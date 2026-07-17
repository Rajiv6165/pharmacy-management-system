from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import Order, Prescription, Product, InventoryLog, Staff, Coupon, CouponUsage, Customer
from app.auth.security import get_current_staff
from app.schemas.order import OrderResponse, PrescriptionResponse
from app.schemas.product import ProductResponse
from app.schemas.staff import (
    OrderStatusUpdate, PrescriptionVerifyRequest, ProductCreate, ProductUpdate, 
    RestockRequest, InventoryLogResponse
)
from app.schemas.loyalty import CouponCreate, CouponUpdate, CouponResponse

router = APIRouter(prefix="/staff", tags=["staff"])

# ============ ORDERS ============

@router.get("/orders", response_model=List[OrderResponse])
def get_orders_queue(
    status: Optional[str] = Query(None),
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if status is not None:
        query = query.filter(Order.status == status)
        
    orders = query.order_by(Order.created_at.desc()).all()
    
    response_orders = []
    for o in orders:
        items = []
        for item in o.items:
            items.append({
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_at_order": item.price_at_order,
                "product_name": item.product.name
            })
        o_dict = o.__dict__.copy()
        o_dict["items"] = items
        o_dict["prescriptions"] = [p.__dict__ for p in o.prescriptions]
        response_orders.append(o_dict)
        
    return response_orders

@router.put("/orders/{id}/status", response_model=OrderResponse)
def update_order_status(
    id: int,
    data: OrderStatusUpdate,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    old_status = order.status
    order.status = data.status
    order.handled_by_staff_id = staff.id
    
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
    
    # Build order response manually to include product_name
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

@router.put("/prescriptions/{id}/verify", response_model=PrescriptionResponse)
def verify_prescription(
    id: int,
    data: PrescriptionVerifyRequest,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    prescription = db.query(Prescription).filter(Prescription.id == id).first()
    if not prescription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prescription not found"
        )
        
    prescription.verified = data.verified
    prescription.verified_by_staff_id = staff.id
    prescription.verified_at = datetime.now(timezone.utc)
    prescription.rejection_reason = data.rejection_reason if not data.verified else None
    
    order = prescription.order
    old_status = order.status
    if data.verified:
        # If the order is paid or COD, transition to confirmed (which triggers stock decrement via database trigger)
        if order.payment_status == "paid" or order.payment_method == "cod":
            order.status = "confirmed"
    else:
        # If prescription rejected, mark order as cancelled
        order.status = "cancelled"
        
    db.commit()
    db.refresh(prescription)
    db.refresh(order)
    
    # Trigger SMS status update if status changed
    if old_status != order.status:
        from app.utils.notifications import notify_order_status_change
        notify_order_status_change(order, old_status, order.status, rejection_reason=prescription.rejection_reason)
        
    # Check low stock warnings if confirmed
    if order.status == "confirmed":
        from app.utils.notifications import send_low_stock_email
        for item in order.items:
            product = item.product
            # Check if stock goes below alert threshold
            if product.is_active and product.stock_qty <= product.low_stock_alert:
                send_low_stock_email(product.name, product.stock_qty, product.low_stock_alert)
                
    return prescription

# ============ INVENTORY ============

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def add_product(
    data: ProductCreate,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    product = Product(
        name=data.name,
        brand=data.brand,
        category_id=data.category_id,
        description=data.description,
        price=data.price,
        mrp=data.mrp,
        stock_qty=data.stock_qty,
        unit=data.unit,
        requires_rx=data.requires_rx,
        image_url=data.image_url,
        is_active=data.is_active,
        low_stock_alert=data.low_stock_alert
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Log initial inventory if stock_qty > 0
    if product.stock_qty > 0:
        inv_log = InventoryLog(
            product_id=product.id,
            staff_id=staff.id,
            change_qty=product.stock_qty,
            reason="restock"
        )
        db.add(inv_log)
        db.commit()
        
    return product

@router.put("/products/{id}", response_model=ProductResponse)
def edit_product(
    id: int,
    data: ProductUpdate,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    update_data = data.model_dump(exclude_unset=True)
    
    # If updating stock_qty manually, we should log a change
    if "stock_qty" in update_data:
        old_qty = product.stock_qty
        new_qty = update_data["stock_qty"]
        diff = new_qty - old_qty
        if diff != 0:
            inv_log = InventoryLog(
                product_id=product.id,
                staff_id=staff.id,
                change_qty=diff,
                reason="correction"
            )
            db.add(inv_log)
            
    for key, value in update_data.items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    return product

@router.get("/products/{id}", response_model=ProductResponse)
def get_product_details_for_staff(
    id: int,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.post("/products/{id}/restock", response_model=ProductResponse)
def restock_product(
    id: int,
    data: RestockRequest,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
        
    # Increment stock
    product.stock_qty += data.quantity
    
    # Log to inventory log
    inv_log = InventoryLog(
        product_id=product.id,
        staff_id=staff.id,
        change_qty=data.quantity,
        reason="restock"
    )
    db.add(inv_log)
    
    db.commit()
    db.refresh(product)
    return product

@router.get("/inventory/low-stock", response_model=List[ProductResponse])
def get_low_stock_products(
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    # Returns active products that are below or equal to low stock alert threshold
    products = db.query(Product).filter(
        Product.is_active == True,
        Product.stock_qty <= Product.low_stock_alert
    ).all()
    return products

@router.get("/inventory/log", response_model=List[InventoryLogResponse])
def get_inventory_log(
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    logs = db.query(InventoryLog).order_by(InventoryLog.created_at.desc()).all()
    
    response_logs = []
    for log in logs:
        response_logs.append({
            "id": log.id,
            "product_id": log.product_id,
            "product_name": log.product.name,
            "staff_id": log.staff_id,
            "staff_name": log.staff.name if log.staff else "System",
            "change_qty": log.change_qty,
            "reason": log.reason,
            "order_id": log.order_id,
            "created_at": log.created_at
        })
        
    return response_logs


# ============ COUPONS ============

@router.post("/coupons", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(
    data: CouponCreate,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    existing = db.query(Coupon).filter(Coupon.code == data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon code already exists"
        )
    coupon = Coupon(
        code=data.code,
        description=data.description,
        discount_type=data.discount_type,
        discount_value=data.discount_value,
        min_order_amount=data.min_order_amount,
        max_discount_amount=data.max_discount_amount,
        usage_limit_total=data.usage_limit_total,
        usage_limit_per_user=data.usage_limit_per_user,
        valid_from=data.valid_from,
        valid_until=data.valid_until,
        is_active=data.is_active,
        created_by_staff_id=staff.id
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    
    c_dict = coupon.__dict__.copy()
    c_dict["usage_count"] = 0
    return c_dict

@router.get("/coupons", response_model=List[CouponResponse])
def list_coupons(
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    coupons = db.query(Coupon).order_by(Coupon.created_at.desc()).all()
    response = []
    for c in coupons:
        usage_count = db.query(CouponUsage).filter(CouponUsage.coupon_id == c.id).count()
        c_dict = c.__dict__.copy()
        c_dict["usage_count"] = usage_count
        response.append(c_dict)
    return response

@router.put("/coupons/{id}", response_model=CouponResponse)
def edit_coupon(
    id: int,
    data: CouponUpdate,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.id == id).first()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(coupon, key, value)
    db.commit()
    db.refresh(coupon)
    
    usage_count = db.query(CouponUsage).filter(CouponUsage.coupon_id == coupon.id).count()
    c_dict = coupon.__dict__.copy()
    c_dict["usage_count"] = usage_count
    return c_dict

@router.get("/coupons/{id}/usage")
def get_coupon_usage(
    id: int,
    staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    usages = db.query(CouponUsage).filter(CouponUsage.coupon_id == id).order_by(CouponUsage.used_at.desc()).all()
    response = []
    for u in usages:
        response.append({
            "id": u.id,
            "customer_id": u.customer_id,
            "customer_name": u.customer.name,
            "customer_phone": u.customer.phone,
            "order_id": u.order_id,
            "discount_applied": float(u.discount_applied),
            "used_at": u.used_at
        })
    return response
