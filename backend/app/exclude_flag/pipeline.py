from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.services.exclude_flag.io import (
    create_phase1_run,
    get_uploaded_file_path,
    load_phase1_normalized_df,
    load_phase1_run,
    load_uploaded_csv,
    read_brand_list_from_csv,
    resolve_combined_output_path,
    resolve_mapping_issue_path,
    resolve_private_brand_path,
    save_phase2_outputs,
    save_phase2_selection,
)
from app.services.exclude_flag.phase1_candidates import run_phase1_candidates
from app.services.exclude_flag.phase2_core import run_phase2_core
from app.services.exclude_flag.pivot_automation import run_pivot_automation
from app.services.exclude_flag.validators import validate_relevant_l2_subset

logger = logging.getLogger(__name__)


def run_phase1_pipeline(file_id: str) -> Dict[str, Any]:
    logger.info("exclude-flag phase1 start file_id=%s", file_id)
    raw_df = load_uploaded_csv(file_id)
    normalized_df, candidates_df = run_phase1_candidates(raw_df)
    payload = create_phase1_run(file_id=file_id, normalized_df=normalized_df, candidates_df=candidates_df)
    logger.info(
        "exclude-flag phase1 complete file_id=%s run_id=%s candidates=%s",
        file_id,
        payload["run_id"],
        payload["meta"]["row_count"],
    )
    return payload


def run_phase2_pipeline(file_id: str, run_id: str, relevant_l2: List[str]) -> Dict[str, Any]:
    logger.info("exclude-flag phase2 start file_id=%s run_id=%s", file_id, run_id)
    phase1_payload = load_phase1_run(file_id=file_id, run_id=run_id)
    selected_l2 = validate_relevant_l2_subset(relevant_l2, phase1_payload.get("candidates", []))
    normalized_df = load_phase1_normalized_df(file_id=file_id, run_id=run_id)

    source_file_path = get_uploaded_file_path(file_id)
    private_brand_path = resolve_private_brand_path(source_file_path)
    mapping_issue_path = resolve_mapping_issue_path(source_file_path)
    combined_output_path = resolve_combined_output_path(source_file_path)

    private_brand_list = read_brand_list_from_csv(private_brand_path)
    phase2_core_df, _, inclusion_summary_df = run_phase2_core(
        normalized_df=normalized_df,
        relevant_l2=selected_l2,
        private_brand_list=private_brand_list,
    )
    final_table_df, summary, warnings = run_pivot_automation(
        phase2_core_df=phase2_core_df,
        private_brand_path=private_brand_path,
        mapping_issue_path=mapping_issue_path,
        combined_output_json_path=combined_output_path,
    )

    save_phase2_selection(file_id=file_id, run_id=run_id, relevant_l2=selected_l2)
    artifact_names = save_phase2_outputs(
        file_id=file_id,
        run_id=run_id,
        final_table_df=final_table_df,
        summary=summary,
        warnings=warnings,
        phase2_core_df=phase2_core_df,
        inclusion_summary_df=inclusion_summary_df,
    )
    artifacts = [
        {
            "name": artifact_name,
            "download_url": f"/api/v1/files/{file_id}/exclude-flag/{run_id}/download?name={artifact_name}",
        }
        for artifact_name in artifact_names
    ]

    final_rows = final_table_df.astype(object).where(final_table_df.notna(), None).to_dict(orient="records")
    response = {
        "file_id": file_id,
        "run_id": run_id,
        "final_table": {
            "columns": final_table_df.columns.tolist(),
            "rows": final_rows,
            "row_count": len(final_rows),
        },
        "summary": summary,
        "artifacts": artifacts,
        "warnings": warnings,
    }
    logger.info(
        "exclude-flag phase2 complete file_id=%s run_id=%s rows=%s warnings=%s",
        file_id,
        run_id,
        response["final_table"]["row_count"],
        len(warnings),
    )
    return response
