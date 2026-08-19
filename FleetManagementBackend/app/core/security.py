from datetime import datetime, timedelta

from jose import jwt
from pwdlib import PasswordHash


# Password hashing
password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return password_hash.verify(
        plain_password,
        hashed_password
    )


# JWT configuration
SECRET_KEY = "fleetflow_secret_key"
ALGORITHM = "HS256"


def create_access_token(data: dict):
    expire = datetime.utcnow() + timedelta(
        minutes=60
    )

    data = data.copy()
    data.update(
        {
            "exp": expire
        }
    )

    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )