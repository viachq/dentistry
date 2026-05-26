# DentaCare — Full-Stack Dental Clinic System

## Project overview
Full-stack web application for a dental clinic. Built with FastAPI (backend), React + Vite + Tailwind (patient frontend), and React + Vite + Tailwind (admin frontend).

## Architecture
```
dentistry/
├── backend/          # FastAPI + SQLAlchemy + PostgreSQL
├── frontend/         # Patient-facing React app (port 5173)
├── admin-frontend/   # Admin/Doctor React app (port 5174)
├── uploads/          # Uploaded files (auto-created)
└── docker-compose.yml
```

## Tech stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2, Alembic, psycopg3, pydantic-settings, python-jose, pwdlib
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS 3, React Router v6, Axios
- **DB**: PostgreSQL 16 (port 5435, db: dentistry, user: postgres, password: dentistry_pg_2026)

## Domain model
- **Roles**: `patient`, `doctor`, `admin`
- **DoctorProfile**: linked to User with role=doctor
- **PatientCard** + **DentalVisit**: dental records for patients
- **ClinicSettings**: brand/contact info (brand: DentaCare)

## Quick start
```powershell
# Start DB
./dev-up.ps1

# Backend
cd backend
pip install -e .
alembic upgrade head
python scripts/seed_admin.py
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev

# Admin frontend
cd admin-frontend && npm install && npm run dev
```

## Key endpoints
- `POST /api/v1/auth/register` — register as patient
- `POST /api/v1/auth/login` — login
- `GET /api/v1/doctors` — list doctors
- `GET /api/v1/appointments/available-slots` — get available slots
- `POST /api/v1/appointments` — book appointment
- `GET /api/v1/patients/{id}/card` — patient dental card

## Default credentials
- Admin: `admin` / `admin12345`
- Demo doctor: `doctor_demo` / `doctor12345`
- Demo patient: `patient_demo` / `patient12345`
