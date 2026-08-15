import os
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import bcrypt
from app.config import settings

# In-memory blacklist for revoked JWT tokens (logged out)
token_blacklist = set()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against its hashed version.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    Generate a bcrypt hash of the password.
    """
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """
    Create a JWT access token containing a subject ('sub') and expiration ('exp').
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def blacklist_token(token: str) -> None:
    """
    Add a JWT token to the in-memory blacklist.
    """
    token_blacklist.add(token)

def is_token_blacklisted(token: str) -> bool:
    """
    Check if a JWT token has been blacklisted.
    """
    return token in token_blacklist
