from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Customer, Staff
from app.schemas.auth import CustomerRegister, CustomerLogin, StaffLogin, Token, CustomerResponse
from app.auth.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/customer/register", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def register_customer(data: CustomerRegister, db: Session = Depends(get_db)):
    # Check if phone number is registered
    existing_phone = db.query(Customer).filter(Customer.phone == data.phone).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered"
        )
    
    # Check if email is registered (if provided)
    if data.email:
        existing_email = db.query(Customer).filter(Customer.email == data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered"
            )
            
    # Create customer
    pwd_hash = hash_password(data.password)
    customer = Customer(
        name=data.name,
        phone=data.phone,
        email=data.email,
        password_hash=pwd_hash
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.post("/customer/login", response_model=Token)
def login_customer(data: CustomerLogin, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.phone == data.phone).first()
    if not customer or not verify_password(data.password, customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password"
        )
        
    access_token = create_access_token(data={"sub": str(customer.id), "type": "customer"})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/staff/login", response_model=Token)
def login_staff(data: StaffLogin, db: Session = Depends(get_db)):
    staff = db.query(Staff).filter(Staff.phone == data.phone).first()
    if not staff or not verify_password(data.password, staff.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password"
        )
        
    if not staff.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff account is deactivated"
        )
        
    access_token = create_access_token(data={"sub": str(staff.id), "type": "staff", "role": staff.role})
    return {"access_token": access_token, "token_type": "bearer", "role": staff.role}
