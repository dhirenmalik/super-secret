from fastapi import APIRouter, HTTPException, Body
from app.services import eda_service
from app.schemas.eda import EdaAnalysisResponse, RelevanceUpdateRequest, RelevanceUpdateResponse

router = APIRouter()

@router.get("/eda/exclude-analysis", response_model=EdaAnalysisResponse)
async def get_exclude_analysis():
    try:
        data = eda_service.get_produce_category_data()
        # Rename keys to match Pydantic schema if needed, but eda_service already does some renaming.
        # Let's verify matches.
        # eda_service returns:
        # 'Category', 'Total_OFFDisplay_Spend', ...
        # 'OFFDisplay_Spend_Share%', 'ONDisplay_Spend_Share%', 'Search_Spend_Share%', 'Sales_Share%', 'Unit_Share%'
        # Pydantic expects:
        # OFFDisplay_Spend_Share_Percentage, ...
        
        # We need to map the % keys to _Percentage keys
        cleaned_data = []
        for item in data:
            cleaned_item = item.copy()
            cleaned_item['OFFDisplay_Spend_Share_Percentage'] = item.pop('OFFDisplay_Spend_Share%', 0)
            cleaned_item['ONDisplay_Spend_Share_Percentage'] = item.pop('ONDisplay_Spend_Share%', 0)
            cleaned_item['Search_Spend_Share_Percentage'] = item.pop('Search_Spend_Share%', 0)
            cleaned_item['Sales_Share_Percentage'] = item.pop('Sales_Share%', 0)
            cleaned_item['Unit_Share_Percentage'] = item.pop('Unit_Share%', 0)
            cleaned_data.append(cleaned_item)
            
        return {"data": cleaned_data}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Source data file not found") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

@router.post("/eda/relevance", response_model=RelevanceUpdateResponse)
async def update_relevance(payload: RelevanceUpdateRequest):
    try:
        return eda_service.update_relevance(payload.category, payload.relevant)
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to update relevance") from exc
