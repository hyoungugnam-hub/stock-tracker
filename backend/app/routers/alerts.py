from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.stock import Alert
from app.schemas.alert import AlertResponse
from app.services.scheduler import check_stop_losses

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertResponse])
def get_alerts(unread_only: bool = False, db: Session = Depends(get_db)):
    q = db.query(Alert).order_by(Alert.created_at.desc())
    if unread_only:
        q = q.filter(Alert.is_read == False)  # noqa: E712
    return q.limit(50).all()


@router.patch("/{alert_id}/read", response_model=AlertResponse)
def mark_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/read-all", status_code=204)
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Alert).filter(Alert.is_read == False).update({"is_read": True})  # noqa: E712
    db.commit()


@router.delete("/{alert_id}", status_code=204)
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    db.delete(alert)
    db.commit()


@router.post("/check-now", status_code=202)
def trigger_check():
    """손절가 즉시 체크 (테스트용)"""
    import threading
    threading.Thread(target=check_stop_losses, daemon=True).start()
    return {"message": "손절가 체크를 시작했습니다."}
