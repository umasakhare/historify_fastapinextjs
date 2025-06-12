from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.backtest import (
    BacktestRun, Trade, Order, Position,
    BacktestCreate, BacktestResponse, TradeResponse, OrderResponse, PositionResponse
)
from app.models.watchlist import WatchlistItem
from app.utils.backtest_engine import BacktestEngine
from typing import List, Optional
from datetime import datetime
import logging

router = APIRouter()

# Available strategies
STRATEGIES = {
    'sma_crossover': {
        'name': 'SMA Crossover',
        'description': 'Simple Moving Average crossover strategy',
        'parameters': {
            'short_window': {'type': 'int', 'default': 20, 'min': 5, 'max': 100},
            'long_window': {'type': 'int', 'default': 50, 'min': 20, 'max': 200}
        }
    },
    'rsi_strategy': {
        'name': 'RSI Strategy',
        'description': 'Relative Strength Index based strategy',
        'parameters': {
            'rsi_period': {'type': 'int', 'default': 14, 'min': 5, 'max': 50},
            'oversold_threshold': {'type': 'int', 'default': 30, 'min': 10, 'max': 40},
            'overbought_threshold': {'type': 'int', 'default': 70, 'min': 60, 'max': 90}
        }
    },
    'bollinger_bands': {
        'name': 'Bollinger Bands',
        'description': 'Bollinger Bands mean reversion strategy',
        'parameters': {
            'window': {'type': 'int', 'default': 20, 'min': 10, 'max': 50},
            'num_std': {'type': 'float', 'default': 2.0, 'min': 1.0, 'max': 3.0}
        }
    }
}

@router.get("/strategies")
async def get_strategies():
    """Get available trading strategies"""
    return STRATEGIES

@router.get("/symbols")
async def get_symbols(db: Session = Depends(get_db)):
    """Get available symbols for backtesting"""
    watchlist_items = db.query(WatchlistItem).all()
    return [{"symbol": item.symbol, "exchange": item.exchange, "name": item.name} for item in watchlist_items]

@router.post("/backtest", response_model=BacktestResponse)
async def run_backtest(backtest_data: BacktestCreate, db: Session = Depends(get_db)):
    """Run a backtest"""
    try:
        # Create backtest record
        backtest_run = BacktestRun(
            name=backtest_data.name,
            strategy_name=backtest_data.strategy_name,
            symbol=backtest_data.symbol,
            exchange=backtest_data.exchange,
            start_date=backtest_data.start_date,
            end_date=backtest_data.end_date,
            initial_capital=backtest_data.initial_capital,
            status='running'
        )
        backtest_run.set_parameters(backtest_data.parameters)
        
        db.add(backtest_run)
        db.commit()
        db.refresh(backtest_run)
        
        # Run backtest
        engine = BacktestEngine(db)
        config = {
            'strategy_name': backtest_data.strategy_name,
            'symbol': backtest_data.symbol,
            'exchange': backtest_data.exchange,
            'start_date': backtest_data.start_date,
            'end_date': backtest_data.end_date,
            'initial_capital': backtest_data.initial_capital,
            'parameters': backtest_data.parameters or {}
        }
        
        results = engine.run_backtest(config)
        
        # Update backtest record with results
        backtest_run.status = 'completed'
        backtest_run.completed_at = datetime.now()
        backtest_run.set_results(results)
        
        # Save trades
        for trade_data in results.get('trades', []):
            trade = Trade(
                backtest_id=backtest_run.id,
                symbol=backtest_data.symbol,
                side=trade_data['side'],
                quantity=trade_data['quantity'],
                price=trade_data['price'],
                timestamp=datetime.fromisoformat(trade_data['timestamp'].replace('Z', '+00:00')) if isinstance(trade_data['timestamp'], str) else trade_data['timestamp'],
                order_id=trade_data.get('order_id'),
                commission=trade_data.get('commission', 0),
                pnl=trade_data.get('pnl', 0)
            )
            db.add(trade)
        
        # Save orders
        for order_data in results.get('orders', []):
            order = Order(
                backtest_id=backtest_run.id,
                order_id=order_data['order_id'],
                symbol=backtest_data.symbol,
                side=order_data['side'],
                order_type=order_data['order_type'],
                quantity=order_data['quantity'],
                price=order_data.get('price'),
                status=order_data['status'],
                timestamp=datetime.fromisoformat(order_data['timestamp'].replace('Z', '+00:00')) if isinstance(order_data['timestamp'], str) else order_data['timestamp'],
                filled_quantity=order_data.get('filled_quantity', 0),
                filled_price=order_data.get('filled_price')
            )
            db.add(order)
        
        db.commit()
        db.refresh(backtest_run)
        
        return BacktestResponse(
            id=backtest_run.id,
            name=backtest_run.name,
            strategy_name=backtest_run.strategy_name,
            symbol=backtest_run.symbol,
            exchange=backtest_run.exchange,
            start_date=backtest_run.start_date,
            end_date=backtest_run.end_date,
            initial_capital=backtest_run.initial_capital,
            parameters=backtest_run.get_parameters(),
            status=backtest_run.status,
            results=backtest_run.get_results(),
            created_at=backtest_run.created_at,
            completed_at=backtest_run.completed_at
        )
        
    except Exception as e:
        # Update status to failed
        if 'backtest_run' in locals():
            backtest_run.status = 'failed'
            db.commit()
        
        logging.error(f"Backtest error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results", response_model=List[BacktestResponse])
async def get_backtest_results(
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get backtest results"""
    backtests = db.query(BacktestRun).order_by(BacktestRun.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        BacktestResponse(
            id=bt.id,
            name=bt.name,
            strategy_name=bt.strategy_name,
            symbol=bt.symbol,
            exchange=bt.exchange,
            start_date=bt.start_date,
            end_date=bt.end_date,
            initial_capital=bt.initial_capital,
            parameters=bt.get_parameters(),
            status=bt.status,
            results=bt.get_results(),
            created_at=bt.created_at,
            completed_at=bt.completed_at
        ) for bt in backtests
    ]

@router.get("/results/{backtest_id}", response_model=BacktestResponse)
async def get_backtest_result(backtest_id: int, db: Session = Depends(get_db)):
    """Get specific backtest result"""
    backtest = db.query(BacktestRun).filter(BacktestRun.id == backtest_id).first()
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    return BacktestResponse(
        id=backtest.id,
        name=backtest.name,
        strategy_name=backtest.strategy_name,
        symbol=backtest.symbol,
        exchange=backtest.exchange,
        start_date=backtest.start_date,
        end_date=backtest.end_date,
        initial_capital=backtest.initial_capital,
        parameters=backtest.get_parameters(),
        status=backtest.status,
        results=backtest.get_results(),
        created_at=backtest.created_at,
        completed_at=backtest.completed_at
    )

@router.get("/orderbook/{backtest_id}", response_model=List[OrderResponse])
async def get_orderbook(backtest_id: int, db: Session = Depends(get_db)):
    """Get orders for a specific backtest"""
    orders = db.query(Order).filter(Order.backtest_id == backtest_id).order_by(Order.timestamp.desc()).all()
    return orders

@router.get("/tradebook/{backtest_id}", response_model=List[TradeResponse])
async def get_tradebook(backtest_id: int, db: Session = Depends(get_db)):
    """Get trades for a specific backtest"""
    trades = db.query(Trade).filter(Trade.backtest_id == backtest_id).order_by(Trade.timestamp.desc()).all()
    return trades

@router.get("/positions/{backtest_id}", response_model=List[PositionResponse])
async def get_positions(backtest_id: int, db: Session = Depends(get_db)):
    """Get positions for a specific backtest"""
    positions = db.query(Position).filter(Position.backtest_id == backtest_id).order_by(Position.timestamp.desc()).all()
    return positions

@router.delete("/results/{backtest_id}")
async def delete_backtest(backtest_id: int, db: Session = Depends(get_db)):
    """Delete a backtest and all related data"""
    backtest = db.query(BacktestRun).filter(BacktestRun.id == backtest_id).first()
    if not backtest:
        raise HTTPException(status_code=404, detail="Backtest not found")
    
    # Delete related data
    db.query(Trade).filter(Trade.backtest_id == backtest_id).delete()
    db.query(Order).filter(Order.backtest_id == backtest_id).delete()
    db.query(Position).filter(Position.backtest_id == backtest_id).delete()
    
    # Delete backtest
    db.delete(backtest)
    db.commit()
    
    return {"message": "Backtest deleted successfully"}