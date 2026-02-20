import sys
import os
from pathlib import Path

# Add backend to sys.path
sys.path.append(str(Path(__file__).resolve().parent))

from app.core.database import engine, Base
from app.modules.analytics import models as analytics_models
from app.modules.governance import models as governance_models

def recreate_table():
    print("Dropping subcategory_relevance_mappings...")
    with engine.connect() as conn:
        conn.execute("DROP TABLE IF EXISTS subcategory_relevance_mappings")
    
    print("Recreating all tables (including subcategory_relevance_mappings with NEW schema)...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    recreate_table()
