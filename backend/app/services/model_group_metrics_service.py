from typing import List, Dict, Any, Optional
import pandas as pd
from app.services.csv_service import load_csv
from app.services.mapping_service import load_mapping
from app.schemas.model_group_metrics import (
    ModelGroupMetricsResponse,
    WeeklyMetricSeries,
    YoYMetrics,
)

L2_COLUMN = "L2"
DATE_COLUMN = "week_start_date"

METRIC_MAP = {
    "sales": "O_SALE",
    "units": "O_UNIT",
}

SPEND_MAP = {
    "search": "M_SEARCH_SPEND",
    "onsite": "M_ON_DIS_TOTAL_SPEND",
    "offsite": "M_OFF_DIS_TOTAL_SPEND",
}

def _coerce_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(",", "", regex=False)
    return pd.to_numeric(cleaned, errors="coerce").fillna(0)

def get_model_group_metrics(
    file_id: str,
    group_names: List[str],
    metric: str = "sales",
    include_spends: bool = True,
    window_weeks: int = 104
) -> Dict[str, Any]:
    # 1. Load Data
    df = load_csv(file_id)
    mapping = load_mapping(file_id)
    
    # 2. Validation
    if L2_COLUMN not in df.columns:
        raise ValueError(f"Missing required column: {L2_COLUMN}")
    
    metric_col = METRIC_MAP.get(metric)
    if not metric_col:
        raise ValueError(f"Invalid metric: {metric}")
    if metric_col not in df.columns:
        raise ValueError(f"Missing required column for metric: {metric_col}")

    if DATE_COLUMN not in df.columns:
        raise ValueError(f"Missing required column: {DATE_COLUMN}")

    # 3. Preprocess
    df = df.copy()
    
    # Standardize L2
    df[L2_COLUMN] = df[L2_COLUMN].fillna("UNKNOWN").astype(str).str.strip()
    df.loc[df[L2_COLUMN] == "", L2_COLUMN] = "UNKNOWN"
    
    # Coerce numeric columns
    # Ensure both sales and units are present and numeric for YoY calc
    for m_key, m_col in METRIC_MAP.items():
        if m_col in df.columns:
            df[m_col] = _coerce_numeric(df[m_col])
        else:
             df[m_col] = 0.0
    
    spend_cols = []
    if include_spends:
        for key, col in SPEND_MAP.items():
            if col in df.columns:
                df[col] = _coerce_numeric(df[col])
                spend_cols.append(col)
            else:
                df[col] = 0.0 # Default to 0 if missing

    # 4. Map L2 to Model Group
    # Build a lookup dictionary: l2 -> group_name
    l2_to_group = {}
    if "groups" in mapping:
        for grp in mapping["groups"]:
            g_name = grp.get("group_name")
            for l2 in grp.get("l2_values", []):
                l2_to_group[l2] = g_name
    
    # Apply mapping
    df["model_group"] = df[L2_COLUMN].map(l2_to_group)
    
    # Filter by selected groups
    # Normalize selection for case-insensitive comparison if needed, but usually strict match is fine
    # assuming exact match for now as per previous frontend implementation
    if group_names:
        df = df[df["model_group"].isin(group_names)]
    
    # 5. Temporal Aggregation
    df[DATE_COLUMN] = pd.to_datetime(df[DATE_COLUMN], errors="coerce")
    df = df[df[DATE_COLUMN].notna()]
    
    if df.empty:
         return {
            "file_id": file_id,
            "series": [],
            "yoy": {"metric_yoy_pct": None, "spends_yoy_pct": None},
            "meta": {"weeks_returned": 0}
        }

    # Group by Date and Sum
    # We need Sales AND Units for YoY, even if we only return one series for the chart.
    agg_dict = {
        metric_col: "sum", # The requested metric for the chart series
    }
    
    # Ensure we have column names for specific YoY calculations
    sales_col = METRIC_MAP["sales"]
    units_col = METRIC_MAP["units"]
    
    # Add them to aggregation if not already there (metric_col might be one of them)
    agg_dict[sales_col] = "sum"
    agg_dict[units_col] = "sum"
    
    if include_spends:
        for col in SPEND_MAP.values():
            agg_dict[col] = "sum"
            
    weekly_agg = df.groupby(DATE_COLUMN).agg(agg_dict).reset_index()
    weekly_agg = weekly_agg.sort_values(DATE_COLUMN, ascending=False) # Latest first
    
    # 6. Build Series Response
    series_data = []
    for _, row in weekly_agg.iterrows():
        series_data.append(WeeklyMetricSeries(
            week_start_date=row[DATE_COLUMN].date().isoformat(),
            metric_value=float(row[metric_col]),
            search_spend=float(row.get(SPEND_MAP["search"], 0)),
            onsite_spend=float(row.get(SPEND_MAP["onsite"], 0)),
            offsite_spend=float(row.get(SPEND_MAP["offsite"], 0)),
        ))
        
    # 7. Calculate YoY (Latest 52 vs Prior 52)
    latest_52 = weekly_agg.head(52)
    prior_52 = weekly_agg.iloc[52:104]
    
    sales_yoy = None
    units_yoy = None
    spends_yoy = None
    
    # Helper for YoY
    def calc_pct_change(current, prior):
        if prior == 0:
            return None
        return ((current - prior) / prior) * 100

    if not latest_52.empty and not prior_52.empty:
        # Sales YoY
        curr_sales = latest_52[sales_col].sum()
        prior_sales = prior_52[sales_col].sum()
        sales_yoy = calc_pct_change(curr_sales, prior_sales)
        
        # Units YoY
        curr_units = latest_52[units_col].sum()
        prior_units = prior_52[units_col].sum()
        units_yoy = calc_pct_change(curr_units, prior_units)
        
        # Spends YoY
        if include_spends:
            curr_spend_sum = latest_52[list(SPEND_MAP.values())].sum().sum()
            prior_spend_sum = prior_52[list(SPEND_MAP.values())].sum().sum()
            spends_yoy = calc_pct_change(curr_spend_sum, prior_spend_sum)

    return {
        "file_id": file_id,
        "series": series_data,
        "yoy": {
            "sales_yoy_pct": sales_yoy,
            "units_yoy_pct": units_yoy,
            "spends_yoy_pct": spends_yoy,
        },
        "meta": {
            "bucket": "week",
            "weeks_returned": len(series_data)
        }
    }
