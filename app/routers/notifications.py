from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Customer, PushSubscription, Notification
from app.auth.security import get_current_customer
from app.schemas.notification import PushSubscriptionCreate, NotificationResponse, UnreadCountResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.post("/push-subscribe", status_code=status.HTTP_201_CREATED)
def subscribe_push(
    subscription: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    # Check if subscription already exists for this endpoint
    existing = db.query(PushSubscription).filter(
        PushSubscription.endpoint == subscription.endpoint
    ).first()
    
    if existing:
        # Update if it belongs to someone else or just update keys
        existing.customer_id = current_customer.id
        existing.p256dh_key = subscription.p256dh_key
        existing.auth_key = subscription.auth_key
    else:
        new_sub = PushSubscription(
            customer_id=current_customer.id,
            endpoint=subscription.endpoint,
            p256dh_key=subscription.p256dh_key,
            auth_key=subscription.auth_key
        )
        db.add(new_sub)
    
    db.commit()
    return {"status": "success", "message": "Push subscription saved"}


@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    notifications = db.query(Notification).filter(
        Notification.customer_id == current_customer.id
    ).order_by(Notification.created_at.desc()).limit(50).all()
    return notifications


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    count = db.query(Notification).filter(
        Notification.customer_id == current_customer.id,
        Notification.is_read == False
    ).count()
    return {"count": count}


@router.put("/{notification_id}/read")
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(get_current_customer)
):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.customer_id == current_customer.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.is_read = True
    db.commit()
    return {"status": "success"}
