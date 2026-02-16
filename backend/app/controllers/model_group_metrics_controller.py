from app.schemas.model_group_metrics import (
    ModelGroupMetricsResponse,
    ModelGroupMetricsRequest,
)
from app.services.model_group_metrics_service import get_model_group_metrics

def handle_get_model_group_metrics(file_id: str, payload: ModelGroupMetricsRequest):
    data = get_model_group_metrics(
        file_id=file_id,
        group_names=payload.group_names,
        metric=payload.metric,
        include_spends=payload.include_spends,
        window_weeks=payload.window_weeks,
    )
    return ModelGroupMetricsResponse(**data)
