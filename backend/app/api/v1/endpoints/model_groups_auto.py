from fastapi import APIRouter, HTTPException, Query

from app.schemas.auto_grouping import AutoGroupingResponse, AutoGroupingRequest
from app.controllers.file_controller import (
    handle_auto_group_preview,
    handle_auto_group_apply,
)

router = APIRouter()


@router.get(
    "/files/{file_id}/model-groups/auto/preview",
    response_model=AutoGroupingResponse,
)
async def auto_group_preview(file_id: str, reference_path: str = Query(...)):
    try:
        return handle_auto_group_preview(file_id, reference_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Auto grouping failed") from exc


@router.post(
    "/files/{file_id}/model-groups/auto",
    response_model=AutoGroupingResponse,
)
async def auto_group_apply(file_id: str, payload: AutoGroupingRequest):
    try:
        return handle_auto_group_apply(file_id, payload.reference_path, payload.persist)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Auto grouping failed") from exc
