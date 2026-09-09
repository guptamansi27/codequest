# Frontend (Vite + React) — CodeQuest

This folder contains the client application built with Vite and React. It implements the UI, consumes backend APIs, and contains client-side role-based views for admin, SME, and user.

Quick start
1. Install Node.js (recommended 16+ or compatible with the project's `package.json`).
2. Install dependencies:

```bash
cd frontend
npm install
```

3. Run the dev server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

API configuration
- The client expects a backend API base URL. Adjust the base URL in `src/api/axiosInstance.js` or via environment variables used by the project.
- Frontend routes and components are organized under `src/pages/` and `src/components/` for `admin`, `sme`, `user`, and `public` areas.

Role types (client view)
- `admin` — Access to admin interfaces and management pages
- `sme` — Create/maintain challenges, review content
- `user` — Take challenges, view progress

Testing & linting
- Run tests:

```bash
npm test
```

- Linting and formatting are configured in the repository; see `package.json` and project configs.

Notes
- All API interactions happen through the backend APIs. The frontend contains only API consumers and client-side routes.

API Usage (frontend)
The frontend communicates with the backend through the shared axios instance in `src/api/axiosInstance.js` (`api`) and a small `aiService` helper for AI features (`src/services/aiService.js`). Below are the primary API consumers and example request/response shapes.

- Authentication (dev flow used in tests and local development)
	- `POST /api/auth/login/`
		- Request: `{ email, password }`
		- Response: `{ access, refresh, email, role, program_type, is_new_user }`
		- Example (uses `api`): `await api.post('/auth/login/', { email, password })`

- Token refresh (handled automatically by `src/api/axiosInstance.js`)
	- `POST /api/auth/token/refresh/` — Request `{ refresh }` → Response `{ access, refresh }`

- AI endpoints (use `src/services/aiService.js`)
	- `aiService.generateTestCases({ title, description, technology, difficulty })` → calls `POST /api/ai/generate-testcases/` and returns `{ success, testcases }`.
	- `aiService.challengeChat({ challengeId, message, currentCode })` → calls `POST /api/ai/challenge-chat/` and returns `{ success, reply }`.

- Challenges
	- `GET /api/challenges/` — used across dashboards and lists. Query params: `type`, `status`, `program_type`.
	- `POST /api/challenges/` — challenge creation (SME). Payload fields: see backend `ChallengeCreateSerializer` (title, description, difficulty, module, challenge_type/type, technology, starter_code, xp_points, chatbot flags, start_time, end_time, is_active, assignment_mode, target_super_batches, target_batches, target_sub_batches, employee_ids, test_cases).
	- `GET /api/challenges/<id>/` — challenge detail used on the challenge page.
	- `PATCH /api/challenges/<id>/` — update challenge (SME owner)
	- `PATCH /api/challenges/<id>/toggle/` — toggle visibility/chatbot state; example: `await api.patch('/challenges/1/toggle/', { is_active: false })`.
	- `GET /api/challenges/<id>/insights/` and `/insights/export/` — report JSON or blob download for analytics.
	- `POST /api/challenges/<id>/assignments/upload/` — multipart upload (formData with `file`) to assign users for non-ignite challenges.

- Submissions & drafts
	- `GET /api/submissions/` — fetch current user's submissions.
	- `POST /api/submissions/` — submit code. Payload: `{ challenge, submitted_code, client_evaluation? }` → response contains submission data and runtime fields like `submissionSuccess`, `awarded_xp`, `passed`, `total`.
	- `GET /api/submissions/<challenge_id>/history/` — submission attempt history.
	- `GET/PUT /api/drafts/<challenge_id>/` — save/load working draft; `PUT` expects `{ code }`.

- Users & admin
	- Admin UI uses `/api/users/` and `/api/users/<id>/` for listing and managing users.
	- Module data comes from `/api/modules/`.

Examples
- Using `api` (axios instance):

```js
import api from './api/axiosInstance'

// fetch challenges
const { data } = await api.get('/challenges/', { params: { type: 'challenge' } })

// submit code
const result = await api.post('/submissions/', { challenge: 7, submitted_code: '<App/>...' })
```

- Using `aiService`:

```js
import aiService from './services/aiService'

const tc = await aiService.generateTestCases({ title, description, technology, difficulty })
const reply = await aiService.challengeChat({ challengeId, message, currentCode })
```

Notes
- The frontend expects the backend API base URL in `src/api/axiosInstance.js` (`API_BASE_URL`). The `api` instance automatically attaches `Authorization` header from `localStorage.access` and refreshes tokens using `localStorage.refresh`.

