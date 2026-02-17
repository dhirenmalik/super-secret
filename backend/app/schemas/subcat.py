from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class SubcatAnalysisBase(BaseModel):
    model_group: str
    model_name: str
    subcategory_name: str
    estimated_impact: Optional[dict] = None
    configuration: Optional[dict] = None
    linked_artifacts: Optional[List[str]] = None

class SubcatAnalysisCreate(SubcatAnalysisBase):
    pass

class SubcatAnalysisUpdate(BaseModel):
    status: Optional[str] = None
    reviewer_comments: Optional[str] = None

class SubcatAnalysisResponse(SubcatAnalysisBase):
    analysis_id: int
    status: str
    requested_by: int
    reviewed_by: Optional[int]
    requested_at: datetime
    reviewed_at: Optional[datetime]
    reviewer_comments: Optional[str]
    proposal_version: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
