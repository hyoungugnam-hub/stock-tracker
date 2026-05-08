from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: int
    ticker: str
    name: str
    stop_loss: float
    triggered_price: float
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
