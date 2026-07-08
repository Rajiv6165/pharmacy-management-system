from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Address, Customer
from app.auth.security import get_current_customer
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse

router = APIRouter(prefix="/addresses", tags=["addresses"])

@router.get("", response_model=List[AddressResponse])
def list_addresses(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    addresses = db.query(Address).filter(Address.customer_id == customer.id).all()
    return addresses

@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    data: AddressCreate,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    # If this is the default address or customer's first address, ensure it is set as default.
    # Otherwise check if there are no existing addresses, make it default.
    existing_count = db.query(Address).filter(Address.customer_id == customer.id).count()
    is_default = data.is_default or (existing_count == 0)
    
    if is_default:
        # Unset previous defaults
        db.query(Address).filter(Address.customer_id == customer.id).update({"is_default": False})
        
    address = Address(
        customer_id=customer.id,
        label=data.label,
        full_address=data.full_address,
        landmark=data.landmark,
        latitude=data.latitude,
        longitude=data.longitude,
        is_default=is_default
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address

@router.put("/{id}", response_model=AddressResponse)
def update_address(
    id: int,
    data: AddressUpdate,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(Address.id == id, Address.customer_id == customer.id).first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
        
    # Process updates
    update_data = data.model_dump(exclude_unset=True)
    
    if "is_default" in update_data and update_data["is_default"] is True:
        # Unset previous defaults
        db.query(Address).filter(Address.customer_id == customer.id).update({"is_default": False})
        
    for key, value in update_data.items():
        setattr(address, key, value)
        
    db.commit()
    db.refresh(address)
    return address

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    id: int,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    address = db.query(Address).filter(Address.id == id, Address.customer_id == customer.id).first()
    if not address:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Address not found"
        )
        
    was_default = address.is_default
    db.delete(address)
    db.commit()
    
    # If the deleted address was default, make another one default (if any exists)
    if was_default:
        next_address = db.query(Address).filter(Address.customer_id == customer.id).first()
        if next_address:
            next_address.is_default = True
            db.commit()
            
    return None
