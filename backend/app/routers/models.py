from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.security import get_current_user

router = APIRouter(prefix="/models", tags=["models"])

@router.post("/", response_model=schemas.Model)
def create_model(model: schemas.ModelCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Default initial stage
    if not model.current_stage_id:
        initial_stage = db.query(models.WorkflowStage).order_by(models.WorkflowStage.stage_order.asc()).first()
        if not initial_stage:
            # Create a default stage if none exists
            initial_stage = models.WorkflowStage(stage_name="Draft", stage_order=1, approval_required=False)
            db.add(initial_stage)
            db.commit()
            db.refresh(initial_stage)
        model.current_stage_id = initial_stage.stage_id

    new_model = models.Model(
        model_name=model.model_name,
        model_type=model.model_type,
        created_by=current_user.user_id,
        current_stage_id=model.current_stage_id,
        status="draft"
    )
    db.add(new_model)
    db.commit()
    db.refresh(new_model)
    return new_model

@router.get("/", response_model=List[schemas.Model])
def read_models(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    models_list = db.query(models.Model).offset(skip).limit(limit).all()
    return models_list

@router.get("/{model_id}", response_model=schemas.Model)
def read_model(model_id: int, db: Session = Depends(get_db)):
    db_model = db.query(models.Model).filter(models.Model.model_id == model_id).first()
    if db_model is None:
        raise HTTPException(status_code=404, detail="Model not found")
    return db_model

@router.patch("/{model_id}", response_model=schemas.Model)
def update_model(model_id: int, model_update: schemas.ModelUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_model = db.query(models.Model).filter(models.Model.model_id == model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Logic for stage progression
    if model_update.current_stage_id and model_update.current_stage_id != db_model.current_stage_id:
        # Check if current stage required approval and if it was approved
        current_stage = db_model.current_stage
        if current_stage and current_stage.approval_required:
            latest_approval = db.query(models.ModelStageApproval)\
                .filter(models.ModelStageApproval.model_id == model_id)\
                .filter(models.ModelStageApproval.stage_id == db_model.current_stage_id)\
                .order_by(models.ModelStageApproval.requested_at.desc())\
                .first()
            
            if not latest_approval or latest_approval.status != "approved":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot move to next stage without approval of current stage"
                )

    update_data = model_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_model, key, value)
    
    db.commit()
    db.refresh(db_model)
    return db_model
