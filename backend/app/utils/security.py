from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext


# ============================================================
# JWT SETTINGS
# ============================================================

SECRET_KEY = "fleetflow_secret_key"
ALGORITHM = "HS256"

# Token valid for 8 hours
ACCESS_TOKEN_EXPIRE_MINUTES = 480


# ============================================================
# PASSWORD
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# ============================================================
# JWT
# ============================================================

def create_access_token(data: dict) -> str:

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
        algorithm=ALGORITHM,
    )


# ============================================================
# OAUTH2
# ============================================================

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)


# ============================================================
# VERIFY TOKEN
# ============================================================

def verify_token(
    token: str = Depends(oauth2_scheme),
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        email = payload.get("sub")
        role = payload.get("role")

        if not email:

            raise HTTPException(
                status_code=401,
                detail="Token does not contain user email",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        if not role:

            raise HTTPException(
                status_code=401,
                detail="Token does not contain user role",
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        return payload

    except JWTError as exc:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from exc


# ============================================================
# ROLE MANAGEMENT
# ============================================================

ROLE_ALIASES = {

    "admin": "admin",
    "Admin": "admin",

    "manager": "manager",
    "Manager": "manager",
    "Fleet Manager": "manager",

    "driver": "driver",
    "Driver": "driver",

    "dispatcher": "dispatcher",
    "Dispatcher": "dispatcher",
}


def require_role(allowed_roles: list):

    def role_checker(
        user=Depends(verify_token)
    ):

        token_role = user.get("role")

        normalized_token_role = ROLE_ALIASES.get(
            token_role,
            token_role,
        )

        normalized_allowed_roles = [
            ROLE_ALIASES.get(
                role,
                role,
            )
            for role in allowed_roles
        ]

        if (
            normalized_token_role
            not in normalized_allowed_roles
        ):

            raise HTTPException(
                status_code=403,
                detail="Access Denied",
            )

        return user

    return role_checker