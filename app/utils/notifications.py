import logging
import smtplib
import json
import pywebpush
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.config import settings
from app.database import SessionLocal
from app.models import Notification, PushSubscription

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
        f"This is an automated stock alert from the {settings.BRAND_NAME} Pharmacy Management System.\n\n"
        f"The product '{product_name}' has run low on stock.\n"
        f"  - Current Stock: {current_stock}\n"
        f"  - Threshold Limit: {threshold}\n\n"
        f"Please restock this product as soon as possible to prevent order delays.\n\n"
        f"Best regards,\n"
        f"{settings.BRAND_NAME} System"
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

def send_html_email(to_email: str, subject: str, title: str, message: str, order_id: int):
    if not all([settings.SMTP_HOST, settings.SMTP_USERNAME, settings.SMTP_PASSWORD, to_email]):
        logger.warning(f"[MOCK EMAIL] To: {to_email} | Subject: {subject} | Msg: {message}")
        return

    html_content = f"""
    <html>
      <body style="font-family: sans-serif; color: #1F3D2E; background-color: #f4f6f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 24px; border-radius: 8px; border: 1px solid #d3dcd9;">
          <h1 style="color: #3A7563; font-size: 24px; margin-bottom: 10px; margin-top: 0;">{settings.BRAND_NAME}</h1>
          <h2 style="font-size: 20px; border-bottom: 2px solid #3A7563; padding-bottom: 10px;">{title}</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">{message}</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; text-align: center;">
            <a href="http://localhost:3000/orders" style="display: inline-block; background-color: #3A7563; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Order</a>
          </div>
        </div>
      </body>
    </html>
    """
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    msg["To"] = to_email
    
    part1 = MIMEText(message, "plain")
    part2 = MIMEText(html_content, "html")
    msg.attach(part1)
    msg.attach(part2)

    try:
        smtp_port = settings.SMTP_PORT or 587
        with smtplib.SMTP(settings.SMTP_HOST, smtp_port) as server:
            if smtp_port == 587:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"HTML email sent to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send HTML email to {to_email}: {e}")

def send_web_push(customer_id: int, title: str, message: str, url: str):
    if not all([settings.VAPID_PRIVATE_KEY, settings.VAPID_PUBLIC_KEY, settings.VAPID_SUBJECT]):
        logger.warning(f"[MOCK PUSH] Customer: {customer_id} | Title: {title} | Msg: {message}")
        return

    db = SessionLocal()
    try:
        subs = db.query(PushSubscription).filter(PushSubscription.customer_id == customer_id).all()
        for sub in subs:
            try:
                subscription_info = {
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh_key,
                        "auth": sub.auth_key
                    }
                }
                payload = json.dumps({
                    "title": title,
                    "body": message,
                    "url": url,
                    "icon": "/icon-192.png"
                })
                pywebpush.webpush(
                    subscription_info=subscription_info,
                    data=payload,
                    vapid_private_key=settings.VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": settings.VAPID_SUBJECT}
                )
                logger.info(f"Push sent to customer {customer_id}")
            except pywebpush.WebPushException as ex:
                logger.error(f"Push failed for {sub.endpoint}: {repr(ex)}")
                if ex.response and ex.response.status_code in [404, 410]:
                    # Expired/invalid subscription
                    db.delete(sub)
            except Exception as ex:
                logger.error(f"Push error: {repr(ex)}")
        db.commit()
    finally:
        db.close()

def notify_order_status_change(order, old_status: str, new_status: str, rejection_reason: Optional[str] = None):
    """
    Determines if an order status change requires notification,
    creates in-app notification, sends SMS, HTML email, and Web Push.
    """
    if old_status == new_status:
        return

    customer = order.customer
    phone = customer.phone
    email = customer.email
    order_id = order.id
    amount = float(order.total_amount)
    delivery_type = order.delivery_type

    title = None
    message = None
    
    if new_status == "confirmed":
        title = f"Order #{order_id} Confirmed"
        message = (
            f"Your {settings.BRAND_NAME} order #{order_id} has been confirmed! Total: Rs. {amount:.2f}. "
            f"We are preparing it for {delivery_type}."
        )
    elif new_status == "cancelled":
        title = f"Order #{order_id} Cancelled"
        reason_str = f" Reason: {rejection_reason}." if rejection_reason else ""
        message = (
            f"Your {settings.BRAND_NAME} order #{order_id} has been cancelled.{reason_str} "
            f"If paid online, a refund will be processed shortly."
        )
    elif new_status == "out_for_delivery":
        title = f"Order #{order_id} Out for Delivery"
        message = f"Your {settings.BRAND_NAME} order #{order_id} is out for delivery! It will reach you shortly."
    elif new_status == "ready":
        title = f"Order #{order_id} Ready for Pickup"
        message = f"Your {settings.BRAND_NAME} order #{order_id} is ready for pickup! Please visit our store."
    elif new_status == "completed":
        title = f"Order #{order_id} Completed"
        message = f"Your {settings.BRAND_NAME} order #{order_id} has been delivered successfully. Thank you for choosing {settings.BRAND_NAME}!"

    if title and message:
        # In-App Notification insertion
        db = SessionLocal()
        try:
            new_notif = Notification(
                customer_id=customer.id,
                order_id=order_id,
                title=title,
                message=message
            )
            db.add(new_notif)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to insert in-app notification: {e}")
        finally:
            db.close()

        send_sms_notification(phone, message)
        
        if email:
            send_html_email(email, f"{settings.BRAND_NAME}: {title}", title, message, order_id)
            
        send_web_push(customer.id, title, message, f"/orders/{order_id}")
