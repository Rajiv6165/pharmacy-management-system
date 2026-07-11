from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    BRAND_NAME: str = "Pharmacy"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    UPLOAD_DIR: str = "uploads"
    RAZORPAY_SECRET: str
    ADMIN_BOOTSTRAP_PASSWORD: Optional[str] = None

    # Phase 3: Deployment & Production Readiness settings
    ENV: str = "production"  # local | staging | production
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    AWS_S3_BUCKET_NAME: Optional[str] = None

    # Razorpay Webhook Settings
    RAZORPAY_KEY_ID: Optional[str] = None
    RAZORPAY_WEBHOOK_SECRET: Optional[str] = None

    # Error tracking Settings
    SENTRY_DSN: Optional[str] = None

    # Notification Settings (Email/SMTP)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    ADMIN_EMAIL: Optional[str] = None

    # Notification Settings (Twilio SMS)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_FROM_NUMBER: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
