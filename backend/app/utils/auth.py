from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

SECRET_KEY = "your_super_secret_key"
ALGORITHM = "HS256"

security = HTTPBearer()


def admin_required(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        email = payload.get("sub")
        role = payload.get("role")

        if role != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        return {
            "email": email,
            "role": role
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )