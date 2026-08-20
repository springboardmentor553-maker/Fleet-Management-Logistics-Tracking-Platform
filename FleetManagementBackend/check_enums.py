from sqlalchemy import text
from app.database import engine

with engine.connect() as connection:
    result = connection.execute(
        text("SELECT typname FROM pg_type WHERE typcategory = 'E' ORDER BY typname")
    )

    print("ENUM TYPES:")
    for row in result:
        print(row[0])