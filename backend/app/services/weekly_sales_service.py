from typing import Dict, Any, List

import pandas as pd

from app.services.csv_service import load_csv

L2_COLUMN = "L2"
DATE_COLUMN = "week_start_date"

METRIC_COLUMNS = {
    "sales": "O_SALE",
    "units": "O_UNIT",
    "search_spends": "M_SEARCH_SPEND",
    "onsite_spends": "M_ON_DIS_TOTAL_SPEND",
    "offsite_spends": "M_OFF_DIS_TOTAL_SPEND",
}


def _coerce_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(",", "", regex=False)
    return pd.to_numeric(cleaned, errors="coerce").fillna(0)


def get_weekly_sales(file_id: str, metric: str = "sales") -> Dict[str, Any]:
    df = load_csv(file_id)
    if L2_COLUMN not in df.columns:
        raise ValueError(f"Missing required column: {L2_COLUMN}")
    metric_column = METRIC_COLUMNS.get(metric)
    if not metric_column:
        raise ValueError("Invalid metric")
    if metric_column not in df.columns:
        raise ValueError(f"Missing required column: {metric_column}")
    if DATE_COLUMN not in df.columns:
        raise ValueError(f"Missing required column: {DATE_COLUMN}")

    df = df.copy()
    df[L2_COLUMN] = df[L2_COLUMN].fillna("UNKNOWN").astype(str).str.strip()
    df.loc[df[L2_COLUMN] == "", L2_COLUMN] = "UNKNOWN"
    df[metric_column] = _coerce_numeric(df[metric_column])
    df[DATE_COLUMN] = pd.to_datetime(df[DATE_COLUMN], errors="coerce")
    df = df[df[DATE_COLUMN].notna()]

    if df.empty:
        return {"file_id": file_id, "l2_values": [], "series": []}

    grouped = (
        df.groupby([DATE_COLUMN, L2_COLUMN])[metric_column]
        .sum()
        .reset_index()
        .sort_values(by=[DATE_COLUMN, L2_COLUMN])
    )

    series: Dict[str, Dict[str, float]] = {}
    for _, row in grouped.iterrows():
        date_key = row[DATE_COLUMN].date().isoformat()
        l2 = str(row[L2_COLUMN])
        series.setdefault(date_key, {})[l2] = float(row[metric_column])

    rows: List[Dict[str, Any]] = []
    for date_key in sorted(series.keys()):
        row = {"week_start_date": date_key}
        row.update(series[date_key])
        rows.append(row)

    l2_values = (
        grouped[L2_COLUMN].drop_duplicates().sort_values().astype(str).tolist()
    )

    return {
        "file_id": file_id,
        "metric": metric,
        "l2_values": l2_values,
        "series": rows,
    }
