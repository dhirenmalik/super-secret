from typing import List

from pydantic import BaseModel


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
    date_bounds: dict
    meta: L3AnalysisMeta
