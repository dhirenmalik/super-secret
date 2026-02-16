from typing import List

from pydantic import BaseModel


class CorrelationResponse(BaseModel):
    file_id: str
    l2_values: List[str]
    matrix: List[List[float]]
