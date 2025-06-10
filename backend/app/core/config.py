from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 5001
    DEBUG: bool = True
    SECRET_KEY: str = "your_secret_key_here"
    
    DATABASE_URL: str = "sqlite:///./historify.db"
    
    OPENALGO_API_KEY: str = ""
    OPENALGO_API_HOST: str = "http://127.0.0.1:5000"
    
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()