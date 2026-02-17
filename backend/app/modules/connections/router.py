from fastapi import APIRouter, HTTPException
from . import schemas, service

router = APIRouter(prefix="/connections", tags=["connections"])

@router.post("/test", response_model=schemas.ConnectionTestResponse)
async def test_connection(config: schemas.ConnectionTestRequest):
    return await service.test_connection(config)

@router.post("/save")
async def save_connection(config: schemas.ConnectionTestRequest):
    # In a real implementation, this would persist the config to the database.
    return {"status": "success", "message": "Connection configuration saved."}
