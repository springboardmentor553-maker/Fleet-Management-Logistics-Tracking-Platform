# 🚚 FleetFlow — Fleet Management System

A full-stack fleet management application built with **FastAPI** (Python) and **React** (Vite). It provides real-time fleet operations management including vehicle tracking, driver management, shipment dispatching, and a live dashboard — all secured with JWT-based authentication and role-based access control.

---

## 📁 Project Structure

```
FleetFlow/
├── Backend/                  # FastAPI application
│   ├── app/
│   │   ├── models/           # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── driver.py
│   │   │   ├── vehicle.py
│   │   │   └── shipment.py
│   │   ├── routers/          # API route handlers
│   │   │   ├── auth.py       # Register, Login, /me
│   │   │   ├── admin.py      # User management (admin only)
│   │   │   ├── fleet.py      # Vehicle CRUD
│   │   │   ├── drivers.py    # Driver CRUD (management)
│   │   │   ├── driver.py     # Driver self-service (shipments)
│   │   │   ├── dispatcher.py # Shipment creation & assignment
│   │   │   └── dashboard.py  # Fleet stats
│   │   ├── schemas/          # Pydantic request/response models
│   │   ├── services/         # Business logic layer
│   │   ├── utils/
│   │   │   ├── security.py   # bcrypt hashing + JWT
│   │   │   ├── dependencies.py # get_db, get_current_user
│   │   │   └── roles.py      # Role enum + require_roles()
│   │   ├── database.py       # SQLAlchemy engine + Base
│   │   ├── config.py         # Pydantic settings
│   │   └── main.py           # FastAPI app entry point
│   ├── migrations/           # Alembic migration files
│   ├── .env                  # Environment variables
│   ├── alembic.ini
│   └── requirements.txt
│
└── Frontend/                 # React + Vite application
    └── src/
        ├── api/
        │   ├── axios.js      # Axios instance with auth interceptor
        │   ├── auth.js       # Login, getMe
        │   ├── dashboard.js  # Stats API
        │   ├── vehicles.js   # Vehicle CRUD
        │   └── drivers.js    # Driver CRUD
        ├── components/
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Vehicles.jsx
        │   ├── Drivers.jsx
        │   ├── Wireframes.jsx
        │   └── StatCard.jsx
        ├── App.jsx            # App shell + sidebar routing
        └── App.css            # All styles (dark fleet theme)
```

---

## ⚙️ Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | Python 3.13, FastAPI, SQLAlchemy 2.0    |
| Database   | PostgreSQL                              |
| Migrations | Alembic                                 |
| Auth       | JWT (python-jose), bcrypt               |
| Frontend   | React 19, Vite 8                        |
| HTTP Client| Axios                                   |
| Styling    | Plain CSS (dark theme)                  |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL running locally

---

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd FleetFlow
```

---

### 2. Backend Setup

```bash
cd Backend
```

**Create and activate a virtual environment**

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

**Install dependencies**

```bash
pip install -r requirements.txt
```

**Configure environment variables**

Create a `.env` file in the `Backend/` directory:

```env
DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/fleetflow
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Create the PostgreSQL database**

```sql
CREATE DATABASE fleetflow;
```

**Run database migrations**

```bash
alembic upgrade head
```

**Start the backend server**

```bash
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔐 Authentication

FleetFlow uses **JWT Bearer token** authentication.

1. Register a user via `POST /auth/register`
2. Login via `POST /auth/login` — returns an `access_token`
3. All protected routes require the header: `Authorization: Bearer <token>`

The Axios instance in `src/api/axios.js` automatically attaches the token from `sessionStorage` to every request.

**Register your first admin user:**

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin User", "email": "admin@fleetflow.com", "password": "admin123", "role": "admin"}'
```

---

## 👥 Roles & Permissions

| Role            | Permissions                                              |
|-----------------|----------------------------------------------------------|
| `admin`         | Full access to all endpoints                             |
| `fleet_manager` | Manage vehicles and drivers, view dashboard              |
| `dispatcher`    | Create & assign shipments, manage drivers                |
| `driver`        | View own assigned shipments, mark deliveries             |

---

## 📡 API Endpoints

### Auth — `/auth`
| Method | Endpoint         | Access  | Description              |
|--------|------------------|---------|--------------------------|
| POST   | `/auth/register` | Public  | Register a new user      |
| POST   | `/auth/login`    | Public  | Login, returns JWT token |
| GET    | `/auth/me`       | Any     | Get current user profile |

### Admin — `/admin`
| Method | Endpoint                       | Access | Description        |
|--------|--------------------------------|--------|--------------------|
| GET    | `/admin/users`                 | Admin  | List all users     |
| PATCH  | `/admin/users/{id}/activate`   | Admin  | Activate a user    |
| PATCH  | `/admin/users/{id}/deactivate` | Admin  | Deactivate a user  |
| PATCH  | `/admin/users/{id}/role`       | Admin  | Change user role   |

### Vehicles — `/vehicles`
| Method | Endpoint            | Access                    | Description          |
|--------|---------------------|---------------------------|----------------------|
| GET    | `/vehicles/`        | Admin, Fleet Manager      | List all vehicles    |
| GET    | `/vehicles/{id}`    | Admin, Fleet Manager      | Get vehicle by ID    |
| POST   | `/vehicles/`        | Admin, Fleet Manager      | Add new vehicle      |
| PUT    | `/vehicles/{id}`    | Admin, Fleet Manager      | Update vehicle       |
| DELETE | `/vehicles/{id}`    | Admin, Fleet Manager      | Delete vehicle       |

### Drivers — `/drivers`
| Method | Endpoint           | Access                              | Description        |
|--------|--------------------|-------------------------------------|--------------------|
| GET    | `/drivers/`        | Admin, Fleet Manager, Dispatcher    | List all drivers   |
| GET    | `/drivers/{id}`    | Admin, Fleet Manager, Dispatcher    | Get driver by ID   |
| POST   | `/drivers/`        | Admin, Fleet Manager, Dispatcher    | Add new driver     |
| PUT    | `/drivers/{id}`    | Admin, Fleet Manager, Dispatcher    | Update driver      |
| DELETE | `/drivers/{id}`    | Admin, Fleet Manager, Dispatcher    | Delete driver      |

### Dispatcher — `/dispatcher`
| Method | Endpoint                              | Access                  | Description              |
|--------|---------------------------------------|-------------------------|--------------------------|
| GET    | `/dispatcher/shipments`               | Admin, Dispatcher       | List all shipments       |
| POST   | `/dispatcher/shipments`               | Admin, Dispatcher       | Create shipment          |
| PATCH  | `/dispatcher/shipments/{id}/assign`   | Admin, Dispatcher       | Assign driver + vehicle  |
| PATCH  | `/dispatcher/shipments/{id}/cancel`   | Admin, Dispatcher       | Cancel shipment          |

### Driver Self-Service — `/driver`
| Method | Endpoint                            | Access         | Description              |
|--------|-------------------------------------|----------------|--------------------------|
| GET    | `/driver/my-shipments`              | Driver, Admin  | View own shipments       |
| PATCH  | `/driver/shipments/{id}/deliver`    | Driver, Admin  | Mark shipment delivered  |

### Dashboard — `/dashboard`
| Method | Endpoint            | Access | Description          |
|--------|---------------------|--------|----------------------|
| GET    | `/dashboard/stats`  | Any    | Get fleet statistics |

---

## 🗄️ Database Models

### User
| Field             | Type    | Description                              |
|-------------------|---------|------------------------------------------|
| id                | Integer | Primary key                              |
| name              | String  | Full name                                |
| email             | String  | Unique, indexed                          |
| hashed_password   | String  | bcrypt hashed                            |
| role              | String  | admin / fleet_manager / driver / dispatcher |
| is_active         | Boolean | Account status                           |
| created_at        | DateTime| Timestamp                                |

### Driver
| Field          | Type    | Description          |
|----------------|---------|----------------------|
| id             | Integer | Primary key          |
| name           | String  | Full name            |
| email          | String  | Unique               |
| phone          | String  | Contact number       |
| license_number | String  | Unique               |
| is_available   | Boolean | Trip availability    |
| created_at     | DateTime| Timestamp            |

### Vehicle
| Field        | Type    | Description          |
|--------------|---------|----------------------|
| id           | Integer | Primary key          |
| plate_number | String  | Unique, indexed      |
| model        | String  | Vehicle model name   |
| capacity_kg  | Float   | Load capacity        |
| is_available | Boolean | Fleet availability   |
| created_at   | DateTime| Timestamp            |

### Shipment
| Field        | Type    | Description                              |
|--------------|---------|------------------------------------------|
| id           | Integer | Primary key                              |
| origin       | String  | Pickup location                          |
| destination  | String  | Drop location                            |
| weight_kg    | Float   | Cargo weight                             |
| status       | String  | pending / in_transit / delivered / cancelled |
| driver_id    | FK      | Assigned driver                          |
| vehicle_id   | FK      | Assigned vehicle                         |
| created_at   | DateTime| Created timestamp                        |
| delivered_at | DateTime| Delivery timestamp                       |

---

## 🖥️ Frontend Pages

| Page            | Route (sidebar) | Description                                      |
|-----------------|-----------------|--------------------------------------------------|
| Login           | —               | Email + password login form                      |
| Dashboard       | 📊 Dashboard    | 7 live stat cards from `/dashboard/stats`        |
| Vehicles        | 🚛 Vehicles     | Full CRUD table + modal form                     |
| Drivers         | 👤 Drivers      | Full CRUD table + modal form with avatar initials|
| Wireframes      | 🖼️ Wireframes   | Annotated SVG wireframes for all 4 screens       |

---

## 🗺️ UI Wireframes

The app includes a built-in **Wireframes** page (accessible from the sidebar) with annotated SVG wireframes for:

1. **Login Page** — card layout, email/password fields, submit button
2. **Dashboard** — sidebar + 7 color-coded stat cards
3. **Vehicle Registration** — data table + add/edit modal
4. **Driver Management** — table with avatar initials, license badge, status badges

---

## 🔄 Shipment Lifecycle

```
pending  ──► in_transit  ──► delivered
                │
                └──► cancelled
```

- Dispatcher creates a shipment (`pending`)
- Dispatcher assigns a driver + vehicle → status becomes `in_transit`, driver and vehicle marked unavailable
- Driver marks it delivered → status becomes `delivered`, driver and vehicle freed back to available
- Dispatcher can cancel any non-delivered shipment

---

## 🛠️ Development Commands

```bash
# Backend — run server
uvicorn app.main:app --reload

# Backend — create new migration
alembic revision --autogenerate -m "description"

# Backend — apply migrations
alembic upgrade head

# Backend — rollback one step
alembic downgrade -1

# Frontend — dev server
npm run dev

# Frontend — production build
npm run build
```

---

## 📦 Backend Dependencies

```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
python-dotenv
pydantic-settings
pydantic[email]
passlib
bcrypt
python-jose[cryptography]
alembic
```

## 📦 Frontend Dependencies

```
react 19
react-dom 19
axios
vite 8
```

---

## 🔒 Security Notes

- Passwords are hashed using **bcrypt** directly (not via passlib, which has compatibility issues with bcrypt >= 4.0)
- JWT tokens expire after 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Tokens are stored in `sessionStorage` — cleared automatically when the browser tab is closed
- All protected routes validate the token on every request via the `get_current_user` dependency
- Role enforcement is done via the `require_roles()` factory — returns a 403 if the role doesn't match

---

## 👨‍💻 Author

Built as part of the **Infosys Internship Project** — FleetFlow Fleet Management System.
