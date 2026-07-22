"""
Quick test: verify SQLAlchemy can query shipments without enum errors.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app.models.shipment import Shipment

db = SessionLocal()
try:
    shipments = db.query(Shipment).all()
    print(f"SUCCESS: fetched {len(shipments)} shipments")
    for s in shipments:
        print(f"  ID={s.id} status={s.current_status} ({type(s.current_status).__name__})")
except Exception as e:
    print(f"ERROR: {e}")
finally:
    db.close()
