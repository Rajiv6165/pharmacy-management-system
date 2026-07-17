import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Order, OrderItem, Product, Address, Prescription, Customer
from app.auth.security import get_current_customer
from app.config import settings
from app.schemas.order import OrderCreate, OrderResponse, PrescriptionResponse

router = APIRouter(prefix="/orders", tags=["orders"])

from decimal import Decimal
from datetime import datetime
from app.models import Order, OrderItem, Product, Address, Prescription, Customer, Coupon, CouponUsage, LoyaltyTransaction

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    # Validate delivery address if delivery type is selected
    if data.delivery_type == "delivery":
        if not data.address_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Address ID is required for home delivery"
            )
        address = db.query(Address).filter(Address.id == data.address_id, Address.customer_id == customer.id).first()
        if not address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid address ID for this customer"
            )

    # Validate items and calculate total amount
    total_amount = Decimal('0.0')
    requires_rx_check = False
    order_items_to_create = []
    
    for item_in in data.items:
        product = db.query(Product).filter(Product.id == item_in.product_id).first()
        if not product or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with ID {item_in.product_id} is not available"
            )
        
        # Check stock quantity
        if product.stock_qty < item_in.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product '{product.name}'. Available: {product.stock_qty}, Requested: {item_in.quantity}"
            )
            
        if product.requires_rx:
            requires_rx_check = True
            
        price = Decimal(str(product.price))
        total_amount += price * item_in.quantity
        
        order_items_to_create.append((product, item_in.quantity, price))
        
    # Phase 6: Coupon and Loyalty calculations
    coupon_discount = Decimal('0.0')
    points_discount = Decimal('0.0')
    coupon_id = None
    points_redeemed_final = 0
    
    # 1. Coupon validation
    if data.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == data.coupon_code).first()
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon code does not exist"
            )
        if not coupon.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon is not active"
            )
        now = datetime.now()
        if now < coupon.valid_from or now > coupon.valid_until:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon has expired or is not yet valid"
            )
        # Usage limits
        if coupon.usage_limit_total is not None:
            total_usages = db.query(CouponUsage).filter(CouponUsage.coupon_id == coupon.id).count()
            if total_usages >= coupon.usage_limit_total:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Coupon has reached its total usage limit"
                )
        user_usages = db.query(CouponUsage).filter(
            CouponUsage.coupon_id == coupon.id,
            CouponUsage.customer_id == customer.id
        ).count()
        if user_usages >= coupon.usage_limit_per_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already used this coupon code"
            )
        if total_amount < coupon.min_order_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum order amount of ₹{coupon.min_order_amount:.2f} is required for this coupon"
            )
            
        # Calculate discount
        if coupon.discount_type == "flat":
            coupon_discount = coupon.discount_value
        elif coupon.discount_type == "percentage":
            coupon_discount = total_amount * (coupon.discount_value / Decimal('100.0'))
            if coupon.max_discount_amount is not None:
                coupon_discount = min(coupon_discount, coupon.max_discount_amount)
        
        # Cap at total amount
        coupon_discount = min(coupon_discount, total_amount)
        coupon_id = coupon.id

    # 2. Loyalty points validation
    if data.points_to_redeem > 0:
        if customer.loyalty_points < data.points_to_redeem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient loyalty points balance ({customer.loyalty_points})"
            )
        if data.points_to_redeem < settings.LOYALTY_MIN_REDEEM:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Minimum points required to redeem is {settings.LOYALTY_MIN_REDEEM}"
            )
            
        remaining_payable = total_amount - coupon_discount
        max_points_needed = int(remaining_payable * Decimal(str(settings.LOYALTY_REDEEM_RATE)))
        
        points_redeemed_final = min(data.points_to_redeem, max_points_needed)
        if points_redeemed_final > 0:
            points_discount = Decimal(points_redeemed_final) / Decimal(str(settings.LOYALTY_REDEEM_RATE))
        else:
            points_redeemed_final = 0
            points_discount = Decimal('0.0')

    discount_amount = coupon_discount + points_discount
    final_total_amount = total_amount - discount_amount
    final_total_amount = max(Decimal('0.0'), final_total_amount)
    
    # Calculate pre-earned points (final amount after discount)
    points_earned = int(final_total_amount / Decimal(str(settings.LOYALTY_EARN_RATE)))

    # Create order object
    order = Order(
        customer_id=customer.id,
        address_id=data.address_id if data.delivery_type == "delivery" else None,
        delivery_type=data.delivery_type,
        status="pending",
        payment_method=data.payment_method,
        payment_status="unpaid",
        total_amount=final_total_amount,
        requires_rx_check=requires_rx_check,
        coupon_id=coupon_id,
        discount_amount=discount_amount,
        points_redeemed=points_redeemed_final,
        points_earned=points_earned
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Deduct customer loyalty points immediately if points were redeemed
    if points_redeemed_final > 0:
        customer.loyalty_points -= points_redeemed_final
        db.commit()
        db.refresh(customer)
        
        loyalty_tx = LoyaltyTransaction(
            customer_id=customer.id,
            order_id=order.id,
            points_change=-points_redeemed_final,
            reason="redeemed",
            balance_after=customer.loyalty_points
        )
        db.add(loyalty_tx)
        
    # Record coupon usage if a coupon was applied
    if coupon_id is not None:
        usage = CouponUsage(
            coupon_id=coupon_id,
            customer_id=customer.id,
            order_id=order.id,
            discount_applied=coupon_discount
        )
        db.add(usage)
        
    db.commit()
    
    # Create order items
    for product, qty, price in order_items_to_create:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            price_at_order=price
        )
        db.add(order_item)
        
    # Flush items first to database
    db.flush()
    
    # If COD and no Rx check, confirm the order now (triggers AFTER UPDATE trigger)
    should_notify = False
    if data.payment_method == "cod" and not requires_rx_check:
        order.status = "confirmed"
        should_notify = True
        
    db.commit()
    db.refresh(order)

    # Trigger SMS notification for auto-confirmed COD orders
    if should_notify:
        from app.utils.notifications import notify_order_status_change
        notify_order_status_change(order, "pending", "confirmed")
    
    # Build response manually to include product_name
    response_items = []
    for item in order.items:
        response_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_order": float(item.price_at_order),
            "product_name": item.product.name
        })
        
    order_dict = order.__dict__.copy()
    order_dict["items"] = response_items
    order_dict["prescriptions"] = [p.__dict__ for p in order.prescriptions]
    order_dict["discount_amount"] = float(order.discount_amount)
    order_dict["total_amount"] = float(order.total_amount)
    return order_dict

@router.post("/{id}/prescription", response_model=PrescriptionResponse, status_code=status.HTTP_201_CREATED)
def upload_prescription(
    id: int,
    file: UploadFile = File(...),
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    if not order.requires_rx_check:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This order does not contain products that require a prescription"
        )
        
    # Check file size (max 5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the maximum limit of 5MB."
        )
        
    # Enforce file extension check
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPG, JPEG, PNG, and PDF files are allowed."
        )
        
    file_content = file.file.read()
    unique_filename = f"prescriptions/{uuid.uuid4()}{file_extension}"
    
    # Attempt to upload to S3 if configured
    file_url = None
    if settings.AWS_S3_BUCKET_NAME:
        from app.utils.s3 import upload_file_to_s3
        file_url = upload_file_to_s3(
            file_content,
            unique_filename,
            file.content_type
        )
        
    # Fallback to local storage if S3 is not configured or fails
    if not file_url:
        if settings.ENV in ("local", "testing"):
            os.makedirs(os.path.join(settings.UPLOAD_DIR, "prescriptions"), exist_ok=True)
            local_filename = f"{uuid.uuid4()}{file_extension}"
            filepath = os.path.join(settings.UPLOAD_DIR, "prescriptions", local_filename)
            with open(filepath, "wb") as buffer:
                buffer.write(file_content)
            file_url = f"/uploads/prescriptions/{local_filename}"
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Prescription upload to cloud storage failed. Fallback to local ephemeral storage is disabled in staging/production."
            )
    
    # Create prescription record
    prescription = Prescription(
        order_id=order.id,
        file_url=file_url,
        verified=False
    )
    db.add(prescription)
    
    # Update order status to rx_pending
    old_status = order.status
    order.status = "rx_pending"
    db.commit()
    db.refresh(prescription)
    
    # Trigger SMS status update
    from app.utils.notifications import notify_order_status_change
    notify_order_status_change(order, old_status, "rx_pending")
    return prescription

@router.get("/my", response_model=List[OrderResponse])
def get_my_orders(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.customer_id == customer.id).order_by(Order.created_at.desc()).all()
    
    response_orders = []
    for order in orders:
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
        response_orders.append(order_dict)
        
    return response_orders

@router.get("/{id}", response_model=OrderResponse)
def get_order_detail(
    id: int,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
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
