import os
from typing import List

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()


class Settings(BaseModel):
    cors_origins: List[str] = Field(default_factory=list)
    # Storage settings
    storage_backend: str = os.getenv("STORAGE_BACKEND", "local").lower()
    
    # Azure Settings
    azure_connection_string: str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
    azure_container_name: str = os.getenv("AZURE_CONTAINER_NAME", "uploads")
    
    # AWS S3 Settings
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region_name: str = os.getenv("AWS_REGION", "us-east-1")
    s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "uploads-bucket")

def get_settings() -> Settings:
    origins = os.getenv("BACKEND_CORS_ORIGINS", "")
    parsed = [origin.strip() for origin in origins.split(",") if origin.strip()]
    return Settings(cors_origins=parsed)
