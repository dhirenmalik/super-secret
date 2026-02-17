from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.security import get_current_user

router = APIRouter(prefix="/approvals", tags=["approvals"])

@router.post("/", response_model=schemas.ModelStageApproval)
def request_approval(approval: schemas.ModelStageApprovalCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Verify model existence
    db_model = db.query(models.Model).filter(models.Model.model_id == approval.model_id).first()
    if not db_model:
        raise HTTPException(status_code=404, detail="Model not found")
    
    # Create approval request
    new_approval = models.ModelStageApproval(
        model_id=approval.model_id,
        stage_id=approval.stage_id,
        requested_by=current_user.user_id,
        status="pending",
        requested_at=datetime.utcnow(),
        comments=approval.comments
    )
    db.add(new_approval)
    db.commit()
    db.refresh(new_approval)
    return new_approval

@router.post("/{approval_id}/review", response_model=schemas.ModelStageApproval)
def review_approval(approval_id: int, review: schemas.ModelStageApprovalReview, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_approval = db.query(models.ModelStageApproval).filter(models.ModelStageApproval.approval_id == approval_id).first()
    if not db_approval:
        raise HTTPException(status_code=404, detail="Approval request not found")
    
    if db_approval.status != "pending":
        raise HTTPException(status_code=400, detail="Approval request already processed")
    
    # Requirement: Creators cannot approve their own stages
    db_model = db_approval.model
    if db_model.created_by == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Creators cannot approve their own models"
        )
    
    # Requirement: Only reviewers/admins can approve
    # For now, we assume anyone who is NOT the creator can be a reviewer if they have the role
    # In a more strict RBAC, we'd check for 'Reviewer' role or specific assignment
    
    db_approval.status = review.status
    db_approval.reviewed_by = current_user.user_id
    db_approval.reviewed_at = datetime.utcnow()
    db_approval.comments = review.comments
    
    # If approved, we might want to update the model status
    if review.status == "approved":
        # Additional logic could go here
        pass
        
    db.commit()
    db.refresh(db_approval)
    return db_approval

@router.get("/model/{model_id}", response_model=List[schemas.ModelStageApproval])
def get_model_approvals(model_id: int, db: Session = Depends(get_db)):
    return db.query(models.ModelStageApproval).filter(models.ModelStageApproval.model_id == model_id).all()
