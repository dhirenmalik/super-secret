from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.rbac import get_current_user
from . import service, schemas, models
from . import stack
from . import discovery
import pandas as pd

router = APIRouter(tags=["analytics"])

# EDA Produce Category
@router.get("/eda/exclude-analysis", response_model=Dict[str, Any])
async def get_exclude_analysis(
    group_by: str = Query("L3"),
    model_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return await service.get_exclude_analysis_data(db, model_id, group_by)

@router.post("/eda/relevance")
async def update_relevance(
    payload: schemas.RelevanceUpdateRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return service.update_produce_relevance(db, payload.category, payload.relevant, payload.model_id)

# File Management & Analysis
@router.post("/files/upload")
async def upload_file(
    file: UploadFile = File(...), 
    category: Optional[str] = Query(None),
    model_id: Optional[int] = Query(None),
    is_analysis: bool = Query(False),
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return await service.handle_file_upload(db, file, current_user.user_id, category, model_id, is_analysis)

from app.modules.governance import schemas as gov_schemas

@router.get("/files", response_model=List[gov_schemas.ModelFile])
def get_all_files(is_analysis: Optional[bool] = Query(None), db: Session = Depends(get_db)):
    return service.get_all_files_records(db, is_analysis)

@router.get("/files/latest", response_model=gov_schemas.ModelFile)
def get_latest_file(
    category: Optional[str] = Query(None), 
    model_id: Optional[int] = Query(None),
    is_analysis: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    latest = service.get_latest_file_record(db, category, model_id, is_analysis)
    if not latest:
        raise HTTPException(status_code=404, detail="No files found")
    return latest

@router.delete("/files/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    success = service.delete_file_record(db, file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    return {"status": "success", "message": "File deleted"}

@router.get("/files/{file_id}/preview")
def get_file_preview(file_id: str, rows: int = 5):
    return service.get_file_preview_data(file_id, rows)

@router.get("/files/{file_id}/subcategory-summary", response_model=schemas.SubcategorySummaryResponse)
def get_subcategory_summary(
    file_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    group_by: str = "l2",
    auto_bucket: bool = False,
    db: Session = Depends(get_db)
):
    return service.get_subcategory_summary_data(db, file_id, start_date, end_date, group_by, auto_bucket)

@router.get("/files/{file_id}/l2-values", response_model=schemas.L2ValuesResponse)
def get_l2_values(file_id: str, db: Session = Depends(get_db)):
    return service.get_l2_values_data(db, file_id)

@router.get("/files/{file_id}/model-groups", response_model=schemas.ModelGroupsResponse)
def get_model_groups(file_id: str, db: Session = Depends(get_db)):
    return service.get_model_groups_data(file_id, db)

@router.post("/files/{file_id}/model-groups", response_model=schemas.ModelGroupsResponse)
def save_model_groups(file_id: str, payload: schemas.ModelGroupsSave, db: Session = Depends(get_db)):
    return service.save_model_groups_data(file_id, payload.groups, db)

@router.get("/files/{file_id}/model-groups/auto/preview", response_model=schemas.AutoGroupingPreviewResponse)
def preview_auto_model_groups(file_id: str, reference_path: str = Query(...), db: Session = Depends(get_db)):
    return service.preview_auto_model_groups_data(db, file_id, reference_path)

@router.post("/files/{file_id}/model-groups/auto", response_model=schemas.AutoGroupingPreviewResponse)
def apply_auto_model_groups(file_id: str, payload: schemas.AutoGroupingApplyRequest, db: Session = Depends(get_db)):
    return service.apply_auto_model_groups_data(db, file_id, payload.reference_path, payload.persist)

@router.get("/files/{file_id}/l3-analysis", response_model=schemas.L3AnalysisResponse)
def get_l3_analysis(
    file_id: str,
    limit_l2: Optional[str] = None,
    rows: int = 100,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return service.get_l3_analysis_data(db, file_id, limit_l2, rows, start_date, end_date)

@router.get("/files/{file_id}/correlation", response_model=schemas.CorrelationResponse)
def get_correlation(file_id: str, db: Session = Depends(get_db)):
    return service.get_correlation_data(db, file_id)

@router.get("/files/{file_id}/weekly-sales", response_model=schemas.WeeklySalesResponse)
def get_weekly_sales(file_id: str, metric: str = "sales", db: Session = Depends(get_db)):
    return service.get_weekly_sales_data(db, file_id, metric)

@router.get("/files/{file_id}/model-group-weekly-sales", response_model=schemas.ModelGroupWeeklySalesResponse)
def get_model_group_weekly_sales(file_id: str, db: Session = Depends(get_db)):
    return service.get_model_group_weekly_sales_data(db, file_id)

@router.post("/files/{file_id}/model-group-weekly-metrics", response_model=schemas.ModelGroupWeeklyMetricsResponse)
def get_model_group_weekly_metrics(file_id: str, payload: schemas.ModelGroupWeeklyMetricsRequest, db: Session = Depends(get_db)):
    return service.get_model_group_weekly_metrics_data(db, file_id, payload)

@router.get("/files/{file_id}/selections", response_model=schemas.ChartSelectionResponse)
def get_chart_selection(file_id: str, db: Session = Depends(get_db)):
    return service.get_chart_selection_data(db, file_id)

@router.post("/files/{file_id}/selections", response_model=schemas.ChartSelectionResponse)
def save_chart_selection(file_id: str, payload: schemas.ChartSelectionRequest, db: Session = Depends(get_db)):
    return service.save_chart_selection_data(db, file_id, payload.l2_values)

@router.post("/files/{file_id}/status")
def update_report_status(file_id: str, payload: schemas.ReportStatusRequest, db: Session = Depends(get_db)):
    return service.update_report_status_data(db, file_id, payload.status)

@router.post("/files/{file_id}/comments", response_model=schemas.ReportCommentResponse)
def add_report_comment(file_id: str, payload: schemas.ReportCommentRequest, db: Session = Depends(get_db)):
    # Using hardcoded user_id=1 for now as per project convention
    return service.add_report_comment_data(db, file_id, 1, payload.comment_text)

@router.get("/files/{file_id}/comments", response_model=List[schemas.ReportCommentResponse])
def get_report_comments(file_id: str, db: Session = Depends(get_db)):
    return service.get_report_comments_data(db, file_id)

@router.get("/files/{file_id}/brand-exclusion", response_model=schemas.BrandExclusionResponse)
async def get_brand_exclusion(
    file_id: str,
    model_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    return await service.get_brand_exclusion_data(file_id, db, model_id)

@router.post("/eda/brand-exclusion/update")
async def update_brand_exclusion(
    payload: schemas.BrandExclusionUpdateRequest,
    db: Session = Depends(get_db)
):
    return service.update_brand_exclusion_result(db, payload)

from . import stack

@router.post("/files/{file_id}/build-stack", response_model=schemas.StackBuildResponse)
async def build_stack(
    file_id: int,
    payload: schemas.StackBuildRequest,
    db: Session = Depends(get_db)
):
    try:
        """
        We pass file_id which belongs to the exclude_flags raw file to the generator.
        """
        result = await stack.build_stack_process(db, file_id, stack_type=payload.stack_type)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/files/{file_id}/build-stack", response_model=schemas.StackBuildResponse)
async def get_built_stack(
    file_id: int,
    stack_type: str = Query("brand"),
    db: Session = Depends(get_db)
):
    try:
        from .service import get_persisted_result
        res = get_persisted_result(db, file_id, f"brand_stacks_build_{stack_type}")
        if not res:
            raise HTTPException(status_code=404, detail="Stack not built yet.")
        return res
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/eda/discovery/{model_id}", response_model=schemas.DiscoveryChartResponse)
async def get_discovery_analysis(
    model_id: int,
    db: Session = Depends(get_db)
):
    try:
        return discovery.get_discovery_data(db, model_id, force_refresh=True)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
@router.post("/eda/discovery/generate-insights", response_model=schemas.AnomalyInsightsResponse)
async def generate_discovery_insights(
    payload: schemas.AnomalyInsightsRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Fetch the project name
        from app.modules.governance.models import Model
        model = db.query(Model).filter(Model.model_id == payload.model_id).first()
        project_name = model.model_name if model else f"model_{payload.model_id}"
        
        # Convert dicts back to DataFrame for the LLM function
        df = pd.DataFrame(payload.records)
        insights = discovery.summarize_observations_llm(df, payload.model_id, project_name)
        return {"agent_insights": insights}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/eda/brand-agg/{model_id}")
async def get_brand_agg_analysis(
    model_id: int,
    db: Session = Depends(get_db)
):
    try:
        return service.get_brand_agg_stack(db, model_id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
