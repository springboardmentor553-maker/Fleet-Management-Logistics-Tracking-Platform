<<<<<<< HEAD
import os

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)
=======
DATABASE_URL = "postgresql://postgres:Ramya@localhost:5432/fleet_flow_db"
>>>>>>> 3fe352e492c5f4e3aad06022327550a07322882a
