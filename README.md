# Secure AI Assistant

## Sprint 2 authentication

The backend uses Argon2id password hashes, 15-minute JWT access tokens, and seven-day refresh tokens stored server-side and delivered through an HttpOnly cookie. Refresh tokens rotate on every refresh and reuse revokes the user's active refresh sessions. `SameSite=Lax` protects the cookie for the local same-site deployment; set `COOKIE_SECURE=true` behind HTTPS.

Access tokens live only in the React auth context. The frontend never reads or persists the refresh cookie. A small in-process login limiter returns `429` after five failures for the same client/email within 60 seconds; production deployments with multiple API replicas should move this counter to shared infrastructure such as Redis.

Roles are database-backed and limited to `admin`, `manager`, and `employee`. The frontend role selector is presentation-only. FastAPI dependencies load the current user and role from the database, so request bodies, JWT role claims, and browser state cannot elevate permissions.

## Local setup

1. Copy `.env.example` to `.env` and replace `JWT_SECRET_KEY` and `ADMIN_PASSWORD`.
2. Start PostgreSQL with `docker compose up -d db`.
3. Apply migrations from `backend`: `alembic upgrade head`.
4. Seed the development admin explicitly: `python -m app.seed`.
5. Start the API from `backend`: `uvicorn app.main:app --reload`.
6. Start the frontend: `npm install --prefix frontend && npm run dev --prefix frontend`.

The API is available at `http://localhost:8000`, the frontend at `http://localhost:3000`, and health checks remain public at `/health` and `/db-health`.

## API surface

Authentication lives under `/api/v1/auth`: `login`, `refresh`, `logout`, `me`, `forgot-password`, and `reset-password`. There is intentionally no public registration endpoint. `/api/v1/users` CRUD is Admin-only; `401` means unauthenticated and `403` means authenticated without the required role.

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are used only by the explicit, idempotent `python -m app.seed` command. Password reset tokens are hashed and single-use; an email provider is not wired yet, so reset delivery needs to be connected before production use.

Authentication events such as successful/failed login, refresh, logout, password reset, user creation, role changes, and deactivation are persisted in `auth_audit_events`. Raw passwords and tokens are never stored in these events. Playwright is not configured in this repository yet; browser verification is performed manually against the running Vite and FastAPI services.

## Verification

Run backend tests with `backend\\venv\\Scripts\\python.exe -m pytest tests` after the database is migrated. Run frontend tests with `npm test --prefix frontend` and the build with `npm run build --prefix frontend`. Docker startup is `docker compose up --build`. Check migration state with `backend\\venv\\Scripts\\alembic.exe current`.