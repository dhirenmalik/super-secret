
import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath("backend"))

os.environ["DATABASE_URL"] = "sqlite:///backend/sql_app.db"

from app.modules.analytics import service
from sqlalchemy.orm import Session
from app.core.database import SessionLocal

async def test_brand_exclusion():
    try:
        # Assuming file_id 18 exists as seen in sqlite
        result = await service.get_brand_exclusion_data("18")
        print("BRAND EXCLUSION TEST SUCCESS")
        print(f"Row count: {len(result['rows'])}")
        print(f"Summary: {result['summary']}")
        if len(result['rows']) > 0:
            print(f"First row: {result['rows'][0]}")
    except Exception as e:
        print(f"BRAND EXCLUSION TEST FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_brand_exclusion())
