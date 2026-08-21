# ⚙️ FleetFlow — Setup Instructions

## Prerequisites

Before setting up FleetFlow, ensure you have the following installed:

| Tool | Version | Download |
|---|---|---|
| **Python** | 3.10+ (3.13 recommended) | [python.org](https://python.org) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **PostgreSQL** | 14+ (16 recommended) | [postgresql.org](https://postgresql.org) |
| **Redis** | 6+ (7 recommended) | [redis.io](https://redis.io) |
| **Git** | Any | [git-scm.com](https://git-scm.com) |
| **Docker** *(optional)* | 24+ | [docker.com](https://docker.com) |

---

## Option A — Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd FleetFlow
```

---

### Step 2: Backend Setup

#### 2a. Navigate to the Backend directory

```bash
cd Backend
```

#### 2b. Create and activate a Python virtual environment

**Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 2c. Install backend dependencies

```bash
pip install -r requirements.txt
```

**Dependencies installed:**
```
fastapi          # Web framework
uvicorn          # ASGI server
sqlalchemy       # ORM
psycopg2-binary  # PostgreSQL driver
python-dotenv    # .env file loader
pydantic-settings# Config management
pydantic[email]  # Email validation
passlib          # Password utilities
bcrypt           # Password hashing
python-jose[cryptography]  # JWT tokens
alembic          # Database migrations
requests         # HTTP client
celery           # Task queue
redis            # Celery broker
reportlab        # PDF generation
openpyxl         # Excel generation
```

#### 2d. Configure environment variables

Create a `.env` file inside the `Backend/` directory:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Then edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/fleetflow

# JWT Authentication
SECRET_KEY=your-super-secret-key-minimum-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Google Maps (optional — for real geocoding)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Celery (if running locally with Redis)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Maintenance alert schedule (days before service)
MAINTENANCE_REMINDER_DAYS=7
```

> **Tip:** Generate a strong SECRET_KEY with:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

#### 2e. Set up the PostgreSQL database

Using `psql`:
```sql
CREATE DATABASE fleetflow;
```

Or using pgAdmin:
1. Open pgAdmin
2. Right-click "Databases" → Create → Database
3. Name: `fleetflow`, Owner: `postgres`
4. Click Save

#### 2f. Run database migrations

```bash
alembic upgrade head
```

This will create all tables in your `fleetflow` database.

**Expected output:**
```
INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> <hash>, initial schema
...
INFO  [alembic.runtime.migration] Running upgrade ... -> head
```

#### 2g. Create your first admin user

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@fleetflow.com",
    "password": "admin123",
    "role": "admin"
  }'
```

Or use Swagger UI at `http://localhost:8000/docs`

#### 2h. Start the backend server

```bash
uvicorn app.main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

✅ **Backend running at:** `http://localhost:8000`
✅ **Swagger UI at:** `http://localhost:8000/docs`

---

### Step 3: Frontend Setup

Open a **new terminal** and navigate to the Frontend:

```bash
cd FleetFlow/Frontend
```

#### 3a. Install Node dependencies

```bash
npm install
```

#### 3b. Start the development server

```bash
npm run dev
```

**Expected output:**
```
  VITE v8.x.x  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

✅ **Frontend running at:** `http://localhost:5173`

---

### Step 4: Start Redis (for Celery tasks)

**Windows (with Redis installed):**
```powershell
redis-server
```

**macOS:**
```bash
brew services start redis
```

**Linux:**
```bash
sudo systemctl start redis
```

---

### Step 5: Start Celery Workers (optional, for background tasks)

In a new terminal from `Backend/`:

```bash
# Activate venv first
venv\Scripts\activate  # Windows

# Start worker
celery -A app.celery_app.celery_app worker --loglevel=info

# Start scheduler (in another terminal)
celery -A app.celery_app.celery_app beat --loglevel=info
```

---

## Option B — Docker Compose Setup (Recommended for Production)

### Step 1: Build Docker images

From the `FleetFlow/` root directory:

```bash
# Build the backend image
docker build -t fleetflow-backend:latest ./Backend

# Build the frontend image
docker build -t fleetflow-frontend:latest ./Frontend
```

### Step 2: Configure environment variables

Create a `.env` file in the `FleetFlow/` root:

```env
SECRET_KEY=your-super-secret-key-here
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### Step 3: Start all services

```bash
docker-compose up -d
```

**Services started:**

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |

### Step 4: Run database migrations inside Docker

```bash
docker exec fleetflow-backend alembic upgrade head
```

### Step 5: Check service status

```bash
docker-compose ps
```

### Stop all services

```bash
docker-compose down

# To also remove volumes (delete all data)
docker-compose down -v
```

---

## Verification Checklist

After setup, verify these endpoints respond correctly:

```bash
# 1. Backend health check
curl http://localhost:8000/
# Expected: {"message": "FleetFlow Backend Running Successfully"}

# 2. Register admin user
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@fleetflow.com","password":"admin123","role":"admin"}'

# 3. Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fleetflow.com","password":"admin123"}'
# Expected: {"access_token":"eyJ...", "token_type":"bearer"}

# 4. Dashboard stats (with token)
curl http://localhost:8000/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

---

## Development Commands Reference

```bash
# ─── Backend ───────────────────────────────────────────────

# Start with auto-reload
uvicorn app.main:app --reload

# Start on custom port
uvicorn app.main:app --reload --port 8001

# Create new migration
alembic revision --autogenerate -m "add new table"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1

# View migration history
alembic history

# Run tests
cd Backend && pytest tests/ -v

# ─── Frontend ──────────────────────────────────────────────

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint check
npm run lint

# ─── Docker ────────────────────────────────────────────────

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Rebuild and restart
docker-compose up -d --build

# Stop all
docker-compose down
```

---

## Troubleshooting

### ❌ `psycopg2.OperationalError: could not connect to server`
- PostgreSQL is not running. Start it:
  - Windows: Open Services → Start "postgresql-x64-16"
  - macOS: `brew services start postgresql`
  - Linux: `sudo systemctl start postgresql`
- Check `DATABASE_URL` in `.env` — verify password and port

### ❌ `ModuleNotFoundError: No module named 'app'`
- Make sure you're running `uvicorn` from the `Backend/` directory
- Make sure your virtual environment is activated

### ❌ `401 Unauthorized` on API calls
- Token has expired — login again
- Token not being sent — check Axios interceptor in `Frontend/src/api/axios.js`
- Wrong format — must be `Authorization: Bearer <token>`

### ❌ `CORS Error` in browser
- Backend CORS allows `localhost:5173` and `localhost:5174`
- If using a different port, update `allow_origins` in `Backend/app/main.py`

### ❌ Frontend shows blank page after login
- Check browser console for errors
- Verify backend is running at port 8000
- Check `sessionStorage` for `access_token` key

### ❌ `alembic: command not found`
- Activate your virtual environment first
- Or use: `python -m alembic upgrade head`

### ❌ Celery not processing tasks
- Redis must be running (`redis-cli ping` should return `PONG`)
- Start worker: `celery -A app.celery_app.celery_app worker --loglevel=info`

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | sqlite:///./app.db | PostgreSQL connection string |
| `SECRET_KEY` | ✅ Yes | — | JWT signing key (min 32 chars) |
| `ALGORITHM` | No | HS256 | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | 480 | Token expiry (8 hours) |
| `GOOGLE_MAPS_API_KEY` | No | "" | For real geocoding |
| `CELERY_BROKER_URL` | No | redis://localhost:6379/0 | Celery task broker |
| `CELERY_RESULT_BACKEND` | No | redis://localhost:6379/0 | Celery results store |
| `MAINTENANCE_REMINDER_DAYS` | No | 7 | Days before maintenance alert |

---

*Document Version: 1.0 | Project: FleetFlow | Organization: Infosys Internship*
