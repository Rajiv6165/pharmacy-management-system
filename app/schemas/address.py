from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field

class AddressCreate(BaseModel):
    label: Optional[str] = Field(None, max_length=30, examples=["Home", "Work"])
    full_address: str = Field(..., min_length=5)
    landmark: Optional[str] = Field(None, max_length=150)
    latitude: Optional[Decimal] = Field(None, max_digits=9, decimal_places=6)
    longitude: Optional[Decimal] = Field(None, max_digits=9, decimal_places=6)
    is_default: Optional[bool] = False

class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, max_length=30)
    full_address: Optional[str] = Field(None, min_length=5)
    landmark: Optional[str] = Field(None, max_length=150)
    latitude: Optional[Decimal] = Field(None, max_digits=9, decimal_places=6)
    longitude: Optional[Decimal] = Field(None, max_digits=9, decimal_places=6)
    is_default: Optional[bool] = None

class AddressResponse(BaseModel):
    id: int
    customer_id: int
    label: Optional[str] = None
    full_address: str
    landmark: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    is_default: bool

    class Config:
        from_attributes = True
