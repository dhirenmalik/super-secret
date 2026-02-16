from typing import Dict, Any, List

import pandas as pd

from app.services.csv_service import load_csv

L2_COLUMN = "L2"
SALE_COLUMN = "O_SALE"
DATE_COLUMN = "week_start_date"


def _coerce_numeric(series: pd.Series) -> pd.Series:
    cleaned = series.astype(str).str.replace(",", "", regex=False)
    return pd.to_numeric(cleaned, errors="coerce").fillna(0)


def get_l2_correlation(file_id: str) -> Dict[str, Any]:
    df = load_csv(file_id)
    if L2_COLUMN not in df.columns:
        raise ValueError(f"Missing required column: {L2_COLUMN}")
    if SALE_COLUMN not in df.columns:
        raise ValueError(f"Missing required column: {SALE_COLUMN}")

    df = df.copy()
    df[L2_COLUMN] = df[L2_COLUMN].fillna("UNKNOWN").astype(str).str.strip()
    df.loc[df[L2_COLUMN] == "", L2_COLUMN] = "UNKNOWN"
    df[SALE_COLUMN] = _coerce_numeric(df[SALE_COLUMN])

    if DATE_COLUMN in df.columns:
        df[DATE_COLUMN] = pd.to_datetime(df[DATE_COLUMN], errors="coerce")
        df = df[df[DATE_COLUMN].notna()]
        if df.empty:
            return {"file_id": file_id, "l2_values": [], "matrix": []}
        pivot = (
            df.groupby([DATE_COLUMN, L2_COLUMN])[SALE_COLUMN]
            .sum()
            .reset_index()
            .pivot(index=DATE_COLUMN, columns=L2_COLUMN, values=SALE_COLUMN)
            .fillna(0)
        )
    else:
        pivot = (
            df.groupby([df.index, L2_COLUMN])[SALE_COLUMN]
            .sum()
            .reset_index()
            .pivot(index="index", columns=L2_COLUMN, values=SALE_COLUMN)
            .fillna(0)
        )

    if pivot.empty:
        return {"file_id": file_id, "l2_values": [], "matrix": []}

    # Filter out columns with zero variance (std == 0)
    pivot = pivot.loc[:, pivot.std() > 0]

    if pivot.empty:
        return {"file_id": file_id, "l2_values": [], "matrix": []}

    corr = pivot.corr(method="pearson").fillna(0)
    l2_values = [str(col) for col in corr.columns]
    matrix: List[List[float]] = [
        [round(float(value), 3) for value in row] for row in corr.values.tolist()
    ]

    return {"file_id": file_id, "l2_values": l2_values, "matrix": matrix}
