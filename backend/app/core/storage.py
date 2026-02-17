import os
import json
from typing import Dict, Any, Tuple

UPLOAD_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))

def ensure_upload_root() -> None:
    os.makedirs(UPLOAD_ROOT, exist_ok=True)

def build_file_paths(file_id: str, filename: str) -> Tuple[str, str]:
    subfolder = os.path.join(UPLOAD_ROOT, file_id)
    os.makedirs(subfolder, exist_ok=True)
    file_path = os.path.join(subfolder, filename)
    manifest_path = os.path.join(subfolder, "manifest.json")
    return file_path, manifest_path

def write_manifest(path: str, payload: Dict[str, Any]) -> None:
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)

def read_manifest(file_id: str) -> Dict[str, Any]:
    path = os.path.join(UPLOAD_ROOT, file_id, "manifest.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Manifest not found: {path}")
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)
