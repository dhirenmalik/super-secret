from typing import List, Dict, Any

from pydantic import BaseModel


class ModelGroupWeeklySalesResponse(BaseModel):
    file_id: str
    group_names: List[str]
    series: List[Dict[str, Any]]
