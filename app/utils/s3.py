import logging
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from app.config import settings
from typing import Optional

logger = logging.getLogger(__name__)

def upload_file_to_s3(file_data: bytes, filename: str, content_type: str) -> Optional[str]:
    """
    Uploads a file's bytes to an AWS S3 bucket and returns its public URL.
    In local or testing environment, returns None if AWS credentials/bucket name are not configured,
    or if the upload fails. In staging or production, fails loudly by raising errors.
    """
    if not settings.AWS_S3_BUCKET_NAME:
        if settings.ENV not in ("local", "testing"):
            raise ValueError("AWS_S3_BUCKET_NAME is not configured in environment: " + settings.ENV)
        logger.warning("AWS_S3_BUCKET_NAME is not configured. Skipping S3 upload.")
        return None

    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        if settings.ENV not in ("local", "testing"):
            raise ValueError("AWS credentials are not configured in environment: " + settings.ENV)
        logger.warning("AWS credentials not configured. Skipping S3 upload.")
        return None

    logger.info(f"Attempting to upload file {filename} to S3 bucket {settings.AWS_S3_BUCKET_NAME}...")

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )

    try:
        # Upload object to S3
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=filename,
            Body=file_data,
            ContentType=content_type
        )
        
        # Construct public URL
        # Assumes the bucket policy permits public read access to prescriptions/*
        url = f"https://{settings.AWS_S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{filename}"
        logger.info(f"Successfully uploaded {filename} to S3. URL: {url}")
        return url

    except NoCredentialsError as e:
        logger.error("AWS credentials not found or invalid.")
        if settings.ENV not in ("local", "testing"):
            raise e
        return None
    except ClientError as e:
        logger.error(f"AWS ClientError during upload: {e}")
        if settings.ENV not in ("local", "testing"):
            raise e
        return None
    except Exception as e:
        logger.error(f"Unexpected error during S3 upload: {e}")
        if settings.ENV not in ("local", "testing"):
            raise e
        return None
