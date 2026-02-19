from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Numeric,
    DateTime
)
from sqlalchemy.orm import relationship
from app.core.database import Base

# ==========================================================
# STACKS
# ==========================================================
class Stack(Base):
    __tablename__ = "stacks"
    stack_id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), nullable=False)
    stack_name = Column(String(150))
    stack_version = Column(String(50))
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to Model (Governance)
    model = relationship("Model", back_populates="stacks")

# ==========================================================
# EDA RESULTS
# ==========================================================
class EDAResult(Base):
    __tablename__ = "eda_results"
    eda_id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), nullable=False)
    stack_id = Column(Integer, ForeignKey("stacks.stack_id"), nullable=False)
    metric_name = Column(String(150))
    metric_value = Column(Numeric(15, 4))
    generated_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)

# ==========================================================
# ANALYTICAL EXTENSIONS
# ==========================================================
class SubcatAnalysis(Base):
    __tablename__ = "subcategory_analysis"
    analysis_id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), nullable=False)
    subcategory = Column(String(150), nullable=False)
    sales = Column(Numeric(15, 2), default=0.0)
    units = Column(Numeric(15, 2), default=0.0)
    avg_price = Column(Numeric(15, 2), default=0.0)
    total_spends = Column(Numeric(15, 2), default=0.0)
    search_spends = Column(Numeric(15, 2), default=0.0)
    onsite_display_spends = Column(Numeric(15, 2), default=0.0)
    offsite_display_spends = Column(Numeric(15, 2), default=0.0)
    spends_per_sales = Column(Numeric(15, 4), default=0.0)
    sales_share_pct = Column(Numeric(10, 2), default=0.0)
    unit_share_pct = Column(Numeric(10, 2), default=0.0)
    total_spends_pct = Column(Numeric(10, 2), default=0.0)
    
    model = relationship("Model", back_populates="analyses")

class ModelGroup(Base):
    __tablename__ = "model_groups"
    group_id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), nullable=False)
    group_name = Column(String(150), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    l2_mappings = relationship("ModelGroupL2", back_populates="group", cascade="all, delete-orphan")

class ModelGroupL2(Base):
    __tablename__ = "model_group_l2_mappings"
    mapping_id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("model_groups.group_id"), nullable=False)
    l2_value = Column(String(150), nullable=False)
    
    group = relationship("ModelGroup", back_populates="l2_mappings")

class ChartSelection(Base):
    __tablename__ = "chart_selections"
    selection_id = Column(Integer, primary_key=True)
    file_id = Column(String(255), nullable=False) # Reference to uploaded file ID
    l2_values = Column(String(2000)) # Stored as comma-separated or JSON string
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

from sqlalchemy import UniqueConstraint

class SubcategoryRelevanceMapping(Base):
    __tablename__ = "subcategory_relevance_mappings"
    mapping_id = Column(Integer, primary_key=True)
    model_id = Column(Integer, ForeignKey("models.model_id"), nullable=True) # Optional for now to keep global fallback
    subcategory = Column(String(150), nullable=False)
    is_relevant = Column(Numeric(1), default=1) # 1 for YES, 0 for NO
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint('model_id', 'subcategory', name='_model_subcat_uc'),)

class AnalyticalResult(Base):
    __tablename__ = "analytical_results"
    result_id = Column(Integer, primary_key=True)
    file_id = Column(Integer, ForeignKey("model_files.file_id"), nullable=False)
    result_type = Column(String(100), nullable=False) # e.g., 'subcategory_summary', 'l3_analysis', 'correlation', 'weekly_sales', 'brand_exclusion'
    result_data = Column(String(1000000)) # JSON encoded string
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint('file_id', 'result_type', name='_file_result_uc'),)
