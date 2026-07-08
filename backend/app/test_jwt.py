from backend.app.utils.jwt_handler import create_access_token

token = create_access_token(
    {"sub": "deepika@gmail.com"}
)

print(token)