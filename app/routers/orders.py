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
    total_amount = 0
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
            
        price = product.price
        total_amount += price * item_in.quantity
        
        order_items_to_create.append((product, item_in.quantity, price))
        
    # Create order object
    # For COD, if no prescription required, we can auto-confirm.
    # Otherwise, it stays 'pending' (if online, waiting for payment; if needs Rx, waiting for Rx upload)
    status_val = "pending"
    if data.payment_method == "cod" and not requires_rx_check:
        status_val = "confirmed"
        
    order = Order(
        customer_id=customer.id,
        address_id=data.address_id if data.delivery_type == "delivery" else None,
        delivery_type=data.delivery_type,
        status=status_val,
        payment_method=data.payment_method,
        payment_status="unpaid",
        total_amount=total_amount,
        requires_rx_check=requires_rx_check
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Create order items
    for product, qty, price in order_items_to_create:
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            price_at_order=price
        )
        db.add(order_item)
        
    db.commit()
    db.refresh(order)
    
    # Build response manually to include product_name
    response_items = []
    for item in order.items:
        response_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_order": item.price_at_order,
            "product_name": item.product.name
        })
        
    order_dict = order.__dict__.copy()
    order_dict["items"] = response_items
    order_dict["prescriptions"] = [p.__dict__ for p in order.prescriptions]
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
        
    # Save the file
    os.makedirs(os.path.join(settings.UPLOAD_DIR, "prescriptions"), exist_ok=True)
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    filepath = os.path.join(settings.UPLOAD_DIR, "prescriptions", unique_filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())
        
    file_url = f"/uploads/prescriptions/{unique_filename}"
    
    # Create prescription record
    prescription = Prescription(
        order_id=order.id,
        file_url=file_url,
        verified=False
    )
    db.add(prescription)
    
    # Update order status to rx_pending
    order.status = "rx_pending"
    db.commit()
    db.refresh(prescription)
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
