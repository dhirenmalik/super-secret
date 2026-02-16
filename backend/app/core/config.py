import os
from typing import List

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()


class Settings(BaseModel):
    cors_origins: List[str] = Field(default_factory=list)


def get_settings() -> Settings:
    origins = os.getenv("BACKEND_CORS_ORIGINS", "")
    parsed = [origin.strip() for origin in origins.split(",") if origin.strip()]
    return Settings(cors_origins=parsed)
