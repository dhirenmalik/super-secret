from typing import List, Dict, Any

from pydantic import BaseModel


class WeeklySalesResponse(BaseModel):
    file_id: str
    metric: str
    l2_values: List[str]
    series: List[Dict[str, Any]]
