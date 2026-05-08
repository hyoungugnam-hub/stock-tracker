from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.stock import JournalEntry
from app.schemas.stock import JournalEntryCreate, JournalEntryResponse

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("", response_model=list[JournalEntryResponse])
def get_journal(db: Session = Depends(get_db)):
    return db.query(JournalEntry).order_by(JournalEntry.traded_at.desc()).all()


@router.post("", response_model=JournalEntryResponse, status_code=201)
def add_journal_entry(entry: JournalEntryCreate, db: Session = Depends(get_db)):
    db_entry = JournalEntry(**entry.model_dump())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


@router.delete("/{entry_id}", status_code=204)
def delete_journal_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="일지를 찾을 수 없습니다.")
    db.delete(entry)
    db.commit()
