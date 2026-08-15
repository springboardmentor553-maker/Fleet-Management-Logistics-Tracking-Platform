from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.fuel_record import FuelRecordModel as FuelLog
from app.models.vehicle import Vehicle
from app.models.driver import Driver
from app.models.user import User

class FuelService:
    def __init__(self, db: Session):
        self.db = db

    def get_analytics(self) -> dict:
        total_fuel = self.db.query(func.sum(FuelLog.fuel_quantity)).scalar() or 0.0
        total_cost = self.db.query(func.sum(FuelLog.fuel_cost)).scalar() or 0.0

        # Trip averages (FuelRecordModel doesn't use trip_id, so calculate averages per record as requested)
        trip_logs_count = self.db.query(FuelLog).count()
        trip_fuel_total = total_fuel
        trip_cost_total = total_cost
        
        # highest_expense
        highest_expense = self.db.query(func.max(FuelLog.fuel_cost)).scalar() or 0.0
        
        avg_trip_consumption = trip_fuel_total / trip_logs_count if trip_logs_count > 0 else 0.0
        avg_trip_cost = trip_cost_total / trip_logs_count if trip_logs_count > 0 else 0.0

        # Highest consuming driver
        highest_driver = self.db.query(
            Driver.id,
            User.full_name,
            func.sum(FuelLog.fuel_quantity).label("total_qty")
        ).join(FuelLog, Driver.id == FuelLog.driver_id) \
         .join(User, Driver.user_id == User.id) \
         .group_by(Driver.id, User.full_name) \
         .order_by(func.sum(FuelLog.fuel_quantity).desc()) \
         .first()

        highest_driver_name = highest_driver.full_name if highest_driver and highest_driver.full_name else "N/A"

        # Most efficient vehicle (For simplicity: least fuel consumed, or we can use distance if available)
        # Let's find the vehicle with the lowest total fuel that has at least one record
        efficient_vehicle = self.db.query(
            Vehicle.license_plate,
            func.sum(FuelLog.fuel_quantity).label("total_qty")
        ).join(FuelLog, Vehicle.id == FuelLog.vehicle_id) \
         .group_by(Vehicle.id, Vehicle.license_plate) \
         .order_by(func.sum(FuelLog.fuel_quantity).asc()) \
         .first()
         
        most_efficient_vehicle = efficient_vehicle.license_plate if efficient_vehicle else "N/A"

        return {
            "total_fuel_consumed": round(total_fuel, 2),
            "total_fuel_cost": round(total_cost, 2),
            "average_trip_consumption": round(avg_trip_consumption, 2),
            "average_cost_per_trip": round(avg_trip_cost, 2),
            "most_efficient_vehicle": most_efficient_vehicle,
            "highest_consuming_driver": highest_driver_name,
            "highest_expense": round(highest_expense, 2)
        }

    def get_monthly_charts(self):
        # Return monthly aggregation of fuel usage and cost
        # Group by month (YYYY-MM)
        results = self.db.query(
            func.to_char(FuelLog.fuel_date, 'YYYY-MM').label('month'),
            func.sum(FuelLog.fuel_quantity).label('fuel_usage'),
            func.sum(FuelLog.fuel_cost).label('fuel_cost')
        ).group_by(func.to_char(FuelLog.fuel_date, 'YYYY-MM')) \
         .order_by(func.to_char(FuelLog.fuel_date, 'YYYY-MM')).all()
         
        return [{"month": r.month, "fuel_usage": r.fuel_usage, "fuel_cost": r.fuel_cost} for r in results]

    def get_vehicle_charts(self):
        results = self.db.query(
            Vehicle.id,
            Vehicle.license_plate,
            func.sum(FuelLog.fuel_quantity).label("fuel_consumed"),
            func.sum(FuelLog.fuel_cost).label("total_cost")
        ).join(FuelLog, Vehicle.id == FuelLog.vehicle_id) \
         .group_by(Vehicle.id, Vehicle.license_plate) \
         .order_by(func.sum(FuelLog.fuel_quantity).desc()).all()
         
        return [{"vehicle_id": r.id, "license_plate": r.license_plate, "fuel_consumed": r.fuel_consumed, "total_cost": r.total_cost} for r in results]

    def get_driver_charts(self):
        results = self.db.query(
            Driver.id,
            User.full_name,
            func.sum(FuelLog.fuel_quantity).label("fuel_consumed")
        ).join(FuelLog, Driver.id == FuelLog.driver_id) \
         .join(User, Driver.user_id == User.id) \
         .group_by(Driver.id, User.full_name) \
         .order_by(func.sum(FuelLog.fuel_quantity).desc()).all()
         
        return [{"driver_id": r.id, "driver_name": r.full_name if r.full_name else "N/A", "fuel_consumed": r.fuel_consumed} for r in results]

