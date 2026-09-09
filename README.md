# CodeQuest — Project Overview

This repository contains CodeQuest, a challenge platform with a React frontend and a Django backend. This top-level README describes the application's features, architecture, and how to run the system locally.

Architecture
- Frontend: `frontend/` — Vite + React application. Implements UI, client-side routing, and consumes backend APIs.
- Backend: `backend/codequest/` — Django project exposing REST APIs, authentication, and AI-powered services.

Main Features
- Role-based access: admin, SME (subject matter experts), and regular users.
- Challenge engine: authoring, scheduling, and running coding/quiz challenges.
- AI-assisted features: prompts and assistant utilities under the backend `ai` module and client helpers.
- User progress tracking and reporting dashboards.


Running locally (development)
set http_proxy=http://proxy.tcs.com:8080
set https_proxy=http://proxy.tcs.com:8080
1. Backend

```powershell
cd backend/codequest

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

2. Frontend

```bash
cd frontend
npm install
npm run dev
```

APIs and placement
- There are no main-level APIs in this root README. All API implementations live under the `backend` project (server-side endpoints) and the `frontend` client uses those APIs as consumers.

Where to look next
- Backend API code: `backend/codequest/apis/`
- AI services and prompts: `backend/codequest/ai/`
- Frontend API client: `frontend/src/api/axiosInstance.js`

Contact / maintainers
- See project metadata and `package.json` / `requirements.txt` files for contacts and dependency information.
