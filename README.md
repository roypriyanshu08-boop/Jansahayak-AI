# JanSahayak AI - Technical Architecture & Foundation

Complete full-stack architecture foundation for JanSahayak AI - Citizen Grievance & Technical AI Platform.

## Directory Structure

```
Hackthon 9_10/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/v1/          # Endpoints (Auth, Users, Complaints, Admin, AI, Analytics)
│   │   ├── core/            # Config, Security (JWT/bcrypt), Database setup
│   │   ├── models/          # SQLAlchemy ORM Models (User, Complaint, Officer, Assignment, History, DuplicateGroup, Escalation, AIAnalysis)
│   │   ├── schemas/         # Pydantic Schemas
│   │   ├── services/        # Service Layer & AI Foundation Stubs
│   │   └── main.py          # FastAPI server entrypoint
│   └── requirements.txt
├── frontend/                 # React Application (Vite)
│   ├── src/
│   │   ├── components/      # Common, Citizen, Admin UI components
│   │   ├── context/         # AuthContext state provider
│   │   ├── hooks/           # useAuth hook
│   │   ├── pages/           # Auth, Citizen, and Admin views
│   │   ├── routes/          # AppRoutes & ProtectedRoute guards
│   │   └── services/        # Axios API service integration layer
│   └── package.json
└── README.md
```

## Running the Application Foundation

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive API Docs: `http://localhost:8000/docs`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Web App UI: `http://localhost:5173`
