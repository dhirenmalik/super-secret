from typing import Dict, Any, List

import pandas as pd

from app.services.csv_service import load_csv

REQUIRED_COLUMNS = ["L2", "L3", "O_SALE", "O_UNIT", "M_ON_DIS_TOTAL_SPEND"]
SPEND_COLUMNS = ["M_ON_DIS_TOTAL_SPEND", "M_OFF_DIS_TOTAL_SPEND", "M_SEARCH_SPEND"]
TOTAL_COLUMN = "Total"


def _coerce_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(",", "", regex=False)
    return pd.to_numeric(cleaned, errors="coerce").fillna(0)


def get_l3_analysis(
    file_id: str,
    limit_l2: int | None = None,
    rows: int | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
) -> Dict[str, Any]:
    df = load_csv(file_id)
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    df = df.copy()
    if "week_start_date" in df.columns:
        date_series = pd.to_datetime(df["week_start_date"], errors="coerce")
        if date_series.dropna().empty:
            date_bounds = {"min": "", "max": ""}
        else:
            date_bounds = {
                "min": date_series.min().date().isoformat(),
                "max": date_series.max().date().isoformat(),
            }
    else:
        date_bounds = {"min": "", "max": ""}
    if start_date or end_date:
        if "week_start_date" not in df.columns:
            raise ValueError("Missing required column: week_start_date")
        df["week_start_date"] = pd.to_datetime(df["week_start_date"], errors="coerce")
        if start_date:
            start = pd.to_datetime(start_date, errors="coerce")
            if pd.isna(start):
                raise ValueError(f"Invalid start date: {start_date}")
            df = df[df["week_start_date"] >= start]
        if end_date:
            end = pd.to_datetime(end_date, errors="coerce")
            if pd.isna(end):
                raise ValueError(f"Invalid end date: {end_date}")
            df = df[df["week_start_date"] <= end]
    df["L2"] = df["L2"].fillna("").astype(str).str.strip()
    df["L3"] = df["L3"].fillna("").astype(str).str.strip()
    df.loc[df["L2"] == "", "L2"] = "UNKNOWN"
    df.loc[df["L3"] == "", "L3"] = "UNKNOWN"

    df["O_SALE"] = _coerce_numeric(df["O_SALE"])
    df["O_UNIT"] = _coerce_numeric(df["O_UNIT"])
    df["M_ON_DIS_TOTAL_SPEND"] = _coerce_numeric(df["M_ON_DIS_TOTAL_SPEND"])

    if TOTAL_COLUMN in df.columns:
        df["TOTAL"] = _coerce_numeric(df[TOTAL_COLUMN])
    else:
        available_spends = [col for col in SPEND_COLUMNS if col in df.columns]
        if available_spends:
            for col in available_spends:
                df[col] = _coerce_numeric(df[col])
            df["TOTAL"] = df[available_spends].sum(axis=1)
        else:
            df["TOTAL"] = 0

    grouped = (
        df.groupby(["L2", "L3"], dropna=False)
        .agg(
            sales=("O_SALE", "sum"),
            units=("O_UNIT", "sum"),
            onsite_display_spends=("M_ON_DIS_TOTAL_SPEND", "sum"),
            total=("TOTAL", "sum"),
        )
        .reset_index()
    )

    grouped = grouped.sort_values(by=["L2", "sales"], ascending=[True, False])

    if limit_l2:
        top_l2 = grouped["L2"].drop_duplicates().head(limit_l2)
        grouped = grouped[grouped["L2"].isin(top_l2)]

    if rows:
        grouped = grouped.head(rows)

    rows_out: List[Dict[str, Any]] = []
    for _, row in grouped.iterrows():
        rows_out.append(
            {
                "l2": row["L2"],
                "l3": row["L3"],
                "sales": round(float(row["sales"]), 2),
                "units": round(float(row["units"]), 2),
                "onsite_display_spends": round(float(row["onsite_display_spends"]), 2),
                "total": round(float(row["total"]), 2),
            }
        )

    return {
        "file_id": file_id,
        "rows": rows_out,
        "date_bounds": date_bounds,
        "meta": {
            "unique_l2": int(grouped["L2"].nunique()),
            "unique_l3": int(grouped["L3"].nunique()),
            "row_count": int(len(grouped)),
        },
    }
