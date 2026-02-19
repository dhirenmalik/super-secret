from __future__ import annotations

import pandas as pd

from app.services.exclude_flag.source_notebook_converted import (
    build_sub_dis_candidates,
    normalize_aggregate_df,
)


def run_phase_1(file_path: str) -> pd.DataFrame:
    raw_df = pd.read_csv(file_path)
    normalized = normalize_aggregate_df(raw_df)
    return build_sub_dis_candidates(normalized)
