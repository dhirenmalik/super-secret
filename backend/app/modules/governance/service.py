import os
from typing import Tuple, List, Dict, Any
from uuid import uuid4
from sqlalchemy.orm import Session
from .models import ModelFile, User, Model, Role
from .schemas import UserCreate, ModelCreate

# Constants
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

def create_user(db: Session, user_in: UserCreate) -> User:
    db_user = User(
        user_name=user_in.user_name,
        email=user_in.email,
        role_id=user_in.role_id,
        is_active=user_in.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_model(db: Session, model_in: ModelCreate, user_id: int) -> Model:
    db_model = Model(
        model_name=model_in.model_name,
        model_type=model_in.model_type,
        created_by=user_id,
        status="draft"
    )
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model

def register_file(db: Session, file_name: str, file_path: str, model_id: int = None, uploaded_by: int = None, category: str = None) -> ModelFile:
    db_file = ModelFile(
        model_id=model_id,
        file_name=file_name,
        file_path=file_path,
        file_category=category,
        file_type="csv" if file_name.lower().endswith(".csv") else "parquet",
        uploaded_by=uploaded_by,
        status="uploaded"
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file
