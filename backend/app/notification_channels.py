import logging
import os
import smtplib
from email.message import EmailMessage

import requests


logger = logging.getLogger(__name__)


# ============================================================
# CONFIGURATION
# ============================================================

EMAIL_ENABLED = (
    os.getenv("EMAIL_NOTIFICATIONS_ENABLED", "false")
    .lower()
    == "true"
)

SMS_ENABLED = (
    os.getenv("SMS_NOTIFICATIONS_ENABLED", "false")
    .lower()
    == "true"
)

PUSH_ENABLED = (
    os.getenv("PUSH_NOTIFICATIONS_ENABLED", "false")
    .lower()
    == "true"
)


SMTP_HOST = os.getenv(
    "SMTP_HOST",
    "",
)

SMTP_PORT = int(
    os.getenv(
        "SMTP_PORT",
        "587",
    )
)

SMTP_USERNAME = os.getenv(
    "SMTP_USERNAME",
    "",
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD",
    "",
)

SMTP_FROM_EMAIL = os.getenv(
    "SMTP_FROM_EMAIL",
    SMTP_USERNAME,
)


TWILIO_ACCOUNT_SID = os.getenv(
    "TWILIO_ACCOUNT_SID",
    "",
)

TWILIO_AUTH_TOKEN = os.getenv(
    "TWILIO_AUTH_TOKEN",
    "",
)

TWILIO_FROM_NUMBER = os.getenv(
    "TWILIO_FROM_NUMBER",
    "",
)


VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY",
    "",
)

VAPID_CLAIMS_EMAIL = os.getenv(
    "VAPID_CLAIMS_EMAIL",
    "mailto:admin@fleetflow.local",
)


# ============================================================
# EMAIL
# ============================================================

def send_email_notification(
    recipient_email: str,
    title: str,
    message: str,
):
    """
    Send an email notification using SMTP.

    Failures are logged and do not interrupt
    the FleetFlow business transaction.
    """

    if not EMAIL_ENABLED:
        return False

    if not (
        SMTP_HOST
        and SMTP_USERNAME
        and SMTP_PASSWORD
        and recipient_email
    ):
        logger.warning(
            "Email notifications enabled but SMTP "
            "configuration is incomplete."
        )
        return False

    try:

        email = EmailMessage()

        email["Subject"] = (
            f"FleetFlow - {title}"
        )

        email["From"] = SMTP_FROM_EMAIL

        email["To"] = recipient_email

        email.set_content(
            (
                "FleetFlow Notification\n\n"
                f"{title}\n\n"
                f"{message}\n\n"
                "This is an automated "
                "FleetFlow notification."
            )
        )

        with smtplib.SMTP(
            SMTP_HOST,
            SMTP_PORT,
            timeout=15,
        ) as server:

            server.starttls()

            server.login(
                SMTP_USERNAME,
                SMTP_PASSWORD,
            )

            server.send_message(
                email
            )

        return True

    except Exception:
        logger.exception(
            "Failed to send email notification "
            "to %s",
            recipient_email,
        )

        return False


# ============================================================
# SMS
# ============================================================

def send_sms_notification(
    recipient_phone: str,
    title: str,
    message: str,
):
    """
    Send an SMS through Twilio's REST API.

    The existing Driver.phone field is used
    as the destination number.
    """

    if not SMS_ENABLED:
        return False

    if not (
        TWILIO_ACCOUNT_SID
        and TWILIO_AUTH_TOKEN
        and TWILIO_FROM_NUMBER
        and recipient_phone
    ):
        logger.warning(
            "SMS notifications enabled but Twilio "
            "configuration is incomplete."
        )
        return False

    try:

        url = (
            "https://api.twilio.com/2010-04-01/"
            f"Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        )

        response = requests.post(

            url,

            auth=(
                TWILIO_ACCOUNT_SID,
                TWILIO_AUTH_TOKEN,
            ),

            data={
                "From":
                    TWILIO_FROM_NUMBER,

                "To":
                    recipient_phone,

                "Body":
                    (
                        f"FleetFlow: {title}\n"
                        f"{message}"
                    ),
            },

            timeout=15,
        )

        response.raise_for_status()

        return True

    except Exception:
        logger.exception(
            "Failed to send SMS notification "
            "to %s",
            recipient_phone,
        )

        return False


# ============================================================
# PUSH
# ============================================================

def send_push_notification(
    subscription,
    title: str,
    message: str,
):
    """
    Send a browser push notification using Web Push.
    """

    if not PUSH_ENABLED:
        return False

    if not VAPID_PRIVATE_KEY:
        logger.warning(
            "Push notifications enabled but "
            "VAPID_PRIVATE_KEY is missing."
        )
        return False

    try:

        from pywebpush import webpush

        webpush(

            subscription_info={
                "endpoint":
                    subscription.endpoint,

                "keys": {
                    "p256dh":
                        subscription.p256dh,

                    "auth":
                        subscription.auth,
                },
            },

            data=(
                __import__(
                    "json"
                ).dumps(
                    {
                        "title": title,
                        "message": message,
                    }
                )
            ),

            vapid_private_key=
                VAPID_PRIVATE_KEY,

            vapid_claims={
                "sub":
                    VAPID_CLAIMS_EMAIL,
            },

        )

        return True

    except Exception as exc:

        logger.exception(
            "Failed to send push notification."
        )

        # A browser may return 404/410 when a
        # subscription has expired. The caller
        # can remove the subscription.
        if getattr(
            exc,
            "response",
            None,
        ) is not None:

            status_code = getattr(
                exc.response,
                "status_code",
                None,
            )

            if status_code in (
                404,
                410,
            ):

                return "expired"

        return False