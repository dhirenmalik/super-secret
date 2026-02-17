from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.core.security import get_current_user

router = APIRouter(prefix="/stacks", tags=["stacks"])

@router.post("/", response_model=schemas.Stack)
def create_stack(stack: schemas.StackCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    new_stack = models.Stack(
        **stack.dict(),
        created_by=current_user.user_id,
        created_at=datetime.utcnow()
    )
    db.add(new_stack)
    db.commit()
    db.refresh(new_stack)
    return new_stack

@router.get("/model/{model_id}", response_model=List[schemas.Stack])
def get_model_stacks(model_id: int, db: Session = Depends(get_db)):
    return db.query(models.Stack).filter(models.Stack.model_id == model_id).all()

@router.post("/{stack_id}/eda", response_model=schemas.EDAResult)
def add_eda_result(result: schemas.EDAResultCreate, stack_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if result.stack_id != stack_id:
        raise HTTPException(status_code=400, detail="Stack ID mismatch")
    
    new_result = models.EDAResult(
        **result.dict(),
        generated_by=current_user.user_id,
        generated_at=datetime.utcnow()
    )
    db.add(new_result)
    db.commit()
    db.refresh(new_result)
    return new_result
