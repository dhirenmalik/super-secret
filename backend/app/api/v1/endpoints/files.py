from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from app.database import get_db

from app.schemas.file import (
    UploadResponse,
    PreviewResponse,
    SubcategorySummaryResponse,
    L2ValuesResponse,
    ModelGroupMapping,
    ModelGroupSaveRequest,
)
from app.schemas.l3 import L3AnalysisResponse
from app.schemas.correlation import CorrelationResponse
from app.schemas.weekly_sales import WeeklySalesResponse
from app.schemas.model_group_weekly_sales import ModelGroupWeeklySalesResponse
from app.controllers.file_controller import (
    handle_upload,
    handle_preview,
    handle_subcategory_summary,
    handle_l2_values,
    handle_get_model_groups,
    handle_save_model_groups,
    handle_l3_analysis,
    handle_correlation,
    handle_weekly_sales,
    handle_model_group_weekly_sales,
)

router = APIRouter()


@router.post("/files/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        return handle_upload(file, db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Upload failed") from exc


@router.get("/files/{file_id}/preview", response_model=PreviewResponse)
async def preview_file(file_id: str, rows: int = Query(default=5, ge=1, le=100)):
    try:
        return handle_preview(file_id, rows)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Preview failed") from exc


@router.get("/files/{file_id}/l2-values", response_model=L2ValuesResponse)
async def l2_values(file_id: str):
    try:
        return handle_l2_values(file_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to load L2 values") from exc


@router.get("/files/{file_id}/model-groups", response_model=ModelGroupMapping)
async def get_model_groups(file_id: str, db: Session = Depends(get_db)):
    try:
        return handle_get_model_groups(file_id, db)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to load model groups") from exc


@router.post("/files/{file_id}/model-groups", response_model=ModelGroupMapping)
async def save_model_groups(file_id: str, payload: ModelGroupSaveRequest, db: Session = Depends(get_db)):
    try:
        return handle_save_model_groups(file_id, [group.dict() for group in payload.groups], db)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to save model groups") from exc


@router.get(
    "/files/{file_id}/subcategory-summary",
    response_model=SubcategorySummaryResponse,
)
async def subcategory_summary(
    file_id: str,
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    group_by: str = Query(default="l2"),
    auto_bucket: bool = Query(default=False),
):
    try:
        if group_by not in {"l2", "model_group"}:
            raise ValueError("group_by must be 'l2' or 'model_group'")
        return handle_subcategory_summary(
            file_id, start_date, end_date, group_by, auto_bucket
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Summary failed") from exc


@router.get("/files/{file_id}/l3-analysis", response_model=L3AnalysisResponse)
async def l3_analysis(
    file_id: str,
    limit_l2: int | None = Query(default=None, ge=1),
    rows: int | None = Query(default=None, ge=1),
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
):
    try:
        return handle_l3_analysis(file_id, limit_l2, rows, start_date, end_date)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="L3 analysis failed") from exc


@router.get("/files/{file_id}/correlation", response_model=CorrelationResponse)
async def correlation(file_id: str):
    try:
        return handle_correlation(file_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Correlation failed") from exc


@router.get("/files/{file_id}/weekly-sales", response_model=WeeklySalesResponse)
async def weekly_sales(file_id: str, metric: str = Query(default="sales")):
    try:
        return handle_weekly_sales(file_id, metric)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Weekly sales failed") from exc


@router.get(
    "/files/{file_id}/model-group-weekly-sales",
    response_model=ModelGroupWeeklySalesResponse,
)
async def model_group_weekly_sales(file_id: str):
    try:
        return handle_model_group_weekly_sales(file_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="File not found") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Model group weekly sales failed") from exc
