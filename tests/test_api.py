import io
import os
os.environ["ADMIN_BOOTSTRAP_PASSWORD"] = "Admin@123"
os.environ["ENV"] = "testing"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.config import settings
from app.models import Category, Staff, Product, Order, InventoryLog, Address, Customer, Coupon, CouponUsage, LoyaltyTransaction

# Use the same database URL or override for testing.
# Since we have the credentials, we can use the same DB, but clean up our test data.
# For isolation, let's create a test session.
engine = create_engine(settings.DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    # Setup test tables
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Clear existing test data to ensure clean run
        db.query(InventoryLog).delete()
        db.query(CouponUsage).delete()
        db.query(LoyaltyTransaction).delete()
        db.query(Order).delete()
        db.query(Coupon).delete()
        db.query(Product).delete()
        db.query(Category).delete()
        db.query(Address).delete()
        db.query(Customer).delete()
        db.query(Staff).delete()
        db.commit()
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module")
def client(db_session):
    # Override get_db dependency
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_admin_bootstrap_and_login(client, db_session):
    # Lifespan should have created default admin
    # Let's verify by logging in
    login_data = {
        "phone": "9999999999",
        "password": "Admin@123"
    }
    response = client.post("/auth/staff/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"

def test_customer_registration_and_login(client):
    # 1. Register a customer
    reg_data = {
        "name": "John Doe",
        "phone": "9876543210",
        "email": "john@example.com",
        "password": "password123"
    }
    response = client.post("/auth/customer/register", json=reg_data)
    assert response.status_code == 201
    customer_data = response.json()
    assert customer_data["name"] == "John Doe"
    assert customer_data["phone"] == "9876543210"
    
    # 2. Test duplicate registration
    response = client.post("/auth/customer/register", json=reg_data)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]
    
    # 3. Login
    login_data = {
        "phone": "9876543210",
        "password": "password123"
    }
    response = client.post("/auth/customer/login", json=login_data)
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_addresses_crud(client):
    # Get Customer Token
    login_data = {"phone": "9876543210", "password": "password123"}
    token = client.post("/auth/customer/login", json=login_data).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create Address 1 (Default)
    addr1 = {
        "label": "Home",
        "full_address": "123 Main St, Apartment 4B",
        "landmark": "Near Central Park",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "is_default": True
    }
    response = client.post("/addresses", json=addr1, headers=headers)
    assert response.status_code == 201
    addr1_data = response.json()
    assert addr1_data["is_default"] is True
    addr1_id = addr1_data["id"]
    
    # 2. Create Address 2 (Non-default)
    addr2 = {
        "label": "Work",
        "full_address": "456 Office Rd, Floor 10",
        "is_default": False
    }
    response = client.post("/addresses", json=addr2, headers=headers)
    assert response.status_code == 201
    addr2_data = response.json()
    assert addr2_data["is_default"] is False
    addr2_id = addr2_data["id"]
    
    # 3. Get Addresses
    response = client.get("/addresses", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2
    
    # 4. Update Address 2 to be default (should unset Address 1 as default)
    response = client.put(f"/addresses/{addr2_id}", json={"is_default": True}, headers=headers)
    assert response.status_code == 200
    assert response.json()["is_default"] is True
    
    # Verify Address 1 is no longer default
    response = client.get("/addresses", headers=headers)
    addresses = response.json()
    for addr in addresses:
        if addr["id"] == addr1_id:
            assert addr["is_default"] is False
        if addr["id"] == addr2_id:
            assert addr["is_default"] is True
            
    # 5. Delete Address 2 (Address 1 should become default again)
    response = client.delete(f"/addresses/{addr2_id}", headers=headers)
    assert response.status_code == 204
    
    # Verify Address 1 is default again
    response = client.get("/addresses", headers=headers)
    addresses = response.json()
    assert len(addresses) == 1
    assert addresses[0]["id"] == addr1_id
    assert addresses[0]["is_default"] is True

def test_catalog_and_inventory_operations(client, db_session):
    # Log in as admin to create a staff member
    admin_login = {"phone": "9999999999", "password": "Admin@123"}
    admin_token = client.post("/auth/staff/login", json=admin_login).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Create a staff member
    staff_create = {
        "name": "Jane Staff",
        "phone": "8888888888",
        "password": "staffpassword",
        "role": "staff"
    }
    response = client.post("/admin/staff", json=staff_create, headers=admin_headers)
    assert response.status_code == 201
    
    # Log in as staff
    staff_login = {"phone": "8888888888", "password": "staffpassword"}
    staff_token = client.post("/auth/staff/login", json=staff_login).json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    
    # 2. Add Category directly to database (since no category router endpoint is in spec)
    category = Category(name="Prescription Medicines")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    
    # 3. Create Product (Requires Rx, starting stock = 50)
    product_data = {
        "name": "Amoxicillin 500mg",
        "brand": "MediLabs",
        "category_id": category.id,
        "description": "Broad-spectrum antibiotic",
        "price": 150.00,
        "mrp": 180.00,
        "stock_qty": 50,
        "unit": "strip of 10",
        "requires_rx": True,
        "image_url": "http://example.com/amox.jpg",
        "is_active": True,
        "low_stock_alert": 15
    }
    response = client.post("/staff/products", json=product_data, headers=staff_headers)
    assert response.status_code == 201
    product = response.json()
    product_id = product["id"]
    
    # Verify initial stock log was generated
    response = client.get("/staff/inventory/log", headers=staff_headers)
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 1
    assert logs[0]["product_id"] == product_id
    assert logs[0]["change_qty"] == 50
    assert logs[0]["reason"] == "restock"
    
    # 4. Public Catalog view
    response = client.get("/products")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Amoxicillin 500mg"
    
    # 5. Restock Product
    restock_data = {"quantity": 10}
    response = client.post(f"/staff/products/{product_id}/restock", json=restock_data, headers=staff_headers)
    assert response.status_code == 200
    assert response.json()["stock_qty"] == 60
    
    # Check inventory logs again (should have 2 entries)
    response = client.get("/staff/inventory/log", headers=staff_headers)
    logs = response.json()
    assert len(logs) == 2
    assert logs[0]["change_qty"] == 10  # order desc
    assert logs[0]["reason"] == "restock"

def test_order_creation_prescription_payment_and_stock_trigger(client, db_session):
    # Log in customer
    cust_login = {"phone": "9876543210", "password": "password123"}
    cust_token = client.post("/auth/customer/login", json=cust_login).json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    
    # Log in staff
    staff_login = {"phone": "8888888888", "password": "staffpassword"}
    staff_token = client.post("/auth/staff/login", json=staff_login).json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}
    
    # Get customer address and product
    address = db_session.query(Address).first()
    product = db_session.query(Product).first()
    assert product.stock_qty == 60  # updated from previous restock test
    
    # 1. Create order (requires prescription, 2 units)
    order_create = {
        "delivery_type": "delivery",
        "address_id": address.id,
        "payment_method": "online",
        "items": [
            {"product_id": product.id, "quantity": 2}
        ]
    }
    response = client.post("/orders", json=order_create, headers=cust_headers)
    assert response.status_code == 201
    order = response.json()
    assert order["status"] == "pending"
    assert order["requires_rx_check"] is True
    assert float(order["total_amount"]) == 300.00  # 150 * 2
    order_id = order["id"]
    
    # 2. Upload prescription file
    file_content = b"fake prescription pdf content"
    file = io.BytesIO(file_content)
    response = client.post(
        f"/orders/{order_id}/prescription",
        files={"file": ("prescription.pdf", file, "application/pdf")},
        headers=cust_headers
    )
    assert response.status_code == 201
    prescription = response.json()
    assert prescription["verified"] is False
    assert "/uploads/prescriptions/" in prescription["file_url"]
    prescription_id = prescription["id"]
    
    # Order status should have transitioned to rx_pending
    response = client.get(f"/orders/{order_id}", headers=cust_headers)
    assert response.json()["status"] == "rx_pending"
    
    # 3. Simulate payment
    # Create payment
    response = client.post("/payments/create", json={"order_id": order_id}, headers=cust_headers)
    assert response.status_code == 200
    rzp_order_id = response.json()["razorpay_order_id"]
    
    # Verify payment
    verify_data = {
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": "pay_mock_123",
        "razorpay_signature": "mock_sig_verification_bypass"
    }
    response = client.post("/payments/verify", json=verify_data, headers=cust_headers)
    assert response.status_code == 200
    assert response.json()["payment_status"] == "paid"
    # Status should still be rx_pending since prescription is not verified
    assert response.json()["status"] == "rx_pending"
    
    # 4. Verify prescription by staff
    verify_request = {
        "verified": True
    }
    response = client.put(f"/staff/prescriptions/{prescription_id}/verify", json=verify_request, headers=staff_headers)
    assert response.status_code == 200
    assert response.json()["verified"] is True
    
    # The order status should now automatically update to 'confirmed' because payment_status is 'paid'
    response = client.get(f"/orders/{order_id}", headers=cust_headers)
    assert response.json()["status"] == "confirmed"
    
    # 5. Check stock decrement database trigger logic!
    # Query product directly from db_session
    db_session.expire_all()
    product_db = db_session.query(Product).filter(Product.id == product.id).first()
    # Initial was 60. Ordered 2. Should be 58!
    assert product_db.stock_qty == 58
    
    # Check that trigger inserted inventory log entry
    inv_logs = db_session.query(InventoryLog).filter(InventoryLog.order_id == order_id).all()
    assert len(inv_logs) == 1
    assert inv_logs[0].change_qty == -2
    assert inv_logs[0].reason == "order"
    assert inv_logs[0].product_id == product.id

def test_admin_dashboard_summary(client):
    admin_login = {"phone": "9999999999", "password": "Admin@123"}
    admin_token = client.post("/auth/staff/login", json=admin_login).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.get("/admin/dashboard/summary", headers=admin_headers)
    assert response.status_code == 200
    summary = response.json()
    assert summary["today_orders_count"] == 1
    assert float(summary["today_revenue"]) == 300.00
    assert summary["pending_rx_count"] == 0


def test_prescription_upload_validation(client, db_session):
    # Log in customer
    cust_login = {"phone": "9876543210", "password": "password123"}
    cust_token = client.post("/auth/customer/login", json=cust_login).json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    
    # Get a product and address
    address = db_session.query(Address).first()
    product = db_session.query(Product).first()
    
    # Create order requiring Rx
    order_create = {
        "delivery_type": "delivery",
        "address_id": address.id,
        "payment_method": "online",
        "items": [
            {"product_id": product.id, "quantity": 1}
        ]
    }
    response = client.post("/orders", json=order_create, headers=cust_headers)
    order_id = response.json()["id"]
    
    # Test file size limit (>5MB)
    large_content = b"a" * (5 * 1024 * 1024 + 1)
    file = io.BytesIO(large_content)
    response = client.post(
        f"/orders/{order_id}/prescription",
        files={"file": ("prescription.pdf", file, "application/pdf")},
        headers=cust_headers
    )
    assert response.status_code == 400
    assert "size" in response.json()["detail"].lower()
    
    # Test invalid file format
    invalid_content = b"some text file content"
    file = io.BytesIO(invalid_content)
    response = client.post(
        f"/orders/{order_id}/prescription",
        files={"file": ("prescription.txt", file, "text/plain")},
        headers=cust_headers
    )
    assert response.status_code == 400
    assert "file type" in response.json()["detail"].lower()


def test_razorpay_webhook_signature_verification(client):
    from app.config import settings
    # Save original settings
    orig_secret = settings.RAZORPAY_WEBHOOK_SECRET
    settings.RAZORPAY_WEBHOOK_SECRET = "test_webhook_secret_key"
    
    # Make a dummy request body
    body = b'{"event":"order.paid","payload":{"payment":{"entity":{"order_id":"order_test_123","id":"pay_test_abc"}}}}'
    
    # Generate signature using hmac
    import hmac
    import hashlib
    expected_signature = hmac.new(
        b"test_webhook_secret_key",
        body,
        hashlib.sha256
    ).hexdigest()
    
    # Post with valid signature
    response = client.post(
        "/payments/webhook",
        content=body,
        headers={"X-Razorpay-Signature": expected_signature}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ignored"
    
    # Post with invalid signature
    response = client.post(
        "/payments/webhook",
        content=body,
        headers={"X-Razorpay-Signature": "invalid_sig"}
    )
    assert response.status_code == 400
    
    # Restore settings
    settings.RAZORPAY_WEBHOOK_SECRET = orig_secret


def test_rate_limiter_in_isolation():
    from app.utils.rate_limiter import RateLimiter
    from fastapi import HTTPException
    from app.config import settings
    import pytest
    
    # Temporarily set environment to local so rate limiting is not bypassed
    orig_env = settings.ENV
    settings.ENV = "local"
    
    try:
        limiter = RateLimiter(requests_limit=2, window_seconds=10)
        
        class DummyClient:
            def __init__(self, host):
                self.host = host
                
        class MockRequest:
            def __init__(self, host, headers=None):
                self.client = DummyClient(host)
                self.headers = headers or {}
                
        req = MockRequest("1.1.1.1")
        
        # First request
        limiter(req)
        # Second request
        limiter(req)
        
        # Third request within window should raise 429
        with pytest.raises(HTTPException) as exc_info:
            limiter(req)
        assert exc_info.value.status_code == 429
    finally:
        settings.ENV = orig_env


def test_mock_signature_bypass_in_production(client, db_session):
    from app.config import settings
    # Set environment to production
    orig_env = settings.ENV
    settings.ENV = "production"
    
    verify_data = {
        "razorpay_order_id": "order_mock_123",
        "razorpay_payment_id": "pay_mock_123",
        "razorpay_signature": "mock_sig_bypass"
    }
    
    # Log in customer
    cust_login = {"phone": "9876543210", "password": "password123"}
    cust_token = client.post("/auth/customer/login", json=cust_login).json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    
    # Get address and product
    address = db_session.query(Address).first()
    product = db_session.query(Product).first()
    order_create = {
        "delivery_type": "delivery",
        "address_id": address.id,
        "payment_method": "online",
        "items": [
            {"product_id": product.id, "quantity": 1}
        ]
    }
    order = client.post("/orders", json=order_create, headers=cust_headers).json()
    order_id = order["id"]
    
    # Set dummy razorpay order id
    real_order = db_session.query(Order).filter(Order.id == order_id).first()
    real_order.razorpay_order_id = "order_rzp_prod_test"
    db_session.commit()
    
    verify_data["razorpay_order_id"] = "order_rzp_prod_test"
    
    response = client.post("/payments/verify", json=verify_data, headers=cust_headers)
    assert response.status_code == 400
    assert "invalid razorpay payment signature" in response.json()["detail"].lower()
    
    # Restore environment
    settings.ENV = orig_env


def test_support_chat_non_medical(client):
    chat_data = {
        "message": "how can I track my order?",
        "conversation_history": []
    }
    response = client.post("/support/chat", json=chat_data)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "[MOCK SUPPORT BOT]" in data["response"]


def test_support_chat_medical_deflection(client):
    chat_data = {
        "message": "What dosage of paracetamol is safe?",
        "conversation_history": []
    }
    response = client.post("/support/chat", json=chat_data)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
    assert "pharmacist" in data["response"]
    assert "contact the store directly" in data["response"]


def test_loyalty_and_coupons_flow(client, db_session):
    # 1. Login staff/admin to manage coupons
    login_data = {"phone": "9999999999", "password": "Admin@123"}
    staff_token = client.post("/auth/staff/login", json=login_data).json()["access_token"]
    staff_headers = {"Authorization": f"Bearer {staff_token}"}

    # 2. Login customer
    login_data = {"phone": "9876543210", "password": "password123"}
    cust_token = client.post("/auth/customer/login", json=login_data).json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}

    # 3. Create a non-Rx product for testing checkout quickly
    from app.models import Category
    category = db_session.query(Category).first()
    if not category:
        category = Category(name="General OTC")
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)

    product_data = {
        "name": "Paracetamol 650mg",
        "brand": "Cipa",
        "category_id": category.id,
        "description": "Pain relief",
        "price": 200.00,
        "mrp": 200.00,
        "stock_qty": 100,
        "unit": "strip of 15",
        "requires_rx": False,
        "image_url": "http://example.com/para.jpg",
        "is_active": True,
        "low_stock_alert": 10
    }
    response = client.post("/staff/products", json=product_data, headers=staff_headers)
    assert response.status_code == 201
    product_id = response.json()["id"]

    # Ensure customer has a default address
    response = client.get("/addresses", headers=cust_headers)
    assert response.status_code == 200
    addresses = response.json()
    if not addresses:
        addr = {
            "label": "Home",
            "full_address": "123 Main St, Apartment 4B",
            "landmark": "Near Central Park",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "is_default": True
        }
        addr_res = client.post("/addresses", json=addr, headers=cust_headers)
        address_id = addr_res.json()["id"]
    else:
        address_id = addresses[0]["id"]

    # 4. Create coupons (Staff)
    # Coupon 1: flat discount coupon
    flat_coupon = {
        "code": "FLAT50",
        "description": "Flat ₹50 off",
        "discount_type": "flat",
        "discount_value": 50.00,
        "min_order_amount": 150.00,
        "max_discount_amount": None,
        "usage_limit_total": 10,
        "usage_limit_per_user": 1,
        "valid_from": "2026-07-01T00:00:00",
        "valid_until": "2026-07-30T00:00:00",
        "is_active": True
    }
    response = client.post("/staff/coupons", json=flat_coupon, headers=staff_headers)
    assert response.status_code == 201

    # Coupon 2: percentage discount coupon
    pct_coupon = {
        "code": "WELCOME10",
        "description": "10% off up to ₹30",
        "discount_type": "percentage",
        "discount_value": 10.00,
        "min_order_amount": 100.00,
        "max_discount_amount": 30.00,
        "usage_limit_total": 100,
        "usage_limit_per_user": 2,
        "valid_from": "2026-07-01T00:00:00",
        "valid_until": "2026-07-30T00:00:00",
        "is_active": True
    }
    response = client.post("/staff/coupons", json=pct_coupon, headers=staff_headers)
    assert response.status_code == 201

    # 5. Validate coupons
    # Min order validation failure
    response = client.post("/coupons/validate", json={"code": "FLAT50", "cart_total": 100.00}, headers=cust_headers)
    assert response.status_code == 200
    assert response.json()["valid"] is False
    assert "Minimum order" in response.json()["message"]

    # Validation success (percentage cap test)
    response = client.post("/coupons/validate", json={"code": "WELCOME10", "cart_total": 400.00}, headers=cust_headers)
    assert response.status_code == 200
    assert response.json()["valid"] is True
    assert float(response.json()["discount_amount"]) == 30.00

    # 6. Admin loyalty adjust: Give user initial points
    response = client.get("/loyalty/balance", headers=cust_headers)
    assert response.status_code == 200
    initial_balance = response.json()["balance"]

    from app.models import Customer as DB_Customer
    customer = db_session.query(DB_Customer).filter(DB_Customer.phone == "9876543210").first()
    assert customer is not None
    customer_id = customer.id

    adjust_payload = {
        "customer_id": customer_id,
        "points_change": 500,
        "reason": "admin_adjustment"
    }
    response = client.post("/admin/loyalty/adjust", json=adjust_payload, headers=staff_headers)
    assert response.status_code == 200
    assert response.json()["loyalty_points"] == initial_balance + 500

    # Check balance endpoint
    response = client.get("/loyalty/balance", headers=cust_headers)
    assert response.status_code == 200
    assert response.json()["balance"] == initial_balance + 500

    # 7. Checkout applying both FLAT50 and loyalty points (stacking)
    # Cart total = 1 item of Paracetamol = ₹200
    # Apply FLAT50: cart drops to 150
    # Redeem 300 points (value = ₹30): cart drops to 120
    # Final payable = ₹120.00
    checkout_payload = {
        "delivery_type": "pickup",
        "address_id": None,
        "payment_method": "cod",
        "items": [{"product_id": product_id, "quantity": 1}],
        "coupon_code": "FLAT50",
        "points_to_redeem": 300
    }
    response = client.post("/orders", json=checkout_payload, headers=cust_headers)
    assert response.status_code == 201
    order = response.json()
    assert float(order["total_amount"]) == 120.00
    assert float(order["discount_amount"]) == 80.00
    assert order["points_redeemed"] == 300

    # Check points balance: decreased by 300 (redeemed), increased by 1 (earned)
    # because COD + no Rx check auto-confirms immediately on creation!
    response = client.get("/loyalty/balance", headers=cust_headers)
    assert response.json()["balance"] == initial_balance + 201

    # Check loyalty transaction history
    response = client.get("/loyalty/history", headers=cust_headers)
    assert response.status_code == 200
    history = response.json()
    assert len(history) >= 2 # admin adjust, redeemed, and earned (via trigger)
    
    # 8. Confirm the order (no-op since already confirmed, but should succeed)
    order_id = order["id"]
    response = client.put(f"/staff/orders/{order_id}/status", json={"status": "confirmed"}, headers=staff_headers)
    assert response.status_code == 200

    # Verify balance remains initial_balance + 201
    response = client.get("/loyalty/balance", headers=cust_headers)
    assert response.json()["balance"] == initial_balance + 201

    # 9. Cancel order and verify points refund (redeemed returned, earned reversed)
    # Cancelled: 201 points -> reverse earned (1 point) -> refund redeemed (300 points) -> Final: initial_balance + 500 points
    response = client.put(f"/staff/orders/{order_id}/status", json={"status": "cancelled"}, headers=staff_headers)
    assert response.status_code == 200

    response = client.get("/loyalty/balance", headers=cust_headers)
    assert response.json()["balance"] == initial_balance + 500


