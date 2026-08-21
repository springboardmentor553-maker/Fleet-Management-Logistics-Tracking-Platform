from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.routers import (
    auth,
    admin,
    fleet,
    dispatcher,
    driver,
    drivers,
    dashboard,
    shipment,
    trip,
    gps,
    route,
    maintenance,
    driver_assignment,
    fuel,
    analytics,
    maintenance_alert,
    reports,
    notifications,
    reports_export,
)

from app.connection_manager import manager
from app.database import init_db
from fastapi import WebSocket, WebSocketDisconnect
from app.routers.driver_assignment import router_driver


app = FastAPI(
    title="FleetFlow API",
    description="Fleet Management System — call POST /auth/login, copy the access_token, click **Authorize** and paste it.",
    version="1.0.0",
)


# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",

        # Render deployed frontend
        "https://fleetflow-frontend-i8rs.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# ROUTERS
# --------------------------------------------------

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(fleet.router)
app.include_router(dispatcher.router)
app.include_router(driver.router)
app.include_router(drivers.router)
app.include_router(dashboard.router)
app.include_router(shipment.router)
app.include_router(trip.router)
app.include_router(gps.router)
app.include_router(route.router)
app.include_router(maintenance.router)
app.include_router(maintenance_alert.router)
app.include_router(reports.router)
app.include_router(driver_assignment.router)
app.include_router(router_driver)
app.include_router(fuel.router)
app.include_router(analytics.router)
app.include_router(notifications.router)
app.include_router(reports_export.router)


# --------------------------------------------------
# STARTUP
# --------------------------------------------------

@app.on_event("startup")
def on_startup():
    init_db()
    manager.ensure_simulation_running()


# --------------------------------------------------
# CUSTOM OPENAPI
# --------------------------------------------------

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add BearerAuth security scheme
    schema.setdefault("components", {})["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Paste the access_token from POST /auth/login",
        }
    }

    # Apply BearerAuth to every operation
    for path_item in schema["paths"].values():
        for operation in path_item.values():
            if isinstance(operation, dict):
                operation["security"] = [{"BearerAuth": []}]

    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/", tags=["Health"])
def home():
    return {
        "message": "FleetFlow Backend Running Successfully"
    }


# --------------------------------------------------
# WEBSOCKET
# --------------------------------------------------

@app.websocket("/ws/tracking/{trip_id}")
async def tracking_socket(websocket: WebSocket, trip_id: int):
    await manager.connect(websocket, trip_id)

    await websocket.send_json({
        "type": "connected",
        "trip_id": trip_id
    })

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        await manager.disconnect(websocket, trip_id)