from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field

class ProductCreate(BaseModel):
    name: str = Field(..., max_length=200)
    brand: Optional[str] = Field(None, max_length=100)
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    mrp: Optional[Decimal] = None
    stock_qty: int = Field(0, ge=0)
    unit: Optional[str] = Field(None, max_length=30)
    requires_rx: Optional[bool] = False
    image_url: Optional[str] = None
    is_active: Optional[bool] = True
    low_stock_alert: Optional[int] = Field(10, ge=0)

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    brand: Optional[str] = Field(None, max_length=100)
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, gt=0)
    mrp: Optional[Decimal] = None
    stock_qty: Optional[int] = Field(None, ge=0)
    unit: Optional[str] = Field(None, max_length=30)
    requires_rx: Optional[bool] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    low_stock_alert: Optional[int] = Field(None, ge=0)

class RestockRequest(BaseModel):
    quantity: int = Field(..., gt=0)

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|rx_pending|confirmed|preparing|out_for_delivery|ready_for_pickup|completed|cancelled)$")

class PrescriptionVerifyRequest(BaseModel):
    verified: bool
    rejection_reason: Optional[str] = None

class StaffCreate(BaseModel):
    name: str = Field(..., max_length=100)
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    role: str = Field("staff", pattern="^(staff|admin)$")

class StaffUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    role: Optional[str] = Field(None, pattern="^(staff|admin)$")
    is_active: Optional[bool] = None

class DashboardSummaryResponse(BaseModel):
    today_orders_count: int
    today_revenue: Decimal
    pending_rx_count: int

class InventoryLogResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    staff_id: Optional[int] = None
    staff_name: Optional[str] = None
    change_qty: int
    reason: str
    order_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
