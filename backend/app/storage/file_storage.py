import json
import os
from typing import Tuple

UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
UPLOAD_ROOT = os.path.abspath(UPLOAD_ROOT)


def ensure_upload_root() -> None:
    os.makedirs(UPLOAD_ROOT, exist_ok=True)


def build_file_paths(file_id: str, filename: str) -> Tuple[str, str]:
    folder = os.path.join(UPLOAD_ROOT, file_id)
    os.makedirs(folder, exist_ok=True)
    file_path = os.path.join(folder, filename)
    manifest_path = os.path.join(folder, "manifest.json")
    return file_path, manifest_path


def write_manifest(manifest_path: str, payload: dict) -> None:
    with open(manifest_path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def read_manifest(file_id: str) -> dict:
    folder = os.path.join(UPLOAD_ROOT, file_id)
    manifest_path = os.path.join(folder, "manifest.json")
    if not os.path.exists(manifest_path):
        raise FileNotFoundError("Manifest not found")
    with open(manifest_path, "r", encoding="utf-8") as handle:
        return json.load(handle)
