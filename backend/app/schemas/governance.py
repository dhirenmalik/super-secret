from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

# ==========================================================
# RBAC SCHEMAS
# ==========================================================

class PermissionBase(BaseModel):
    permission_name: str

class PermissionCreate(PermissionBase):
    pass

class Permission(PermissionBase):
    permission_id: int

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    role_name: str

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    role_id: int
    permissions: List[Permission] = []

    class Config:
        from_attributes = True

# ==========================================================
# USER SCHEMAS
# ==========================================================

class UserBase(BaseModel):
    user_name: str
    email: EmailStr
    is_active: bool = True

class UserCreate(UserBase):
    role_id: int

class User(UserBase):
    user_id: int
    role: Role
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================================
# WORKFLOW STAGES
# ==========================================================

class WorkflowStageBase(BaseModel):
    stage_name: str
    stage_order: int
    approval_required: bool = True

class WorkflowStageCreate(WorkflowStageBase):
    pass

class WorkflowStage(WorkflowStageBase):
    stage_id: int

    class Config:
        from_attributes = True

# ==========================================================
# FILE SCHEMAS
# ==========================================================

class ModelFileBase(BaseModel):
    file_name: str
    file_guid: Optional[str] = None
    file_category: Optional[str] = None
    file_stage: Optional[str] = None
    storage_type: str  # local / s3 / azure
    bucket_name: Optional[str] = None
    file_path: str
    file_type: str  # csv / parquet
    version: int = 1
    remarks: Optional[str] = None

class ModelFileCreate(ModelFileBase):
    model_id: int
    uploaded_by: Optional[int] = None

class ModelFile(ModelFileBase):
    file_id: int
    model_id: int
    uploaded_by: Optional[int]
    uploaded_at: datetime
    status: str
    is_active: bool

    class Config:
        from_attributes = True

# ==========================================================
# MODEL GROUP SCHEMAS
# ==========================================================

class ModelGroupBase(BaseModel):
    group_name: str
    l2_values: List[str]

class ModelGroupCreate(ModelGroupBase):
    model_id: int

class ModelGroup(ModelGroupBase):
    group_id: int
    model_id: int
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# ==========================================================
# APPROVAL SCHEMAS
# ==========================================================

class ModelStageApprovalBase(BaseModel):
    model_id: int
    stage_id: int
    comments: Optional[str] = None

class ModelStageApprovalCreate(ModelStageApprovalBase):
    requested_by: int

class ModelStageApprovalReview(BaseModel):
    status: str  # approved / rejected
    comments: Optional[str] = None
    reviewed_by: int

class ModelStageApproval(ModelStageApprovalBase):
    approval_id: int
    status: str
    requested_by: int
    reviewed_by: Optional[int]
    requested_at: datetime
    reviewed_at: Optional[datetime]
    stage: WorkflowStage

    class Config:
        from_attributes = True

# ==========================================================
# MODEL SCHEMAS
# ==========================================================

class ModelBase(BaseModel):
    model_name: str
    model_type: Optional[str] = None

class ModelCreate(ModelBase):
    created_by: int
    current_stage_id: Optional[int] = None

class ModelUpdate(BaseModel):
    model_name: Optional[str] = None
    model_type: Optional[str] = None
    status: Optional[str] = None
    current_stage_id: Optional[int] = None

class Model(ModelBase):
    model_id: int
    status: str
    current_stage_id: Optional[int]
    created_by: int
    created_at: datetime
    
    # Optional relationships to include when needed
    current_stage: Optional[WorkflowStage] = None
    files: List[ModelFile] = []
    
    class Config:
        from_attributes = True

# ==========================================================
# STACK & EDA SCHEMAS
# ==========================================================

class StackBase(BaseModel):
    stack_name: Optional[str] = None
    stack_version: Optional[str] = None

class StackCreate(StackBase):
    model_id: int
    created_by: int

class Stack(StackBase):
    stack_id: int
    model_id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

class EDAResultBase(BaseModel):
    metric_name: str
    metric_value: float

class EDAResultCreate(EDAResultBase):
    model_id: int
    stack_id: int
    generated_by: int

class EDAResult(EDAResultBase):
    eda_id: int
    model_id: int
    stack_id: int
    generated_at: datetime

    class Config:
        from_attributes = True

# ==========================================================
# NOTIFICATION SCHEMAS
# ==========================================================

class NotificationBase(BaseModel):
    message: str
    model_id: Optional[int] = None

class Notification(NotificationBase):
    notification_id: int
    user_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
