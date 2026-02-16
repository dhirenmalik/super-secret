from typing import Dict, Any, List

from app.services.csv_service import get_l2_values
from app.services.mapping_service import save_mapping
from app.services.reference_mapping_service import load_reference_mapping


def generate_auto_grouping(
    file_id: str,
    reference_path: str,
    persist: bool = False,
) -> Dict[str, Any]:
    reference = load_reference_mapping(reference_path)
    allowed_l2 = set(get_l2_values(file_id))

    filtered_groups: List[Dict[str, Any]] = []
    assigned_l2 = set()
    l2_to_group: Dict[str, str] = {}
    warnings: List[str] = []

    historical_groups = reference.get("historical_groups", [])

    for group in reference["groups"]:
        group_name = group["group_name"]
        historical_model_group = group.get("historical_model_group", "")
        l2_values = [value for value in group["l2_values"] if value in allowed_l2]
        if not l2_values:
            continue

        cleaned_l2 = []
        for value in l2_values:
            existing_group = l2_to_group.get(value)
            if existing_group and existing_group != group_name:
                warnings.append(
                    f"Duplicate L2 assignment across groups skipped: {value}"
                )
                continue
            l2_to_group[value] = group_name
            if value not in cleaned_l2:
                cleaned_l2.append(value)

        if not cleaned_l2:
            continue

        assigned_l2.update(cleaned_l2)
        payload_group = {
            "group_id": len(filtered_groups) + 1,
            "group_name": group_name,
            "l2_values": cleaned_l2,
        }
        if historical_model_group:
            payload_group["historical_model_group"] = historical_model_group
        filtered_groups.append(payload_group)

    unassigned = sorted(list(allowed_l2 - assigned_l2))

    payload = {
        "file_id": file_id,
        "reference_path": reference_path,
        "groups": filtered_groups,
        "historical_groups": historical_groups,
        "unassigned_l2": unassigned,
        "warnings": warnings,
    }

    if persist:
        save_mapping(file_id, filtered_groups, list(allowed_l2))

    return payload
