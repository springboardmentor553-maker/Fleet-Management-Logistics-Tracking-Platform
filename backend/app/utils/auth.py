from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

SECRET_KEY = "your_super_secret_key"
ALGORITHM = "HS256"

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")
        username = payload.get("username")
        email = payload.get("sub")
        role = payload.get("role")

        if not user_id or not role:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        return {
            "id": user_id,
            "username": username,
            "email": email,
            "role": role
        }

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


def admin_required(
    user=Depends(get_current_user)
):

    if user["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user


def manager_required(
    user=Depends(get_current_user)
):

    if user["role"] not in ["admin", "manager"]:

        raise HTTPException(
            status_code=403,
            detail="Manager access required"
        )

    return user


def driver_required(
    user=Depends(get_current_user)
):

    if user["role"] not in [
        "admin",
        "manager",
        "driver"
    ]:

        raise HTTPException(
            status_code=403,
            detail="Driver access required"
        )

    return user