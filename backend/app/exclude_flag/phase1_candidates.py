from __future__ import annotations

import pandas as pd

from app.services.exclude_flag.code01_2_category_qa_updated import (
    build_sub_dis_candidates,
    normalize_aggregate_df,
)
from app.services.exclude_flag.validators import validate_required_columns


def run_phase1_candidates(raw_df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    validate_required_columns(raw_df)
    normalized_df = normalize_aggregate_df(raw_df)
    candidates_df = build_sub_dis_candidates(normalized_df)
    return normalized_df, candidates_df

