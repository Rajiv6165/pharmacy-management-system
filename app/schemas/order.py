from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    delivery_type: str = Field(..., pattern="^(pickup|delivery)$")
    address_id: Optional[int] = None
    payment_method: str = Field(..., pattern="^(online|cod)$")
    items: List[OrderItemCreate]
    coupon_code: Optional[str] = None
    points_to_redeem: int = Field(default=0, ge=0)

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_order: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

class PrescriptionResponse(BaseModel):
    id: int
    order_id: int
    file_url: str
    uploaded_at: datetime
    verified: bool
    verified_by_staff_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    address_id: Optional[int] = None
    delivery_type: str
    status: str
    payment_method: str
    payment_status: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    total_amount: Decimal
    requires_rx_check: bool
    handled_by_staff_id: Optional[int] = None
    coupon_id: Optional[int] = None
    discount_amount: Decimal
    points_redeemed: int
    points_earned: int
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse]
    prescriptions: List[PrescriptionResponse]

    class Config:
        from_attributes = True

class PaymentCreateRequest(BaseModel):
    order_id: int

class PaymentCreateResponse(BaseModel):
    razorpay_order_id: str
    amount: Decimal
    currency: str

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
