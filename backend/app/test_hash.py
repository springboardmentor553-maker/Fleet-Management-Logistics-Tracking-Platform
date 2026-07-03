from utils.security import hash_password

password = "admin123"

hashed = hash_password(password)

print("Original Password:", password)
print("Hashed Password:", hashed)