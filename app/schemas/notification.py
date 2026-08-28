from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str

class NotificationResponse(BaseModel):
    id: int
    order_id: Optional[int]
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UnreadCountResponse(BaseModel):
    count: int
