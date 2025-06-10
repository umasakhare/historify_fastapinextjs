from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database.database import Base
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WatchlistItem(Base):
    __tablename__ = "watchlist"
    
    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100))
    exchange = Column(String(10), default="NSE")
    added_on = Column(DateTime, default=func.now())

# Pydantic models
class WatchlistItemCreate(BaseModel):
    symbol: str
    name: Optional[str] = None
    exchange: str = "NSE"

class WatchlistItemResponse(BaseModel):
    id: int
    symbol: str
    name: Optional[str]
    exchange: str
    added_on: datetime
    
    class Config:
        from_attributes = True