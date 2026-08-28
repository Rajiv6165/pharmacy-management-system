import os
import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings

# Initialize Sentry if DSN is configured
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
        environment=settings.ENV
    )
    print(f"Sentry SDK initialized for environment: {settings.ENV}")


# Import routers
from app.routers.auth import router as auth_router
from app.routers.catalog import router as catalog_router
from app.routers.addresses import router as addresses_router
from app.routers.orders import router as orders_router
from app.routers.payments import router as payments_router
from app.routers.staff import router as staff_router
from app.routers.admin import router as admin_router
from app.routers.support import router as support_router
from app.routers.loyalty import router as loyalty_router

from contextlib import asynccontextmanager
from app.database import SessionLocal
from app.models import Staff
from app.auth.security import hash_password

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bootstrap default administrator account if none exists
    db = SessionLocal()
    try:
        admin_exists = db.query(Staff).filter(Staff.role == "admin").first()
        if not admin_exists:
            bootstrap_password = settings.ADMIN_BOOTSTRAP_PASSWORD
            if not bootstrap_password:
                raise ValueError(
                    "ADMIN_BOOTSTRAP_PASSWORD environment variable is not set! "
                    "Cannot bootstrap default administrator account."
                )
            default_admin = Staff(
                name="System Administrator",
                phone="9999999999",
                password_hash=hash_password(bootstrap_password),
                role="admin",
                is_active=True
            )
            db.add(default_admin)
            db.commit()
            print("Bootstrapped default administrator account: phone=9999999999")
    finally:
        db.close()
    yield

# Ensure uploads directory exists
os.makedirs(os.path.join(settings.UPLOAD_DIR, "prescriptions"), exist_ok=True)

app = FastAPI(
    title="Pharmacy Management System API",
    description="Backend API for managing pharmacy operations (Phase 1)",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend integration
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for hosting static files (e.g. uploaded prescriptions)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth_router)
app.include_router(catalog_router)
app.include_router(addresses_router)
app.include_router(orders_router)
app.include_router(payments_router)
app.include_router(staff_router)
app.include_router(admin_router)
app.include_router(support_router)
app.include_router(loyalty_router)

from app.routers.notifications import router as notifications_router
app.include_router(notifications_router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Pharmacy Management System API is running smoothly."
    }
