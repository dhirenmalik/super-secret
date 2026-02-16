from fastapi import APIRouter, HTTPException

from app.schemas.model_group_metrics import (
    ModelGroupMetricsResponse,
    ModelGroupMetricsRequest,
)
from app.controllers.model_group_metrics_controller import (
    handle_get_model_group_metrics,
)

router = APIRouter()

@router.post(
    "/files/{file_id}/model-group-weekly-metrics",
    response_model=ModelGroupMetricsResponse,
)
async def get_model_group_weekly_metrics(
    file_id: str, payload: ModelGroupMetricsRequest
):
    try:
        return handle_get_model_group_metrics(file_id, payload)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail="Failed to calculate model group metrics"
        ) from exc
