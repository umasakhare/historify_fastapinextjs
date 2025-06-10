from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.stock_data import StockData
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import pytz

router = APIRouter()

def calculate_ema(data, period=20):
    """Calculate Exponential Moving Average"""
    if len(data) < period:
        return [None] * len(data)
    
    df = pd.DataFrame(data)
    df['ema'] = df['close'].ewm(span=period, adjust=False).mean()
    return df['ema'].tolist()

def calculate_rsi(data, period=14):
    """Calculate Relative Strength Index"""
    if len(data) < period + 1:
        return [None] * len(data)
    
    df = pd.DataFrame(data)
    delta = df['close'].diff()
    
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    avg_gain = gain.rolling(window=period).mean().fillna(0)
    avg_loss = loss.rolling(window=period).mean().fillna(0)
    
    rs = avg_gain / avg_loss.replace(0, np.finfo(float).eps)
    rsi = 100 - (100 / (1 + rs))
    
    return rsi.tolist()

@router.get("/chart-data/{symbol}/{exchange}/{interval}/{ema_period}/{rsi_period}")
async def get_chart_data(
    symbol: str,
    exchange: str,
    interval: str,
    ema_period: int = 20,
    rsi_period: int = 14,
    db: Session = Depends(get_db)
):
    """Get chart data with indicators for TradingView chart"""
    try:
        # Get date range based on interval
        end_date = datetime.now().date()
        if interval in ['1m', '5m', '15m', '30m']:
            start_date = end_date - timedelta(days=7)
        elif interval == '1h':
            start_date = end_date - timedelta(days=30)
        elif interval == 'D':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        # Fetch data from database
        data = db.query(StockData).filter(
            StockData.symbol == symbol,
            StockData.exchange == exchange,
            StockData.date >= start_date,
            StockData.date <= end_date
        ).order_by(StockData.date, StockData.time).all()
        
        if not data:
            return {
                'error': f'No data found for {symbol} ({exchange}) with {interval} interval',
                'candlestick': [],
                'ema': [],
                'rsi': []
            }
        
        # Convert to OHLCV format
        ohlcv_data = []
        for item in data:
            try:
                if item.time is None:
                    if interval in ['D', '1d']:
                        time_obj = item.date.strftime('%Y-%m-%d')
                    else:
                        db_datetime_naive = datetime.combine(item.date, datetime.min.time())
                        ist_tz = pytz.timezone('Asia/Kolkata')
                        ist_datetime_aware = ist_tz.localize(db_datetime_naive)
                        time_obj = int(ist_datetime_aware.timestamp())
                else:
                    db_datetime_naive = datetime.combine(item.date, item.time)
                    ist_tz = pytz.timezone('Asia/Kolkata')
                    ist_datetime_aware = ist_tz.localize(db_datetime_naive)
                    time_obj = int(ist_datetime_aware.timestamp())
                
            except Exception as e:
                time_obj = int(datetime.now().timestamp())
            
            ohlcv_data.append({
                'time': time_obj,
                'open': item.open,
                'high': item.high,
                'low': item.low,
                'close': item.close,
                'volume': item.volume
            })
        
        # Sort by time
        ohlcv_data = sorted(ohlcv_data, key=lambda x: x['time'])
        
        # Calculate indicators
        ema_data = []
        ema_values = calculate_ema(ohlcv_data, ema_period)
        for i, item in enumerate(ohlcv_data):
            if i < len(ema_values) and ema_values[i] is not None:
                ema_data.append({
                    'time': item['time'],
                    'value': ema_values[i]
                })
        
        rsi_data = []
        rsi_values = calculate_rsi(ohlcv_data, rsi_period)
        for i, item in enumerate(ohlcv_data):
            if i < len(rsi_values) and rsi_values[i] is not None:
                rsi_data.append({
                    'time': item['time'],
                    'value': rsi_values[i]
                })
        
        return {
            'candlestick': ohlcv_data,
            'ema': ema_data,
            'rsi': rsi_data
        }
        
    except Exception as e:
        return {
            'error': f"Error processing chart data: {str(e)}",
            'candlestick': [],
            'ema': [],
            'rsi': []
        }

@router.get("/timeframes")
async def get_timeframes():
    """Get available chart timeframes"""
    timeframes = [
        {"value": "1m", "label": "1 Minute"},
        {"value": "5m", "label": "5 Minutes"},
        {"value": "15m", "label": "15 Minutes"},
        {"value": "30m", "label": "30 Minutes"},
        {"value": "1h", "label": "1 Hour"},
        {"value": "D", "label": "Daily"},
        {"value": "W", "label": "Weekly"}
    ]
    return timeframes