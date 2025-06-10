import os
import logging
import random
import time
from datetime import datetime, timedelta
from app.core.config import settings

try:
    from openalgo import api
    OPENALGO_AVAILABLE = True
    logging.info('OpenAlgo API successfully imported')
except ImportError as e:
    OPENALGO_AVAILABLE = False
    logging.error(f'OpenAlgo API import error: {str(e)}')

def fetch_historical_data(symbol, start_date, end_date, interval='D', exchange='NSE'):
    """Fetch historical stock data from OpenAlgo API"""
    if not OPENALGO_AVAILABLE:
        logging.error(f"Cannot fetch data for {symbol}: OpenAlgo API module is not available")
        raise ValueError(f"OpenAlgo API is not available. Please check your installation.")
        
    api_key = settings.OPENALGO_API_KEY
    host = settings.OPENALGO_API_HOST
    
    if not api_key:
        logging.error(f"Cannot fetch data for {symbol}: API key is missing")
        raise ValueError(f"OpenAlgo API key is missing. Please configure it in Settings page.")
    
    try:
        logging.info(f"Initializing OpenAlgo client with host: {host}")
        client = api(api_key=api_key, host=host)
        
        openalgo_interval = convert_interval_format(interval)
        
        logging.info(f"Fetching historical data for {symbol} from exchange {exchange}, period {start_date} to {end_date}")
        response = client.history(
            symbol=symbol,
            exchange=exchange,
            interval=openalgo_interval,
            start_date=start_date,
            end_date=end_date
        )
        
        import pandas as pd
        
        if isinstance(response, pd.DataFrame):
            logging.info(f"Received pandas DataFrame with {len(response)} rows for {symbol}")
            
            if response.empty:
                logging.warning(f"Empty DataFrame received for {symbol}")
                return []
            
            data = []
            for idx, row in response.iterrows():
                timestamp = idx
                if isinstance(timestamp, str):
                    try:
                        timestamp = pd.to_datetime(timestamp)
                    except Exception as e:
                        logging.error(f"Error parsing timestamp {timestamp}: {e}")
                        continue
                
                date_obj = timestamp.date()
                time_obj = timestamp.time()
                
                data.append({
                    'date': date_obj,
                    'time': time_obj,
                    'open': float(row.get('open', 0)),
                    'high': float(row.get('high', 0)),
                    'low': float(row.get('low', 0)),
                    'close': float(row.get('close', 0)),
                    'volume': int(row.get('volume', 0)),
                    'exchange': exchange
                })
            
            return data
            
        elif isinstance(response, dict) and response.get('status') == 'success' and 'data' in response:
            data = []
            for item in response['data']:
                date_obj = datetime.strptime(item.get('time').split('T')[0], '%Y-%m-%d').date()
                time_obj = None
                if 'T' in item.get('time'):
                    time_str = item.get('time').split('T')[1].split('+')[0]
                    time_obj = datetime.strptime(time_str, '%H:%M:%S').time()
                
                data.append({
                    'date': date_obj,
                    'time': time_obj,
                    'open': float(item.get('open', 0)),
                    'high': float(item.get('high', 0)),
                    'low': float(item.get('low', 0)),
                    'close': float(item.get('close', 0)),
                    'volume': int(item.get('volume', 0)),
                    'exchange': exchange
                })
            
            return data
        else:
            if isinstance(response, dict) and 'message' in response:
                error_msg = response.get('message', 'Unknown API error')
            else:
                error_msg = 'Unknown API error or unsupported response format'
            
            logging.error(f"API error for {symbol}: {error_msg}")
            raise ValueError(f"API error: {error_msg}")
            
    except Exception as e:
        logging.error(f"Error fetching historical data from OpenAlgo: {str(e)}")
        raise ValueError(f"Failed to fetch data for {symbol} from OpenAlgo API: {str(e)}")

def fetch_realtime_quotes(symbols, exchanges=None):
    """Fetch real-time quotes for a list of symbols"""
    quotes = []
    
    if not OPENALGO_AVAILABLE:
        logging.error("Cannot fetch quotes: OpenAlgo API module is not available")
        raise ValueError("OpenAlgo API is not available. Please check your installation.")
        
    api_key = settings.OPENALGO_API_KEY
    host = settings.OPENALGO_API_HOST
    
    if not api_key:
        logging.error("Cannot fetch quotes: API key is missing")
        raise ValueError("OpenAlgo API key is missing. Please configure it in Settings page.")
    
    if exchanges is None:
        exchanges = ['NSE'] * len(symbols)
    elif len(exchanges) < len(symbols):
        exchanges.extend(['NSE'] * (len(symbols) - len(exchanges)))
    
    logging.info(f"Initializing OpenAlgo client with host: {host}")
    client = api(api_key=api_key, host=host)
    
    for symbol, exchange in zip(symbols, exchanges):
        try:
            logging.info(f"Fetching quote for {symbol} from exchange {exchange}")
            response = client.quotes(symbol=symbol, exchange=exchange)
            
            if response.get('status') == 'success' and 'data' in response:
                quote_data = response['data']
                
                prev_close = quote_data.get('prev_close', 0)
                ltp = quote_data.get('ltp', 0)
                
                if prev_close > 0:
                    change_percent = ((ltp - prev_close) / prev_close) * 100
                else:
                    change_percent = 0
                
                quotes.append({
                    'symbol': symbol,
                    'exchange': exchange,
                    'ltp': quote_data.get('ltp', 0),
                    'change': quote_data.get('change', 0),
                    'change_percent': round(change_percent, 2),
                    'volume': quote_data.get('volume', 0),
                    'bid': quote_data.get('bid', 0),
                    'ask': quote_data.get('ask', 0),
                    'high': quote_data.get('high', 0),
                    'low': quote_data.get('low', 0),
                    'open': quote_data.get('open', 0),
                    'prev_close': quote_data.get('prev_close', 0),
                    'timestamp': quote_data.get('timestamp', datetime.now().isoformat())
                })
            else:
                error_msg = response.get('message', 'Unknown API error')
                logging.error(f"API error for {symbol}: {error_msg}")
                quotes.append({
                    'symbol': symbol,
                    'exchange': exchange,
                    'error': error_msg,
                    'ltp': 0,
                    'change_percent': 0,
                    'timestamp': datetime.now().isoformat()
                })
        except Exception as e:
            logging.error(f"Error fetching quote for {symbol}: {str(e)}")
            quotes.append({
                'symbol': symbol,
                'exchange': exchange,
                'error': str(e),
                'ltp': 0,
                'change_percent': 0,
                'timestamp': datetime.now().isoformat()
            })
        
        time.sleep(0.1)  # Rate limiting
    
    return quotes

def convert_interval_format(interval):
    """Convert internal interval format to OpenAlgo format"""
    interval_map = {
        '1m': '1m',
        '3m': '3m',
        '5m': '5m',
        '10m': '10m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '1d': 'D',
        'D': 'D',
        '1w': 'W'
    }
    return interval_map.get(interval, 'D')