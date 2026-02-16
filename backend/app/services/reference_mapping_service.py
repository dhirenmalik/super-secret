import ast
import os
import re
from typing import Dict, Any, List

import pandas as pd

GROUP_NAME_COLUMN = "group name"
L2_LIST_COLUMN = "all subcategories in each group"
HISTORICAL_GROUP_COLUMN = "historical model group"


def _normalize_column(name: str) -> str:
    return re.sub(r"\s+", " ", str(name).strip().lower())


def _normalize_path(reference_path: str) -> str:
    if re.match(r"^[A-Za-z]:\\\\", reference_path):
        drive = reference_path[0].lower()
        rest = reference_path[2:].replace("\\", "/")
        return f"/mnt/{drive}{rest}"
    if not os.path.isabs(reference_path):
        repo_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..")
        )
        return os.path.abspath(os.path.join(repo_root, reference_path))
    return reference_path


def _parse_l2_list(raw_value: str) -> List[str]:
    if raw_value is None:
        return []
    value = str(raw_value).strip()
    if value.startswith("[") and value.endswith("]"):
        try:
            parsed = ast.literal_eval(value)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except Exception:
            return []
    return [item.strip() for item in value.split(",") if item.strip()]


def load_reference_mapping(reference_path: str) -> Dict[str, Any]:
    if not reference_path:
        raise ValueError("reference_path is required")

    normalized_path = _normalize_path(reference_path)

    if not os.path.exists(normalized_path):
        raise FileNotFoundError("Reference file not found")

    if not normalized_path.lower().endswith(".csv"):
        raise ValueError("Reference file must be a .csv")

    df = pd.read_csv(normalized_path)
    if df.empty:
        raise ValueError("Reference file is empty")

    normalized = {_normalize_column(col): col for col in df.columns}
    if GROUP_NAME_COLUMN not in normalized or L2_LIST_COLUMN not in normalized:
        raise ValueError(
            "Reference file must include 'Group Name' and "
            "'All Subcategories in Each Group' columns."
        )

    group_col = normalized[GROUP_NAME_COLUMN]
    l2_col = normalized[L2_LIST_COLUMN]
    historical_col = normalized.get(HISTORICAL_GROUP_COLUMN)

    groups: Dict[str, Dict[str, Any]] = {}
    historical_groups: Dict[str, Dict[str, Any]] = {}
    for _, row in df.iterrows():
        group_name = str(row.get(group_col, "")).strip()
        if not group_name:
            continue
        l2_values = _parse_l2_list(row.get(l2_col))
        if not l2_values:
            continue

        if group_name not in groups:
            groups[group_name] = {
                "group_name": group_name,
                "l2_values": [],
                "historical_model_group": "",
            }
        if historical_col:
            historical_value = str(row.get(historical_col, "")).strip()
            if historical_value and not groups[group_name]["historical_model_group"]:
                groups[group_name]["historical_model_group"] = historical_value
            if historical_value:
                if historical_value not in historical_groups:
                    historical_groups[historical_value] = {
                        "group_name": historical_value,
                        "l2_values": [],
                    }
                for value in l2_values:
                    if value not in historical_groups[historical_value]["l2_values"]:
                        historical_groups[historical_value]["l2_values"].append(value)

        for value in l2_values:
            if value not in groups[group_name]["l2_values"]:
                groups[group_name]["l2_values"].append(value)

    ordered_groups: List[Dict[str, Any]] = list(groups.values())
    ordered_historical: List[Dict[str, Any]] = list(historical_groups.values())

    return {
        "source_name": os.path.basename(normalized_path),
        "groups": ordered_groups,
        "historical_groups": ordered_historical,
    }
