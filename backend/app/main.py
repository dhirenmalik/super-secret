from app.modules.analytics import models as _analytics_models
from app.modules.governance import models as _governance_models
from app import models # For seeding access
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm import configure_mappers

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.storage import ensure_upload_root
from app.core.database import SessionLocal, engine, Base

settings = get_settings()

app = FastAPI(title="Walmart ML Governance API", version="1.0.0")

# CORS setup
allow_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
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
    
    # Force registration of all models
    configure_mappers()
    
    # Ensure all tables are created
    Base.metadata.create_all(bind=engine)
    
    from app.core.security import get_password_hash
    db = SessionLocal()
    try:
        # Seed basic roles
        admin_role = db.query(models.Role).filter(models.Role.role_name == "admin").first()
        if not admin_role:
            admin_role = models.Role(role_name="admin")
            db.add(admin_role)
            db.add(models.Role(role_name="modeler"))
            db.add(models.Role(role_name="reviewer"))
            db.commit()
            db.refresh(admin_role)
        
        modeler_role = db.query(models.Role).filter(models.Role.role_name == "modeler").first()
        if not modeler_role:
            # Check if 'creator' exists and rename it, otherwise create new
            creator_role = db.query(models.Role).filter(models.Role.role_name == "creator").first()
            if creator_role:
                creator_role.role_name = "modeler"
                db.commit()
                modeler_role = creator_role
            else:
                modeler_role = models.Role(role_name="modeler")
                db.add(modeler_role)
                db.commit()
                db.refresh(modeler_role)
        reviewer_role = db.query(models.Role).filter(models.Role.role_name == "reviewer").first()
        
        # Ensure default users exist
        hashed_password = get_password_hash("walmart123")
        
        # Admin
        if not db.query(models.User).filter(models.User.email == "admin@walmart.com").first():
            db.add(models.User(
                user_id=1,
                user_name="Admin User",
                email="admin@walmart.com",
                password_hash=hashed_password,
                role_id=admin_role.role_id
            ))
            
        # Creator
        if not db.query(models.User).filter(models.User.email == "abhishek@walmart.com").first():
            db.add(models.User(
                user_id=2,
                user_name="Abhishek",
                email="abhishek@walmart.com",
                password_hash=hashed_password,
                role_id=modeler_role.role_id
            ))
            
        # Reviewer
        if not db.query(models.User).filter(models.User.email == "reviewer@walmart.com").first():
            db.add(models.User(
                user_id=3,
                user_name="Reviewer User",
                email="reviewer@walmart.com",
                password_hash=hashed_password,
                role_id=reviewer_role.role_id
            ))
            
        db.commit()
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "ok", "database": "connected"}

app.include_router(api_router)
