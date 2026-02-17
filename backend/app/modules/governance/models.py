from datetime import datetime
from typing import List
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Table,
    Numeric
)
from sqlalchemy.orm import relationship
from app.core.database import Base

# Cross-module imports for direct relationship resolution
from app.modules.analytics.models import Stack, SubcatAnalysis

# ==========================================================
# RBAC SECTION
# ==========================================================
# Association table for Role-Permission mapping
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.role_id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.permission_id"), primary_key=True),
)

class Role(Base):
    __tablename__ = "roles"
    role_id = Column(Integer, primary_key=True)
    role_name = Column(String(50), unique=True, nullable=False)
    
    users = relationship("User", back_populates="role")
    permissions = relationship(
        "Permission",
        secondary=role_permissions,
        back_populates="roles"
    )

class Permission(Base):
    __tablename__ = "permissions"
    permission_id = Column(Integer, primary_key=True)
    permission_name = Column(String(100), unique=True, nullable=False)
    
    roles = relationship(
        "Role",
        secondary=role_permissions,
        back_populates="permissions"
    )

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True)
    user_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=True) # Nullable for pre-seeded users without passwords for now
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    role = relationship("Role", back_populates="users")
    created_models = relationship("Model", back_populates="creator")

# ==========================================================
# WORKFLOW STAGES
# ==========================================================
class WorkflowStage(Base):
    __tablename__ = "workflow_stages"
    stage_id = Column(Integer, primary_key=True)
    stage_name = Column(String(100), unique=True, nullable=False)
    stage_order = Column(Integer, nullable=False)
    approval_required = Column(Boolean, default=True)

# ==========================================================
# MODELS
# ==========================================================
class Model(Base):
    __tablename__ = "models"
    model_id = Column(Integer, primary_key=True)
    model_name = Column(String(150), nullable=False)
    model_type = Column(String(100))
    status = Column(String(50), default="draft")
    current_stage_id = Column(Integer, ForeignKey("workflow_stages.stage_id"))
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    creator = relationship("User", back_populates="created_models")
    current_stage = relationship("WorkflowStage")
    files = relationship("ModelFile", back_populates="model", cascade="all, delete-orphan")
    approvals = relationship("ModelStageApproval", back_populates="model", cascade="all, delete-orphan")
    
    # Cross-module relationships (will use string references)
    stacks = relationship("Stack", back_populates="model", cascade="all, delete-orphan")
    analyses = relationship("SubcatAnalysis", back_populates="model", cascade="all, delete-orphan")

# ==========================================================
# FILE MANAGEMENT
# ==========================================================
class ModelFile(Base):
    __tablename__ = "model_files"
    file_id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_category = Column(String(50))
    file_stage = Column(String(100))
    storage_type = Column(String(50))
    bucket_name = Column(String(255))
    file_path = Column(String(500))
    file_type = Column(String(50))
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    uploaded_by = Column(Integer, ForeignKey("users.user_id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="uploaded")
    remarks = Column(String(500))
    
    model = relationship("Model", back_populates="files")
    comments = relationship("ReportComment", back_populates="file", cascade="all, delete-orphan")

class ReportComment(Base):
    __tablename__ = "report_comments"
    comment_id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("model_files.file_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    comment_text = Column(String(1000), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    file = relationship("ModelFile", back_populates="comments")
    user = relationship("User")

# ==========================================================
# APPROVAL SYSTEM
# ==========================================================
class ModelStageApproval(Base):
    __tablename__ = "model_stage_approvals"
    approval_id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), nullable=False)
    stage_id = Column(Integer, ForeignKey("workflow_stages.stage_id"), nullable=False)
    status = Column(String(50), default="pending")
    requested_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    reviewed_by = Column(Integer, ForeignKey("users.user_id"))
    requested_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)
    comments = Column(String(500))
    
    model = relationship("Model", back_populates="approvals")
    stage = relationship("WorkflowStage")

class ModelAssignment(Base):
    __tablename__ = "model_assignments"
    assignment_id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

# ==========================================================
# NOTIFICATIONS
# ==========================================================
class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    model_id = Column(Integer, ForeignKey("models.model_id"))
    message = Column(String(500))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
