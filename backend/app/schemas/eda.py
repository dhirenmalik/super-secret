from pydantic import BaseModel

class EdaAnalysisItem(BaseModel):
    Category: str
    Total_OFFDisplay_Spend: float
    Total_ONDisplay_Spend: float
    Total_Search_Spend: float
    Total_Sales: float
    Total_Units: float
    AVG_PRICE: float
    OFFDisplay_Spend_Share_Percentage: float
    ONDisplay_Spend_Share_Percentage: float
    Search_Spend_Share_Percentage: float
    Sales_Share_Percentage: float
    Unit_Share_Percentage: float
    Relevant: str

    class Config:
        allow_population_by_field_name = True

class EdaAnalysisResponse(BaseModel):
    data: list[EdaAnalysisItem]

class RelevanceUpdateRequest(BaseModel):
    category: str
    relevant: bool

class RelevanceUpdateResponse(BaseModel):
    status: str
    category: str
    relevant: str
