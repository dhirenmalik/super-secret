from __future__ import annotations

import json
import os
from typing import List, Tuple

import pandas as pd

from app.services.exclude_flag.code01_3_exclude_flag_pivot_automation import (
    add_issue_reason_columns,
    apply_private_and_mapping_issue_flags,
    assign_combine_flags,
    build_final_flags_table,
    build_pivot_from_phase2_core,
    compute_update_exclude_flag,
    summarize_issue_counts,
)


def _safe_read_brands_from_file(path: str, preferred_columns: list[str]) -> list[str]:
    if not path or not os.path.exists(path):
        return []
    ext = os.path.splitext(path)[1].lower()
    if ext in {".xlsx", ".xls"}:
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path)
    if df.empty:
        return []

    cols_lower = {str(col).strip().lower(): col for col in df.columns}
    chosen_col = None
    for candidate in preferred_columns:
        if candidate in cols_lower:
            chosen_col = cols_lower[candidate]
            break
    if chosen_col is None:
        chosen_col = df.columns[0]

    return [
        str(value).strip().upper()
        for value in df[chosen_col].tolist()
        if str(value).strip() and str(value).strip().lower() != "nan"
    ]


def _safe_load_json(path: str) -> dict:
    if not path or not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def run_pivot_automation(
    phase2_core_df: pd.DataFrame,
    private_brand_path: str | None,
    mapping_issue_path: str | None,
    combined_output_json_path: str | None,
) -> Tuple[pd.DataFrame, dict, list[str]]:
    warnings: list[str] = []
    private_brands = _safe_read_brands_from_file(private_brand_path, ["brand", "unique_brand_name"])
    if not private_brands:
        warnings.append("Private brand reference is missing or empty; private brand flags may be incomplete.")

    mapping_issue_brands = _safe_read_brands_from_file(
        mapping_issue_path, ["mapping issues brand", "brand", "unique_brand_name"]
    )
    if not mapping_issue_brands:
        warnings.append("Mapping issue reference is missing or empty; mapping issue flags may be incomplete.")

    if not _safe_load_json(combined_output_json_path):
        warnings.append("Combine-group reference JSON is missing or empty; combine flags may be incomplete.")

    pivot_df = build_pivot_from_phase2_core(phase2_core_df)
    pivot_df = apply_private_and_mapping_issue_flags(
        pivot_df=pivot_df,
        private_brands=private_brands,
        mapping_issue_brands=mapping_issue_brands,
    )
    pivot_df = assign_combine_flags(pivot_df, combined_output_json_path=combined_output_json_path)
    pivot_df = compute_update_exclude_flag(pivot_df)
    pivot_df = add_issue_reason_columns(pivot_df)

    final_df = build_final_flags_table(pivot_df)
    combine_count, exclude_count, issues = summarize_issue_counts(final_df)
    summary = {
        "combine_flag_count": combine_count,
        "exclude_flag_count": exclude_count,
        "issues_detected": issues,
    }
    return final_df, summary, warnings

