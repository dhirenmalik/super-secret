import os
from typing import List

import pandas as pd

from app.storage.file_storage import read_manifest

L2_COLUMN = "L2"


def load_csv(file_id: str) -> pd.DataFrame:
    manifest = read_manifest(file_id)
    saved_path = manifest.get("saved_path")

    if not saved_path or not os.path.exists(saved_path):
        raise FileNotFoundError("Saved file not found")

    return pd.read_csv(saved_path)


def get_l2_values(file_id: str) -> List[str]:
    df = load_csv(file_id)
    if L2_COLUMN not in df.columns:
        raise ValueError(f"Missing required column: {L2_COLUMN}")

    values = (
        df[L2_COLUMN]
        .dropna()
        .astype(str)
        .drop_duplicates()
        .sort_values()
        .tolist()
    )
    return values
