from fastapi import Depends, HTTPException, status
from jose import jwt
from app.security import oauth2_scheme

SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"


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
    if user.get("role") != "Fleet Manager":
        raise HTTPException(
            status_code=403,
            detail="Only Fleet Manager can access this API"
        )
    return user


def dispatcher_required(user: dict = Depends(get_current_user)):
    if user.get("role") != "Dispatcher":
        raise HTTPException(
            status_code=403,
            detail="Only Dispatcher can access this API"
        )
    return user


def driver_required(user: dict = Depends(get_current_user)):
    if user.get("role") != "Driver":
        raise HTTPException(
            status_code=403,
            detail="Only Driver can access this API"
        )
    return user