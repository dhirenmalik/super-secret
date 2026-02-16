from fastapi import APIRouter

from app.api.v1.endpoints import files, model_groups_auto, model_group_metrics

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(files.router, tags=["files"])
api_router.include_router(model_groups_auto.router, tags=["model-groups-auto"])
api_router.include_router(model_group_metrics.router, tags=["model-group-metrics"])
