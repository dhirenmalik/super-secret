import os
import json
from datetime import datetime
from typing import Dict, Any, Tuple
import hashlib
from app.core.config import get_settings

settings = get_settings()
UPLOAD_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

def ensure_upload_root() -> None:
    os.makedirs(UPLOAD_ROOT, exist_ok=True)

def build_file_paths(subfolder: str, filename: str, data_type: str = "raw_data") -> Tuple[str, str]:
    # subfolder will be the sanitized model name
    folder_path = os.path.join(UPLOAD_ROOT, subfolder, data_type)
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, filename)
    manifest_path = os.path.join(folder_path, f"{filename}.manifest.json")
    return file_path, manifest_path

async def save_file(file, model_name: str, is_analysis: bool = False) -> Dict[str, Any]:
    """Saves file under model name/type folder."""
    data_type = "analysis" if is_analysis else "raw_data"
    subfolder = "".join([c if c.isalnum() or c in ("-", "_") else "_" for c in model_name])
    
    file_path, manifest_path = build_file_paths(subfolder, file.filename, data_type)
    
    sha256_hash = hashlib.sha256()
    size = 0
    
    with open(file_path, "wb") as target:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            sha256_hash.update(chunk)
            target.write(chunk)
            
    # Reset file pointer if needed elsewhere
    await file.seek(0)
    
    metadata = {
        "file_name": file.filename,
        "storage_type": "local",
        "file_path": file_path,
        "bucket_name": None,
        "file_type": file.content_type or file.filename.split(".")[-1],
        "file_size": size,
        "checksum": sha256_hash.hexdigest(),
        "status": "uploaded",
        "uploaded_at": datetime.utcnow()
    }
    
    write_manifest(manifest_path, metadata)
    return metadata

def write_manifest(path: str, payload: Dict[str, Any]) -> None:
    def datetime_serializer(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, default=datetime_serializer)

def read_manifest(file_id: str) -> Dict[str, Any]:
    # Try the old UUID path first
    path = os.path.join(UPLOAD_ROOT, file_id, "manifest.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
            
    # If not found, it might be in the new hierarchical structure
    # Search for any file in UPLOAD_ROOT that matches the filename.manifest.json pattern
    # Since we store the full path in DB, we could also pass that, but let's stick to UUID for now if possible
    # Actually, the file_id in ModelFile is now the DB ID. 
    # For now, let's just raise FileNotFoundError if not in old structure
    # as we expect new uploads to use the new structure and we have their full paths in the DB anyway.
    raise FileNotFoundError(f"Manifest not found for ID: {file_id}")
