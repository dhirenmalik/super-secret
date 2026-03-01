import os
import json
from datetime import datetime
from typing import Dict, Any, Tuple
import hashlib
from app.core.config import get_settings

settings = get_settings()

# Define local root where local files OR cached cloud files are sorted
UPLOAD_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
CACHE_DIR = os.path.join(UPLOAD_ROOT, ".cloud_cache")

def ensure_upload_root() -> None:
    os.makedirs(UPLOAD_ROOT, exist_ok=True)
    os.makedirs(CACHE_DIR, exist_ok=True)

def _get_azure_client():
    from azure.storage.blob import BlobServiceClient
    if not settings.azure_connection_string:
        raise ValueError("AZURE_STORAGE_CONNECTION_STRING is missing.")
    return BlobServiceClient.from_connection_string(settings.azure_connection_string)

def _get_s3_client():
    import boto3
    if not settings.aws_access_key_id or not settings.aws_secret_access_key:
        raise ValueError("AWS credentials are missing.")
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region_name
    )

def build_cloud_keys(subfolder: str, filename: str, data_type: str = "raw_data") -> Tuple[str, str]:
    """Generates the remote object key paths for Azure/S3"""
    file_key = f"{subfolder}/{data_type}/{filename}"
    manifest_key = f"{subfolder}/{data_type}/{filename}.manifest.json"
    return file_key, manifest_key

def build_file_paths(subfolder: str, filename: str, data_type: str = "raw_data") -> Tuple[str, str]:
    """Generates local paths"""
    folder_path = os.path.join(UPLOAD_ROOT, subfolder, data_type)
    os.makedirs(folder_path, exist_ok=True)
    file_path = os.path.join(folder_path, filename)
    manifest_path = os.path.join(folder_path, f"{filename}.manifest.json")
    return file_path, manifest_path

async def save_file(file, model_name: str, is_analysis: bool = False) -> Dict[str, Any]:
    """Saves file under model name/type folder utilizing the globally configured STORAGE_BACKEND."""
    ensure_upload_root()
    data_type = "analysis" if is_analysis else "raw_data"
    subfolder = "".join([c if c.isalnum() or c in ("-", "_") else "_" for c in model_name])
    
    file_content = await file.read()
    size = len(file_content)
    sha256_hash = hashlib.sha256(file_content).hexdigest()
    
    metadata = {
        "file_name": file.filename,
        "storage_type": settings.storage_backend,
        "bucket_name": None,
        "file_type": file.content_type or file.filename.split(".")[-1],
        "file_size": size,
        "checksum": sha256_hash,
        "status": "uploaded",
        "uploaded_at": datetime.utcnow()
    }

    if settings.storage_backend == "azure":
        client = _get_azure_client()
        file_key, manifest_key = build_cloud_keys(subfolder, file.filename, data_type)
        
        blob_client = client.get_blob_client(container=settings.azure_container_name, blob=file_key)
        blob_client.upload_blob(file_content, overwrite=True)
        
        metadata["file_path"] = f"az://{settings.azure_container_name}/{file_key}"
        metadata["bucket_name"] = settings.azure_container_name
        
        manifest_blob = client.get_blob_client(container=settings.azure_container_name, blob=manifest_key)
        manifest_blob.upload_blob(json.dumps(metadata, default=str), overwrite=True)

    elif settings.storage_backend == "s3":
        s3 = _get_s3_client()
        file_key, manifest_key = build_cloud_keys(subfolder, file.filename, data_type)
        
        s3.put_object(Bucket=settings.s3_bucket_name, Key=file_key, Body=file_content)
        
        metadata["file_path"] = f"s3://{settings.s3_bucket_name}/{file_key}"
        metadata["bucket_name"] = settings.s3_bucket_name
        
        s3.put_object(Bucket=settings.s3_bucket_name, Key=manifest_key, Body=json.dumps(metadata, default=str))

    else:
        # Default local OS storage
        file_path, manifest_path = build_file_paths(subfolder, file.filename, data_type)
        
        with open(file_path, "wb") as f:
            f.write(file_content)
            
        metadata["file_path"] = file_path
        write_manifest(manifest_path, metadata)

    return metadata

def ensure_local_file(file_path: str) -> str:
    """If the file is hosted on Azure or S3, download it to the local temporary cache and return the local path.
    Otherwise, if it's already a local path, verify it exists and return it."""
    
    ensure_upload_root()
    
    if file_path.startswith("az://"):
        parts = file_path.replace("az://", "").split("/")
        container = parts[0]
        blob_name = "/".join(parts[1:])
        
        local_cache_path = os.path.join(CACHE_DIR, os.path.basename(blob_name))
        if os.path.exists(local_cache_path):
            return local_cache_path
            
        # Download
        client = _get_azure_client()
        blob_client = client.get_blob_client(container=container, blob=blob_name)
        with open(local_cache_path, "wb") as f:
            download_stream = blob_client.download_blob()
            f.write(download_stream.readall())
        return local_cache_path

    elif file_path.startswith("s3://"):
        parts = file_path.replace("s3://", "").split("/")
        bucket = parts[0]
        s3_key = "/".join(parts[1:])
        
        local_cache_path = os.path.join(CACHE_DIR, os.path.basename(s3_key))
        if os.path.exists(local_cache_path):
            return local_cache_path
            
        # Download
        s3 = _get_s3_client()
        s3.download_file(bucket, s3_key, local_cache_path)
        return local_cache_path

    else:
        # It's a local file format
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Local file missing at {file_path}")
        return file_path

def file_exists(file_path: str) -> bool:
    """Safe verifier to see if a DB file_path natively exists across storage backends."""
    try:
        if file_path.startswith("az://"):
            parts = file_path.replace("az://", "").split("/")
            client = _get_azure_client()
            blob_client = client.get_blob_client(container=parts[0], blob="/".join(parts[1:]))
            return blob_client.exists()
            
        elif file_path.startswith("s3://"):
            parts = file_path.replace("s3://", "").split("/")
            s3 = _get_s3_client()
            try:
                s3.head_object(Bucket=parts[0], Key="/".join(parts[1:]))
                return True
            except Exception:
                return False
                
        else:
            return os.path.exists(file_path)
    except Exception:
        return False

def delete_file(file_path: str) -> None:
    """Safely deletes a file natively across storage backends."""
    try:
        if file_path.startswith("az://"):
            parts = file_path.replace("az://", "").split("/")
            client = _get_azure_client()
            blob_client = client.get_blob_client(container=parts[0], blob="/".join(parts[1:]))
            blob_client.delete_blob()
            
        elif file_path.startswith("s3://"):
            parts = file_path.replace("s3://", "").split("/")
            s3 = _get_s3_client()
            s3.delete_object(Bucket=parts[0], Key="/".join(parts[1:]))
            
        else:
            if os.path.exists(file_path):
                os.remove(file_path)
    except Exception as e:
        print(f"[WARNING] Storage delete failed for {file_path}: {e}")

def write_manifest(path: str, payload: Dict[str, Any]) -> None:
    def datetime_serializer(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, default=datetime_serializer)

def read_manifest(file_id: str) -> Dict[str, Any]:
    # Deprecated fallback logic, keeping for backward compatibility if ever called explicitly on legacy models
    path = os.path.join(UPLOAD_ROOT, file_id, "manifest.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as handle:
            return json.load(handle)
    raise FileNotFoundError(f"Manifest not found for ID: {file_id}")
