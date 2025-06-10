from sqlalchemy import Column, Integer, String, Date, Time, Float, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.database.database import Base
from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional

class StockData(Base):
    __tablename__ = "stock_data"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    exchange = Column(String(10), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    time = Column(Time, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    __table_args__ = (
        UniqueConstraint('symbol', 'exchange', 'date', 'time', name='uix_symbol_exchange_date_time'),
    )

# Pydantic models
class StockDataCreate(BaseModel):
    symbol: str
    exchange: str
    date: date
    time: time
    open: float
    high: float
    low: float
    close: float
    volume: int

class StockDataResponse(BaseModel):
    id: int
    symbol: str
    exchange: str
    date: date
    time: Optional[time]
    open: float
    high: float
    low: float
    close: float
    volume: int
    created_at: datetime
    
    class Config:
        from_attributes = True