import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "sqlite:///./freightflow.db"

SECRET_KEY = "a-very-long-random-secret-string-change-this-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

ORS_API_KEY = os.getenv("ORS_API_KEY")