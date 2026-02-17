from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models

def seed_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Create Roles
        admin_role = db.query(models.Role).filter(models.Role.role_name == "Admin").first()
        if not admin_role:
            admin_role = models.Role(role_name="Admin")
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print("Created Admin role")
        
        reviewer_role = db.query(models.Role).filter(models.Role.role_name == "Reviewer").first()
        if not reviewer_role:
            reviewer_role = models.Role(role_name="Reviewer")
            db.add(reviewer_role)
            print("Created Reviewer role")
            
        # 2. Create Default Admin User
        admin_user = db.query(models.User).filter(models.User.email == "admin@walmart.com").first()
        if not admin_user:
            admin_user = models.User(
                user_name="Walmart Admin",
                email="admin@walmart.com",
                role_id=admin_role.role_id,
                is_active=True
            )
            db.add(admin_user)
            print("Created default admin user: admin@walmart.com")
            
        # 3. Create Workflow Stages
        stages = [
            ("Draft", 1, False),
            ("EDAReporting", 2, True),
            ("Modeling", 3, True),
            ("FinalReview", 4, True),
            ("Production", 5, False)
        ]
        
        for name, order, req_app in stages:
            stage = db.query(models.WorkflowStage).filter(models.WorkflowStage.stage_name == name).first()
            if not stage:
                stage = models.WorkflowStage(
                    stage_name=name,
                    stage_order=order,
                    approval_required=req_app
                )
                db.add(stage)
                print(f"Created stage: {name}")
                
        db.commit()
        print("Database seeding completed!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
