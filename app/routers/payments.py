import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Order, Customer
from app.auth.security import get_current_customer
from app.schemas.order import PaymentCreateRequest, PaymentCreateResponse, PaymentVerifyRequest, OrderResponse
from app.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])

@router.post("/create", response_model=PaymentCreateResponse)
def create_payment_order(
    data: PaymentCreateRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == data.order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    if order.payment_method != "online":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment creation is only supported for online payment method"
        )
        
    # Generate mock Razorpay Order ID
    razorpay_order_id = f"order_{order.id}_{hashlib.md5(str(order.created_at).encode()).hexdigest()[:12]}"
    
    order.razorpay_order_id = razorpay_order_id
    db.commit()
    db.refresh(order)
    
    return {
        "razorpay_order_id": razorpay_order_id,
        "amount": order.total_amount,
        "currency": "INR"
    }

@router.post("/verify", response_model=OrderResponse)
def verify_payment_signature(
    data: PaymentVerifyRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.razorpay_order_id == data.razorpay_order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found for this Razorpay order ID"
        )
        
    # Verify signature
    msg = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected_signature = hmac.new(
        settings.RAZORPAY_SECRET.encode('utf-8'),
        msg.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # We only accept signatures starting with "mock_sig" in non-production environments
    is_mock_allowed = settings.ENV != "production"
    is_valid = (data.razorpay_signature == expected_signature) or (is_mock_allowed and data.razorpay_signature.startswith("mock_sig"))
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature"
        )
        
    old_status = order.status
    
    # Mark order as paid
    order.payment_status = "paid"
    order.razorpay_payment_id = data.razorpay_payment_id
    
    # If it does not require Rx check, transition directly to confirmed (which triggers stock decrement)
    if not order.requires_rx_check:
        order.status = "confirmed"
    else:
        # If it requires Rx check, we make sure it is in 'rx_pending' or 'pending' depending on upload.
        # If prescription has already been uploaded, keep it at rx_pending.
        # Otherwise, wait for upload.
        if len(order.prescriptions) > 0:
            order.status = "rx_pending"
        else:
            order.status = "pending"
            
    db.commit()
    db.refresh(order)
    
    # Trigger SMS status update if status changed
    if old_status != order.status:
        from app.utils.notifications import notify_order_status_change
        notify_order_status_change(order, old_status, order.status)
        
    # Check low stock warnings if confirmed
    if order.status == "confirmed":
        from app.utils.notifications import send_low_stock_email
        for item in order.items:
            product = item.product
            # Check if stock goes below alert threshold
            if product.is_active and product.stock_qty <= product.low_stock_alert:
                send_low_stock_email(product.name, product.stock_qty, product.low_stock_alert)
    
    # Return order detail response
    items = []
    for item in order.items:
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_order": item.price_at_order,
            "product_name": item.product.name
        })
        
    order_dict = order.__dict__.copy()
    order_dict["items"] = items
    order_dict["prescriptions"] = [p.__dict__ for p in order.prescriptions]
    return order_dict

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(..., alias="X-Razorpay-Signature"),
    db: Session = Depends(get_db)
):
    body = await request.body()
    
    # Verify webhook signature
    webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
    if not webhook_secret:
        # Fallback to general secret if webhook secret is unset (useful in development/staging setup)
        webhook_secret = settings.RAZORPAY_SECRET
        
    expected_signature = hmac.new(
        webhook_secret.encode('utf-8'),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(x_razorpay_signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook signature"
        )
        
    payload = await request.json()
    event = payload.get("event")
    
    if event == "order.paid":
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        razorpay_payment_id = payment_entity.get("id")
        
        if not razorpay_order_id:
            return {"status": "ignored", "reason": "No Razorpay order ID in payload"}
            
        # Find matching order
        order = db.query(Order).filter(Order.razorpay_order_id == razorpay_order_id).first()
        if order and order.payment_status != "paid":
            old_status = order.status
            
            # Mark order as paid
            order.payment_status = "paid"
            order.razorpay_payment_id = razorpay_payment_id
            
            if not order.requires_rx_check:
                order.status = "confirmed"
            else:
                if len(order.prescriptions) > 0:
                    order.status = "rx_pending"
                else:
                    order.status = "pending"
                    
            db.commit()
            db.refresh(order)
            
            # Trigger SMS status update if status changed
            if old_status != order.status:
                from app.utils.notifications import notify_order_status_change
                notify_order_status_change(order, old_status, order.status)
                
            # Check low stock warnings if confirmed
            if order.status == "confirmed":
                from app.utils.notifications import send_low_stock_email
                for item in order.items:
                    product = item.product
                    if product.is_active and product.stock_qty <= product.low_stock_alert:
                        send_low_stock_email(product.name, product.stock_qty, product.low_stock_alert)
                        
            return {"status": "processed", "order_id": order.id}
            
    return {"status": "ignored", "event": event}
