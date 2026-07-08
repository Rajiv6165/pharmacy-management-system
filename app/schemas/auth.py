from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class CustomerRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=6)

class CustomerLogin(BaseModel):
    phone: str
    password: str

class StaffLogin(BaseModel):
    phone: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None  # Returned for staff

class CustomerResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StaffResponse(BaseModel):
    id: int
    name: str
    phone: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
