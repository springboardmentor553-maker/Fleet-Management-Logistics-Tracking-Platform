from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

SECRET_KEY = os.getenv("SECRET_KEY", "secret")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30
print(SECRET_KEY)