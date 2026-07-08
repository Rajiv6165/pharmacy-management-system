import io
import os
os.environ["ADMIN_BOOTSTRAP_PASSWORD"] = "Admin@123"
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app.config import settings
from app.models import Category, Staff, Product, Order, InventoryLog, Address, Customer

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
        db.query(Order).delete()
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
