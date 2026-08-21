# 📚 FleetFlow — Documentation Index

> **FleetFlow** — Fleet Management & Logistics Tracking Platform  
> *Infosys Internship Project | Full-Stack | FastAPI + React*

---

## Documentation Structure

```
docs/
├── README.md                  ← This index file
├── 01_introduction.md         ← Project intro, problem statement, objectives
├── 02_workflow.md             ← System workflow & data flow diagrams
├── 03_architecture.md         ← System architecture & component design
├── 04_database.md             ← Database schema, ERD & table definitions
├── 05_api_documentation.md    ← Complete REST & WebSocket API reference
├── 06_setup_instructions.md   ← Local & Docker setup guide
├── 07_screenshots.md          ← UI screenshots & design guide
└── 08_conclusion.md           ← Summary, achievements & future roadmap
```

---

## Quick Navigation

| # | Document | Description |
|---|---|---|
| 1 | [Introduction](./01_introduction.md) | What is FleetFlow, problem statement, objectives, and tech stack |
| 2 | [Workflow](./02_workflow.md) | End-to-end system workflows: auth, dispatch, GPS, maintenance, reports |
| 3 | [Architecture](./03_architecture.md) | System architecture, component diagrams, security model, Docker layout |
| 4 | [Database](./04_database.md) | ERD, all 10 table schemas, relationships, and example queries |
| 5 | [API Documentation](./05_api_documentation.md) | All 70+ REST endpoints + WebSocket reference with request/response examples |
| 6 | [Setup Instructions](./06_setup_instructions.md) | Step-by-step local dev and Docker deployment guide |
| 7 | [Screenshots](./07_screenshots.md) | All 14 UI pages, design system, color palette |
| 8 | [Conclusion](./08_conclusion.md) | Achievements, challenges, lessons learned, and future enhancements |

---

## Quick Start

```bash
# Clone repo
git clone <repo-url> && cd FleetFlow

# Backend setup
cd Backend && python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
# Configure .env (see 06_setup_instructions.md)
alembic upgrade head
uvicorn app.main:app --reload

# Frontend setup (new terminal)
cd Frontend && npm install && npm run dev
```

**Access the app:**
- 🖥️ **Frontend:** http://localhost:5173
- 🔌 **API:** http://localhost:8000
- 📖 **Swagger UI:** http://localhost:8000/docs

---

## Tech Stack at a Glance

| Layer | Technology |
|---|---|
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.0 |
| Database | PostgreSQL 16 + Alembic migrations |
| Auth | JWT (python-jose) + bcrypt |
| Async Tasks | Celery + Redis |
| Reports | ReportLab (PDF) + OpenPyXL (Excel) |
| Frontend | React 19, Vite 8, Axios |
| Real-Time | WebSockets (GPS tracking) |
| Deploy | Docker Compose (6 services) |

---

*FleetFlow Documentation v1.0 | Infosys Internship Project 2026*
