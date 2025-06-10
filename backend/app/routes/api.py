from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.watchlist import WatchlistItem
from app.models.stock_data import StockData
from app.utils.data_fetcher import fetch_historical_data, fetch_realtime_quotes
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import logging

router = APIRouter()

class DownloadRequest(BaseModel):
    symbols: List[str]
    exchanges: Optional[List[str]] = None
    interval: str = "D"
    start_date: str
    end_date: str
    mode: str = "fresh"

class QuotesResponse(BaseModel):
    symbol: str
    exchange: str
    ltp: float
    change_percent: float
    volume: int
    timestamp: str

@router.get("/symbols")
async def get_symbols(db: Session = Depends(get_db)):
    """Get all available symbols from watchlist"""
    watchlist_items = db.query(WatchlistItem).all()
    return [{"symbol": item.symbol, "exchange": item.exchange, "name": item.name} for item in watchlist_items]

@router.post("/download")
async def download_data(request: DownloadRequest, db: Session = Depends(get_db)):
    """Download historical stock data"""
    try:
        symbols = request.symbols
        exchanges = request.exchanges or ['NSE'] * len(symbols)
        
        # Ensure exchanges list matches symbols list
        if len(exchanges) < len(symbols):
            exchanges.extend(['NSE'] * (len(symbols) - len(exchanges)))
        elif len(exchanges) > len(symbols):
            exchanges = exchanges[:len(symbols)]
        
        results = {
            'success': [],
            'failed': [],
            'status': 'success',
            'message': 'Download initiated'
        }
        
        # Process symbols
        for symbol, exchange in zip(symbols, exchanges):
            try:
                # Fetch historical data
                historical_data = fetch_historical_data(
                    symbol, 
                    request.start_date, 
                    request.end_date, 
                    interval=request.interval, 
                    exchange=exchange
                )
                
                # Store in database
                for data_point in historical_data:
                    # Check if exists
                    existing = db.query(StockData).filter_by(
                        symbol=symbol,
                        exchange=exchange,
                        date=data_point['date'],
                        time=data_point['time']
                    ).first()
                    
                    if existing:
                        # Update existing
                        existing.open = data_point['open']
                        existing.high = data_point['high']
                        existing.low = data_point['low']
                        existing.close = data_point['close']
                        existing.volume = data_point['volume']
                    else:
                        # Create new
                        new_data = StockData(
                            symbol=symbol,
                            exchange=exchange,
                            date=data_point['date'],
                            time=data_point['time'],
                            open=data_point['open'],
                            high=data_point['high'],
                            low=data_point['low'],
                            close=data_point['close'],
                            volume=data_point['volume']
                        )
                        db.add(new_data)
                
                db.commit()
                results['success'].append(symbol)
                
            except Exception as e:
                results['failed'].append({
                    'symbol': symbol,
                    'error': str(e)
                })
                logging.error(f"Error processing {symbol}: {str(e)}")
        
        if len(results['failed']) > 0:
            results['status'] = 'partial'
            results['message'] = f"Downloaded {len(results['success'])} symbols, {len(results['failed'])} failed"
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/quotes")
async def get_quotes(symbols: str = "", exchanges: str = "", db: Session = Depends(get_db)):
    """Get real-time quotes for symbols"""
    try:
        if symbols:
            symbol_list = symbols.split(',')
            exchange_list = exchanges.split(',') if exchanges else ['NSE'] * len(symbol_list)
        else:
            # Get from watchlist
            watchlist_items = db.query(WatchlistItem).all()
            symbol_list = [item.symbol for item in watchlist_items]
            exchange_list = [item.exchange for item in watchlist_items]
        
        if not symbol_list:
            return []
        
        # Fetch quotes
        quotes = fetch_realtime_quotes(symbol_list, exchange_list)
        return quotes
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data")
async def get_data(
    symbol: str,
    start_date: str,
    end_date: str,
    interval: str = "D",
    exchange: str = "NSE",
    db: Session = Depends(get_db)
):
    """Get OHLCV data for a specific symbol"""
    try:
        start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        data = db.query(StockData).filter(
            StockData.symbol == symbol,
            StockData.exchange == exchange,
            StockData.date >= start_date_obj,
            StockData.date <= end_date_obj
        ).order_by(StockData.date, StockData.time).all()
        
        # Format for TradingView charts
        ohlcv_data = []
        for item in data:
            timestamp = int(datetime.combine(item.date, item.time or datetime.min.time()).timestamp())
            ohlcv_data.append({
                'time': timestamp,
                'open': item.open,
                'high': item.high,
                'low': item.low,
                'close': item.close,
                'volume': item.volume,
                'symbol': symbol,
                'exchange': exchange,
                'interval': interval
            })
        
        return ohlcv_data
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))