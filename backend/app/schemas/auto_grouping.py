from typing import List, Dict, Any

from pydantic import BaseModel


class AutoGroupingResponse(BaseModel):
    file_id: str
    reference_path: str
    groups: List[Dict[str, Any]]
    historical_groups: List[Dict[str, Any]]
    unassigned_l2: List[str]
    warnings: List[str]


class AutoGroupingRequest(BaseModel):
    reference_path: str
    persist: bool = False
