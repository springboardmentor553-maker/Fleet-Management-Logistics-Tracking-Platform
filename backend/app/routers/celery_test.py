from fastapi import APIRouter

from app.tasks import (
    test_task,
    check_maintenance_alerts,
    check_delayed_trips,
    generate_daily_report
)

router = APIRouter(
    prefix="/celery-test",
    tags=["Celery"]
)


@router.get("/test")
def test():

    test_task.delay()

    return {
        "message": "Test task started"
    }


@router.get("/maintenance")
def maintenance():

    check_maintenance_alerts.delay()

    return {
        "message": "Maintenance alert task started"
    }


@router.get("/trip")
def trip():

    check_delayed_trips.delay()

    return {
        "message": "Trip monitoring task started"
    }


@router.get("/report")
def report():

    generate_daily_report.delay()

    return {
        "message": "Daily report task started"
    }