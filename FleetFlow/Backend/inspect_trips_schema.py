import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd()))
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='trips' ORDER BY column_name"))
    cols = [row[0] for row in result]
    print(cols)
