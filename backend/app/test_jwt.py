from utils.jwt_handler import create_access_token

token = create_access_token(
    {"sub": "amisha@example.com"}
)

print(token)
