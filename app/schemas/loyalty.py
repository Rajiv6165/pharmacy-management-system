from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class CouponBase(BaseModel):
    code: str = Field(..., max_length=30)
    description: Optional[str] = Field(None, max_length=200)
    discount_type: str = Field(..., pattern="^(percentage|flat)$")
    discount_value: Decimal = Field(..., gt=0)
    min_order_amount: Decimal = Field(default=Decimal('0.0'), ge=0)
    max_discount_amount: Optional[Decimal] = Field(None, ge=0)
    usage_limit_total: Optional[int] = Field(None, ge=1)
    usage_limit_per_user: int = Field(default=1, ge=1)
    valid_from: datetime
    valid_until: datetime
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    description: Optional[str] = Field(None, max_length=200)
    discount_value: Optional[Decimal] = Field(None, gt=0)
    min_order_amount: Optional[Decimal] = Field(None, ge=0)
    max_discount_amount: Optional[Decimal] = Field(None, ge=0)
    usage_limit_total: Optional[int] = Field(None, ge=1)
    usage_limit_per_user: Optional[int] = Field(None, ge=1)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: int
    created_by_staff_id: Optional[int] = None
    created_at: datetime
    usage_count: int = 0

    class Config:
        from_attributes = True

class LoyaltyTransactionResponse(BaseModel):
    id: int
    customer_id: int
    order_id: Optional[int] = None
    points_change: int
    reason: str
    balance_after: int
    created_at: datetime

    class Config:
        from_attributes = True

class CouponValidateRequest(BaseModel):
    code: str
    cart_total: Decimal = Field(..., ge=0)

class CouponValidateResponse(BaseModel):
    valid: bool
    discount_amount: Decimal
    message: str

class LoyaltyAdjustRequest(BaseModel):
    customer_id: int
    points_change: int
    reason: str = Field(..., max_length=30)
