from typing import Dict, Any, List

import pandas as pd

from app.services.csv_service import load_csv
from app.services.mapping_service import load_mapping

L2_COLUMN = "L2"
DATE_COLUMN = "week_start_date"
SALES_COLUMN = "O_SALE"
TOTAL_COLUMN = "Total"
SPEND_COLUMNS = [
    "M_ON_DIS_TOTAL_SPEND",
    "M_OFF_DIS_TOTAL_SPEND",
    "M_SEARCH_SPEND",
]


def _column_lookup(df: pd.DataFrame) -> Dict[str, str]:
    return {str(col).strip().lower(): col for col in df.columns}


def _resolve_column(df: pd.DataFrame, name: str) -> str | None:
    lookup = _column_lookup(df)
    return lookup.get(name.strip().lower())


def _normalize_l2(value: str) -> str:
    return " ".join(str(value).strip().split())


def _coerce_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(",", "", regex=False)
    return pd.to_numeric(cleaned, errors="coerce").fillna(0)


def _ensure_spend_total(
    df: pd.DataFrame, total_column: str | None, spend_columns: List[str]
) -> pd.Series:
    if total_column and total_column in df.columns:
        return _coerce_numeric(df[total_column])
    available = [col for col in spend_columns if col in df.columns]
    if not available:
        return pd.Series([0] * len(df), index=df.index)
    total = pd.Series([0] * len(df), index=df.index, dtype="float64")
    for col in available:
        total = total.add(_coerce_numeric(df[col]), fill_value=0)
    return total


def get_model_group_weekly_sales(file_id: str) -> Dict[str, Any]:
    mapping = load_mapping(file_id)
    groups = mapping.get("groups") or []
    if not groups:
        return {"file_id": file_id, "group_names": [], "series": []}

    l2_to_group: Dict[str, str] = {}
    for group in groups:
        group_name = (group.get("group_name") or "").strip()
        for l2 in group.get("l2_values") or []:
            key = _normalize_l2(l2)
            if key and key not in l2_to_group:
                l2_to_group[key] = group_name

    if not l2_to_group:
        return {"file_id": file_id, "group_names": [], "series": []}

    df = load_csv(file_id)
    l2_col = _resolve_column(df, L2_COLUMN)
    date_col = _resolve_column(df, DATE_COLUMN)
    sales_col = _resolve_column(df, SALES_COLUMN)
    total_col = _resolve_column(df, TOTAL_COLUMN)
    if not l2_col:
        raise ValueError(f"Missing required column: {L2_COLUMN}")
    if not date_col:
        raise ValueError(f"Missing required column: {DATE_COLUMN}")
    if not sales_col:
        raise ValueError(f"Missing required column: {SALES_COLUMN}")

    df = df.copy()
    df[L2_COLUMN] = df[l2_col].fillna("UNKNOWN").astype(str).apply(_normalize_l2)
    df.loc[df[L2_COLUMN] == "", L2_COLUMN] = "UNKNOWN"
    df[DATE_COLUMN] = pd.to_datetime(df[date_col], errors="coerce")
    df[SALES_COLUMN] = _coerce_numeric(df[sales_col])
    spend_cols = [
        col for col in [_resolve_column(df, col) for col in SPEND_COLUMNS] if col
    ]
    df["total_spends"] = _ensure_spend_total(df, total_col, spend_cols)
    df = df[df[DATE_COLUMN].notna()]

    if df.empty:
        return {"file_id": file_id, "group_names": [], "series": []}

    df["group_name"] = df[L2_COLUMN].map(l2_to_group)
    df = df[df["group_name"].notna()]

    if df.empty:
        return {"file_id": file_id, "group_names": [], "series": []}

    grouped = (
        df.groupby([DATE_COLUMN, "group_name"])[[SALES_COLUMN, "total_spends"]]
        .sum()
        .reset_index()
        .sort_values(by=[DATE_COLUMN, "group_name"])
    )

    series: Dict[str, Dict[str, Dict[str, float]]] = {}
    for _, row in grouped.iterrows():
        date_key = row[DATE_COLUMN].date().isoformat()
        group_name = str(row["group_name"])
        entry = series.setdefault(date_key, {"spends": {}, "sales": {}})
        entry["spends"][group_name] = float(row["total_spends"])
        entry["sales"][group_name] = float(row[SALES_COLUMN])

    rows: List[Dict[str, Any]] = []
    for date_key in sorted(series.keys()):
        row = {"week_start_date": date_key}
        row.update(series[date_key])
        rows.append(row)

    group_names = (
        grouped["group_name"].drop_duplicates().sort_values().astype(str).tolist()
    )

    return {"file_id": file_id, "group_names": group_names, "series": rows}
