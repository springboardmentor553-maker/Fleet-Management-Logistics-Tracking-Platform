from fastapi import FastAPI, Depends, HTTPException, status
# trigger reload 2
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from app.models.driver import Driver
from app.routers import (
    auth, vehicles, drivers, shipments, trips, dashboard, 
    maintenance, analytics, fuel, fuel_record, background, 
    driver_assignments, attendance, fleet, maintenance_alerts, reports
)
from app.utils.dependencies import get_current_active_user

# Initialize the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FleetFlow - Fleet Management & Logistics Tracking Platform Backend APIs",
    version="1.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )


# Register routers
app.include_router(auth.router)
app.include_router(vehicles.router)
app.include_router(drivers.router)
app.include_router(shipments.router)
app.include_router(trips.router)
app.include_router(dashboard.router)
app.include_router(maintenance.router)
app.include_router(analytics.router)
app.include_router(fuel.router)
app.include_router(fuel_record.router)
app.include_router(background.router)
app.include_router(driver_assignments.router)
app.include_router(attendance.router)
app.include_router(fleet.router)
app.include_router(maintenance_alerts.router)
app.include_router(reports.router)

from fastapi import WebSocket, WebSocketDisconnect

@app.get("/", tags=["Health Check"])
@app.head("/", tags=["Health Check"])
def home():
    """
    Health check endpoint to verify that the FleetFlow backend is running successfully.
    """
    return {
        "message": "FleetFlow Backend Running Successfully"
    }

@app.on_event("startup")
async def startup_event():
    import os
    from app.database import SessionLocal
    from app.models.trip import Trip, TripStatus
    
    enable_simulator = os.getenv("ENABLE_SIMULATOR", "true").lower() == "true"
    if enable_simulator:
        print("[GPS SIMULATOR] Resuming simulations for active trips...")
        db = SessionLocal()
        try:
            active_trips = db.query(Trip).filter(Trip.trip_status == TripStatus.IN_TRANSIT).all()
            from app.websocket.simulator import start_simulation_background
            for trip in active_trips:
                if trip.shipment and trip.shipment.tracking_number:
                    print(f"[GPS SIMULATOR] Starting simulation for trip {trip.id} (tracking: {trip.shipment.tracking_number})")
                    await start_simulation_background(trip.shipment.tracking_number)
        except Exception as e:
            print(f"[GPS SIMULATOR] Failed to resume simulations: {e}")
        finally:
            db.close()

@app.websocket("/ws/shipment/{tracking_number}")
async def websocket_endpoint(websocket: WebSocket, tracking_number: str):
    from app.websocket.connection_manager import manager
    await manager.connect(tracking_number, websocket)
    try:
        while True:
            # We don't expect messages from the client right now, but we need to keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(tracking_number, websocket)

@app.get("/trip/{trip_id}/route", tags=["Trips"])
def get_trip_route_root(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Alias endpoint for retrieving trip routes (GET /trip/{trip_id}/route).
    """
    from app.services.trip import TripService
    from app.services.maps_service import MapsService
    
    trip_service = TripService(db)
    trip = trip_service.get_by_id(trip_id)
    
    if current_user.role == UserRole.DRIVER:
        driver = db.query(Driver).filter(Driver.user_id == current_user.id).first()
        if not driver or trip.driver_id != driver.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this route."
            )
            
    plat = trip.pickup_latitude
    plng = trip.pickup_longitude
    dlat = trip.destination_latitude
    dlng = trip.destination_longitude
    
    # Generate coordinates and routing details dynamically if not present
    if (plat is None or plng is None or dlat is None or dlng is None or 
        trip.distance_km is None or trip.estimated_duration is None or 
        trip.route_geometry is None):
        
        from app.services.geocoding_service import GeocodingService
        from app.services.route_service import RouteService
        
        if plat is None or plng is None:
            plat, plng = GeocodingService.geocode(trip.pickup_location)
            trip.pickup_latitude = plat
            trip.pickup_longitude = plng
        if dlat is None or dlng is None:
            dlat, dlng = GeocodingService.geocode(trip.destination)
            trip.destination_latitude = dlat
            trip.destination_longitude = dlng
            
        route_info = RouteService.get_route(plat, plng, dlat, dlng)
        trip.distance_km = route_info["distance_km"]
        trip.estimated_duration = route_info["estimated_duration"]
        trip.route_summary = route_info["route_summary"]
        trip.route_geometry = route_info["route_geometry"]
        
        db.commit()
        db.refresh(trip)
        
    return {
        "trip_id": trip.id,
        "pickup_location": trip.pickup_location,
        "destination": trip.destination,
        "pickup_coordinates": {
            "latitude": trip.pickup_latitude,
            "longitude": trip.pickup_longitude
        },
        "destination_coordinates": {
            "latitude": trip.destination_latitude,
            "longitude": trip.destination_longitude
        },
        "current_location": {
            "latitude": trip.current_latitude,
            "longitude": trip.current_longitude,
            "updated_at": trip.location_updated_at.isoformat() if trip.location_updated_at else None
        } if trip.current_latitude is not None and trip.current_longitude is not None else None,
        "distance": f"{trip.distance_km} km" if trip.distance_km is not None else "0 km",
        "estimated_time": trip.estimated_duration,
        "estimated_travel_time": trip.estimated_duration,
        "route_summary": trip.route_summary or "NH44 Route",
        "route_geometry": trip.route_geometry,
        "polyline": ""
    }
# Triggering Uvicorn reload
