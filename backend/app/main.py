import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import auth, driver, vehicle, trip, users
from app.routers.shipment import router as shipment_router
from app.routers.dashboard import router as dashboard_router

# ---------------------------------------------------------------------------
# Logging — structured output to stdout so uvicorn captures it cleanly
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("fleetflow")

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app = FastAPI(
    title="FleetFlow API",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS — must be registered BEFORE any routers
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


def _cors_headers(origin: str) -> dict:
    """Return CORS headers when the request origin is in the allow-list."""
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    return {}


# ---------------------------------------------------------------------------
# Exception handlers
#
# Starlette's CORSMiddleware does NOT add CORS headers when an exception
# short-circuits the middleware chain, so we inject them manually here for
# BOTH expected (HTTPException) and unexpected (Exception) errors.
# Without the catch-all handler a 500 from SQLAlchemy / Python crashes shows
# up in the browser as a mysterious CORS error instead of the real message.
# ---------------------------------------------------------------------------

@app.exception_handler(HTTPException)
async def cors_aware_http_exception_handler(request: Request, exc: HTTPException):
    origin = request.headers.get("origin", "")
    logger.warning(
        "HTTP %s — %s %s — %s",
        exc.status_code,
        request.method,
        request.url.path,
        exc.detail,
    )
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=_cors_headers(origin),
    )
    return response


@app.exception_handler(Exception)
async def cors_aware_generic_exception_handler(request: Request, exc: Exception):
    """Catch-all handler so unhandled Python exceptions also carry CORS headers.

    Without this, a SQLAlchemy OperationalError, AttributeError, etc. returns
    a 500 with no Access-Control-Allow-Origin, and the browser reports it as a
    CORS error — masking the real root cause.
    """
    origin = request.headers.get("origin", "")
    logger.exception(
        "Unhandled exception on %s %s",
        request.method,
        request.url.path,
    )
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Check the backend logs for details."},
        headers=_cors_headers(origin),
    )
    return response


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(driver.router)
app.include_router(vehicle.router)
app.include_router(shipment_router)
app.include_router(trip.router)
app.include_router(users.router)
app.include_router(dashboard_router)


@app.get("/")
def home():
    return {"message": "FleetFlow Backend Running Successfully"}
