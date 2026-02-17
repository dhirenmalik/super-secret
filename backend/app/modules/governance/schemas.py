from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr

# RBAC Schemas
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
    permission_ids: List[int] = []

class Role(RoleBase):
    role_id: int
    permissions: List[Permission] = []
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    user_name: str
    email: EmailStr
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    role_id: int

class User(UserBase):
    user_id: int
    created_at: datetime
    role: Role
    class Config:
        from_attributes = True

# Workflow Schemas
class WorkflowStageBase(BaseModel):
    stage_name: str
    stage_order: int
    approval_required: bool = True

class WorkflowStage(WorkflowStageBase):
    stage_id: int
    class Config:
        from_attributes = True

# Model Schemas
class ModelBase(BaseModel):
    model_name: str
    model_type: Optional[str] = None

class ModelCreate(ModelBase):
    pass

class Model(ModelBase):
    model_id: int
    status: str
    current_stage_id: Optional[int]
    created_at: datetime
    created_by: int
    class Config:
        from_attributes = True

# File Schemas
class ModelFileBase(BaseModel):
    file_name: str
    file_category: Optional[str] = None
    file_stage: Optional[str] = None
    storage_type: Optional[str] = "local"
    bucket_name: Optional[str] = None
    file_path: str
    file_type: str
    version: int = 1

class ModelFileCreate(ModelFileBase):
    model_id: Optional[int] = None

class ModelFile(ModelFileBase):
    file_id: int
    status: str
    uploaded_at: datetime
    class Config:
        from_attributes = True

# Approval Schemas
class ApprovalBase(BaseModel):
    comments: Optional[str] = None

class ApprovalCreate(ApprovalBase):
    model_id: int
    stage_id: int

class ApprovalAction(ApprovalBase):
    status: str # approved / rejected

class Approval(ApprovalBase):
    approval_id: int
    model_id: int
    stage_id: int
    status: str
    requested_by: int
    reviewed_by: Optional[int]
    requested_at: datetime
    reviewed_at: Optional[datetime]
    class Config:
        from_attributes = True
