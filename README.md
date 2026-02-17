# Walmart ETL/EDA & ML Governance Application

This project is a production-grade ML governance and analytical platform. It consists of a FastAPI backend and a Vite+React frontend.

## Project Structure

- `/` (Root): Frontend React application (Vite).
- `/backend`: FastAPI application with SQLAlchemy ORM and Alembic migrations.

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL (for production) or SQLite (for development)

### 2. Startup Instructions

#### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # Mac/Linux
   # or
   venv\Scripts\activate     # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations to initialize the database:
   ```bash
   export PYTHONPATH=$PYTHONPATH:.
   alembic upgrade head
   ```
5. Start the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend will be available at `http://localhost:8000`.

#### Frontend Setup
1. From the root directory, install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Features
- **File Upload**: Support for CSV/Parquet uploads with model context.
- **Analytical Tabs**: Subcategory Analysis, Kickoff Group Review, Kickoff Report.
- **ML Governance**: RBAC (Admin, Creator, Reviewer), Model Workflow Stages, and Approval System.
- **Persistence**: Relational database for metadata and governance state.
