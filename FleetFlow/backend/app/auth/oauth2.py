from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from app.auth.jwt_handler import verify_access_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="users/login"
)

def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    payload = verify_access_token(token)

    if payload is None:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return payload

def get_current_admin(
    current_user=Depends(get_current_user)
):

    if current_user["role"] != "Admin":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can perform this action"
        )

    return current_user