from sqlalchemy import (
    event,
    inspect,
)

from sqlalchemy.orm import Session

from app.database import SessionLocal

from app.models.user import User
from app.models.driver import Driver
from app.models.vehicle import Vehicle
from app.models.shipment import Shipment
from app.models.trip import Trip
from app.models.driver_assignment import (
    DriverAssignment
)
from app.models.notification import (
    Notification
)
from app.models.notification_subscription import (
    NotificationSubscription
)

from app.notification_channels import (
    send_email_notification,
    send_sms_notification,
    send_push_notification,
)


def normalize(value):

    return " ".join(
        str(value or "")
        .strip()
        .lower()
        .split()
    )


# ============================================================
# FIND DRIVER USER
# ============================================================

def get_driver_user(
    session,
    driver_id,
):

    driver = session.get(
        Driver,
        driver_id,
    )

    if not driver:

        return None


    driver_name = normalize(
        driver.name
    )


    driver_users = (

        session.query(
            User
        )

        .filter(
            User.role
            ==
            "driver"
        )

        .all()

    )


    return next(

        (

            user

            for user
            in driver_users

            if normalize(
                user.name
            )
            ==
            driver_name

        ),

        None,

    )


# ============================================================
# OPERATIONAL USERS
# ============================================================

def get_operational_users(
    session,
):

    return (

        session.query(
            User
        )

        .filter(

            User.role.in_(
                [
                    "admin",
                    "fleet manager",
                    "dispatcher",
                ]
            )

        )

        .all()

    )


# ============================================================
# QUEUE EXTERNAL DELIVERY
# ============================================================

def queue_external_delivery(
    session,
    user_id,
    title,
    message,
):

    deliveries = session.info.setdefault(
        "notification_deliveries",
        [],
    )


    deliveries.append(

        {
            "user_id":
                user_id,

            "title":
                title,

            "message":
                message,

        }

    )


# ============================================================
# ADD NOTIFICATION
# ============================================================

def add_notification(
    session,
    user_id,
    title,
    message,
    notification_type,
    related_entity=None,
    related_id=None,
):

    if not user_id:

        return


    session.add(

        Notification(

            user_id=
                user_id,

            title=
                title,

            message=
                message,

            notification_type=
                notification_type,

            related_entity=
                related_entity,

            related_id=
                related_id,

            is_read=False,

        )

    )


    queue_external_delivery(

        session,

        user_id,

        title,

        message,

    )


# ============================================================
# DRIVER + OPERATIONS
# ============================================================

def notify_driver_and_operations(
    session,
    driver_id,
    title,
    message,
    notification_type,
    related_entity,
    related_id,
):

    driver_user = get_driver_user(
        session,
        driver_id,
    )


    # --------------------------------------------------------
    # DRIVER
    # --------------------------------------------------------

    if driver_user:

        add_notification(

            session,

            driver_user.id,

            title,

            message,

            notification_type,

            related_entity,

            related_id,

        )


    # --------------------------------------------------------
    # ADMIN / FLEET MANAGER / DISPATCHER
    # --------------------------------------------------------

    for user in get_operational_users(
        session
    ):

        add_notification(

            session,

            user.id,

            title,

            message,

            notification_type,

            related_entity,

            related_id,

        )


# ============================================================
# AUTOMATIC BUSINESS NOTIFICATIONS
# ============================================================

@event.listens_for(
    Session,
    "after_flush",
)
def create_business_notifications(
    session,
    flush_context,
):

    if session.info.get(
        "creating_notifications"
    ):

        return


    session.info[
        "creating_notifications"
    ] = True


    try:

        # ====================================================
        # NEW SHIPMENT WITH DRIVER
        # ====================================================

        for shipment in list(
            session.new
        ):

            if not isinstance(
                shipment,
                Shipment,
            ):

                continue


            if shipment.assigned_driver_id:

                notify_driver_and_operations(

                    session,

                    shipment.assigned_driver_id,

                    "Shipment Assigned",

                    (
                        f"Shipment "
                        f"{shipment.tracking_number} "
                        f"has been assigned."
                    ),

                    "shipment_assignment",

                    "shipment",

                    shipment.id,

                )


        # ====================================================
        # NEW DRIVER ASSIGNMENT
        # ====================================================

        for assignment in list(
            session.new
        ):

            if not isinstance(
                assignment,
                DriverAssignment,
            ):

                continue


            driver_user = get_driver_user(

                session,

                assignment.driver_id,

            )


            if not driver_user:

                continue


            vehicle = session.get(

                Vehicle,

                assignment.vehicle_id,

            )


            vehicle_number = (

                vehicle.vehicle_number

                if vehicle

                else
                "the assigned vehicle"

            )


            add_notification(

                session,

                driver_user.id,

                "Driver Assignment",

                (
                    f"You have been assigned "
                    f"to {vehicle_number} "
                    f"for Trip "
                    f"#{assignment.trip_id}."
                ),

                "driver_assignment",

                "trip",

                assignment.trip_id,

            )


        # ====================================================
        # SHIPMENT STATUS CHANGE
        # ====================================================

        for shipment in list(
            session.dirty
        ):

            if not isinstance(
                shipment,
                Shipment,
            ):

                continue


            history = inspect(
                shipment
            ).attrs.status.history


            if not history.has_changes():

                continue


            old_value = (

                history.deleted[0]

                if history.deleted

                else None

            )


            new_value = (

                history.added[0]

                if history.added

                else shipment.status

            )


            old_status = getattr(

                old_value,

                "value",

                old_value,

            )


            new_status = getattr(

                new_value,

                "value",

                new_value,

            )


            if old_status == new_status:

                continue


            notify_driver_and_operations(

                session,

                shipment.assigned_driver_id,

                "Shipment Status Updated",

                (
                    f"Shipment "
                    f"{shipment.tracking_number} "
                    f"changed from "
                    f"{old_status or 'Unknown'} "
                    f"to {new_status}."
                ),

                "shipment_status",

                "shipment",

                shipment.id,

            )


        # ====================================================
        # TRIP ROUTE CHANGE
        # ====================================================

        for trip in list(
            session.dirty
        ):

            if not isinstance(
                trip,
                Trip,
            ):

                continue


            start_history = inspect(
                trip
            ).attrs.start_location.history


            end_history = inspect(
                trip
            ).attrs.end_location.history


            if not (

                start_history.has_changes()

                or

                end_history.has_changes()

            ):

                continue


            notify_driver_and_operations(

                session,

                trip.driver_id,

                "Route Changed",

                (
                    f"Trip #{trip.id} "
                    f"route has been changed. "
                    f"Please review the "
                    f"updated route."
                ),

                "route_change",

                "trip",

                trip.id,

            )


    finally:

        session.info[
            "creating_notifications"
        ] = False


# ============================================================
# EXTERNAL NOTIFICATIONS AFTER COMMIT
# ============================================================

@event.listens_for(
    Session,
    "after_commit",
)
def send_external_notifications(
    session,
):

    deliveries = session.info.pop(
        "notification_deliveries",
        [],
    )


    if not deliveries:

        return


    db = SessionLocal()


    try:

        for delivery in deliveries:

            user = db.get(
                User,
                delivery["user_id"],
            )


            if not user:

                continue


            title = delivery[
                "title"
            ]

            message = delivery[
                "message"
            ]


            # =================================================
            # EMAIL
            # =================================================

            send_email_notification(

                user.email,

                title,

                message,

            )


            # =================================================
            # SMS
            # =================================================

            driver = None

            if user.role == "driver":

                driver_users = (

                    db.query(
                        Driver
                    )

                    .all()

                )


                driver = next(

                    (

                        item

                        for item
                        in driver_users

                        if normalize(
                            item.name
                        )
                        ==
                        normalize(
                            user.name
                        )

                    ),

                    None,

                )


            if driver and driver.phone:

                send_sms_notification(

                    driver.phone,

                    title,

                    message,

                )


            # =================================================
            # PUSH
            # =================================================

            subscriptions = (

                db.query(
                    NotificationSubscription
                )

                .filter(

                    NotificationSubscription.user_id
                    ==
                    user.id

                )

                .all()

            )


            expired_ids = []


            for subscription in subscriptions:

                result = send_push_notification(

                    subscription,

                    title,

                    message,

                )


                if result == "expired":

                    expired_ids.append(
                        subscription.id
                    )


            if expired_ids:

                (

                    db.query(
                        NotificationSubscription
                    )

                    .filter(
                        NotificationSubscription.id.in_(
                            expired_ids
                        )
                    )

                    .delete(
                        synchronize_session=False
                    )

                )


        db.commit()


    except Exception:

        db.rollback()

    finally:

        db.close()