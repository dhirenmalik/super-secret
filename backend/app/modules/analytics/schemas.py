from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class RelevanceUpdateRequest(BaseModel):
    category: str
    relevant: bool

# Stack Schemas
class StackBase(BaseModel):
    stack_name: Optional[str] = None
    stack_version: Optional[str] = None

class StackCreate(StackBase):
    model_id: int

class Stack(StackBase):
    stack_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# EDA / Subcat Schemas
class SubcatAnalysisBase(BaseModel):
    subcategory: str
    sales: float
    units: float
    avg_price: float
    total_spends: float
    search_spends: float
    onsite_display_spends: float
    offsite_display_spends: float
    spends_per_sales: float
    sales_share_pct: float
    unit_share_pct: float
    total_spends_pct: float

class SubcatAnalysis(SubcatAnalysisBase):
    analysis_id: int
    model_id: int
    class Config:
        from_attributes = True

class SubcategorySummaryRow(BaseModel):
    subcategory: str
    sales: float
    units: float
    avg_price: float
    total_spends: float
    search_spends: float
    onsite_display_spends: float
    offsite_display_spends: float
    spends_per_sales: float
    sales_share_pct: float
    unit_share_pct: float
    total_spends_pct: float
    search_spends_pct: float
    onsite_display_spends_pct: float
    offsite_display_spends_pct: float

class SubcategorySummaryMeta(BaseModel):
    unique_l2: int
    row_count: int

class SubcategorySummaryTotals(BaseModel):
    sales: float
    units: float
    total_spends: float

class SubcategorySummaryResponse(BaseModel):
    file_id: str
    rows: List[SubcategorySummaryRow]
    date_bounds: Dict[str, str]
    meta: SubcategorySummaryMeta
    totals: SubcategorySummaryTotals

# L2 Values
class L2ValuesResponse(BaseModel):
    file_id: str
    l2_values: List[str]

# Model Group Mapping
class ModelGroupRow(BaseModel):
    group_name: str
    l2_values: List[str]

class ModelGroupsResponse(BaseModel):
    file_id: str
    groups: List[ModelGroupRow]

class ModelGroupsSave(BaseModel):
    groups: List[ModelGroupRow]

# Auto Grouping
class AutoGroupingPreviewResponse(BaseModel):
    file_id: str
    groups: List[ModelGroupRow]
    historical_groups: List[ModelGroupRow]
    unassigned_l2: List[str]
    warnings: List[str] = []

class AutoGroupingApplyRequest(BaseModel):
    reference_path: str
    persist: bool = True

# Correlation
class CorrelationResponse(BaseModel):
    file_id: str
    l2_values: List[str]
    matrix: List[List[float]]

# Model Group Weekly Metrics
class ModelGroupWeeklyMetricsRequest(BaseModel):
    group_names: List[str]
    metric: str = "sales"
    include_spends: bool = True
    window_weeks: int = 104
    l2_values: Optional[List[str]] = None

class ModelGroupWeeklyMetricsResponse(BaseModel):
    file_id: str
    series: List[Dict[str, Any]]
    yoy: Optional[Dict[str, Any]] = None

# Weekly Sales
class WeeklySalesResponse(BaseModel):
    file_id: str
    l2_values: List[str]
    series: List[Dict[str, Any]]

# L3 Analysis
class L3AnalysisRow(BaseModel):
    l2: str
    l3: str
    sales: float
    units: float
    onsite_display_spends: float
    total: float

class L3AnalysisMeta(BaseModel):
    unique_l2: int
    unique_l3: int
    row_count: int

class L3AnalysisResponse(BaseModel):
    file_id: str
    rows: List[L3AnalysisRow]
    date_bounds: Dict[str, str]
    meta: L3AnalysisMeta

# Model Group Weekly Sales
class ModelGroupWeeklySalesResponse(BaseModel):
    file_id: str
    group_names: List[str]
    series: List[Dict[str, Any]]

# Chart Selections
class ChartSelectionRequest(BaseModel):
    l2_values: List[str]

class ChartSelectionResponse(BaseModel):
    file_id: str
    l2_values: List[str]
    updated_at: datetime

# Report Status & Comments
class ReportStatusRequest(BaseModel):
    status: str

class ReportCommentRequest(BaseModel):
    comment_text: str

class ReportCommentResponse(BaseModel):
    comment_id: int
    user_id: int
    user_name: str
    comment_text: str
    created_at: datetime

# Brand Exclusion Analysis
class BrandExclusionRow(BaseModel):
    brand: str
    sales_share: float
    spend_share: float
    unit_share: float
    private_brand: int
    mapping_issue: int
    combine_flag: Optional[int] = None
    exclude_flag: int
    reason_issue_type: str
    sum_sales: float
    sum_spend: float
    sum_units: float

class BrandExclusionSummary(BaseModel):
    combine_flag_count: int
    exclude_flag_count: int
    issue_counts: Dict[str, int]

class BrandExclusionResponse(BaseModel):
    file_id: str
    rows: List[BrandExclusionRow]
    summary: BrandExclusionSummary
    warnings: List[str] = []
