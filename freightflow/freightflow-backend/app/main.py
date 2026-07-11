from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.common.exceptions import DomainError, domain_error_handler
from app.core.settings import get_settings
from app.modules.accounts.router import accounts_router, auth_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.drivers.router import router as drivers_router
from app.modules.fleet.router import router as fleet_router
from app.modules.maintenance.router import router as maintenance_router
from app.modules.notifications.router import router as notifications_router
from app.modules.reporting.router import router as reporting_router
from app.modules.routes_ops.router import router as routes_router
from app.modules.shipments.router import router as shipments_router
from app.modules.tracking.router import router as tracking_router

settings = get_settings()

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(DomainError, domain_error_handler)

api = settings.api_prefix
app.include_router(auth_router, prefix=api)
app.include_router(accounts_router, prefix=api)
app.include_router(fleet_router, prefix=api)
app.include_router(drivers_router, prefix=api)
app.include_router(shipments_router, prefix=api)
app.include_router(routes_router, prefix=api)
app.include_router(maintenance_router, prefix=api)
app.include_router(tracking_router, prefix=api)
app.include_router(notifications_router, prefix=api)
app.include_router(dashboard_router, prefix=api)
app.include_router(reporting_router, prefix=api)


@app.get("/", tags=["Health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
