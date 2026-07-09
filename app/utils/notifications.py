import logging
import smtplib
from email.mime.text import MIMEText
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

def send_low_stock_email(product_name: str, current_stock: int, threshold: int):
    """
    Sends a low stock warning email to the admin/staff.
    Falls back to a warning log if SMTP credentials are missing.
    """
    if not all([settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.ADMIN_EMAIL]):
        logger.warning(
            f"[MOCK EMAIL] Low Stock Alert: Product '{product_name}' has stock {current_stock} "
            f"(threshold limit: {threshold}). Set SMTP environment variables to enable real email notifications."
        )
        return

    msg = MIMEText(
        f"Hello Staff,\n\n"
        f"This is an automated stock alert from the AetherRx Pharmacy Management System.\n\n"
        f"The product '{product_name}' has run low on stock.\n"
        f"  - Current Stock: {current_stock}\n"
        f"  - Threshold Limit: {threshold}\n\n"
        f"Please restock this product as soon as possible to prevent order delays.\n\n"
        f"Best regards,\n"
        f"AetherRx System"
    )
    msg["Subject"] = f"ALERT: Low Stock Warning for {product_name}"
    msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    msg["To"] = settings.ADMIN_EMAIL

    try:
        smtp_port = settings.SMTP_PORT or 587
        with smtplib.SMTP(settings.SMTP_HOST, smtp_port) as server:
            if smtp_port == 587:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Low stock email warning for '{product_name}' sent to {settings.ADMIN_EMAIL}")
    except Exception as e:
        logger.error(f"Failed to send low stock email for '{product_name}': {e}")


def send_sms_notification(to_phone: str, message: str):
    """
    Sends an SMS notification via Twilio.
    Formats Indian phone numbers to prepend '+91' automatically if required.
    Falls back to a warning log if Twilio credentials are missing.
    """
    # Clean and format phone number
    clean_phone = to_phone.strip()
    if not clean_phone.startswith("+"):
        if len(clean_phone) == 10:
            clean_phone = "+91" + clean_phone
        elif len(clean_phone) == 12 and clean_phone.startswith("91"):
            clean_phone = "+" + clean_phone

    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_FROM_NUMBER]):
        logger.warning(
            f"[MOCK SMS] To: {clean_phone} | Message: {message}. "
            f"Set Twilio environment variables to send real SMS notifications."
        )
        return

    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(
            body=message,
            from_=settings.TWILIO_FROM_NUMBER,
            to=clean_phone
        )
        logger.info(f"SMS successfully sent to {clean_phone}")
    except Exception as e:
        logger.error(f"Failed to send SMS to {clean_phone}: {e}")


def notify_order_status_change(order, old_status: str, new_status: str, rejection_reason: Optional[str] = None):
    """
    Determines if an order status change requires an SMS notification to the customer,
    constructs the appropriate text, and dispatches it.
    """
    if old_status == new_status:
        return

    phone = order.customer.phone
    order_id = order.id
    amount = float(order.total_amount)
    delivery_type = order.delivery_type

    message = None
    if new_status == "confirmed":
        message = (
            f"Your AetherRx order #{order_id} has been confirmed! Total: Rs. {amount:.2f}. "
            f"We are preparing it for {delivery_type}."
        )
    elif new_status == "cancelled":
        reason_str = f" Reason: {rejection_reason}." if rejection_reason else ""
        message = (
            f"Your AetherRx order #{order_id} has been cancelled.{reason_str} "
            f"If paid online, a refund will be processed shortly."
        )
    elif new_status == "out_for_delivery":
        message = f"Your AetherRx order #{order_id} is out for delivery! It will reach you shortly."
    elif new_status == "ready":
        message = f"Your AetherRx order #{order_id} is ready for pickup! Please visit our store."
    elif new_status == "completed":
        message = f"Your AetherRx order #{order_id} has been delivered successfully. Thank you for choosing AetherRx!"

    if message:
        send_sms_notification(phone, message)
