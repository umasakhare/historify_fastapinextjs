from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, JSON
from sqlalchemy.sql import func
from app.database.database import Base
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any
import json

class BacktestRun(Base):
    __tablename__ = "backtest_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    strategy_name = Column(String(100), nullable=False)
    symbol = Column(String(20), nullable=False)
    exchange = Column(String(10), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    initial_capital = Column(Float, default=100000.0)
    parameters = Column(Text)  # JSON string of strategy parameters
    status = Column(String(20), default='pending')  # pending, running, completed, failed
    results = Column(Text)  # JSON string of results
    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
    
    def get_parameters(self):
        if self.parameters:
            return json.loads(self.parameters)
        return {}
    
    def set_parameters(self, params_dict):
        if params_dict:
            self.parameters = json.dumps(params_dict)
        else:
            self.parameters = None
    
    def get_results(self):
        if self.results:
            return json.loads(self.results)
        return {}
    
    def set_results(self, results_dict):
        if results_dict:
            self.results = json.dumps(results_dict)
        else:
            self.results = None

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, nullable=False, index=True)
    symbol = Column(String(20), nullable=False)
    side = Column(String(10), nullable=False)  # BUY, SELL
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    order_id = Column(String(50))
    commission = Column(Float, default=0.0)
    pnl = Column(Float, default=0.0)

class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, nullable=False, index=True)
    order_id = Column(String(50), nullable=False)
    symbol = Column(String(20), nullable=False)
    side = Column(String(10), nullable=False)  # BUY, SELL
    order_type = Column(String(20), nullable=False)  # MARKET, LIMIT, STOP
    quantity = Column(Integer, nullable=False)
    price = Column(Float)
    status = Column(String(20), nullable=False)  # PENDING, FILLED, CANCELLED
    timestamp = Column(DateTime, nullable=False)
    filled_quantity = Column(Integer, default=0)
    filled_price = Column(Float)

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    backtest_id = Column(Integer, nullable=False, index=True)
    symbol = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    avg_price = Column(Float, nullable=False)
    current_price = Column(Float)
    pnl = Column(Float, default=0.0)
    timestamp = Column(DateTime, nullable=False)

# Pydantic models
class BacktestCreate(BaseModel):
    name: str
    strategy_name: str
    symbol: str
    exchange: str = "NSE"
    start_date: datetime
    end_date: datetime
    initial_capital: float = 100000.0
    parameters: Optional[Dict[str, Any]] = {}

class BacktestResponse(BaseModel):
    id: int
    name: str
    strategy_name: str
    symbol: str
    exchange: str
    start_date: datetime
    end_date: datetime
    initial_capital: float
    parameters: Optional[Dict[str, Any]]
    status: str
    results: Optional[Dict[str, Any]]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class TradeResponse(BaseModel):
    id: int
    backtest_id: int
    symbol: str
    side: str
    quantity: int
    price: float
    timestamp: datetime
    order_id: Optional[str]
    commission: float
    pnl: float
    
    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    backtest_id: int
    order_id: str
    symbol: str
    side: str
    order_type: str
    quantity: int
    price: Optional[float]
    status: str
    timestamp: datetime
    filled_quantity: int
    filled_price: Optional[float]
    
    class Config:
        from_attributes = True

class PositionResponse(BaseModel):
    id: int
    backtest_id: int
    symbol: str
    quantity: int
    avg_price: float
    current_price: Optional[float]
    pnl: float
    timestamp: datetime
    
    class Config:
        from_attributes = True