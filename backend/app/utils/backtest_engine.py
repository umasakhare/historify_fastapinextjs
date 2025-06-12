import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from app.models.stock_data import StockData
from app.models.backtest import BacktestRun, Trade, Order, Position
import logging

class BacktestEngine:
    def __init__(self, db: Session):
        self.db = db
        self.cash = 0
        self.positions = {}
        self.orders = []
        self.trades = []
        self.portfolio_value = []
        self.commission_rate = 0.001  # 0.1% commission
        
    def run_backtest(self, backtest_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a backtest with the given configuration"""
        try:
            # Initialize backtest
            self.cash = backtest_config['initial_capital']
            self.positions = {}
            self.orders = []
            self.trades = []
            self.portfolio_value = []
            
            # Get historical data
            data = self._get_historical_data(
                backtest_config['symbol'],
                backtest_config['exchange'],
                backtest_config['start_date'],
                backtest_config['end_date']
            )
            
            if data.empty:
                raise ValueError("No historical data found for the given parameters")
            
            # Run strategy
            strategy_name = backtest_config['strategy_name']
            strategy_params = backtest_config.get('parameters', {})
            
            if strategy_name == 'sma_crossover':
                results = self._run_sma_crossover_strategy(data, strategy_params)
            elif strategy_name == 'rsi_strategy':
                results = self._run_rsi_strategy(data, strategy_params)
            elif strategy_name == 'bollinger_bands':
                results = self._run_bollinger_bands_strategy(data, strategy_params)
            else:
                raise ValueError(f"Unknown strategy: {strategy_name}")
            
            return results
            
        except Exception as e:
            logging.error(f"Backtest error: {str(e)}")
            raise
    
    def _get_historical_data(self, symbol: str, exchange: str, start_date: datetime, end_date: datetime) -> pd.DataFrame:
        """Fetch historical data from database"""
        data = self.db.query(StockData).filter(
            StockData.symbol == symbol,
            StockData.exchange == exchange,
            StockData.date >= start_date.date(),
            StockData.date <= end_date.date()
        ).order_by(StockData.date, StockData.time).all()
        
        if not data:
            return pd.DataFrame()
        
        # Convert to DataFrame
        df_data = []
        for item in data:
            timestamp = datetime.combine(item.date, item.time or datetime.min.time())
            df_data.append({
                'timestamp': timestamp,
                'open': item.open,
                'high': item.high,
                'low': item.low,
                'close': item.close,
                'volume': item.volume
            })
        
        df = pd.DataFrame(df_data)
        df.set_index('timestamp', inplace=True)
        return df
    
    def _run_sma_crossover_strategy(self, data: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        """Simple Moving Average Crossover Strategy"""
        short_window = params.get('short_window', 20)
        long_window = params.get('long_window', 50)
        
        # Calculate moving averages
        data['sma_short'] = data['close'].rolling(window=short_window).mean()
        data['sma_long'] = data['close'].rolling(window=long_window).mean()
        
        # Generate signals
        data['signal'] = 0
        data['signal'][short_window:] = np.where(
            data['sma_short'][short_window:] > data['sma_long'][short_window:], 1, 0
        )
        data['position'] = data['signal'].diff()
        
        # Execute trades
        position = 0
        for timestamp, row in data.iterrows():
            if row['position'] == 1:  # Buy signal
                if position == 0:
                    position = self._execute_buy_order(timestamp, row['close'], 100)
            elif row['position'] == -1:  # Sell signal
                if position > 0:
                    self._execute_sell_order(timestamp, row['close'], position)
                    position = 0
            
            # Update portfolio value
            portfolio_val = self.cash + (position * row['close'] if position > 0 else 0)
            self.portfolio_value.append({
                'timestamp': timestamp,
                'value': portfolio_val,
                'cash': self.cash,
                'position_value': position * row['close'] if position > 0 else 0
            })
        
        return self._calculate_results(data)
    
    def _run_rsi_strategy(self, data: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        """RSI Strategy"""
        rsi_period = params.get('rsi_period', 14)
        oversold_threshold = params.get('oversold_threshold', 30)
        overbought_threshold = params.get('overbought_threshold', 70)
        
        # Calculate RSI
        delta = data['close'].diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        avg_gain = gain.rolling(window=rsi_period).mean()
        avg_loss = loss.rolling(window=rsi_period).mean()
        
        rs = avg_gain / avg_loss
        data['rsi'] = 100 - (100 / (1 + rs))
        
        # Generate signals
        data['signal'] = 0
        data.loc[data['rsi'] < oversold_threshold, 'signal'] = 1  # Buy
        data.loc[data['rsi'] > overbought_threshold, 'signal'] = -1  # Sell
        
        # Execute trades
        position = 0
        for timestamp, row in data.iterrows():
            if row['signal'] == 1 and position == 0:  # Buy signal
                position = self._execute_buy_order(timestamp, row['close'], 100)
            elif row['signal'] == -1 and position > 0:  # Sell signal
                self._execute_sell_order(timestamp, row['close'], position)
                position = 0
            
            # Update portfolio value
            portfolio_val = self.cash + (position * row['close'] if position > 0 else 0)
            self.portfolio_value.append({
                'timestamp': timestamp,
                'value': portfolio_val,
                'cash': self.cash,
                'position_value': position * row['close'] if position > 0 else 0
            })
        
        return self._calculate_results(data)
    
    def _run_bollinger_bands_strategy(self, data: pd.DataFrame, params: Dict[str, Any]) -> Dict[str, Any]:
        """Bollinger Bands Strategy"""
        window = params.get('window', 20)
        num_std = params.get('num_std', 2)
        
        # Calculate Bollinger Bands
        data['sma'] = data['close'].rolling(window=window).mean()
        data['std'] = data['close'].rolling(window=window).std()
        data['upper_band'] = data['sma'] + (data['std'] * num_std)
        data['lower_band'] = data['sma'] - (data['std'] * num_std)
        
        # Generate signals
        data['signal'] = 0
        data.loc[data['close'] < data['lower_band'], 'signal'] = 1  # Buy
        data.loc[data['close'] > data['upper_band'], 'signal'] = -1  # Sell
        
        # Execute trades
        position = 0
        for timestamp, row in data.iterrows():
            if row['signal'] == 1 and position == 0:  # Buy signal
                position = self._execute_buy_order(timestamp, row['close'], 100)
            elif row['signal'] == -1 and position > 0:  # Sell signal
                self._execute_sell_order(timestamp, row['close'], position)
                position = 0
            
            # Update portfolio value
            portfolio_val = self.cash + (position * row['close'] if position > 0 else 0)
            self.portfolio_value.append({
                'timestamp': timestamp,
                'value': portfolio_val,
                'cash': self.cash,
                'position_value': position * row['close'] if position > 0 else 0
            })
        
        return self._calculate_results(data)
    
    def _execute_buy_order(self, timestamp: datetime, price: float, quantity: int) -> int:
        """Execute a buy order"""
        total_cost = price * quantity
        commission = total_cost * self.commission_rate
        
        if self.cash >= total_cost + commission:
            self.cash -= (total_cost + commission)
            
            # Record order
            order_id = f"BUY_{len(self.orders) + 1}"
            self.orders.append({
                'order_id': order_id,
                'symbol': 'SYMBOL',
                'side': 'BUY',
                'order_type': 'MARKET',
                'quantity': quantity,
                'price': price,
                'status': 'FILLED',
                'timestamp': timestamp,
                'filled_quantity': quantity,
                'filled_price': price
            })
            
            # Record trade
            self.trades.append({
                'symbol': 'SYMBOL',
                'side': 'BUY',
                'quantity': quantity,
                'price': price,
                'timestamp': timestamp,
                'order_id': order_id,
                'commission': commission,
                'pnl': 0
            })
            
            return quantity
        return 0
    
    def _execute_sell_order(self, timestamp: datetime, price: float, quantity: int):
        """Execute a sell order"""
        total_value = price * quantity
        commission = total_value * self.commission_rate
        
        self.cash += (total_value - commission)
        
        # Record order
        order_id = f"SELL_{len(self.orders) + 1}"
        self.orders.append({
            'order_id': order_id,
            'symbol': 'SYMBOL',
            'side': 'SELL',
            'order_type': 'MARKET',
            'quantity': quantity,
            'price': price,
            'status': 'FILLED',
            'timestamp': timestamp,
            'filled_quantity': quantity,
            'filled_price': price
        })
        
        # Calculate PnL (simplified)
        buy_trades = [t for t in self.trades if t['side'] == 'BUY']
        if buy_trades:
            avg_buy_price = sum(t['price'] for t in buy_trades) / len(buy_trades)
            pnl = (price - avg_buy_price) * quantity
        else:
            pnl = 0
        
        # Record trade
        self.trades.append({
            'symbol': 'SYMBOL',
            'side': 'SELL',
            'quantity': quantity,
            'price': price,
            'timestamp': timestamp,
            'order_id': order_id,
            'commission': commission,
            'pnl': pnl
        })
    
    def _calculate_results(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Calculate backtest results and metrics"""
        if not self.portfolio_value:
            return {
                'total_return': 0,
                'total_trades': 0,
                'winning_trades': 0,
                'losing_trades': 0,
                'max_drawdown': 0,
                'sharpe_ratio': 0,
                'portfolio_values': [],
                'trades': [],
                'orders': []
            }
        
        portfolio_df = pd.DataFrame(self.portfolio_value)
        initial_value = self.portfolio_value[0]['value']
        final_value = self.portfolio_value[-1]['value']
        
        # Calculate metrics
        total_return = ((final_value - initial_value) / initial_value) * 100
        
        # Calculate drawdown
        portfolio_df['peak'] = portfolio_df['value'].cummax()
        portfolio_df['drawdown'] = (portfolio_df['value'] - portfolio_df['peak']) / portfolio_df['peak']
        max_drawdown = portfolio_df['drawdown'].min() * 100
        
        # Trade statistics
        total_trades = len(self.trades)
        winning_trades = len([t for t in self.trades if t['pnl'] > 0])
        losing_trades = len([t for t in self.trades if t['pnl'] < 0])
        
        # Sharpe ratio (simplified)
        if len(portfolio_df) > 1:
            returns = portfolio_df['value'].pct_change().dropna()
            sharpe_ratio = returns.mean() / returns.std() * np.sqrt(252) if returns.std() > 0 else 0
        else:
            sharpe_ratio = 0
        
        return {
            'total_return': round(total_return, 2),
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': round((winning_trades / total_trades * 100) if total_trades > 0 else 0, 2),
            'max_drawdown': round(max_drawdown, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'initial_capital': initial_value,
            'final_capital': final_value,
            'portfolio_values': [
                {
                    'timestamp': item['timestamp'].isoformat(),
                    'value': item['value'],
                    'cash': item['cash'],
                    'position_value': item['position_value']
                } for item in self.portfolio_value
            ],
            'trades': self.trades,
            'orders': self.orders
        }