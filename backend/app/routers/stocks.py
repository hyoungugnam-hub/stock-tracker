from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import yfinance as yf

from app.database import get_db
from app.models.stock import WatchlistItem
from app.schemas.stock import WatchlistItemCreate, WatchlistItemResponse, StockPriceResponse

router = APIRouter(prefix="/stocks", tags=["stocks"])


@router.get("/watchlist", response_model=list[WatchlistItemResponse])
def get_watchlist(db: Session = Depends(get_db)):
    return db.query(WatchlistItem).all()


@router.post("/watchlist", response_model=WatchlistItemResponse, status_code=201)
def add_to_watchlist(item: WatchlistItemCreate, db: Session = Depends(get_db)):
    db_item = WatchlistItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/watchlist/{item_id}", status_code=204)
def remove_from_watchlist(item_id: int, db: Session = Depends(get_db)):
    item = db.query(WatchlistItem).filter(WatchlistItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="종목을 찾을 수 없습니다.")
    db.delete(item)
    db.commit()


@router.get("/price/{ticker}", response_model=StockPriceResponse)
def get_stock_price(ticker: str):
    try:
        stock = yf.Ticker(ticker)
        info = stock.fast_info
        hist = stock.history(period="2d")
        if hist.empty:
            raise HTTPException(status_code=404, detail="시세 정보를 가져올 수 없습니다.")
        current = float(hist["Close"].iloc[-1])
        prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
        change = current - prev
        change_pct = (change / prev * 100) if prev else 0
        return StockPriceResponse(
            ticker=ticker.upper(),
            price=current,
            change=change,
            change_pct=change_pct,
            volume=int(hist["Volume"].iloc[-1]),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
