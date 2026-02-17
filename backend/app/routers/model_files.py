from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.security import get_current_user

router = APIRouter(prefix="/model-files", tags=["model-files"])

@router.post("/", response_model=schemas.ModelFile)
def create_model_file(file: schemas.ModelFileCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_file = models.ModelFile(
        **file.dict(),
        uploaded_by=current_user.user_id,
        uploaded_at=datetime.utcnow(),
        status="uploaded",
        is_active=True
    )
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    return new_file

@router.get("/model/{model_id}", response_model=List[schemas.ModelFile])
def get_model_files(model_id: int, db: Session = Depends(get_db)):
    return db.query(models.ModelFile).filter(models.ModelFile.model_id == model_id).all()

@router.delete("/{file_id}")
def delete_model_file(file_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_file = db.query(models.ModelFile).filter(models.ModelFile.file_id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    db_file.is_active = False
    db.commit()
    return {"message": "File deactivated"}
