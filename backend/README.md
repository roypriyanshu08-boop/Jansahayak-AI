# JanSahayak AI - Backend Architecture

FastAPI implementation for JanSahayak AI foundation services.

## Features
- **Authentication**: JWT token base auth & password hashing
- **User Management**: Role based control (Citizen, Admin, Officer)
- **Complaint Lifecycle**: Lifecycle tracking, history logging, escalations
- **AI Service Layer Stub**: AI classification, duplicate probability, impact score prediction
- **Analytics Service**: Grievance stats, category distributions, resolution metrics

## Setup & Run

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
pip install -r requirements.txt

# Run Dev Server
uvicorn app.main:app --reload --port 8000
```
Open interactive docs at `http://localhost:8000/docs`.
