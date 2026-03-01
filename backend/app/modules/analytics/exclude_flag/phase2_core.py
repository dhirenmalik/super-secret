from __future__ import annotations

from typing import List, Tuple

import pandas as pd

from app.services.exclude_flag.code01_2_category_qa_updated import (
    ADV_EXCLUSION_LIST,
    build_final_flag_df,
    build_inclusion_summary,
)


def run_phase2_core(
    normalized_df: pd.DataFrame,
    relevant_l2: List[str],
    private_brand_list: List[str],
) -> Tuple[pd.DataFrame, dict, pd.DataFrame]:
    phase2_core_df = build_final_flag_df(
        aggregate_df=normalized_df,
        relevant_subcats=relevant_l2,
        private_brand_list=private_brand_list,
        adv_exclusion_list=ADV_EXCLUSION_LIST,
    )
    inclusion_summary = build_inclusion_summary(
        df_agg=normalized_df,
        df_agg_flag=phase2_core_df,
        relevant_subcats=relevant_l2,
    )
    inclusion_summary_df = pd.DataFrame([inclusion_summary])
    return phase2_core_df, inclusion_summary, inclusion_summary_df

