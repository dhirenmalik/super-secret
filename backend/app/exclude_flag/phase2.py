from __future__ import annotations

import csv
from typing import List, Tuple

import pandas as pd

from app.services.exclude_flag.source_notebook_converted import (
    ADV_EXCLUSION_LIST,
    build_final_flag_df,
    build_inclusion_summary,
    normalize_aggregate_df,
)


def _load_private_brand_list(private_brand_path: str) -> List[str]:
    brands: List[str] = []
    with open(private_brand_path, "r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        header = next(reader, None)
        if not header:
            raise ValueError("private_brands.csv is empty")

        normalized = [str(col).strip().lower() for col in header]
        if "brand" in normalized:
            brand_idx = normalized.index("brand")
        else:
            # Legacy file shape has a leading unnamed column and brand in column 2.
            brand_idx = 1 if len(header) > 1 else 0

        for row in reader:
            if brand_idx >= len(row):
                continue
            value = str(row[brand_idx]).strip()
            if not value:
                continue
            brands.append(value.upper())

    unique_brands = sorted(set(brands))
    if not unique_brands:
        raise ValueError("private_brands.csv has no usable brand values")
    return unique_brands


def run_phase_2(
    file_path: str,
    selected_relevant_l2: List[str],
    private_brand_path: str,
) -> Tuple[pd.DataFrame, dict, pd.DataFrame]:
    raw_df = pd.read_csv(file_path)
    normalized = normalize_aggregate_df(raw_df)

    private_brand_list = _load_private_brand_list(private_brand_path)

    flag_df = build_final_flag_df(
        aggregate_df=normalized,
        relevant_subcats=selected_relevant_l2,
        private_brand_list=private_brand_list,
        adv_exclusion_list=ADV_EXCLUSION_LIST,
    )

    summary = build_inclusion_summary(
        df_agg=normalized,
        df_agg_flag=flag_df,
        relevant_subcats=selected_relevant_l2,
    )

    inclusion_summary_df = pd.DataFrame([summary])
    return flag_df, summary, inclusion_summary_df
