from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, admin, fleet, dispatcher, driver, drivers, dashboard

app = FastAPI(title="FleetFlow API")

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

@app.get("/")
def home():
    return {"message": "FleetFlow Backend Running Successfully"}
