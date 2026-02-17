from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Role, Permission

# Dependency to get current user (Mock implementation for now)
# In a real app, this would verify a JWT token
# Dependency to get current user (Mock implementation for now)
# In a real app, this would verify a JWT token
def get_current_user(db: Session = Depends(get_db)):
    # For now, return the first user as a placeholder
    user = db.query(User).first()
    if not user:
        # Create a default admin user if none exists for demo/dev
        admin_role = db.query(Role).filter(Role.role_name == "Admin").first()
        if not admin_role:
            admin_role = Role(role_name="Admin")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        
        user = User(
            user_name="Default Admin",
            email="admin@example.com",
            role_id=admin_role.role_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def check_permission(permission_name: str):
    def permission_dependency(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        permissions = [p.permission_name for p in current_user.role.permissions]
        if current_user.role.role_name == "Admin":
            return True
        if permission_name not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing permission: {permission_name}"
            )
        return True
    return permission_dependency

def is_admin(current_user: User = Depends(get_current_user)):
    if current_user.role.role_name != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins can perform this action"
        )
    return True
