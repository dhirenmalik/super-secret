from __future__ import annotations

from typing import Iterable

import pandas as pd

REQUIRED_COLUMNS = [
    "UNIQUE_BRAND_NAME",
    "UNIQUE_ADV_NAME",
    "L0",
    "L1",
    "L2",
    "L3",
    "M_ON_DIS_TOTAL_SUM_SPEND",
    "M_OFF_DIS_TOTAL_SUM_SPEND",
    "M_SEARCH_SPEND",
    "M_TOTAL_DISPLAY_SUM_SPEND",
    "O_SALE",
    "O_UNIT",
]


def validate_required_columns(raw_df: pd.DataFrame) -> None:
    raw_cols = {str(col).upper() for col in raw_df.columns}
    missing = [col for col in REQUIRED_COLUMNS if col not in raw_cols]
    if missing:
        raise ValueError(f"Missing required column(s): {', '.join(missing)}")


def validate_relevant_l2_subset(relevant_l2: list[str], candidate_rows: Iterable[dict]) -> list[str]:
    normalized_candidates = {
        str(row.get("L2", "")).strip().upper()
        for row in candidate_rows
        if str(row.get("L2", "")).strip()
    }
    normalized_requested = sorted(
        {
            str(item).strip().upper()
            for item in relevant_l2
            if str(item).strip()
        }
    )
    if not normalized_requested:
        raise ValueError("relevant_l2 must include at least one L2 value")

    invalid = [l2 for l2 in normalized_requested if l2 not in normalized_candidates]
    if invalid:
        raise ValueError(f"relevant_l2 contains values not present in phase1 candidates: {invalid}")
    return normalized_requested

