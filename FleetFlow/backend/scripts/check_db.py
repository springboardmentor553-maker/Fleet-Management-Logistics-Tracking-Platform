from app.database import SessionLocal
from app.models.driver import Driver
from app.models.driver_attendance import DriverAttendance
from app.models.fuel_record import FuelRecord
from app.models.maintenance import MaintenanceRecord
from app.models.shipment import Shipment
from app.models.vehicle import Vehicle

db = SessionLocal()

print("Vehicles:", db.query(Vehicle).count())
print("Vehicles in Maintenance:", db.query(Vehicle).filter(Vehicle.current_status == 'MAINTENANCE').count())
print("Drivers:", db.query(Driver).count())
print("Drivers ON_DUTY:", db.query(Driver).filter(Driver.status == 'ON_DUTY').count())
print("Shipments:", db.query(Shipment).count())
print("Shipments DELAYED:", db.query(Shipment).filter(Shipment.status == 'DELAYED').count())
print("Fuel Records:", db.query(FuelRecord).count())
print("Maintenance Records:", db.query(MaintenanceRecord).count())
print("Driver Attendance:", db.query(DriverAttendance).count())

total_fuel_cost = sum(r.fuel_cost for r in db.query(FuelRecord).all())
print(f"Total fuel cost (should be 95 per liter): {total_fuel_cost}")

