# PatchPilot AI

Your autonomous AI security engineer.

Detect. Understand. Fix. Test. Prove.

PatchPilot is not another findings dashboard and it is not an AI that only writes a patch. Scanners detect vulnerabilities. The agent explains them, drafts the smallest safe fix, runs tests, rescans, and reports **PATCH VERIFIED** only when the original finding is gone.

```
SCAN
  ↓
UNDERSTAND
  ↓
FIX
  ↓
TEST
  ↓
VERIFY
```

## This repository

The application is a Vite + React console and a FastAPI service.

| Area | Status |
| --- | --- |
| Design system, landing page, command center | Available, driven by deterministic demo fixtures |
| Scan pipeline, finding detail, fixes, verification | Next slices |
| Scanner and model integrations | Structured, not yet executing real tools |

Demo mode is the default. The overview numbers come from a fixed fixture set for `patchpilot-demo`. They are labeled as fixtures. A score of 72 is calculated from open findings, not hardcoded as a display string:

`100 − (critical×7 + high×3 + medium×1 + low×1)`

The demo set is 2 critical, 3 high, 4 medium, and 1 low, which is a penalty of 28.

## Architecture

```
frontend/   React, Vite, TypeScript, Tailwind
backend/    FastAPI
docker/     Container build files
```

Frontend traffic to the API goes through `frontend/src/services/api.ts`.

Planned backend path:

1. Ingest a GitHub URL or ZIP.
2. Run Semgrep, Bandit, pip-audit, Gitleaks, and Trivy when they are installed.
3. Normalize results into one finding shape.
4. Ask the model to explain and propose a patch. The model does not create scanner evidence.
5. Validate and apply a structured patch.
6. Run tests, rescan, and compare findings.
7. Mark the finding verified only when the evidence supports it.

## Run the console

```bash
cd frontend
npm install
npm run dev
```

The dev server listens on [http://127.0.0.1:43123](http://127.0.0.1:43123).

Production build:

```bash
cd frontend
npm run build
```

## Run the API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `GET /api/health`

Tests:

```bash
cd backend
pytest
```

## Environment

Copy `.env.example` to `.env`. Do not commit real keys.

```
VITE_API_BASE_URL=http://localhost:8000/api
DEMO_MODE=true
OPENAI_API_KEY=
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
AI_MODEL=
GITHUB_TOKEN=
```

`DEMO_MODE=true` keeps the product usable when no GitHub token, model key, scanner binary, or Docker daemon is present. Demo data must stay labeled as demo data.

## Docker

```bash
docker compose up --build
```

The API is published on port 8000 and the console on port 43123.
