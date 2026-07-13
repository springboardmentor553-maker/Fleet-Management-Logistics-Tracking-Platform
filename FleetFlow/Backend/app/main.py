from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.routers import auth, admin, fleet, dispatcher, driver, drivers, dashboard, shipment, trip, gps, route

app = FastAPI(
    title="FleetFlow API",
    description="Fleet Management System — call POST /auth/login, copy the access_token, click **Authorize** and paste it.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/", tags=["Health"])
def home():
    return {"message": "FleetFlow Backend Running Successfully"}
