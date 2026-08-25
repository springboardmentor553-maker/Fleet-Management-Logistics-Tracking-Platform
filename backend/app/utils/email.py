import smtplib
from email.mime.text import MIMEText
from app.config import settings


def send_reset_email(to_email: str, reset_link: str):
    subject = "FleetFlow - Password Reset Request"
    body = f"""
    Hi,

    You requested a password reset for your FleetFlow account.
    Click the link below to reset your password (valid for 30 minutes):

    {reset_link}

    If you didn't request this, please ignore this email.

    - FleetFlow Team
    """

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_USER
    msg["To"] = to_email

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_USER, [to_email], msg.as_string())