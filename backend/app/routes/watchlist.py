from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.watchlist import WatchlistItem, WatchlistItemCreate, WatchlistItemResponse
from typing import List

router = APIRouter()

@router.get("/items", response_model=List[WatchlistItemResponse])
async def get_watchlist_items(db: Session = Depends(get_db)):
    """Get all watchlist items"""
    items = db.query(WatchlistItem).all()
    return items

@router.post("/items", response_model=WatchlistItemResponse)
async def add_watchlist_item(item: WatchlistItemCreate, db: Session = Depends(get_db)):
    """Add a new symbol to the watchlist"""
    # Check if symbol already exists
    existing = db.query(WatchlistItem).filter(WatchlistItem.symbol == item.symbol.upper()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Symbol already exists")
    
    # Create new item
    db_item = WatchlistItem(
        symbol=item.symbol.upper(),
        name=item.name or item.symbol.upper(),
        exchange=item.exchange
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    return db_item

@router.delete("/items/{item_id}")
async def delete_watchlist_item(item_id: int, db: Session = Depends(get_db)):
    """Remove a symbol from the watchlist"""
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(item)
    db.commit()
    
    return {"message": "Symbol removed successfully"}