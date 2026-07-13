import json
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.utils.dependencies import get_db, get_current_user
from app.utils.roles import Role, require_roles
from app.models.vehicle import Vehicle
from app.models.user import User

router = APIRouter(prefix="/gps", tags=["GPS"])

# ── WebSocket connection manager ──────────────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)


manager = ConnectionManager()


# ── Schemas ───────────────────────────────────────────────────────────────────
class LocationUpdate(BaseModel):
    latitude:  float = Field(..., example=12.9716)
    longitude: float = Field(..., example=77.5946)


class LocationResponse(BaseModel):
    id:           int
    plate_number: str
    latitude:     float | None
    longitude:    float | None
    current_status: str

    model_config = {"from_attributes": True}


# ── REST: update vehicle location ─────────────────────────────────────────────
@router.patch("/vehicles/{vehicle_id}/location", response_model=LocationResponse)
async def update_location(
    vehicle_id: int,
    data: LocationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER)),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    vehicle.latitude  = data.latitude
    vehicle.longitude = data.longitude
    db.commit()
    db.refresh(vehicle)

    # Broadcast to all WebSocket clients
    await manager.broadcast({
        "vehicle_id":     vehicle.id,
        "plate_number":   vehicle.plate_number,
        "latitude":       vehicle.latitude,
        "longitude":      vehicle.longitude,
        "current_status": vehicle.current_status,
    })

    return vehicle


# ── REST: get all vehicle locations ──────────────────────────────────────────
@router.get("/vehicles/locations", response_model=list[LocationResponse])
def get_all_locations(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Vehicle).filter(Vehicle.latitude.isnot(None)).all()


# ── WebSocket: live location feed ─────────────────────────────────────────────
@router.websocket("/ws/locations")
async def ws_locations(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()   # keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
