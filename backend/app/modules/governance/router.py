from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.rbac import admin_only, get_current_user, PermissionChecker
from pydantic import BaseModel
from . import service, schemas, models

router = APIRouter(tags=["governance"])

# Users
@router.post("/users", response_model=schemas.User)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return service.create_user(db, user_in)

@router.get("/users", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return db.query(models.User).all()

# Models
@router.post("/models", response_model=schemas.Model)
def create_model(
    model_in: schemas.ModelCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(PermissionChecker("create_model"))
):
    return service.create_model(db, model_in, current_user.user_id)

@router.get("/models", response_model=List[schemas.Model])
def list_models(db: Session = Depends(get_db)):
    from app.modules.analytics.models import DiscoveryStack
    db_models = db.query(models.Model).filter(models.Model.is_deleted == False).all()
    result = []
    
    # Pre-fetch all built stack model IDs to avoid N+1 queries
    built_stacks = db.query(DiscoveryStack.model_id).filter(DiscoveryStack.stack_type == 'modeling_stack').distinct().all()
    built_model_ids = {s.model_id for s in built_stacks}

    for m in db_models:
        m_dict = schemas.Model(
            model_id=m.model_id,
            model_name=m.model_name,
            model_type=m.model_type,
            status=m.status,
            exclude_status=m.exclude_status,
            brand_status=m.brand_status,
            discovery_status=m.discovery_status,
            eda_email_status=m.eda_email_status,
            current_stage_id=m.current_stage_id,
            created_at=m.created_at,
            created_by=m.created_by,
            stack_built=(m.model_id in built_model_ids)
        )
        result.append(m_dict)
    return result

@router.get("/models/{model_id}", response_model=schemas.Model)
def get_model(model_id: int, db: Session = Depends(get_db)):
    model = db.query(models.Model).filter(models.Model.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@router.delete("/models/{model_id}")
def delete_model(
    model_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    success = service.soft_delete_model(db, model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Model deleted successfully"}

class StageStatusUpdate(BaseModel):
    stage: str
    status: str

@router.post("/models/{model_id}/stage-status")
def update_model_stage_status(
    model_id: int,
    payload: StageStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    valid_stages = ['exclude', 'brand', 'discovery', 'eda_email']
    valid_statuses = ['in_progress', 'in_review', 'approved', 'rejected']
    
    if payload.stage not in valid_stages:
        raise HTTPException(status_code=400, detail="Invalid stage")
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    model = db.query(models.Model).filter(models.Model.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    # Update the specific stage status
    if payload.stage == 'exclude':
        model.exclude_status = payload.status
        if payload.status == 'approved' and model.brand_status == 'not_started':
            model.brand_status = 'in_progress'
    elif payload.stage == 'brand':
        model.brand_status = payload.status
        if payload.status == 'approved' and model.discovery_status == 'not_started':
            model.discovery_status = 'in_progress'
    elif payload.stage == 'discovery':
        model.discovery_status = payload.status
        if payload.status == 'approved' and model.eda_email_status == 'not_started':
            model.eda_email_status = 'in_progress'
    elif payload.stage == 'eda_email':
        model.eda_email_status = payload.status
        
    db.commit()
    db.refresh(model)
    return {"message": f"{payload.stage} status updated to {payload.status}", "model_id": model.model_id}
