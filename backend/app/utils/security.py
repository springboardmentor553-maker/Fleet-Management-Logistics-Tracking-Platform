from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from app.config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)


# ============================================================
# PASSWORD CONFIGURATION
# ============================================================

MAX_PASSWORD_BYTES = 72


# ============================================================
# PASSWORD VALIDATION
# ============================================================

def _validate_password(password: str) -> None:
    """
    Validate password before sending it to bcrypt.

    bcrypt supports passwords up to 72 bytes.
    """

    if not isinstance(password, str):
        raise ValueError("Password must be a string.")

    if not password:
        raise ValueError("Password cannot be empty.")

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > MAX_PASSWORD_BYTES:
        raise ValueError(
            "Password cannot be longer than 72 bytes."
        )


# ============================================================
# HASH PASSWORD
# ============================================================

def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.
    """

    _validate_password(password)

    password_bytes = password.encode("utf-8")

    hashed_password = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed_password.decode("utf-8")


# ============================================================
# VERIFY PASSWORD
# ============================================================

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    """
    Verify a plain-text password against a bcrypt hash.
    """

    if not isinstance(plain_password, str):
        return False

    if not isinstance(hashed_password, str):
        return False

    try:
        plain_password_bytes = (
            plain_password.encode("utf-8")
        )

        hashed_password_bytes = (
            hashed_password.encode("utf-8")
        )

        return bcrypt.checkpw(
            plain_password_bytes,
            hashed_password_bytes
        )

    except (ValueError, TypeError):
        return False


# ============================================================
# CREATE ACCESS TOKEN
# ============================================================

def create_access_token(data: dict):
    """
    Create a JWT access token.
    """

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    to_encode.update({
        "exp": expire
    })

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )