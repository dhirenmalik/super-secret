from fastapi import APIRouter
# Import Analytics FIRST to ensure its models are registered before Governance models reference them
from app.modules.analytics.router import router as analytics_router
from app.modules.governance.router import router as governance_router
from app.modules.governance.auth import router as auth_router
from app.modules.connections.router import router as connections_router

api_router = APIRouter(prefix="/api/v1")

# Modularized Routers
api_router.include_router(analytics_router)
api_router.include_router(governance_router)
api_router.include_router(connections_router)
api_router.include_router(auth_router)
