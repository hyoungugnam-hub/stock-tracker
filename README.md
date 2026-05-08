# 📈 주식 시세 추적 & 매매일지

주식 관심종목 시세 추적, 손절 알림, 매매일지 기록 웹 서비스

## 기술 스택

| 구분 | 기술 |
|------|------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, TypeScript |
| Backend | FastAPI, SQLAlchemy, SQLite |
| 시세 데이터 | yfinance (Yahoo Finance) |
| 스케줄러 | APScheduler |

## 주요 기능

- **관심종목 관리** — 종목 추가/삭제, 실시간 시세 및 등락률 조회
- **손절 알림** — 손절가 설정 시 5분 간격 자동 체크, 도달 시 벨 아이콘 + 토스트 알림
- **매매일지** — 매수/매도 기록 관리, 총 거래금액 집계

## 프로젝트 구조

```
.
├── frontend/                # Next.js 앱
│   ├── app/
│   │   ├── page.tsx         # 대시보드
│   │   ├── watchlist/       # 관심종목
│   │   └── journal/         # 매매일지
│   ├── components/
│   │   ├── AddStockModal.tsx
│   │   ├── AddJournalModal.tsx
│   │   └── AlertBell.tsx    # 손절 알림 벨
│   └── lib/api.ts           # API 클라이언트
└── backend/                 # FastAPI 앱
    ├── app/
    │   ├── main.py
    │   ├── database.py
    │   ├── models/          # SQLAlchemy 모델
    │   ├── routers/         # API 라우터
    │   ├── schemas/         # Pydantic 스키마
    │   └── services/        # 스케줄러
    └── requirements.txt
```

## 시작하기

### 백엔드

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

서버 실행 후 API 문서: http://localhost:8000/docs

### 프론트엔드

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/stocks/watchlist` | 관심종목 목록 |
| POST | `/stocks/watchlist` | 관심종목 추가 |
| DELETE | `/stocks/watchlist/{id}` | 관심종목 삭제 |
| GET | `/stocks/price/{ticker}` | 실시간 시세 조회 |
| GET | `/journal` | 매매일지 목록 |
| POST | `/journal` | 매매 기록 추가 |
| DELETE | `/journal/{id}` | 매매 기록 삭제 |
| GET | `/alerts` | 손절 알림 목록 |
| PATCH | `/alerts/{id}/read` | 알림 읽음 처리 |
| POST | `/alerts/check-now` | 손절가 즉시 체크 |

## 배포

### 백엔드 — Railway

1. [railway.app](https://railway.app) 접속 후 GitHub 로그인
2. **New Project → Deploy from GitHub repo** 선택
3. 이 저장소 선택 후 **Root Directory** 를 `backend` 로 설정
4. **Variables** 탭에서 환경 변수 추가:

   | 변수 | 값 |
   |------|----|
   | `CORS_ORIGINS` | Vercel 배포 URL (예: `https://stock-tracker.vercel.app`) |

5. 배포 완료 후 Railway가 발급한 URL 복사 (예: `https://stock-tracker-production.up.railway.app`)

> **SQLite 데이터 유지**: Railway 대시보드 → **Volumes** 탭에서 볼륨을 `/app` 경로에 마운트하면 재배포 시에도 DB 파일이 유지됩니다.

---

### 프론트엔드 — Vercel

1. [vercel.com](https://vercel.com) 접속 후 GitHub 로그인
2. **Add New Project → Import Git Repository** 에서 이 저장소 선택
3. **Root Directory** 를 `frontend` 로 설정
4. **Environment Variables** 추가:

   | 변수 | 값 |
   |------|----|
   | `BACKEND_URL` | Railway에서 받은 백엔드 URL |

5. **Deploy** 클릭

배포 완료 후 Vercel URL을 Railway의 `CORS_ORIGINS` 값에도 등록해야 합니다.

---

### 환경 변수 요약

**backend/.env** (로컬 개발용)
```env
DATABASE_URL=sqlite:///./stock_tracker.db
CORS_ORIGINS=http://localhost:3000
```

**frontend/.env.local** (로컬 개발용)
```env
BACKEND_URL=http://localhost:8000
```

---

## 종목 코드 형식

| 시장 | 형식 | 예시 |
|------|------|------|
| 미국 | 티커 그대로 | `AAPL`, `TSLA` |
| 코스피 | `{코드}.KS` | `005930.KS` |
| 코스닥 | `{코드}.KQ` | `035720.KQ` |
