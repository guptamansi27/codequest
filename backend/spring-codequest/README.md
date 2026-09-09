# CodeQuest Spring Boot Backend


## Run Locally

```powershell
cd backend/spring-codequest
mvn spring-boot:run
```

The server listens on port `8000` by default, matching the frontend default API base URL.

This project is configured to build with your installed JDK 25 while targeting Java 21 bytecode. That is intentional: Spring Boot `3.4.x` runs fine on JDK 25, but its packaging plugin does not support Java 25 class files yet.

## Required Environment

Use either `SPRING_DATASOURCE_URL` or the existing PostgreSQL variables:

```powershell
$env:POSTGRES_DB="codequest"
$env:POSTGRES_USER="postgres"
$env:POSTGRES_PASSWORD="root"
$env:POSTGRES_HOST="127.0.0.1"
$env:POSTGRES_PORT="5432"
$env:CODEQUEST_JWT_SECRET="replace-with-a-long-secret-value"
$env:CODEQUEST_SIMPLE_LOGIN_PASSWORD="Tcs#1234"
```

Useful optional variables:

- `SERVER_PORT`
- `CODEQUEST_CORS_ALLOWED_ORIGINS`
- `CODEQUEST_SIMPLE_LOGIN_ENABLED`
- `CODEQUEST_SIMPLE_LOGIN_USERS`, formatted as `email:ROLE,email:ROLE`
- `CODEQUEST_AI_API_URL`, `CODEQUEST_AI_API_KEY`, `CODEQUEST_AI_MODEL`

## Database

The existing PostgreSQL schema is reused. Hibernate runs with `ddl-auto=validate`, and Flyway is enabled with a baseline migration marker:

```text
src/main/resources/db/migration/V1__spring_backend_baseline.sql
```

Add future schema changes as normal Flyway files (`V2__...sql`, `V3__...sql`).

## Implemented API Surface

The backend keeps the frontend contract for auth, users, modules, challenges, submissions, drafts, timers, XP, leaderboards, reports, dashboards, module progress, persisted AI interactions, and `/api/ai/...` endpoints.

Authentication uses `/api/auth/register/` and `/api/auth/login/` only. Registration always creates active `USER` accounts, passwords are stored with BCrypt, and the default administrator is created on startup only when no `ADMIN` account exists.

Some file export/upload endpoints currently return compatibility JSON rather than binary `.xlsx` workbooks. The controllers are separated so Apache POI-backed workbook responses can be filled in without touching frontend routes.

## Build Verification

```powershell
mvn -q -DskipTests package
```
