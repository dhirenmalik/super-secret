from app.schemas.file import (
    UploadResponse,
    PreviewResponse,
    SubcategorySummaryResponse,
    L2ValuesResponse,
    ModelGroupMapping,
)
from app.services.file_service import save_upload, get_preview
from app.services.csv_service import get_l2_values
from app.services.mapping_service import load_mapping, save_mapping
from app.services.summary_service import get_summary
from app.services.l3_service import get_l3_analysis
from app.schemas.l3 import L3AnalysisResponse
from app.services.auto_grouping_service import generate_auto_grouping
from app.schemas.auto_grouping import AutoGroupingResponse
from app.services.correlation_service import get_l2_correlation
from app.schemas.correlation import CorrelationResponse
from app.services.weekly_sales_service import get_weekly_sales
from app.schemas.weekly_sales import WeeklySalesResponse
from app.schemas.model_group_weekly_sales import ModelGroupWeeklySalesResponse
from app.services.model_group_weekly_sales_service import get_model_group_weekly_sales


def handle_upload(file):
    file_id, filename, saved_path = save_upload(file)
    return UploadResponse(file_id=file_id, filename=filename, saved_path=saved_path)


def handle_preview(file_id: str, rows: int):
    preview = get_preview(file_id, rows)
    return PreviewResponse(**preview)


def handle_l2_values(file_id: str):
    values = get_l2_values(file_id)
    return L2ValuesResponse(file_id=file_id, l2_values=values)


def handle_get_model_groups(file_id: str):
    mapping = load_mapping(file_id)
    return ModelGroupMapping(**mapping)


def handle_save_model_groups(file_id: str, groups):
    allowed_l2 = get_l2_values(file_id)
    mapping = save_mapping(file_id, groups, allowed_l2)
    return ModelGroupMapping(**mapping)


def handle_subcategory_summary(
    file_id: str,
    start_date: str | None,
    end_date: str | None,
    group_by: str,
    auto_bucket: bool,
):
    summary = get_summary(
        file_id,
        start_date=start_date,
        end_date=end_date,
        group_by=group_by,
        auto_bucket=auto_bucket,
    )
    return SubcategorySummaryResponse(**summary)


def handle_l3_analysis(
    file_id: str,
    limit_l2: int | None,
    rows: int | None,
    start_date: str | None,
    end_date: str | None,
):
    data = get_l3_analysis(
        file_id,
        limit_l2=limit_l2,
        rows=rows,
        start_date=start_date,
        end_date=end_date,
    )
    return L3AnalysisResponse(**data)


def handle_correlation(file_id: str):
    payload = get_l2_correlation(file_id)
    return CorrelationResponse(**payload)


def handle_weekly_sales(file_id: str, metric: str):
    payload = get_weekly_sales(file_id, metric=metric)
    return WeeklySalesResponse(**payload)


def handle_model_group_weekly_sales(file_id: str):
    payload = get_model_group_weekly_sales(file_id)
    return ModelGroupWeeklySalesResponse(**payload)


def handle_auto_group_preview(file_id: str, reference_path: str):
    payload = generate_auto_grouping(file_id, reference_path, persist=False)
    return AutoGroupingResponse(**payload)


def handle_auto_group_apply(file_id: str, reference_path: str, persist: bool):
    payload = generate_auto_grouping(file_id, reference_path, persist=persist)
    return AutoGroupingResponse(**payload)
