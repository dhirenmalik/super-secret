from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class RelevanceUpdateRequest(BaseModel):
    category: str
    relevant: bool
    model_id: Optional[int] = None

class BrandExclusionUpdateRequest(BaseModel):
    file_id: int
    model_id: int
    brand: str
    combine_flag: Optional[int] = None
    exclude_flag: Optional[int] = None
    private_brand: Optional[int] = None
    mapping_issue: Optional[int] = None

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

# Stack Build API
class StackBuildRequest(BaseModel):
    stack_type: str = "brand"
    model_id: Optional[int] = None

class StackMatch(BaseModel):
    sales_match: bool
    spends_match: bool

class ValuePair(BaseModel):
    flag_value: float
    df_value: float

class StackActuals(BaseModel):
    sales: ValuePair
    spends: ValuePair

class StackReasons(BaseModel):
    sales_reason: str
    spends_reason: str

class StackBuildResponse(BaseModel):
    totals_match_flag: StackMatch
    actual_values: StackActuals
    reason: StackReasons
    mismatch_amounts: Dict[str, float]

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
    file_id: Any
    rows: List[SubcategorySummaryRow]
    date_bounds: Dict[str, str]
    meta: SubcategorySummaryMeta
    totals: SubcategorySummaryTotals

# L2 Values
class L2ValuesResponse(BaseModel):
    file_id: Any
    l2_values: List[str]

# Model Group Mapping
class ModelGroupRow(BaseModel):
    group_name: str
    l2_values: List[str]

class ModelGroupsResponse(BaseModel):
    file_id: Any
    groups: List[ModelGroupRow]

class ModelGroupsSave(BaseModel):
    groups: List[ModelGroupRow]

# Auto Grouping
class AutoGroupingPreviewResponse(BaseModel):
    file_id: Any
    groups: List[ModelGroupRow]
    historical_groups: List[ModelGroupRow]
    unassigned_l2: List[str]
    warnings: List[str] = []

class AutoGroupingApplyRequest(BaseModel):
    reference_path: str
    persist: bool = True

# Correlation
class CorrelationResponse(BaseModel):
    file_id: Any
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
    file_id: Any
    series: List[Dict[str, Any]]
    yoy: Optional[Dict[str, Any]] = None

# Weekly Sales
class WeeklySalesResponse(BaseModel):
    file_id: Any
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
    file_id: Any
    rows: List[L3AnalysisRow]
    date_bounds: Dict[str, str]
    meta: L3AnalysisMeta

# Model Group Weekly Sales
class ModelGroupWeeklySalesResponse(BaseModel):
    file_id: Any
    group_names: List[str]
    series: List[Dict[str, Any]]

# Chart Selections
class ChartSelectionRequest(BaseModel):
    l2_values: List[str]

class ChartSelectionResponse(BaseModel):
    file_id: Any
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

class SummaryTableBucket(BaseModel):
    type: str
    sales: float
    spends: float
    units: float
    sales_pct: float
    spends_pct: float
    units_pct: float

class BrandExclusionSummary(BaseModel):
    # Part 1: Totals
    total_sales: float
    total_spends: float
    total_units: float
    
    # Part 2: Before Analysis
    part2: List[SummaryTableBucket]
    
    # Part 3: After Analysis
    part3: List[SummaryTableBucket]
    
    # Existing metrics for compatibility
    combine_flag_count: int
    exclude_flag_count: int
    issue_counts: Dict[str, int]

class BrandExclusionResponse(BaseModel):
    file_id: Any
    rows: List[BrandExclusionRow]
    summary: BrandExclusionSummary
    warnings: List[str] = []

# Discovery Tool Schemas
class DiscoveryChartResponse(BaseModel):
    columns: List[str]
    time_series: List[Dict[str, Any]]
    anomalies: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None
    yoy_change: Optional[Dict[str, Any]] = None
    overall_period: Optional[Dict[str, Any]] = None
    key_metrics_summary: Optional[List[Dict[str, Any]]] = None
    media_mix: Optional[List[Dict[str, Any]]] = None
    on_air_analysis: Optional[List[Dict[str, Any]]] = None
    value_added: Optional[List[Dict[str, Any]]] = None
    time_periods: Optional[Dict[str, Any]] = None
    charts: Optional[Dict[str, Any]] = None

class AnomalyRecord(BaseModel):
    Tactic_Prefix: str
    Anomaly_Date: str
    Reason: str
    Priority: float
    Impressions: float
    Spend: float
    CPM: float
    Z: float
    Brands_list: Optional[str] = None
    SourceFile: str
    Severity_Score: Optional[float] = None
    Severity_Band: Optional[str] = None

class AnomalyResponse(BaseModel):
    records: List[AnomalyRecord]

class AnomalyInsightsRequest(BaseModel):
    model_id: int
    records: List[Dict[str, Any]]

class AnomalyInsightsResponse(BaseModel):
    agent_insights: str

# Mapping Issues
class MappingIssueBase(BaseModel):
    brand_name: str
    issue_description: Optional[str] = None
    is_active: bool = True

class MappingIssueCreate(MappingIssueBase):
    pass

class MappingIssueUpdate(BaseModel):
    brand_name: Optional[str] = None
    issue_description: Optional[str] = None
    is_active: Optional[bool] = None

class MappingIssueResponse(MappingIssueBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Private Brands
class PrivateBrandBase(BaseModel):
    brand_name: str
    is_active: bool = True

class PrivateBrandCreate(PrivateBrandBase):
    pass

class PrivateBrandUpdate(BaseModel):
    brand_name: Optional[str] = None
    is_active: Optional[bool] = None

class PrivateBrandResponse(PrivateBrandBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
