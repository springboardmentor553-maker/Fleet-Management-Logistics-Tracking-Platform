import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional
import logging

from app.models.notification import Notification
from app.models.user import User
from app.models.driver import Driver
from app.config import settings

logger = logging.getLogger(__name__)


def _dispatch_real_smtp_email(to_email: str, subject: str, body: str) -> tuple[str, str]:
    """
    Sends a real email over SMTP (e.g. Gmail / SendGrid / Custom SMTP).
    Returns (status, message) where status is 'SUCCESS', 'FAILED', or 'NOT_CONFIGURED'.
    """
    if not to_email:
        return "FAILED", "No driver email address provided"

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info(f"📧 [SMTP LOG] Credentials missing. Set SMTP_USER & SMTP_PASSWORD in .env for live email to {to_email}")
        return "NOT_CONFIGURED", "SMTP credentials missing in .env"

    try:
        from_addr = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_addr
        msg["To"] = to_email

        html_content = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f8fafc; border-radius: 10px;">
          <h2 style="color: #3b82f6;">🚚 FleetFlow Dispatch Alert</h2>
          <p style="font-size: 16px; color: #e2e8f0;">{body}</p>
          <hr style="border-color: #334155;" />
          <p style="font-size: 12px; color: #94a3b8;">FleetFlow Automated Notification System</p>
        </div>
        """
        msg.attach(MIMEText(body, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(from_addr, [to_email], msg.as_string())

        logger.info(f"✅ 📧 [LIVE SMTP EMAIL DELIVERED] Sent email to {to_email}")
        return "SUCCESS", f"Delivered via SMTP ({settings.SMTP_HOST})"
    except Exception as exc:
        logger.error(f"❌ [SMTP ERROR] Failed to send email to {to_email}: {exc}")
        return "FAILED", f"SMTP authentication / connection failure: {exc}"


def _dispatch_real_cellular_sms(phone_number: str, message_text: str) -> tuple[str, str]:
    """
    Delivers a real cellular SMS message via Twilio or Fast2SMS API.
    Returns (status, message) where status is 'SUCCESS', 'FAILED', or 'NOT_CONFIGURED'.
    """
    if not phone_number:
        return "FAILED", "No driver mobile phone number provided"

    clean_phone = phone_number.strip().replace(" ", "").replace("-", "")

    # 1. Twilio Integration
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            data = {
                "From": settings.TWILIO_PHONE_NUMBER,
                "To": clean_phone if clean_phone.startswith("+") else f"+91{clean_phone}",
                "Body": message_text,
            }
            resp = requests.post(url, data=data, auth=auth, timeout=10)
            if resp.status_code in [200, 201]:
                logger.info(f"✅ 💬 [LIVE TWILIO CELLULAR SMS DELIVERED] Sent SMS to {clean_phone}")
                return "SUCCESS", "Accepted by Twilio SMS API"
            else:
                logger.error(f"❌ [TWILIO ERROR] {resp.status_code}: {resp.text}")
                return "FAILED", f"Twilio API error {resp.status_code}: {resp.text[:100]}"
        except Exception as exc:
            logger.error(f"❌ [TWILIO EXCEPTION] {exc}")
            return "FAILED", f"Twilio connection exception: {exc}"

    # 2. Fast2SMS Integration (popular for Indian +91 numbers)
    if settings.FAST2SMS_API_KEY:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": settings.FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
            numeric_phone = clean_phone.replace("+91", "").replace("+", "").strip()
            payload = {
                "route": "q",
                "message": message_text,
                "language": "english",
                "flash": 0,
                "numbers": numeric_phone
            }
            resp = requests.post(url, json=payload, headers=headers, timeout=10)
            res_json = resp.json() if resp.status_code == 200 else {}
            
            if resp.status_code == 200 and res_json.get("return") is True:
                msg_detail = res_json.get("message", ["Accepted"])[0] if isinstance(res_json.get("message"), list) else res_json.get("message")
                logger.info(f"✅ 💬 [LIVE FAST2SMS CELLULAR SMS DELIVERED] Sent SMS to {numeric_phone}")
                return "SUCCESS", f"Accepted by Fast2SMS ({msg_detail})"
            else:
                err_detail = res_json.get("message") if res_json.get("message") else resp.text
                logger.error(f"❌ [FAST2SMS REJECTED] Phone {numeric_phone}: {err_detail}")
                return "FAILED", f"Fast2SMS API rejected request: {err_detail}"
        except Exception as exc:
            logger.error(f"❌ [FAST2SMS EXCEPTION] Phone {clean_phone}: {exc}")
            return "FAILED", f"Fast2SMS connection exception: {exc}"

    logger.info(f"💬 [CELLULAR SMS GATEWAY READY] Mobile {clean_phone}. (Add FAST2SMS_API_KEY / TWILIO credentials to .env for live SMS)")
    return "NOT_CONFIGURED", "SMS Gateway API credentials not configured in .env"


def notify_event(
    db: Session,
    title: str,
    message: str,
    category: str,
    priority: str = "normal",
    reference_type: Optional[str] = None,
    reference_id: Optional[int] = None,
    user_id: Optional[int] = None,
    channel_email: bool = False,
    channel_sms: bool = False,
    channel_push: bool = True,
) -> Notification:
    """
    Central helper to create and persist a notification event while avoiding duplicate unread notifications.
    """
    if reference_type and reference_id:
        existing = (
            db.query(Notification)
            .filter(
                Notification.reference_type == reference_type,
                Notification.reference_id == reference_id,
                Notification.title == title,
                Notification.is_read == False,
            )
            .first()
        )
        if existing:
            return existing

    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        category=category,
        channel_email=channel_email,
        channel_sms=channel_sms,
        channel_push=channel_push,
        priority=priority,
        reference_id=reference_id,
        reference_type=reference_type,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    try:
        db.commit()
        db.refresh(notif)
        logger.info(f"🔔 [NOTIFICATION CREATED] #{notif.id} ({category}): {title}")
    except Exception:
        db.rollback()
        raise
    return notif


def send_sms_notification(
    db: Session,
    driver: Driver,
    title: str,
    message: str,
    reference_id: Optional[int] = None,
) -> Notification:
    """
    Dispatches a dedicated SMS notification record for driver's phone with explicit provider status.
    """
    phone_str = driver.phone if driver and driver.phone else "Mobile"
    driver_name = driver.name if driver and driver.name else "Driver"

    sms_status, status_detail = "NOT_CONFIGURED", "SMS Gateway not configured"
    try:
        sms_status, status_detail = _dispatch_real_cellular_sms(driver.phone if driver else "", f"{title}: {message}")
    except Exception as exc:
        sms_status, status_detail = "FAILED", f"Dispatch exception: {exc}"

    if sms_status == "SUCCESS":
        sms_title = f"💬 SMS Alert Sent → {phone_str}"
        sms_body = f"SMS Dispatch to {driver_name} ({phone_str}): {title} - {message} [Provider Status: Delivered]"
    else:
        sms_title = f"💬 SMS Alert ({sms_status}) → {phone_str}"
        sms_body = f"SMS Dispatch to {driver_name} ({phone_str}): {title} - {message} [{sms_status}: {status_detail}]"

    return notify_event(
        db=db,
        title=sms_title,
        message=sms_body,
        category="sms",
        priority="high",
        reference_type="driver",
        reference_id=driver.id if driver else reference_id,
        channel_email=False,
        channel_sms=True,
        channel_push=False,
    )


def send_email_notification(
    db: Session,
    driver: Driver,
    title: str,
    message: str,
    reference_id: Optional[int] = None,
) -> Notification:
    """
    Dispatches a dedicated Email notification record for driver's email with explicit SMTP status.
    """
    email_str = driver.email if driver and driver.email else "Email"
    driver_name = driver.name if driver and driver.name else "Driver"

    email_status, status_detail = "NOT_CONFIGURED", "SMTP not configured"
    try:
        email_status, status_detail = _dispatch_real_smtp_email(driver.email if driver else "", title, message)
    except Exception as exc:
        email_status, status_detail = "FAILED", f"Dispatch exception: {exc}"

    if email_status == "SUCCESS":
        email_title = f"📧 Email Dispatch Sent → {email_str}"
        email_body = f"Email Dispatch to {driver_name} ({email_str}): {title} - {message} [SMTP Status: Delivered]"
    else:
        email_title = f"📧 Email Dispatch ({email_status}) → {email_str}"
        email_body = f"Email Dispatch to {driver_name} ({email_str}): {title} - {message} [{email_status}: {status_detail}]"

    return notify_event(
        db=db,
        title=email_title,
        message=email_body,
        category="email",
        priority="normal",
        reference_type="driver",
        reference_id=driver.id if driver else reference_id,
        channel_email=True,
        channel_sms=False,
        channel_push=False,
    )


def notify_driver_event(
    db: Session,
    driver: Driver,
    title: str,
    message: str,
    category: str = "driver_assignment",
    priority: str = "high",
    reference_type: Optional[str] = "driver",
    reference_id: Optional[int] = None,
    channel_email: bool = True,
    channel_sms: bool = True,
    channel_push: bool = True,
) -> Notification:
    """
    Helper to target notifications directly to an assigned driver via in-app, SMS, and Email.
    Each channel executes independently so failure in one channel never blocks the others.
    """
    driver_user = None
    if driver and driver.email:
        driver_user = db.query(User).filter(func.lower(User.email) == driver.email.lower()).first()

    target_user_id = driver_user.id if driver_user else None
    ref_id = reference_id or (driver.id if driver else None)

    # 1. Main Driver In-App Notification (Always succeeds independently)
    main_notif = notify_event(
        db=db,
        title=title,
        message=message + (f" [Recipient: {driver.name} | Mobile: {driver.phone} | Email: {driver.email}]" if driver else ""),
        category=category,
        priority=priority,
        reference_type=reference_type,
        reference_id=ref_id,
        user_id=target_user_id,
        channel_email=channel_email,
        channel_sms=channel_sms,
        channel_push=channel_push,
    )

    # 2. Dedicated SMS Channel Dispatch (Isolated execution)
    if channel_sms and driver and driver.phone:
        try:
            send_sms_notification(db, driver, title, message, reference_id=ref_id)
        except Exception as exc:
            logger.error(f"❌ [SMS DISPATCH EXCEPTION] {exc}")

    # 3. Dedicated Email Channel Dispatch (Isolated execution)
    if channel_email and driver and driver.email:
        try:
            send_email_notification(db, driver, title, message, reference_id=ref_id)
        except Exception as exc:
            logger.error(f"❌ [EMAIL DISPATCH EXCEPTION] {exc}")

    return main_notif

