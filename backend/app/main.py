from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.storage.file_storage import ensure_upload_root

settings = get_settings()

app = FastAPI(title="WAMM API", version="1.0.0")

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


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(api_router)
