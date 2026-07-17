from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models import Customer, Coupon, CouponUsage, LoyaltyTransaction
from app.auth.security import get_current_customer
from app.schemas.loyalty import (
    CouponValidateRequest, CouponValidateResponse,
    LoyaltyTransactionResponse
)

router = APIRouter(tags=["loyalty"])

@router.get("/loyalty/balance")
def get_loyalty_balance(
    customer: Customer = Depends(get_current_customer)
):
    return {"balance": customer.loyalty_points}

@router.get("/loyalty/history", response_model=List[LoyaltyTransactionResponse])
def get_loyalty_history(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    transactions = db.query(LoyaltyTransaction).filter(
        LoyaltyTransaction.customer_id == customer.id
    ).order_by(LoyaltyTransaction.created_at.desc()).all()
    return transactions

@router.post("/coupons/validate", response_model=CouponValidateResponse)
def validate_coupon(
    data: CouponValidateRequest,
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    coupon = db.query(Coupon).filter(Coupon.code == data.code).first()
    if not coupon:
        return CouponValidateResponse(
            valid=False,
            discount_amount=Decimal('0.0'),
            message="Invalid coupon code. It does not exist."
        )

    if not coupon.is_active:
        return CouponValidateResponse(
            valid=False,
            discount_amount=Decimal('0.0'),
            message="This coupon is no longer active."
        )

    now = datetime.now()
    if now < coupon.valid_from:
        return CouponValidateResponse(
            valid=False,
            discount_amount=Decimal('0.0'),
            message="This coupon is not valid yet."
        )
    if now > coupon.valid_until:
        return CouponValidateResponse(
            valid=False,
            discount_amount=Decimal('0.0'),
            message="This coupon has expired."
        )

    # Check total usage limit
    if coupon.usage_limit_total is not None:
        total_usages = db.query(CouponUsage).filter(CouponUsage.coupon_id == coupon.id).count()
        if total_usages >= coupon.usage_limit_total:
            return CouponValidateResponse(
                valid=False,
                discount_amount=Decimal('0.0'),
                message="This coupon has reached its maximum usage limit."
            )

    # Check usage limit per user
    user_usages = db.query(CouponUsage).filter(
        CouponUsage.coupon_id == coupon.id,
        CouponUsage.customer_id == customer.id
    ).count()
    if user_usages >= coupon.usage_limit_per_user:
        return CouponValidateResponse(
            valid=False,
            discount_amount=Decimal('0.0'),
            message="You have already used this coupon."
        )

    # Check minimum order amount
    if data.cart_total < coupon.min_order_amount:
        return CouponValidateResponse(
            valid=False,
            discount_amount=Decimal('0.0'),
            message=f"Minimum order of ₹{coupon.min_order_amount:.2f} required to use this coupon."
        )

    # Calculate discount
    discount = Decimal('0.0')
    if coupon.discount_type == "flat":
        discount = coupon.discount_value
    elif coupon.discount_type == "percentage":
        discount = data.cart_total * (coupon.discount_value / Decimal('100.0'))
        if coupon.max_discount_amount is not None:
            discount = min(discount, coupon.max_discount_amount)

    # Cap discount at cart total
    discount = min(discount, data.cart_total)

    # Return valid
    return CouponValidateResponse(
        valid=True,
        discount_amount=discount,
        message="Coupon validated successfully!"
    )
