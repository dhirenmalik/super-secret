import os
from typing import Tuple, List, Dict, Any
from uuid import uuid4

import pandas as pd
from fastapi import UploadFile

from app.storage.file_storage import (
    ensure_upload_root,
    build_file_paths,
    write_manifest,
    read_manifest,
)

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


def save_upload(file: UploadFile) -> Tuple[str, str, str]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise ValueError("Only .csv files are supported.")

    ensure_upload_root()
    file_id = str(uuid4())
    file_path, manifest_path = build_file_paths(file_id, file.filename)

    size = 0
    try:
        with open(file_path, "wb") as target:
            while True:
                chunk = file.file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > MAX_FILE_SIZE_BYTES:
                    raise ValueError("File exceeds 10MB limit.")
                target.write(chunk)
    except Exception:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

    manifest_payload = {
        "file_id": file_id,
        "filename": file.filename,
        "saved_path": file_path,
        "size_bytes": size,
    }
    write_manifest(manifest_path, manifest_payload)

    return file_id, file.filename, file_path


def get_preview(file_id: str, rows: int = 5) -> Dict[str, Any]:
    manifest = read_manifest(file_id)
    saved_path = manifest.get("saved_path")

    if not saved_path or not os.path.exists(saved_path):
        raise FileNotFoundError("Saved file not found")

    df = pd.read_csv(saved_path, nrows=rows)
    df = df.fillna("")
    columns: List[str] = list(df.columns)
    row_dicts: List[Dict[str, Any]] = df.to_dict(orient="records")
    return {
        "columns": columns,
        "rows": row_dicts,
        "row_count_returned": len(row_dicts),
    }
