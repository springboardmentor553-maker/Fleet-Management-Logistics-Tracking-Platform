from fastapi import Depends, HTTPException, status
from app.security import oauth2_scheme
from app.config import SECRET_KEY, ALGORITHM
from jose import jwt


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Token"
        )


def administrator_required(user: dict = Depends(get_current_user)):
    if user.get("role") != "Administrator":
        raise HTTPException(
            status_code=403,
            detail="Only Administrator can access this API"
        )
    return user


def fleet_manager_required(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["Administrator", "Fleet Manager"]:
        raise HTTPException(
            status_code=403,
            detail="Only Administrator or Fleet Manager can access this API"
        )
    return user


def dispatcher_required(user: dict = Depends(get_current_user)):
    if user.get("role") not in ["Administrator", "Dispatcher"]:
        raise HTTPException(
            status_code=403,
            detail="Only Administrator or Dispatcher can access this API"
        )
    return user


def driver_required(user: dict = Depends(get_current_user)):
    if user.get("role") != "Driver":
        raise HTTPException(
            status_code=403,
            detail="Only Driver can access this API"
        )
    return user

def dashboard_required(
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in [
        "Administrator",
        "Fleet Manager",
        "Driver",
        "Dispatcher"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return user

def fleet_operations_required(
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in [
        "Administrator",
        "Fleet Manager",
        "Dispatcher"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return user
def shipment_view_required(
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in [
        "Administrator",
        "Fleet Manager",
        "Dispatcher",
        "Driver"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return user

def trip_view_required(
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in [
        "Administrator",
        "Fleet Manager",
        "Dispatcher",
        "Driver"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return user

def driver_view_required(
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in [
        "Administrator",
        "Fleet Manager",
        "Driver",
        "Dispatcher"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return user

def vehicle_view_required(
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in [
        "Administrator",
        "Fleet Manager",
        "Driver",
        "Dispatcher"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return user

def fuel_view_required(
    user=Depends(get_current_user)
):
    role = user["role"].lower().replace(" ", "_")

    allowed_roles = [
        "administrator",
        "fleet_manager",
        "driver",
        "dispatcher"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view fuel records"
        )

    return user

def reports_required(
    user: dict = Depends(get_current_user)
):
    role = user.get("role", "").lower().replace(" ", "_")

    allowed_roles = [
        "administrator",
        "fleet_manager",
        "dispatcher"
    ]

    if role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access reports"
        )

    return user

def fuel_management_required(
    user: dict = Depends(get_current_user)
):
    if user.get("role") not in [
        "Administrator",
        "Fleet Manager"
    ]:
        raise HTTPException(
            status_code=403,
            detail="Only Administrator or Fleet Manager can manage fuel records"
        )

    return user