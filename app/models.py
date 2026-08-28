from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Numeric, ForeignKey, func
from sqlalchemy.orm import relationship, backref
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    email = Column(String(150), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    loyalty_points = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())

    addresses = relationship("Address", back_populates="customer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer")
    loyalty_transactions = relationship("LoyaltyTransaction", back_populates="customer", cascade="all, delete-orphan")
    coupon_usages = relationship("CouponUsage", back_populates="customer", cascade="all, delete-orphan")


class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="staff")  # 'staff' | 'admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(30))  # 'Home', 'Work'
    full_address = Column(Text, nullable=False)
    landmark = Column(String(150))
    latitude = Column(Numeric(9, 6))
    longitude = Column(Numeric(9, 6))
    is_default = Column(Boolean, default=False)

    customer = relationship("Customer", back_populates="addresses")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    parent = relationship("Category", remote_side=[id], backref=backref("subcategories", cascade="all, delete-orphan"))


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    brand = Column(String(100))
    category_id = Column(Integer, ForeignKey("categories.id"))
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    mrp = Column(Numeric(10, 2))
    stock_qty = Column(Integer, nullable=False, default=0)
    unit = Column(String(30))  # 'strip of 10', '100ml bottle'
    requires_rx = Column(Boolean, default=False)
    image_url = Column(Text)
    is_active = Column(Boolean, default=True)
    low_stock_alert = Column(Integer, default=10)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    category = relationship("Category")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    address_id = Column(Integer, ForeignKey("addresses.id"), nullable=True)
    delivery_type = Column(String(20), nullable=False)  # 'pickup' | 'delivery'
    status = Column(String(30), nullable=False, default="pending")
    payment_method = Column(String(20), nullable=False)  # 'online' | 'cod'
    payment_status = Column(String(20), default="unpaid")  # 'unpaid' | 'paid' | 'refunded'
    razorpay_order_id = Column(String(100))
    razorpay_payment_id = Column(String(100))
    total_amount = Column(Numeric(10, 2), nullable=False)
    requires_rx_check = Column(Boolean, default=False)
    handled_by_staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id"), nullable=True)
    discount_amount = Column(Numeric(10, 2), default=0.0)
    points_redeemed = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    address = relationship("Address")
    handled_by = relationship("Staff")
    coupon = relationship("Coupon")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="order", cascade="all, delete-orphan")
    coupon_usages = relationship("CouponUsage", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_order = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=False)
    uploaded_at = Column(DateTime, server_default=func.now())
    verified = Column(Boolean, default=False)
    verified_by_staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text)

    order = relationship("Order", back_populates="prescriptions")
    verified_by = relationship("Staff")


class InventoryLog(Base):
    __tablename__ = "inventory_log"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    change_qty = Column(Integer, nullable=False)
    reason = Column(String(50), nullable=False)  # 'restock' | 'order' | 'correction' | 'damage'
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product")
    staff = relationship("Staff")
    order = relationship("Order")


class LoyaltyTransaction(Base):
    __tablename__ = "loyalty_transactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    points_change = Column(Integer, nullable=False)
    reason = Column(String(30), nullable=False)  # 'earned' | 'redeemed' | 'admin_adjustment' | 'expired'
    balance_after = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer", back_populates="loyalty_transactions")
    order = relationship("Order")


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(30), unique=True, nullable=False, index=True)
    description = Column(String(200))
    discount_type = Column(String(20), nullable=False)  # 'percentage' | 'flat'
    discount_value = Column(Numeric(10, 2), nullable=False)
    min_order_amount = Column(Numeric(10, 2), default=0.0)
    max_discount_amount = Column(Numeric(10, 2), nullable=True)
    usage_limit_total = Column(Integer, nullable=True)
    usage_limit_per_user = Column(Integer, default=1)
    valid_from = Column(DateTime, nullable=False)
    valid_until = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    created_by_staff_id = Column(Integer, ForeignKey("staff.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    created_by = relationship("Staff")
    usages = relationship("CouponUsage", back_populates="coupon", cascade="all, delete-orphan")


class CouponUsage(Base):
    __tablename__ = "coupon_usage"

    id = Column(Integer, primary_key=True, index=True)
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    discount_applied = Column(Numeric(10, 2), nullable=False)
    used_at = Column(DateTime, server_default=func.now())

    coupon = relationship("Coupon", back_populates="usages")
    customer = relationship("Customer", back_populates="coupon_usages")
    order = relationship("Order", back_populates="coupon_usages")


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(Text, nullable=False)
    p256dh_key = Column(Text, nullable=False)
    auth_key = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    customer = relationship("Customer")
    order = relationship("Order")
