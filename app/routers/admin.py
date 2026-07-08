from datetime import datetime, date, time
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Staff, Order
from app.auth.security import get_current_admin, hash_password
from app.schemas.auth import StaffResponse
from app.schemas.staff import StaffCreate, StaffUpdate, DashboardSummaryResponse

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/staff", response_model=StaffResponse, status_code=status.HTTP_201_CREATED)
def create_staff_account(
    data: StaffCreate,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Check if phone number is already registered in staff
    existing = db.query(Staff).filter(Staff.phone == data.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Staff phone number is already registered"
        )
        
    pwd_hash = hash_password(data.password)
    staff_member = Staff(
        name=data.name,
        phone=data.phone,
        password_hash=pwd_hash,
        role=data.role,
        is_active=True
    )
    db.add(staff_member)
    db.commit()
    db.refresh(staff_member)
    return staff_member

@router.put("/staff/{id}", response_model=StaffResponse)
def edit_staff_account(
    id: int,
    data: StaffUpdate,
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    staff_member = db.query(Staff).filter(Staff.id == id).first()
    if not staff_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff member not found"
        )
        
    update_data = data.model_dump(exclude_unset=True)
    
    # Check phone uniqueness if it's changing
    if "phone" in update_data and update_data["phone"] != staff_member.phone:
        existing = db.query(Staff).filter(Staff.phone == update_data["phone"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is already taken by another staff member"
            )
            
    for key, value in update_data.items():
        setattr(staff_member, key, value)
        
    db.commit()
    db.refresh(staff_member)
    return staff_member

@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    admin: Staff = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Calculate today's start
    today_start = datetime.combine(date.today(), time.min)
    
    # Today's orders count
    today_orders_count = db.query(Order).filter(Order.created_at >= today_start).count()
    
    # Today's revenue (sum total_amount for non-cancelled confirmed/completed/preparing/out_for_delivery orders)
    revenue_statuses = ['confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed']
    revenue_sum = db.query(func.sum(Order.total_amount)).filter(
        Order.created_at >= today_start,
        Order.status.in_(revenue_statuses)
    ).scalar()
    
    today_revenue = Decimal(revenue_sum or 0)
    
    # Pending Rx count (orders currently in 'rx_pending' status)
    pending_rx_count = db.query(Order).filter(Order.status == 'rx_pending').count()
    
    return {
        "today_orders_count": today_orders_count,
        "today_revenue": today_revenue,
        "pending_rx_count": pending_rx_count
    }
