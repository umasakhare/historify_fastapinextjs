from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.database.database import Base
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import json

class SchedulerJob(Base):
    __tablename__ = "scheduler_jobs"
    
    id = Column(String(100), primary_key=True)
    name = Column(String(200))
    job_type = Column(String(50))
    time = Column(String(10))
    minutes = Column(Integer)
    symbols = Column(Text)
    exchanges = Column(Text)
    interval = Column(String(10), default='D')
    is_paused = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    def get_symbols(self):
        if self.symbols:
            return json.loads(self.symbols)
        return None
    
    def set_symbols(self, symbols_list):
        if symbols_list:
            self.symbols = json.dumps(symbols_list)
        else:
            self.symbols = None

# Pydantic models
class SchedulerJobCreate(BaseModel):
    type: str
    time: Optional[str] = None
    minutes: Optional[int] = None
    symbols: Optional[List[str]] = None
    exchanges: Optional[List[str]] = None
    interval: str = "D"
    job_id: Optional[str] = None

class SchedulerJobResponse(BaseModel):
    id: str
    name: Optional[str]
    type: str
    time: Optional[str]
    minutes: Optional[int]
    symbols: Optional[List[str]]
    exchanges: Optional[List[str]]
    interval: str
    paused: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True