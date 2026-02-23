# Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

## Backend Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create virtual environment (recommended)
```bash
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Database is already included
The `sql_app.db` file is included in the repository with:
- Pre-configured users (admin, modeler, reviewer)
- 17 recovered historical reports
- All necessary schema and data

**No database setup required!**

### 5. Start the backend server
```bash
python3.11 -m uvicorn app.main:app --reload
```

Backend will run on: `http://localhost:8000`

## Frontend Setup

### 1. Navigate to project root
```bash
cd ..  # if you're in backend directory
```

### 2. Install Node dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```

Frontend will run on: `http://localhost:5173`

## Login Credentials

### Admin Account
- **Email**: `admin@walmart.com`
- **Password**: `admin123`

### Modeler Account (Abhishek)
- **Email**: `abhishek@walmart.com`
- **Password**: `modeler123`

### Reviewer Account
- **Email**: `reviewer@walmart.com`
- **Password**: `reviewer123`

## Quick Start (All-in-One)

### Terminal 1 - Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Terminal 2 - Frontend
```bash
npm install
npm run dev
```

### Terminal 3 - Frontend (Alternative with host)
```bash
npm install && npx vite --host
```

## Verification

1. Open browser to `http://localhost:5173`
2. Login with any of the credentials above
3. Verify you can see the dashboard
4. For Modeler account, verify 17 historical reports are visible

## Troubleshooting

### Backend won't start
- Ensure Python 3.11+ is installed: `python3.11 --version`
- Check if port 8000 is available
- Verify all dependencies installed: `pip list`

### Frontend won't start
- Ensure Node.js 18+ is installed: `node --version`
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check if port 5173 is available

### Database issues
- The database file `backend/sql_app.db` should be present
- If missing, run the recovery script: `python3.11 scripts/recover_data.py`

## Project Structure

```
super-secret/
├── backend/
│   ├── app/
│   │   ├── core/          # Auth, DB, RBAC
│   │   ├── modules/       # Analytics, Governance, Connections
│   │   └── main.py        # FastAPI app
│   ├── scripts/
│   │   └── recover_data.py
│   ├── sql_app.db         # SQLite database (included)
│   └── requirements.txt
├── src/
│   ├── api/              # API client functions
│   ├── components/       # React components
│   ├── context/          # Auth context
│   └── pages/            # Page components
└── package.json
```
