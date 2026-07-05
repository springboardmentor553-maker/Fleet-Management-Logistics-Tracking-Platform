from sqlalchemy import text

from app.database import engine

try:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    print("Database Connected Successfully!")
except Exception as e:
    print("Connection Failed")
    print(e)