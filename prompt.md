We are building a production-grade ML governance web application.
 
Frontend: React  

 Backend: FastAPI  

 ORM: SQLAlchemy  

 Database: PostgreSQL (production), SQLite/MySQL (development)  

 Migrations: Alembic  
 
I am providing a complete `models.py` file that includes:
 
- RBAC (Roles, Permissions, Role-Permission mapping)

 - Users

 - Workflow Stages

 - Models

 - Multi-stage Model Files (S3/Azure/Local supported)

 - Model Stage Approvals

 - Reviewer Assignments

 - Stacks

 - EDA Results

 - Notifications
 
Your task:
 
1. Integrate this models.py into the FastAPI backend.

 2. Ensure relationships and foreign keys are properly configured.

 3. Make it fully compatible with Alembic migrations.

 4. Create required Pydantic schemas (separate file).

 5. Create basic CRUD routers for:

    - Users

    - Models

    - Model Files

    - Approvals

    - Stacks

 6. Implement RBAC middleware/dependency for permission-based access.

 7. Ensure database session dependency uses get_db().

 8. Follow clean architecture structure:
 
app/

 ├── models.py

 ├── schemas.py

 ├── database.py

 ├── routers/

 ├── services/

 ├── core/

 ├── main.py
 
9. Do NOT use Base.metadata.create_all() in production.

 10. Ensure code is modular and production-ready.
 
Make sure:

 - Role-based access control is enforced.

 - Only reviewers/admin can approve stages.

 - Creators cannot approve their own stages.

 - Model cannot move to next stage unless approved.
 
Generate clean, scalable, and production-safe FastAPI backend code.