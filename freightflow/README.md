# FreightFlow — Fleet Management & Logistics Tracking Platform

Full-stack fleet operations system: FastAPI/PostgreSQL backend + React frontend.

## Structure
```
freightflow/
├── freightflow-backend/    FastAPI + SQLAlchemy + Alembic + JWT auth
└── freightflow-frontend/   React + Tailwind + React Router + Axios
```

## Quick start

**Backend:**
```bash
cd freightflow-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # set DATABASE_URL / JWT_SECRET_KEY
createdb freightflow_db
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
python -m app.scripts.seed_admin   # creates admin@freightflow.local / ChangeMe123!
uvicorn app.main:app --reload
```

**Frontend** (separate terminal):
```bash
cd freightflow-frontend
npm install
cp .env.example .env
npm run dev
```

Backend: http://127.0.0.1:8000/docs · Frontend: http://127.0.0.1:5173

See each subfolder's own README for full details (module layout, testing, roles).
