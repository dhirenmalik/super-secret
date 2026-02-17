import requests
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

BASE_URL = "http://localhost:8003/api/v1"

def verify_step4():
    # 1. Upload File
    files = {'file': ('test_step4.csv', 'col1,col2\nval1,val2', 'text/csv')}
    print("Uploading file...")
    response = requests.post(f"{BASE_URL}/files/upload", files=files)
    if response.status_code != 200:
        print(f"Upload failed: {response.text}")
        return
    
    file_id = response.json()['file_id']
    print(f"File uploaded. ID: {file_id}")
    
    # 2. Verify DB Records (Model & File)
    db = SessionLocal()
    try:
        db_file = db.query(models.ModelFile).filter(models.ModelFile.file_guid == file_id).first()
        if not db_file:
            print("FAILED: ModelFile not found in DB")
            return
        
        db_model = db.query(models.Model).filter(models.Model.model_id == db_file.model_id).first()
        if not db_model:
            print("FAILED: Model not found in DB")
            return
            
        print(f"VERIFIED: ModelFile (ID: {db_file.file_id}) linked to Model (ID: {db_model.model_id})")
        
        # 3. Save Model Groups
        payload = {
            "file_id": file_id,
            "groups": [
                {
                    "group_name": "Test Group 1",
                    "l2_values": ["val1", "val2"]
                }
            ]
        }
        # Mocking L2 values for the controller check (controller calls get_l2_values which reads CSV)
        # Since our dummy CSV has "val1", "val2" in data, but get_l2_values might expect specific structure.
        # Actually, get_l2_values reads the file. Our CSV is simple.
        # Let's hope the controller logic works with this simple CSV.
        
        print("Saving model groups...")
        # Note: We need to make sure the CSV structure satisfies get_l2_values requirements.
        # If get_l2_values fails, this step will fail.
        # Let's assume for now valid L2 values.
        
        # We might need to mock get_l2_values or ensure csv content allows it.
        # Using a safer approach: Just try saving.
        
        # To bypass L2 validation if needed, we might need a better CSV.
        # But let's try.
        
        res = requests.post(f"{BASE_URL}/files/{file_id}/model-groups", json=payload)
        if res.status_code != 200:
            print(f"Save groups failed: {res.text}")
            # It might fail due to L2 validation if CSV parsing doesn't yield "val1", "val2" as L2s.
        else:
            print("Groups saved.")
            
            # 4. Verify DB Records (ModelGroup)
            db_groups = db.query(models.ModelGroup).filter(models.ModelGroup.model_id == db_model.model_id).all()
            if not db_groups:
                print("FAILED: No ModelGroups found in DB")
            else:
                print(f"VERIFIED: Found {len(db_groups)} ModelGroup(s) in DB.")
                print(f"Group Name: {db_groups[0].group_name}, L2: {db_groups[0].l2_values}")
                
    finally:
        db.close()

if __name__ == "__main__":
    verify_step4()
