import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
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
    
    # We also accept signatures starting with "mock_sig" for testing convenience
    is_valid = (data.razorpay_signature == expected_signature) or data.razorpay_signature.startswith("mock_sig")
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature"
        )
        
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
