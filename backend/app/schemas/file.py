from typing import List, Dict, Any

from pydantic import BaseModel


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    saved_path: str | None = None


class PreviewResponse(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    row_count_returned: int


class L2ValuesResponse(BaseModel):
    file_id: str
    l2_values: List[str]


class ModelGroup(BaseModel):
    group_id: int | None = None
    group_name: str
    l2_values: List[str]


class ModelGroupMapping(BaseModel):
    file_id: str
    groups: List[ModelGroup]
    updated_at: str | None = None


class ModelGroupSaveRequest(BaseModel):
    groups: List[ModelGroup]


class SubcategorySummaryTotals(BaseModel):
    sales: float
    units: float
    total_spends: float


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


class SubcategorySummaryResponse(BaseModel):
    file_id: str
    totals: SubcategorySummaryTotals
    date_bounds: Dict[str, str]
    rows: List[SubcategorySummaryRow]
