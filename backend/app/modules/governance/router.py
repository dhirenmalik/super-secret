from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.rbac import admin_only, get_current_user, PermissionChecker
from . import service, schemas, models

router = APIRouter(tags=["governance"])

# Users
@router.post("/users", response_model=schemas.User)
def create_user(user_in: schemas.UserCreate, db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return service.create_user(db, user_in)

@router.get("/users", response_model=List[schemas.User])
def list_users(db: Session = Depends(get_db), current_user = Depends(admin_only)):
    return db.query(models.User).all()

# Models
@router.post("/models", response_model=schemas.Model)
def create_model(
    model_in: schemas.ModelCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(PermissionChecker("create_model"))
):
    return service.create_model(db, model_in, current_user.user_id)

@router.get("/models", response_model=List[schemas.Model])
def list_models(db: Session = Depends(get_db)):
    return db.query(models.Model).filter(models.Model.is_deleted == False).all()

@router.get("/models/{model_id}", response_model=schemas.Model)
def get_model(model_id: int, db: Session = Depends(get_db)):
    model = db.query(models.Model).filter(models.Model.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@router.delete("/models/{model_id}")
def delete_model(
    model_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    success = service.soft_delete_model(db, model_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Model deleted successfully"}
