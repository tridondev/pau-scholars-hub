# PAU Scholars Hub

Working scaffold for the Pan African University research, publishing, and
academic management platform. This is a real, runnable starting codebase —
not a finished production platform. Read "What's not built yet" before you
assume something works.

## Stack
Next.js 15 + TypeScript + Tailwind · Django + DRF · PostgreSQL ·
Elasticsearch · Cloudflare R2 · JWT / Google OAuth / ORCID · Firebase ·
Azure OpenAI · Docker + Nginx + GitHub Actions · Azure hosting

## Run it locally

```bash
cp backend/.env.example backend/.env
# edit backend/.env — at minimum set DJANGO_SECRET_KEY

docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api
- API docs (Swagger): http://localhost:8000/api/docs
- Django admin: http://localhost:8000/admin (create a superuser first: `docker compose exec backend python manage.py createsuperuser`)

First run: migrations run automatically via the backend's start command.
Elasticsearch will be empty until you build the index (see below).

## What's actually built

**Backend (Django + DRF)**
- Custom `User` model with roles (student, researcher, lecturer, reviewer, editor, alumni, admin) and `Institute` model for PAUSTI/PAUWES/PAUGMC/etc.
- `AcademicProfile` — bio, research interests, ORCID/Scholar/LinkedIn, CV upload
- Full submission workflow: draft → submitted → editorial screening → peer review → revision requested → accepted → published, with real state-transition endpoints (`/submit/`, `/advance-status/`, `/assign-reviewer/`)
- Reviewer assignment and decision recording
- Journal / Volume / Issue / Article models for the publishing side, with view/download/citation counters
- Elasticsearch document schema + a working `/api/repository/search/` endpoint (full-text + faceted by institute, country, SDG, year)
- JWT auth (`djangorestframework-simplejwt`), Google OAuth wired via `social-auth-app-django`, Cloudflare R2 storage config
- OpenAPI schema + Swagger docs auto-generated (`drf-spectacular`)

**Frontend (Next.js)**
- Design system applied throughout (see `tailwind.config.ts` — same tokens from the AU/PAU brand colors)
- Working pages: home, login, dashboard (lists your submissions with status badges), submit-research form, repository search
- Typed API client (`src/lib/api.ts`) handling JWT storage and requests

## What's not built yet — be honest with yourself about this

- **ORCID OAuth**: no maintained `social-core` backend exists for it. You'll need a custom OAuth2 backend (ORCID's API is documented and not hard, but it's untouched here — see `settings.py` comment).
- **Firebase real-time notifications**: not wired. Add the Firebase Admin SDK on the backend to push events on status changes, and the client SDK on the frontend to receive them.
- **Azure OpenAI / AI research assistant**: config keys are in `settings.py` but no service code exists yet — grammar check, abstract generation, reviewer suggestions all need to be built as a separate Python service or Django app calling Azure OpenAI.
- **DOI assignment**: no registrar integration (e.g. Crossref) — `doi` is just a blank field today.
- **Elasticsearch indexing pipeline**: the search endpoint exists but nothing populates the index yet — you need a signal or management command that pushes `Article` records into `ArticleDocument` on publish.
- **Nginx config, GitHub Actions CI/CD, Azure deployment (Bicep/Terraform)**: not included — this scaffold is dev-only. Production deploy is a separate, substantial piece of work.
- **Institutional dashboard / analytics / reports**: no admin-facing analytics views yet, just the raw data model to build them on.
- **Tests**: none written yet. Add pytest + pytest-django before this goes near production.

## Suggested next steps, in order
1. Get this running locally and create a superuser, an Institute, and a test submission end-to-end through the UI.
2. Write the Elasticsearch indexing signal so published articles actually become searchable.
3. Build the editorial/reviewer dashboard views (the models and API already support it — just needs UI).
4. Wire real Google OAuth credentials and test social login.
5. Build the ORCID backend.
6. Add tests before touching auth or the review workflow again.
