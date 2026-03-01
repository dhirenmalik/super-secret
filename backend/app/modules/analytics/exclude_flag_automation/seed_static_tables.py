import os
import sys
import pandas as pd
from pathlib import Path

# Add the backend root to the sys path
backend_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.append(str(backend_dir))

from app.core.database import SessionLocal
from app.modules.analytics.models import PrivateBrand, MappingIssue

def seed_database():
    print("Starting data seeding from static Excel files...")
    db = SessionLocal()
    
    current_dir = Path(__file__).resolve().parent
    pb_file = current_dir / "Private Brand.xlsx"
    mi_file = current_dir / "Mapping Issue Brand.xlsx"
    
    try:
        # Seed Private Brands
        if pb_file.exists():
            print(f"Reading {pb_file}")
            df_pb = pd.read_excel(pb_file)
            brand_col = next((c for c in df_pb.columns if 'BRAND' in c.upper()), df_pb.columns[0])
            
            # Use a set to track already processed or existing brands
            existing_pb = {pb.brand_name for pb in db.query(PrivateBrand).all()}
            added_pb = 0
            
            for brand in df_pb[brand_col].dropna().unique():
                brand_str = str(brand).strip()
                if brand_str and brand_str not in existing_pb:
                    db.add(PrivateBrand(brand_name=brand_str, is_active=True))
                    existing_pb.add(brand_str)
                    added_pb += 1
            
            db.commit()
            print(f"Successfully added {added_pb} brand(s) to Private Brands.")
        else:
            print("Private Brand.xlsx not found.")
            
        # Seed Mapping Issues
        if mi_file.exists():
            print(f"Reading {mi_file}")
            df_mi = pd.read_excel(mi_file)
            brand_col = next((c for c in df_mi.columns if 'BRAND' in c.upper() or 'ISSUE' in c.upper()), df_mi.columns[0])
            
            existing_mi = {mi.brand_name for mi in db.query(MappingIssue).all()}
            added_mi = 0
            
            for index, row in df_mi.iterrows():
                brand = row[brand_col]
                brand_str = str(brand).strip() if pd.notna(brand) else ""
                
                if brand_str and brand_str not in existing_mi:
                    # Get issue description if available
                    desc = ""
                    for col in df_mi.columns:
                        if 'DESC' in col.upper() or 'REASON' in col.upper():
                            val = row[col]
                            if pd.notna(val):
                                desc = str(val).strip()
                                break
                    
                    db.add(MappingIssue(brand_name=brand_str, issue_description=desc, is_active=True))
                    existing_mi.add(brand_str)
                    added_mi += 1
            
            db.commit()
            print(f"Successfully added {added_mi} brand(s) to Mapping Issues.")
        else:
            print("Mapping Issue Brand.xlsx not found.")
            
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()
        print("Database connection closed.")

if __name__ == "__main__":
    seed_database()
