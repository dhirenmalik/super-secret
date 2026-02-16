from typing import List, Dict, Any

import pandas as pd

from app.services.csv_service import load_csv
from app.services.mapping_service import load_mapping

ROUND_CURRENCY = 2
ROUND_PERCENT = 2

REQUIRED_COLUMNS = [
    "L2",
    "O_SALE",
    "O_UNIT",
    "M_ON_DIS_TOTAL_SPEND",
    "M_OFF_DIS_TOTAL_SPEND",
    "M_SEARCH_SPEND",
]

DATE_COLUMN = "week_start_date"


def _coerce_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(",", "", regex=False)
    return pd.to_numeric(cleaned, errors="coerce").fillna(0)


def _safe_divide(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def _round_currency(value: float) -> float:
    return round(value, ROUND_CURRENCY)


def _round_percent(value: float) -> float:
    return round(value, ROUND_PERCENT)


def _parse_date(value: str | None, label: str) -> pd.Timestamp | None:
    if not value:
        return None
    parsed = pd.to_datetime(value, errors="coerce")
    if pd.isna(parsed):
        raise ValueError(f"Invalid {label} date: {value}")
    return parsed


def _apply_date_filter(
    df: pd.DataFrame, start_date: str | None, end_date: str | None
) -> pd.DataFrame:
    if not start_date and not end_date:
        return df

    if DATE_COLUMN not in df.columns:
        raise ValueError(f"Missing required column: {DATE_COLUMN}")

    df = df.copy()
    df[DATE_COLUMN] = pd.to_datetime(df[DATE_COLUMN], errors="coerce")

    start = _parse_date(start_date, "start")
    end = _parse_date(end_date, "end")

    if start is not None:
        df = df[df[DATE_COLUMN] >= start]
    if end is not None:
        df = df[df[DATE_COLUMN] <= end]

    return df


def _get_date_bounds(df: pd.DataFrame) -> Dict[str, str]:
    if DATE_COLUMN not in df.columns:
        return {"min": "", "max": ""}

    parsed = pd.to_datetime(df[DATE_COLUMN], errors="coerce")
    if parsed.dropna().empty:
        return {"min": "", "max": ""}

    return {
        "min": parsed.min().date().isoformat(),
        "max": parsed.max().date().isoformat(),
    }


def _apply_grouping(
    df: pd.DataFrame,
    group_by: str,
    auto_bucket: bool,
    file_id: str,
) -> pd.DataFrame:
    if group_by == "l2":
        df = df.copy()
        df["GROUP_KEY"] = df["L2"].fillna("Unknown").astype(str)
        return df

    mapping = load_mapping(file_id)
    l2_to_group = {}
    for group in mapping.get("groups", []):
        group_name = group.get("group_name")
        for value in group.get("l2_values", []):
            l2_to_group[value] = group_name

    df = df.copy()
    df["GROUP_KEY"] = df["L2"].map(l2_to_group)

    if auto_bucket:
        df["GROUP_KEY"] = df["GROUP_KEY"].fillna("Others (Excl)")
        return df

    df = df[df["GROUP_KEY"].notna()]
    return df


def get_summary(
    file_id: str,
    start_date: str | None = None,
    end_date: str | None = None,
    group_by: str = "l2",
    auto_bucket: bool = False,
) -> Dict[str, Any]:
    df = load_csv(file_id)
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    date_bounds = _get_date_bounds(df)
    df = _apply_date_filter(df, start_date, end_date)

    if df.empty:
        return {
            "file_id": file_id,
            "totals": {"sales": 0.0, "units": 0.0, "total_spends": 0.0},
            "date_bounds": date_bounds,
            "rows": [],
        }

    df = df.copy()
    df["L2"] = df["L2"].fillna("Unknown").astype(str)
    df["O_SALE"] = _coerce_numeric(df["O_SALE"])
    df["O_UNIT"] = _coerce_numeric(df["O_UNIT"])
    df["M_ON_DIS_TOTAL_SPEND"] = _coerce_numeric(df["M_ON_DIS_TOTAL_SPEND"])
    df["M_OFF_DIS_TOTAL_SPEND"] = _coerce_numeric(df["M_OFF_DIS_TOTAL_SPEND"])
    df["M_SEARCH_SPEND"] = _coerce_numeric(df["M_SEARCH_SPEND"])

    df["TOTAL_SPENDS"] = (
        df["M_ON_DIS_TOTAL_SPEND"]
        + df["M_OFF_DIS_TOTAL_SPEND"]
        + df["M_SEARCH_SPEND"]
    )

    df = _apply_grouping(df, group_by, auto_bucket, file_id)

    if df.empty:
        return {
            "file_id": file_id,
            "totals": {"sales": 0.0, "units": 0.0, "total_spends": 0.0},
            "date_bounds": date_bounds,
            "rows": [],
        }

    grouped = (
        df.groupby("GROUP_KEY", dropna=False)
        .agg(
            sales=("O_SALE", "sum"),
            units=("O_UNIT", "sum"),
            onsite_display_spends=("M_ON_DIS_TOTAL_SPEND", "sum"),
            offsite_display_spends=("M_OFF_DIS_TOTAL_SPEND", "sum"),
            search_spends=("M_SEARCH_SPEND", "sum"),
            total_spends=("TOTAL_SPENDS", "sum"),
        )
        .reset_index()
    )

    grouped["avg_price"] = grouped.apply(
        lambda row: _safe_divide(row["sales"], row["units"]), axis=1
    )
    grouped["spends_per_sales"] = grouped.apply(
        lambda row: _safe_divide(row["total_spends"], row["sales"]), axis=1
    )

    totals_sales = float(grouped["sales"].sum())
    totals_units = float(grouped["units"].sum())
    totals_spends = float(grouped["total_spends"].sum())

    grouped["sales_share_pct"] = grouped["sales"].apply(
        lambda value: _safe_divide(value, totals_sales) * 100
    )
    grouped["unit_share_pct"] = grouped["units"].apply(
        lambda value: _safe_divide(value, totals_units) * 100
    )
    grouped["total_spends_pct"] = grouped["total_spends"].apply(
        lambda value: _safe_divide(value, totals_spends) * 100
    )
    grouped["search_spends_pct"] = grouped["search_spends"].apply(
        lambda value: _safe_divide(value, totals_spends) * 100
    )
    grouped["onsite_display_spends_pct"] = grouped["onsite_display_spends"].apply(
        lambda value: _safe_divide(value, totals_spends) * 100
    )
    grouped["offsite_display_spends_pct"] = grouped["offsite_display_spends"].apply(
        lambda value: _safe_divide(value, totals_spends) * 100
    )

    grouped = grouped.sort_values(by="sales", ascending=False)

    rows: List[Dict[str, Any]] = []
    for _, row in grouped.iterrows():
        rows.append(
            {
                "subcategory": row["GROUP_KEY"],
                "sales": _round_currency(float(row["sales"])),
                "units": _round_currency(float(row["units"])),
                "avg_price": _round_currency(float(row["avg_price"])),
                "total_spends": _round_currency(float(row["total_spends"])),
                "search_spends": _round_currency(float(row["search_spends"])),
                "onsite_display_spends": _round_currency(
                    float(row["onsite_display_spends"])
                ),
                "offsite_display_spends": _round_currency(
                    float(row["offsite_display_spends"])
                ),
                "spends_per_sales": _round_currency(float(row["spends_per_sales"])),
                "sales_share_pct": _round_percent(float(row["sales_share_pct"])),
                "unit_share_pct": _round_percent(float(row["unit_share_pct"])),
                "total_spends_pct": _round_percent(float(row["total_spends_pct"])),
                "search_spends_pct": _round_percent(float(row["search_spends_pct"])),
                "onsite_display_spends_pct": _round_percent(
                    float(row["onsite_display_spends_pct"])
                ),
                "offsite_display_spends_pct": _round_percent(
                    float(row["offsite_display_spends_pct"])
                ),
            }
        )

    totals = {
        "sales": _round_currency(totals_sales),
        "units": _round_currency(totals_units),
        "total_spends": _round_currency(totals_spends),
    }

    return {
        "file_id": file_id,
        "totals": totals,
        "date_bounds": date_bounds,
        "rows": rows,
    }
