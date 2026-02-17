from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router as v1_router
from app.api.v1.routers.subcat import router as subcat_router
from app.routers.api import api_router as governance_router
from app.core.config import get_settings
from app.storage.file_storage import ensure_upload_root

settings = get_settings()

app = FastAPI(title="WAMM AI - ML Governance API", version="2.0.0")

allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    ensure_upload_root()
    # Note: In production, migrations should be run via Alembic CLI
    # For development, we can use Base.metadata.create_all(bind=engine) 
    # but the prompt specifically requested NOT to use it in production.


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(v1_router)
app.include_router(subcat_router, prefix="/api/v1/subcat", tags=["subcat-analysis"])
app.include_router(governance_router, prefix="/api/governance")
