from pydantic import BaseModel


class ShipmentTrackingResponse(BaseModel):

    tracking_number: str

    current_status: str

    driver_name: str

    vehicle_registration_number: str

    pickup_location: str

    destination: str

    eta: str