
SECRET_KEY = "fleetflow_super_secret_key_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
def create_access_token(data: dict):
    {
    "sub": "john@example.com",
    "exp":"expiry time"
}