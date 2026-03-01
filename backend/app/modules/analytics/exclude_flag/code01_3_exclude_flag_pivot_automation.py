"""Converted logic from code01_3_Exclude Flag Analysis Pivot Automation.ipynb."""

from __future__ import annotations

import json
import os
import re
from difflib import SequenceMatcher
from typing import Dict, Iterable, List, Tuple

import pandas as pd

STOP_WORDS = {
    "a",
    "an",
    "and",
    "the",
    "of",
    "for",
    "to",
    "in",
    "on",
    "at",
    "by",
    "with",
}


def clean_text(text: object) -> str:
    if not isinstance(text, str):
        return ""
    lowered = text.lower()
    letters_only = re.sub(r"[^a-z\\s]", "", lowered)
    words = [word for word in letters_only.split() if word and word not in STOP_WORDS]
    return "".join(words)


def _best_fuzzy_score(value: str, candidates: Iterable[str]) -> float:
    best = 0.0
    for candidate in candidates:
        if not candidate:
            continue
        score = SequenceMatcher(None, value, candidate).ratio() * 100
        if score > best:
            best = score
    return best


def build_pivot_from_phase2_core(phase2_core_df: pd.DataFrame) -> pd.DataFrame:
    pivot = (
        phase2_core_df.pivot_table(
            index="UNIQUE_BRAND_NAME",
            values=["O_SALE", "TOTAL_SPEND", "O_UNIT", "Exclude_Flag", "Combine_Flag"],
            aggfunc={
                "O_SALE": "sum",
                "TOTAL_SPEND": "sum",
                "O_UNIT": "sum",
                "Exclude_Flag": "max",
                "Combine_Flag": "max",
            },
            fill_value=0,
        )
        .reset_index()
        .rename(
            columns={
                "O_SALE": "Sum of O_SALE",
                "TOTAL_SPEND": "Sum of TOTAL_SPEND",
                "O_UNIT": "Sum of O_UNIT",
                "Exclude_Flag": "Max of Exclude_Flag",
                "Combine_Flag": "Max of Combine_Flag",
            }
        )
    )

    total_sale = float(pivot["Sum of O_SALE"].sum())
    total_spend = float(pivot["Sum of TOTAL_SPEND"].sum())
    total_unit = float(pivot["Sum of O_UNIT"].sum())
    pivot["Sales Share"] = (pivot["Sum of O_SALE"] / total_sale * 100).round(1) if total_sale else 0
    pivot["Spend Share"] = (pivot["Sum of TOTAL_SPEND"] / total_spend * 100).round(1) if total_spend else 0
    pivot["Unit Share"] = (pivot["Sum of O_UNIT"] / total_unit * 100).round(1) if total_unit else 0
    return pivot


def apply_private_and_mapping_issue_flags(
    pivot_df: pd.DataFrame,
    private_brands: List[str],
    mapping_issue_brands: List[str],
    private_threshold: float = 90.0,
) -> pd.DataFrame:
    out = pivot_df.copy()
    private_cleaned = [clean_text(x) for x in private_brands if clean_text(x)]
    mapping_set = {clean_text(x) for x in mapping_issue_brands if clean_text(x)}

    brand_cleaned = out["UNIQUE_BRAND_NAME"].map(clean_text)
    out["Private Brand"] = brand_cleaned.map(
        lambda value: 1 if value and _best_fuzzy_score(value, private_cleaned) >= private_threshold else 0
    )
    out["Mapping Issue"] = brand_cleaned.map(lambda value: 1 if value in mapping_set else 0)
    return out


def assign_combine_flags(
    pivot_df: pd.DataFrame,
    combined_output_json_path: str | None = None,
) -> pd.DataFrame:
    out = pivot_df.copy()
    out["Combine Flag"] = pd.Series([pd.NA] * len(out), dtype="Int64")

    if not combined_output_json_path or not os.path.exists(combined_output_json_path):
        return out

    with open(combined_output_json_path, "r", encoding="utf-8") as handle:
        groups = json.load(handle)

    normalized_to_group: Dict[str, int] = {}
    for group_id_raw, names in groups.items():
        try:
            group_id = int(group_id_raw)
        except Exception:
            continue
        for name in names:
            cleaned = clean_text(name)
            if cleaned:
                normalized_to_group[cleaned] = group_id

    out["_brand_cleaned"] = out["UNIQUE_BRAND_NAME"].map(clean_text)
    out["Combine Flag"] = out["_brand_cleaned"].map(normalized_to_group).astype("Int64")

    # Keep only groups with 2+ members then normalize to 1..N.
    counts = out["Combine Flag"].value_counts(dropna=True)
    keep = set(counts[counts > 1].index.astype("Int64").tolist())
    out.loc[~out["Combine Flag"].isin(keep), "Combine Flag"] = pd.NA
    sorted_flags = sorted([int(flag) for flag in out["Combine Flag"].dropna().unique().tolist()])
    remap = {old: idx + 1 for idx, old in enumerate(sorted_flags)}
    out["Combine Flag"] = out["Combine Flag"].map(remap).astype("Int64")
    out = out.drop(columns=["_brand_cleaned"])
    return out


def compute_update_exclude_flag(pivot_df: pd.DataFrame) -> pd.DataFrame:
    out = pivot_df.copy()
    out["Exclude Flag"] = pd.Series([pd.NA] * len(out), dtype="Int64")
    out.loc[out["Mapping Issue"] == 1, "Exclude Flag"] = 1
    out.loc[out["Private Brand"] == 1, "Exclude Flag"] = 1
    out.loc[(out["Combine Flag"].notna()) & (out["Exclude Flag"].isna()), "Exclude Flag"] = 0
    out.loc[
        (out["Combine Flag"].isna())
        & (
            (out["Sum of TOTAL_SPEND"] == 0)
            | (out["Sum of O_SALE"] == 0)
            | (out["Sum of O_UNIT"] == 0)
        )
        & (out["Exclude Flag"].isna()),
        "Exclude Flag",
    ] = 1
    out.loc[out["Exclude Flag"].isna(), "Exclude Flag"] = 0
    out["Exclude Flag"] = out["Exclude Flag"].astype("Int64")
    return out


def add_issue_reason_columns(pivot_df: pd.DataFrame) -> pd.DataFrame:
    out = pivot_df.copy()
    out["Reason / Issue Type"] = "none"
    out.loc[out["Mapping Issue"] == 1, "Reason / Issue Type"] = "mapping_issue"
    out.loc[(out["Reason / Issue Type"] == "none") & (out["Private Brand"] == 1), "Reason / Issue Type"] = "private_brand"
    out.loc[(out["Reason / Issue Type"] == "none") & (out["Combine Flag"].notna()), "Reason / Issue Type"] = "combine_candidate"
    out.loc[
        (out["Reason / Issue Type"] == "none") & (out["Exclude Flag"] == 1),
        "Reason / Issue Type",
    ] = "other_issue"

    out["brand"] = out["UNIQUE_BRAND_NAME"]
    out["current_mapping"] = pd.NA
    out["proposed_mapping"] = pd.NA
    out["combine_flag"] = out["Combine Flag"].notna()
    out["exclude_flag"] = out["Exclude Flag"].astype(int) == 1
    out["combine_into"] = out["Combine Flag"].map(lambda value: f"group_{int(value)}" if pd.notna(value) else pd.NA)
    return out


def build_final_flags_table(pivot_df: pd.DataFrame) -> pd.DataFrame:
    ordered_columns = [
        "brand",
        "current_mapping",
        "proposed_mapping",
        "combine_flag",
        "exclude_flag",
        "combine_into",
        "Reason / Issue Type",
        "UNIQUE_BRAND_NAME",
        "Sum of O_SALE",
        "Sum of TOTAL_SPEND",
        "Sum of O_UNIT",
        "Max of Exclude_Flag",
        "Max of Combine_Flag",
        "Sales Share",
        "Unit Share",
        "Spend Share",
        "Private Brand",
        "Mapping Issue",
        "Combine Flag",
        "Exclude Flag",
    ]
    present = [col for col in ordered_columns if col in pivot_df.columns]
    final_df = pivot_df[present].copy()
    return final_df.sort_values(
        ["exclude_flag", "Sum of O_SALE", "brand"], ascending=[False, False, True]
    ).reset_index(drop=True)


def summarize_issue_counts(final_df: pd.DataFrame) -> Tuple[int, int, Dict[str, int]]:
    combine_flag_count = int(final_df["combine_flag"].sum()) if "combine_flag" in final_df.columns else 0
    exclude_flag_count = int(final_df["exclude_flag"].sum()) if "exclude_flag" in final_df.columns else 0

    reasons = final_df.get("Reason / Issue Type", pd.Series([], dtype=str)).astype(str)
    mapping = int((reasons == "mapping_issue").sum())
    private = int((reasons == "private_brand").sum())
    other = int((reasons == "other_issue").sum())
    return combine_flag_count, exclude_flag_count, {
        "mapping_issues": mapping,
        "private_brands": private,
        "other": other,
    }
