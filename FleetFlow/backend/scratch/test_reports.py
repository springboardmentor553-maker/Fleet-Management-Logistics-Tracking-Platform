from app.database import SessionLocal
from app.models.maintenance import MaintenanceRecord
from sqlalchemy import func
db = SessionLocal()
res = db.query(MaintenanceRecord.category).group_by(MaintenanceRecord.category).order_by(func.count(MaintenanceRecord.id).desc()).first()
if res:
    print(type(res[0]))
    try:
        print(res[0].value)
    except Exception as e:
        print("Error:", e)
