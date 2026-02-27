import asyncio
from app.core.database import SessionLocal
from app.modules.analytics.discovery import get_discovery_data

def main():
    db = SessionLocal()
    try:
        data = get_discovery_data(db, 1, force_refresh=True)
        print("Num Brands:", data.get("metadata", {}).get("num_brands"))
    except Exception as e:
        print("Error:", e)
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    main()
