# Backend - Walmart ML Governance API

This is the FastAPI backend for the Walmart ML Governance tool.

## Technical Stack
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Database**: SQLite (default dev), PostgreSQL (production)
- **Migrations**: Alembic

## Installation & Startup

1. Install dependencies via Conda (Python 3.12 recommended):
   ```bash
   conda create -n py312 python=3.12 -y
   conda activate py312
   pip install -r requirements.txt
   ```

2. Configuration:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=sqlite:///./sql_app.db
   # For PostgreSQL:
   # DATABASE_URL=postgresql://user:password@localhost/dbname
   ```

3. Initialize Database:
   ```bash
   export PYTHONPATH=$PYTHONPATH:.
   alembic upgrade head
   ```

4. Run Server:
   ```bash
   uvicorn app.main:app --reload
   ```

## Key Modules
- `app/models.py`: Database schema (RBAC, Models, Workflows).
- `app/api/v1/endpoints/`: API routers (governance & analytics).
- `app/middleware/rbac.py`: Permission-based access control.
- `app/storage/file_storage.py`: Local file management for uploads.

## RBAC Rules
- **Admin**: Full access.
- **Creator**: Can create models and request approvals.
- **Reviewer**: Can approve/reject model stages.
- **Constraint**: A Creator cannot approve their own stage requests.
