from fastapi import APIRouter
from app.routers import users, models, model_files, approvals, stacks

api_router = APIRouter()

api_router.include_router(users.router)
api_router.include_router(models.router)
api_router.include_router(model_files.router)
api_router.include_router(approvals.router)
api_router.include_router(stacks.router)
