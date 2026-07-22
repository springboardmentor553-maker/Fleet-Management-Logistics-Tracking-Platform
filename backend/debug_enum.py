"""
Debug: test how SQLAlchemy maps the enum values.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.models.shipment import ShipmentStatus
from sqlalchemy import Enum as SQLEnum

# Check how SQLAlchemy sees the enum
sa_enum = SQLEnum(ShipmentStatus)
print("SQLAlchemy enum enums:", sa_enum.enums)
print("SQLAlchemy enum._valid_lookup:", sa_enum._valid_lookup if hasattr(sa_enum, '_valid_lookup') else 'N/A')

# Check the enum itself
print("\nPython enum members:")
for m in ShipmentStatus:
    print(f"  name={m.name!r}  value={m.value!r}")
