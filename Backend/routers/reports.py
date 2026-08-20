from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.delivery import Delivery
from app.models.driver import Driver
from app.models.fuel_record import FuelRecord
from app.models.maintenance import Maintenance
from app.models.route import Route
from app.models.shipment import Shipment
from app.models.vehicle import Vehicle

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)
@router.get("/summary")
def report_summary(db: Session = Depends(get_db)):

    vehicles = {
        "total": db.query(Vehicle).count(),
        "available": db.query(Vehicle).filter(
            Vehicle.status == "Available"
        ).count(),
        "on_trip": db.query(Vehicle).filter(
            Vehicle.status == "On Trip"
        ).count(),
        "maintenance": db.query(Vehicle).filter(
            Vehicle.status == "Under Maintenance"
        ).count(),
        "inactive": db.query(Vehicle).filter(
            Vehicle.status == "Inactive"
        ).count(),
    }

    drivers = {
        "total": db.query(Driver).count(),
        "assigned": db.query(Driver).filter(
            Driver.status == "ASSIGNED"
        ).count(),
        "on_trip": db.query(Driver).filter(
            Driver.status == "ON_TRIP"
        ).count(),
        "on_leave": db.query(Driver).filter(
            Driver.status == "ON_LEAVE"
        ).count(),
    }

    shipments = {
        "total": db.query(Shipment).count(),
        "assigned": db.query(Shipment).filter(
            Shipment.status == "ASSIGNED"
        ).count(),
        "in_transit": db.query(Shipment).filter(
            Shipment.status == "IN_TRANSIT"
        ).count(),
        "delivered": db.query(Shipment).filter(
            Shipment.status == "DELIVERED"
        ).count(),
    }

    deliveries = {
        "total": db.query(Delivery).count(),
        "pending": db.query(Delivery).filter(
            Delivery.delivery_status == "Pending"
        ).count(),
        "delivered": db.query(Delivery).filter(
            Delivery.delivery_status == "Delivered"
        ).count(),
    }

    routes = {
        "total": db.query(Route).count()
    }

    maintenance = {
        "total": db.query(Maintenance).count()
    }

    fuel = {
        "total_fuel": db.query(
            func.sum(FuelRecord.fuel_quantity)
        ).scalar() or 0,

        "total_cost": db.query(
            func.sum(FuelRecord.fuel_cost)
        ).scalar() or 0
    }

    return {
        "vehicles": vehicles,
        "drivers": drivers,
        "shipments": shipments,
        "deliveries": deliveries,
        "routes": routes,
        "maintenance": maintenance,
        "fuel": fuel
    }

@router.get("/overall")
def download_overall_report(db: Session = Depends(get_db)):

    buffer = BytesIO()

    doc = SimpleDocTemplate(buffer)

    styles = getSampleStyleSheet()

    elements = []

    elements.append(Paragraph("<b>FleetFlow Overall Report</b>", styles["Title"]))
    elements.append(Spacer(1, 20))

    # ---------------- VEHICLES ----------------

    total_vehicles = db.query(Vehicle).count()

    available = db.query(Vehicle).filter(
        Vehicle.status == "Available"
    ).count()

    on_trip = db.query(Vehicle).filter(
        Vehicle.status == "On Trip"
    ).count()

    maintenance = db.query(Vehicle).filter(
        Vehicle.status == "Under Maintenance"
    ).count()

    inactive = db.query(Vehicle).filter(
        Vehicle.status == "Inactive"
    ).count()

    elements.append(Paragraph("<b>Vehicle Summary</b>", styles["Heading2"]))

    vehicle_table = Table([
        ["Metric", "Value"],
        ["Total Vehicles", total_vehicles],
        ["Available", available],
        ["On Trip", on_trip],
        ["Maintenance", maintenance],
        ["Inactive", inactive]
    ])

    vehicle_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.darkblue),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black),
        ("BACKGROUND",(0,1),(-1,-1),colors.beige)
    ]))

    elements.append(vehicle_table)
    elements.append(Spacer(1,20))

    # ---------------- DRIVERS ----------------

    total_drivers = db.query(Driver).count()

    assigned = db.query(Driver).filter(
        Driver.status == "ASSIGNED"
    ).count()

    on_trip_driver = db.query(Driver).filter(
        Driver.status == "ON_TRIP"
    ).count()

    on_leave = db.query(Driver).filter(
        Driver.status == "ON_LEAVE"
    ).count()

    elements.append(Paragraph("<b>Driver Summary</b>", styles["Heading2"]))

    driver_table = Table([
        ["Metric","Value"],
        ["Total Drivers", total_drivers],
        ["Assigned", assigned],
        ["On Trip", on_trip_driver],
        ["On Leave", on_leave]
    ])

    driver_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.green),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black),
        ("BACKGROUND",(0,1),(-1,-1),colors.whitesmoke)
    ]))

    elements.append(driver_table)
    elements.append(Spacer(1,20))

    # ---------------- SHIPMENTS ----------------

    total_shipments = db.query(Shipment).count()

    delivered = db.query(Shipment).filter(
        Shipment.status == "DELIVERED"
    ).count()

    in_transit = db.query(Shipment).filter(
        Shipment.status == "IN_TRANSIT"
    ).count()

    assigned_shipments = db.query(Shipment).filter(
        Shipment.status == "ASSIGNED"
    ).count()

    elements.append(Paragraph("<b>Shipment Summary</b>", styles["Heading2"]))

    shipment_table = Table([
        ["Metric","Value"],
        ["Total Shipments", total_shipments],
        ["Delivered", delivered],
        ["In Transit", in_transit],
        ["Assigned", assigned_shipments]
    ])

    shipment_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.orange),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black),
        ("BACKGROUND",(0,1),(-1,-1),colors.beige)
    ]))

    elements.append(shipment_table)
    elements.append(Spacer(1,20))

    # ---------------- ROUTES ----------------

    total_routes = db.query(Route).count()

    elements.append(Paragraph("<b>Route Summary</b>", styles["Heading2"]))

    route_table = Table([
        ["Metric","Value"],
        ["Total Routes", total_routes]
    ])

    route_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.purple),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black)
    ]))

    elements.append(route_table)
    elements.append(Spacer(1,20))

    # ---------------- MAINTENANCE ----------------

    total_maintenance = db.query(Maintenance).count()

    elements.append(Paragraph("<b>Maintenance Summary</b>", styles["Heading2"]))

    maintenance_table = Table([
        ["Metric","Value"],
        ["Total Maintenance Records", total_maintenance]
    ])

    maintenance_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.red),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black)
    ]))

    elements.append(maintenance_table)
    elements.append(Spacer(1,20))

    # ---------------- DELIVERIES ----------------

    total_deliveries = db.query(Delivery).count()

    delivered_count = db.query(Delivery).filter(
        Delivery.delivery_status == "Delivered"
    ).count()

    pending = db.query(Delivery).filter(
        Delivery.delivery_status == "Pending"
    ).count()

    elements.append(Paragraph("<b>Delivery Summary</b>", styles["Heading2"]))

    delivery_table = Table([
        ["Metric","Value"],
        ["Total Deliveries", total_deliveries],
        ["Delivered", delivered_count],
        ["Pending", pending]
    ])

    delivery_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.darkgreen),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black)
    ]))

    elements.append(delivery_table)
    elements.append(Spacer(1,20))

    # ---------------- FUEL ----------------

    total_fuel = db.query(
        func.sum(FuelRecord.fuel_quantity)
    ).scalar() or 0

    total_cost = db.query(
        func.sum(FuelRecord.fuel_cost)
    ).scalar() or 0

    elements.append(Paragraph("<b>Fuel Analytics</b>", styles["Heading2"]))

    fuel_table = Table([
        ["Metric","Value"],
        ["Total Fuel Consumed", round(total_fuel,2)],
        ["Total Fuel Cost", round(total_cost,2)]
    ])

    fuel_table.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.darkorange),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("GRID",(0,0),(-1,-1),1,colors.black)
    ]))

    elements.append(fuel_table)
    elements.append(Spacer(1,20))

    elements.append(
        Paragraph(
            "<b>FleetFlow Report generated successfully.</b>",
            styles["Heading2"]
        )
    )

    doc.build(elements)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
            "attachment; filename=FleetFlow_Overall_Report.pdf"
        }
    )