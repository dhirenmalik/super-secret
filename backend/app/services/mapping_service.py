import json
import os
from datetime import datetime
from typing import List, Dict, Any

MAPPING_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "mappings"))


def _ensure_mapping_root() -> None:
    os.makedirs(MAPPING_ROOT, exist_ok=True)


def _mapping_path(file_id: str) -> str:
    return os.path.join(MAPPING_ROOT, f"{file_id}.json")


def load_mapping(file_id: str) -> Dict[str, Any]:
    _ensure_mapping_root()
    path = _mapping_path(file_id)
    if not os.path.exists(path):
        return {"file_id": file_id, "groups": [], "updated_at": None}
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def save_mapping(
    file_id: str,
    groups: List[Dict[str, Any]],
    allowed_l2: List[str],
) -> Dict[str, Any]:
    _ensure_mapping_root()

    allowed_set = set(allowed_l2)
    seen_l2 = set()
    cleaned_groups: List[Dict[str, Any]] = []

    for group in groups:
        group_id = group.get("group_id")
        group_name = (group.get("group_name") or "").strip()
        l2_values = group.get("l2_values") or []

        if not group_name:
            raise ValueError("Group name is required")
        if not isinstance(l2_values, list):
            raise ValueError("l2_values must be a list")

        normalized_l2 = []
        for value in l2_values:
            if value not in allowed_set:
                raise ValueError(f"Invalid L2 value: {value}")
            if value in seen_l2:
                raise ValueError(f"Duplicate L2 assignment: {value}")
            seen_l2.add(value)
            normalized_l2.append(value)

        if group_id is None:
            group_id = len(cleaned_groups) + 1

        cleaned_groups.append(
            {
                "group_id": int(group_id),
                "group_name": group_name,
                "l2_values": normalized_l2,
            }
        )

    payload = {
        "file_id": file_id,
        "groups": cleaned_groups,
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }

    path = _mapping_path(file_id)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)

    return payload
