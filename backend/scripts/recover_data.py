import os
import json
import sqlite3
from datetime import datetime
from uuid import uuid4

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
DB_PATH = os.path.join(BASE_DIR, "sql_app.db")

def recover():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Scanning {UPLOADS_DIR}...")
    
    # Get user 2 (Abhishek) as the target for recovery if possible, else 1
    cursor.execute("SELECT user_id FROM users WHERE email = 'abhishek@walmart.com'")
    abhishek_row = cursor.fetchone()
    abhishek_id = abhishek_row[0] if abhishek_row else 1
    
    recovered_count = 0
    
    for folder_name in os.listdir(UPLOADS_DIR):
        folder_path = os.path.join(UPLOADS_DIR, folder_name)
        if not os.path.isdir(folder_path):
            continue
            
        manifest_path = os.path.join(folder_path, "manifest.json")
        if not os.path.exists(manifest_path):
            continue
            
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
                
            file_id_str = manifest.get("file_id")
            filename = manifest.get("filename")
            saved_path = manifest.get("saved_path")
            
            # Check if already exists
            cursor.execute("SELECT file_id FROM model_files WHERE file_path = ?", (saved_path,))
            if cursor.fetchone():
                print(f"Skipping {filename} (already in DB)")
                continue
                
            # Create a model record
            model_name = f"Recovered_{filename}"
            now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
            
            cursor.execute(
                "INSERT INTO models (model_name, model_type, status, created_by, created_at) VALUES (?, ?, ?, ?, ?)",
                (model_name, "analytics", "draft", abhishek_id, now)
            )
            model_id = cursor.lastrowid
            
            # Create the model_file record
            cursor.execute(
                """INSERT INTO model_files (model_id, file_name, file_path, file_type, uploaded_by, uploaded_at, status, version, is_active) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (model_id, filename, saved_path, "csv", abhishek_id, now, "uploaded", 1, 1)
            )
            
            print(f"Recovered {filename} (ID: {file_id_str}) -> Assigned to Modeler (ID: {abhishek_id})")
            recovered_count += 1
            
        except Exception as e:
            print(f"Error recovering {folder_name}: {e}")

    conn.commit()
    conn.close()
    print(f"Recovery complete. Total recovered: {recovered_count}")

if __name__ == "__main__":
    recover()
