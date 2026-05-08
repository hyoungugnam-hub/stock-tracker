import logging
from apscheduler.schedulers.background import BackgroundScheduler
from app.database import SessionLocal
from app.models.stock import WatchlistItem, Alert

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler(timezone="Asia/Seoul")


def check_stop_losses() -> None:
    import yfinance as yf

    db = SessionLocal()
    try:
        items = (
            db.query(WatchlistItem)
            .filter(WatchlistItem.stop_loss.isnot(None))
            .all()
        )
        if not items:
            return

        for item in items:
            # 이미 읽지 않은 알림이 있으면 중복 생성 방지
            already = (
                db.query(Alert)
                .filter(Alert.ticker == item.ticker, Alert.is_read == False)
                .first()
            )
            if already:
                continue

            try:
                hist = yf.Ticker(item.ticker).history(period="1d")
                if hist.empty:
                    continue
                current = float(hist["Close"].iloc[-1])
                if current <= item.stop_loss:
                    db.add(
                        Alert(
                            ticker=item.ticker,
                            name=item.name,
                            stop_loss=item.stop_loss,
                            triggered_price=current,
                        )
                    )
                    logger.warning(
                        "손절 알림: %s 현재가 %.2f ≤ 손절가 %.2f",
                        item.ticker,
                        current,
                        item.stop_loss,
                    )
            except Exception as exc:
                logger.error("시세 조회 실패 (%s): %s", item.ticker, exc)

        db.commit()
    except Exception as exc:
        logger.error("손절 체크 오류: %s", exc)
        db.rollback()
    finally:
        db.close()


def start_scheduler() -> None:
    scheduler.add_job(
        check_stop_losses,
        "interval",
        minutes=5,
        id="check_stop_losses",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("손절 알림 스케줄러 시작 (5분 간격)")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
