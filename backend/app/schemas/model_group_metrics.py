from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ModelGroupMetricsRequest(BaseModel):
    group_names: List[str]
    metric: str = "sales"  # "sales" or "units"
    include_spends: bool = True
    window_weeks: int = 104

class WeeklyMetricSeries(BaseModel):
    week_start_date: str
    metric_value: float
    search_spend: float
    onsite_spend: float
    offsite_spend: float

class YoYMetrics(BaseModel):
    sales_yoy_pct: Optional[float]
    units_yoy_pct: Optional[float]
    spends_yoy_pct: Optional[float]

class ModelGroupMetricsResponse(BaseModel):
    file_id: str
    series: List[WeeklyMetricSeries]
    yoy: YoYMetrics
    meta: Dict[str, Any]
