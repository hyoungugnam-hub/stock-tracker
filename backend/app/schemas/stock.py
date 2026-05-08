from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.stock import TradeType


class WatchlistItemCreate(BaseModel):
    ticker: str
    name: str
    stop_loss: Optional[float] = None


class WatchlistItemResponse(WatchlistItemCreate):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class JournalEntryCreate(BaseModel):
    ticker: str
    trade_type: TradeType
    price: float
    quantity: int
    note: Optional[str] = None


class JournalEntryResponse(JournalEntryCreate):
    id: int
    traded_at: datetime

    model_config = {"from_attributes": True}


class StockPriceResponse(BaseModel):
    ticker: str
    price: float
    change: float
    change_pct: float
    volume: int
