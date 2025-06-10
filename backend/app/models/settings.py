from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.database.database import Base
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any
import json

class AppSettings(Base):
    __tablename__ = "app_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    data_type = Column(String(50), default='string')
    description = Column(Text, nullable=True)
    is_encrypted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Pydantic models
class SettingsCreate(BaseModel):
    key: str
    value: Optional[str] = None
    data_type: str = "string"
    description: Optional[str] = None

class SettingsUpdate(BaseModel):
    value: Optional[str] = None
    data_type: Optional[str] = None
    description: Optional[str] = None

class SettingsResponse(BaseModel):
    id: int
    key: str
    value: Optional[str]
    data_type: str
    description: Optional[str]
    is_encrypted: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True