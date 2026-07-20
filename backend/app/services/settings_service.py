from sqlalchemy.orm import Session

from app.models.settings import Settings


def get_settings(db: Session):

    settings = db.query(Settings).first()

    if not settings:

        settings = Settings(

            company_name="FleetFlow Logistics",

            admin_email="admin@fleetflow.com",

            phone="9876543210",

            language="English",

            dark_mode=False,

        )

        db.add(settings)

        db.commit()

        db.refresh(settings)

    return settings


def update_settings(data, db: Session):

    settings = db.query(Settings).first()

    if not settings:

        settings = Settings()

        db.add(settings)

        db.commit()

        db.refresh(settings)

    settings.company_name = data.company_name

    settings.admin_email = data.admin_email

    settings.phone = data.phone

    settings.language = data.language

    settings.dark_mode = data.dark_mode

    db.commit()

    db.refresh(settings)

    return settings