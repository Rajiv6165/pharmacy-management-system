from datetime import datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel

class CategoryResponse(BaseModel):
    id: int
    name: str
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True

class ProductResponse(BaseModel):
    id: int
    name: str
    brand: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    price: float
    mrp: Optional[float] = None
    stock_qty: int
    unit: Optional[str] = None
    requires_rx: bool
    image_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
