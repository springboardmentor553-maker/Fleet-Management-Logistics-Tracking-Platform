from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


SECRET_KEY = "fleetflow_secret_key"
ALGORITHM = "HS256"



def hash_password(password):

    return pwd_context.hash(password)



def verify_password(
    plain_password,
    hashed_password
):

    return pwd_context.verify(
        plain_password,
        hashed_password
    )



def create_access_token(data):

    expire = datetime.utcnow() + timedelta(
        minutes=60
    )

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