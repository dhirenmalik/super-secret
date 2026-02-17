from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app import models
from app.database import get_db
from app.core.security import get_current_user, check_permission
from app.schemas.subcat import (
    SubcatAnalysisCreate,
    SubcatAnalysisUpdate,
    SubcatAnalysisResponse
)

router = APIRouter()

# ==========================================================
# 1. CREATE PROPOSAL (DRAFT)
# ==========================================================
@router.post("/propose", response_model=SubcatAnalysisResponse)
def create_proposal(
    proposal: SubcatAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check for duplicate active proposal
    existing = db.query(models.SubcatAnalysis).filter(
        models.SubcatAnalysis.model_group == proposal.model_group,
        models.SubcatAnalysis.model_name == proposal.model_name,
        models.SubcatAnalysis.is_active == True,
        models.SubcatAnalysis.status.in_(["draft", "pending", "approved"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An active proposal with this Group and Model Name already exists."
        )

    db_proposal = models.SubcatAnalysis(
        model_group=proposal.model_group,
        model_name=proposal.model_name,
        subcategory_name=proposal.subcategory_name,
        estimated_impact=proposal.estimated_impact,
        configuration=proposal.configuration,
        linked_artifacts=proposal.linked_artifacts,
        requested_by=current_user.user_id,
        status="draft"
    )
    
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    return db_proposal


# ==========================================================
# 2. SUBMIT FOR APPROVAL
# ==========================================================
@router.post("/{analysis_id}/submit", response_model=SubcatAnalysisResponse)
def submit_proposal(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    proposal = db.query(models.SubcatAnalysis).filter(
        models.SubcatAnalysis.analysis_id == analysis_id,
        models.SubcatAnalysis.is_active == True
    ).first()
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if proposal.requested_by != current_user.user_id:
        raise HTTPException(status_code=403, detail="Only the creator can submit this proposal")
        
    if proposal.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft proposals can be submitted")
        
    proposal.status = "pending"
    db.commit()
    db.refresh(proposal)
    return proposal


# ==========================================================
# 3. APPROVE PROPOSAL (ADMIN/REVIEWER)
# ==========================================================
@router.post("/{analysis_id}/approve", response_model=SubcatAnalysisResponse)
def approve_proposal(
    analysis_id: int,
    review_data: SubcatAnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # RBAC: Check directly for Admin role or specific permission if needed.
    # Assuming "Reviewer" role or "Admin" can approve.
    if current_user.role.role_name not in ["Admin", "Reviewer"]:
         raise HTTPException(status_code=403, detail="Not authorized to approve proposals")

    proposal = db.query(models.SubcatAnalysis).filter(
        models.SubcatAnalysis.analysis_id == analysis_id
    ).first()
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    # Creator cannot approve own proposal
    if proposal.requested_by == current_user.user_id:
        raise HTTPException(status_code=403, detail="Creators cannot approve their own proposals")
        
    if proposal.status != "pending":
        raise HTTPException(status_code=400, detail="Proposal is not pending approval")

    # Update Proposal Status
    proposal.status = "approved"
    proposal.reviewed_by = current_user.user_id
    proposal.reviewed_at = datetime.utcnow()
    proposal.reviewer_comments = review_data.reviewer_comments
    
    # AUTO-CREATE MODEL IN models TABLE
    # Check if model already exists to avoid duplicates (optional safety check)
    existing_model = db.query(models.Model).filter(models.Model.model_name == proposal.model_name).first()
    if existing_model:
         # Depending on logic, maybe fail or incorrectly link?
         # For now, let's allow duplicates in Model table if name isn't unique, 
         # but usually model_name should be unique.
         pass 

    new_model = models.Model(
        model_name=proposal.model_name,
        model_type="prop_generated", # Indication it came from proposal
        status="active",
        created_by=proposal.requested_by
    )
    db.add(new_model)
    
    db.commit()
    db.refresh(proposal)
    return proposal


# ==========================================================
# 4. REJECT PROPOSAL
# ==========================================================
@router.post("/{analysis_id}/reject", response_model=SubcatAnalysisResponse)
def reject_proposal(
    analysis_id: int,
    review_data: SubcatAnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.role_name not in ["Admin", "Reviewer"]:
         raise HTTPException(status_code=403, detail="Not authorized to reject proposals")

    proposal = db.query(models.SubcatAnalysis).filter(
        models.SubcatAnalysis.analysis_id == analysis_id
    ).first()
    
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
        
    if proposal.status != "pending":
        raise HTTPException(status_code=400, detail="Proposal is not pending approval")

    proposal.status = "rejected"
    proposal.reviewed_by = current_user.user_id
    proposal.reviewed_at = datetime.utcnow()
    proposal.reviewer_comments = review_data.reviewer_comments
    
    db.commit()
    db.refresh(proposal)
    return proposal


# ==========================================================
# 5. LIST PROPOSALS
# ==========================================================
@router.get("/list", response_model=List[SubcatAnalysisResponse])
def list_proposals(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.SubcatAnalysis).filter(models.SubcatAnalysis.is_active == True)
    
    if status:
        query = query.filter(models.SubcatAnalysis.status == status)
        
    # If standard user, maybe only show their own?
    # Logic: Admins/Reviewers see all. Users see their own.
    if current_user.role.role_name not in ["Admin", "Reviewer"]:
        query = query.filter(models.SubcatAnalysis.requested_by == current_user.user_id)
        
    return query.all()
