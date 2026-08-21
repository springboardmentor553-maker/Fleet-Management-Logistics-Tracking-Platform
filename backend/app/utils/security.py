from passlib.context import CryptContext


# =========================================================
# PASSWORD HASHING CONFIGURATION
# =========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================================================
# HASH PASSWORD
# =========================================================

def hash_password(password: str) -> str:

    return pwd_context.hash(password)


# =========================================================
# VERIFY PASSWORD
# =========================================================

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password
    )