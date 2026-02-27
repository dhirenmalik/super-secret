from __future__ import annotations

import csv
import os
from typing import Any, Dict, List

import pandas as pd

from app.storage.artifact_storage import create_run_dir, get_run_dir, read_json, write_json
from app.storage.file_storage import read_manifest

PHASE1_JSON = "phase1.json"
PHASE1_CANDIDATES_CSV = "phase1_candidates.csv"
PHASE1_NORMALIZED_CSV = "phase1_normalized.csv"
PHASE2_SELECTED_L2_JSON = "phase2_selected_l2.json"
PHASE2_SUMMARY_JSON = "phase2_summary.json"
PHASE2_FINAL_TABLE_JSON = "phase2_final_table.json"
PHASE2_FINAL_TABLE_CSV = "exclude_flag_final.csv"
PHASE2_FINAL_TABLE_XLSX = "exclude_flag_final.xlsx"
PHASE2_CORE_CSV = "phase2_core_output.csv"
PHASE2_INCLUSION_SUMMARY_CSV = "phase2_inclusion_summary.csv"

REFERENCE_BASE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "reference_codes", "02 Exclude Flag Analysis")
)
DEFAULT_PRIVATE_BRAND_CSV = os.path.join(REFERENCE_BASE, "01 Code (QA Output Generation)", "private_brands.csv")
DEFAULT_PRIVATE_BRAND_XLSX = os.path.join(REFERENCE_BASE, "02 Code (Automation)", "Private Brand.xlsx")
DEFAULT_MAPPING_ISSUE_XLSX = os.path.join(REFERENCE_BASE, "02 Code (Automation)", "Mapping Issue Brand.xlsx")
DEFAULT_COMBINED_OUTPUT_JSON = os.path.join(REFERENCE_BASE, "02 Code (Automation)", "combined_output.json")


def get_uploaded_file_path(file_id: str) -> str:
    manifest = read_manifest(file_id)
    saved_path = manifest.get("saved_path")
    if not saved_path or not os.path.exists(saved_path):
        raise FileNotFoundError("Uploaded file not found")
    return saved_path


def load_uploaded_csv(file_id: str) -> pd.DataFrame:
    return pd.read_csv(get_uploaded_file_path(file_id))


def _resolve_existing(paths: list[str]) -> str | None:
    for path in paths:
        if path and os.path.exists(path):
            return path
    return None


def resolve_private_brand_path(uploaded_csv_path: str) -> str | None:
    upload_dir = os.path.dirname(uploaded_csv_path)
    return _resolve_existing(
        [
            os.path.join(upload_dir, "private_brands.csv"),
            os.path.join(upload_dir, "Private Brand.xlsx"),
            DEFAULT_PRIVATE_BRAND_CSV,
            DEFAULT_PRIVATE_BRAND_XLSX,
        ]
    )


def resolve_mapping_issue_path(uploaded_csv_path: str) -> str | None:
    upload_dir = os.path.dirname(uploaded_csv_path)
    return _resolve_existing([os.path.join(upload_dir, "Mapping Issue Brand.xlsx"), DEFAULT_MAPPING_ISSUE_XLSX])


def resolve_combined_output_path(uploaded_csv_path: str) -> str | None:
    upload_dir = os.path.dirname(uploaded_csv_path)
    return _resolve_existing([os.path.join(upload_dir, "combined_output.json"), DEFAULT_COMBINED_OUTPUT_JSON])


def read_brand_list_from_csv(path: str | None) -> List[str]:
    if not path or not os.path.exists(path):
        return []
    brands: List[str] = []
    with open(path, "r", encoding="utf-8", newline="") as handle:
        reader = csv.reader(handle)
        header = next(reader, None)
        if not header:
            return []
        normalized = [str(col).strip().lower() for col in header]
        brand_idx = normalized.index("brand") if "brand" in normalized else (1 if len(header) > 1 else 0)
        for row in reader:
            if brand_idx >= len(row):
                continue
            value = str(row[brand_idx]).strip()
            if value:
                brands.append(value.upper())
    return sorted(set(brands))


def create_phase1_run(file_id: str, normalized_df: pd.DataFrame, candidates_df: pd.DataFrame) -> Dict[str, Any]:
    run_id, run_dir = create_run_dir(file_id)
    candidates_payload = candidates_df.fillna("").to_dict(orient="records")
    payload = {
        "file_id": file_id,
        "run_id": run_id,
        "candidates": candidates_payload,
        "meta": {"row_count": len(candidates_payload)},
    }
    write_json(os.path.join(run_dir, PHASE1_JSON), payload)
    candidates_df.to_csv(os.path.join(run_dir, PHASE1_CANDIDATES_CSV), index=False)
    normalized_df.to_csv(os.path.join(run_dir, PHASE1_NORMALIZED_CSV), index=False)
    return payload


def load_phase1_run(file_id: str, run_id: str) -> Dict[str, Any]:
    run_dir = get_run_dir(file_id, run_id)
    return read_json(os.path.join(run_dir, PHASE1_JSON))


def load_phase1_normalized_df(file_id: str, run_id: str) -> pd.DataFrame:
    run_dir = get_run_dir(file_id, run_id)
    csv_path = os.path.join(run_dir, PHASE1_NORMALIZED_CSV)
    if not os.path.exists(csv_path):
        raise FileNotFoundError("Missing phase1 normalized data artifact")
    return pd.read_csv(csv_path)


def save_phase2_selection(file_id: str, run_id: str, relevant_l2: List[str]) -> None:
    run_dir = get_run_dir(file_id, run_id)
    write_json(
        os.path.join(run_dir, PHASE2_SELECTED_L2_JSON),
        {"run_id": run_id, "relevant_l2": relevant_l2},
    )


def save_phase2_outputs(
    file_id: str,
    run_id: str,
    final_table_df: pd.DataFrame,
    summary: Dict[str, Any],
    warnings: List[str],
    phase2_core_df: pd.DataFrame,
    inclusion_summary_df: pd.DataFrame,
) -> List[str]:
    run_dir = get_run_dir(file_id, run_id)
    final_table_df.to_csv(os.path.join(run_dir, PHASE2_FINAL_TABLE_CSV), index=False)
    phase2_core_df.to_csv(os.path.join(run_dir, PHASE2_CORE_CSV), index=False)
    inclusion_summary_df.to_csv(os.path.join(run_dir, PHASE2_INCLUSION_SUMMARY_CSV), index=False)

    serializable_rows = final_table_df.astype(object).where(final_table_df.notna(), None).to_dict(orient="records")
    write_json(
        os.path.join(run_dir, PHASE2_FINAL_TABLE_JSON),
        {
            "columns": final_table_df.columns.tolist(),
            "rows": serializable_rows,
            "row_count": int(len(final_table_df)),
        },
    )
    write_json(
        os.path.join(run_dir, PHASE2_SUMMARY_JSON),
        {"run_id": run_id, "summary": summary, "warnings": warnings},
    )

    xlsx_path = os.path.join(run_dir, PHASE2_FINAL_TABLE_XLSX)
    with pd.ExcelWriter(xlsx_path, engine="xlsxwriter") as writer:
        final_table_df.to_excel(writer, sheet_name="analysis", index=False)
        phase2_core_df.to_excel(writer, sheet_name="phase2_core", index=False)
        inclusion_summary_df.to_excel(writer, sheet_name="inclusion_summary", index=False)
    return [PHASE2_FINAL_TABLE_XLSX, PHASE2_FINAL_TABLE_CSV]


def get_artifact_path(file_id: str, run_id: str, name: str) -> str:
    run_dir = get_run_dir(file_id, run_id)
    candidate = os.path.normpath(os.path.join(run_dir, name))
    if not candidate.startswith(run_dir):
        raise ValueError("Invalid artifact name")
    if not os.path.exists(candidate):
        raise FileNotFoundError("Artifact not found")
    return candidate
