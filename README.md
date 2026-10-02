# PatchPilot AI

**Your autonomous AI security engineer.**

Security vulnerabilities do not need another dashboard. They need an engineer that can explain the finding, propose a small patch, run tests, and prove the original issue is gone.

[![Live demo](https://img.shields.io/badge/Live%20demo-Vercel-00E5A0?style=for-the-badge)](https://patchpilot-ai-tau.vercel.app)
[![API health](https://img.shields.io/badge/API-healthy-00B8FF?style=for-the-badge)](https://patchpilot-ai-production.up.railway.app/api/health)
[![GitHub](https://img.shields.io/badge/GitHub-Rudra--113%2Fpatchpilot--ai-181717?style=for-the-badge&logo=github)](https://github.com/Rudra-113/patchpilot-ai)

[🚀 OPEN LIVE PATCHPILOT AI](https://patchpilot-ai-tau.vercel.app)

| Surface | URL |
| --- | --- |
| Frontend | [https://patchpilot-ai-tau.vercel.app](https://patchpilot-ai-tau.vercel.app) |
| Backend API | [https://patchpilot-ai-production.up.railway.app](https://patchpilot-ai-production.up.railway.app) |
| Health check | [https://patchpilot-ai-production.up.railway.app/api/health](https://patchpilot-ai-production.up.railway.app/api/health) |
| Source | [https://github.com/Rudra-113/patchpilot-ai](https://github.com/Rudra-113/patchpilot-ai) |

The public deployment runs in **demo mode**. The health check currently returns `demoMode: true`. Demo mode walks the full product flow with deterministic fixtures. It does not clone repositories, extract ZIP archives, call a model, or execute scanner binaries.

## Overview

Scanners find issues. Coding assistants write patches. Neither one, by itself, can say the vulnerability is gone.

PatchPilot AI connects those steps. It normalizes scanner output, explains the finding, proposes the smallest safe change, applies that change only when the snippet matches, runs pytest, and rescans. **PATCH VERIFIED** is shown only when the patch was applied, tests passed, and a rescan no longer reports the original finding. A generated diff is not verification.

## Core workflow

```text
SCAN → UNDERSTAND → FIX → TEST → VERIFY
```

| Step | What the product does |
| --- | --- |
| SCAN | Ingest a GitHub URL or ZIP and collect findings from Semgrep, Bandit, pip-audit, Gitleaks, and Trivy. |
| UNDERSTAND | Explain root cause, attack path, and impact for the finding in front of you. |
| FIX | Propose a minimal before/after patch in the same file, then apply it only if the snippet is unique. |
| TEST | Run `pytest` as a fixed command. Demo mode records a bundled result and does not run the suite. |
| VERIFY | Rescan and compare. The original finding must be gone, and the rescan must not introduce a new one. |

## Key features

These behaviors are implemented.

| Feature | What you can do today |
| --- | --- |
| Repository vulnerability scanning | Submit a GitHub URL or a ZIP. In demo mode the input is recorded and a fixed workspace is shown. With `DEMO_MODE=false`, the URL is cloned or the ZIP is extracted, and installed scanners run. |
| AI-powered vulnerability explanations | Each demo finding includes a bundled explanation. Outside demo mode, OpenRouter, OpenAI, or Anthropic can write the analysis when a key is configured. |
| Suggested security fixes | Generate a structured patch, review the diff, and apply it. The patch must target the finding's file and match the scanned snippet. |
| Testing and re-scanning | After apply, run tests and rescan. Demo mode uses bundled test and rescan evidence and says so in the UI. |
| Verification of fixes | The evidence checklist covers the security scan, tests, the original vulnerability, and a regression check. |
| Security activity and evidence tracking | The command center, activity timeline, scan history, and settings page show score, events, and tool status. |

The demo workspace is `patchpilot-demo`. Its opening score is **72 / 100**, from 2 critical, 3 high, 4 medium, and 1 low finding:

```text
100 − (critical×7 + high×3 + medium×1 + low×1)
```

Verifying the SQL injection finding moves the score to 79. The command center then points at the next open finding. Proving the remaining critical finding lifts the score to 86. Verifying every open finding reaches 100 and **SECURE**.

## Technology stack

Taken from the repository, not from a planned stack.

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios, Framer Motion, Recharts, Lucide |
| Backend | Python, FastAPI, Pydantic, Uvicorn, pytest, httpx |
| Scanners | Semgrep, Bandit, pip-audit, Gitleaks, Trivy, each behind `BaseScanner` |
| Models | OpenRouter, OpenAI, and Anthropic. Keys come from the environment. |
| Local containers | Docker Compose, with a Python image for the API and a Node image for the Vite dev server |
| Hosting | Frontend on Vercel. Backend on Railway with Railpack. |

There is no database. Scans and findings are kept in memory and, for a live scan, under `backend/data/`. A process restart clears them.

## System architecture

```text
frontend/   React, Vite, TypeScript, Tailwind
backend/    FastAPI application in app/main.py
docker/     Container build files
```

```text
Repository
  → scanners (skipped when the binary is missing)
  → normalized finding
  → AI explanation and structured patch
  → patch validation and apply
  → pytest
  → rescan and comparison
  → verification evidence
```

The browser talks only through `frontend/src/services/api.ts`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service status and demo flag |
| GET | `/api/settings` | Provider, Docker, and scanner availability |
| GET | `/api/scans` | Scan history |
| POST | `/api/scan` | Start a GitHub URL scan |
| POST | `/api/repositories/upload` | Upload a ZIP |
| GET | `/api/scans/{scan_id}` | One scan. `current` is the active scan |
| GET | `/api/scans/{scan_id}/findings` | Findings for a scan |
| GET | `/api/findings/{finding_id}` | One finding |
| POST | `/api/findings/{finding_id}/generate-fix` | Create a patch |
| POST | `/api/findings/{finding_id}/apply-fix` | Apply the reviewed patch |
| POST | `/api/findings/{finding_id}/test` | Run pytest |
| POST | `/api/findings/{finding_id}/verify` | Rescan and record evidence |
| GET | `/api/activity/{scan_id}` | Activity timeline |

## Screenshots

Screenshot files are not in the repository yet. Open the live app for the current screens.

| Screen | Live route |
| --- | --- |
| Landing | [https://patchpilot-ai-tau.vercel.app/](https://patchpilot-ai-tau.vercel.app/) |
| Command center | [https://patchpilot-ai-tau.vercel.app/overview](https://patchpilot-ai-tau.vercel.app/overview) |
| Scan | [https://patchpilot-ai-tau.vercel.app/scan](https://patchpilot-ai-tau.vercel.app/scan) |
| Vulnerabilities | [https://patchpilot-ai-tau.vercel.app/vulnerabilities](https://patchpilot-ai-tau.vercel.app/vulnerabilities) |
| Fixes | [https://patchpilot-ai-tau.vercel.app/fixes](https://patchpilot-ai-tau.vercel.app/fixes) |
| Verification | [https://patchpilot-ai-tau.vercel.app/verification](https://patchpilot-ai-tau.vercel.app/verification) |
| Activity | [https://patchpilot-ai-tau.vercel.app/activity](https://patchpilot-ai-tau.vercel.app/activity) |
| History | [https://patchpilot-ai-tau.vercel.app/history](https://patchpilot-ai-tau.vercel.app/history) |

When images are added, place them in `docs/screenshots/` and replace the links above with Markdown images. Suggested files: `overview.png`, `finding.png`, `diff.png`, `verified.png`.

## Local installation

Requires Node.js 22 or newer, Python 3.12, and npm. Git is required only for a live clone.

```bash
git clone https://github.com/Rudra-113/patchpilot-ai.git
cd patchpilot-ai
```

Install the frontend and backend:

```bash
cd frontend
npm install

cd ../backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

On Windows PowerShell, activate the virtual environment with `.venv\Scripts\Activate.ps1`.

Copy the example environment file if you want to override the defaults. Do not commit real keys.

```bash
cp .env.example .env
```

### Frontend

```bash
cd frontend
npm run dev
```

The dev server listens on [http://127.0.0.1:43123](http://127.0.0.1:43123).

`frontend/.env.development` sets `VITE_API_BASE_URL=http://127.0.0.1:8000/api`. Vite reads `VITE_API_BASE_URL` at build time.

Production build:

```bash
cd frontend
npm run build
```

### Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Tests:

```bash
cd backend
source .venv/bin/activate
pytest
```

### Docker Compose

```bash
docker compose up --build
```

Compose publishes the API on port 8000 and the Vite dev server on port 43123. It sets `DEMO_MODE=true`. If Docker is unavailable when pytest runs outside demo mode, sandbox execution is labeled `development_fallback` and the fixed pytest command runs on the host.

## Environment variables

Names only. Leave secrets empty in Git. `.env.example` is the template.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Frontend | API base URL, including `/api`. Local default: `http://127.0.0.1:8000/api`. |
| `DEMO_MODE` | Backend | Defaults to `true`. Demo fixtures when true. Live clone, extract, scanners, pytest, and model calls when `false`. |
| `OPENROUTER_API_KEY` | Backend | First choice when a model call is allowed. |
| `OPENAI_API_KEY` | Backend | Used when OpenRouter is unset. |
| `ANTHROPIC_API_KEY` | Backend | Used when the other two are unset. |
| `AI_MODEL` | Backend | Optional model override. |
| `GITHUB_TOKEN` | Backend | Optional. Used only to clone a private GitHub repository in live mode. |
| `PATCHPILOT_DEMO_DELAY` | Backend | Optional pause between demo log lines. |
| `PORT` | Backend | Set by Railway. Local default is 8000. |

`DEMO_MODE` defaults to true. Leave the key fields empty unless you are running a live scan on a machine you control.

## Demo mode and live mode

Demo mode is the path that works with nothing else installed, and it is what the public site runs.

- GitHub URLs are validated and recorded. They are not cloned.
- ZIP uploads are accepted and are not extracted or executed.
- Findings, explanations, and patches are deterministic fixtures.
- The terminal says that scanner binaries are not being executed.
- pytest results are the bundled `12 passed / 0 failed` record. The host suite is not run.
- Verification still requires the same evidence chain. Calling verify before apply and tests returns `verified: false` and does not change the score.

The UI labels this state **DEMO MODE**.

Set `DEMO_MODE=false` only for a local or private deployment when you intend to clone a repository or extract a ZIP and run whichever tools are installed. Live mode does not invent findings for a tool that did not run. The public Railway service is not configured as that live execution environment.

### Scanners

| Scanner | Binary | Role | How to install |
| --- | --- | --- | --- |
| Semgrep | `semgrep` | Code rules | Separate install. Not in `requirements.txt`. |
| Bandit | `bandit` | Python security | `pip install bandit` |
| pip-audit | `pip-audit` | Python dependencies | `pip install pip-audit` |
| Gitleaks | `gitleaks` | Secrets | Separate binary. |
| Trivy | `trivy` | Filesystem, misconfig, and dependencies | Separate binary. |

Each returns normalized findings: severity, title, file, line, scanner, CWE, description, and status. If a binary is missing, that scanner reports `available: false` and the scan continues.

### AI

`AIService` exposes `analyze_finding`, `generate_fix`, `review_patch`, and `explain_verification`.

Provider order: OpenRouter, then OpenAI, then Anthropic. `AI_MODEL` overrides the default model. In demo mode the service returns the bundled analysis and patch and does not call a provider.

The prompt tells the model to explain the supplied finding, produce the smallest safe change, stay in that file, and not invent scanner evidence. `review_patch` rejects path escapes, unrelated files, and patches that do not match the scanned snippet.

Verification text can be rephrased by a model outside demo mode. The verified flag itself comes only from tests and the rescan comparison.

### Patch and verification

1. Validate the patch path and the before/after snippet.
2. Apply it only inside the scan workspace, and only when the snippet occurs once.
3. Run `pytest` as a fixed argument list. Demo mode does not run it. When Docker is available, live pytest runs in a container with network disabled. Otherwise it runs on the host.
4. Rescan with the installed scanners.
5. Compare the new results with the original finding.
6. Mark the finding verified only when the original issue is gone and no new finding was introduced.

Model output is never passed to a shell.

Checks stored with the finding:

- Security scan
- Tests
- Original vulnerability
- Regression

Failure copy includes the scanner, file, and line, for example: `Semgrep still reports the original vulnerability at app/database.py:42.` The UI offers **Review patch** and does not show **PATCH VERIFIED**.

## Backend deployment

The API is deployed on Railway from the `backend/` directory.

- Root directory: `backend`
- Builder: Railpack
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
- Health check: `/api/health`
- Python: 3.12 (`backend/.python-version`)
- Config: `backend/railway.toml` and `backend/railpack.json`

Public base URL: [https://patchpilot-ai-production.up.railway.app](https://patchpilot-ai-production.up.railway.app)

The hosted API is in demo mode. Do not set `DEMO_MODE=false` on that public service unless test execution is isolated. Uploaded tests can run on the API host when Docker is unavailable.

## Frontend deployment

The console is a static Vite build on Vercel.

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Required build variable: `VITE_API_BASE_URL=https://patchpilot-ai-production.up.railway.app/api`

Public site: [https://patchpilot-ai-tau.vercel.app](https://patchpilot-ai-tau.vercel.app)

`VITE_API_BASE_URL` is baked in at build time. Changing the API URL requires a new Vercel build.

## Future improvements

These are not implemented.

- Persist scans in a database so a restart does not wipe the workspace.
- Add authentication before any public live-scan mode.
- Install scanner binaries in the hosted image and run pytest in an isolated sandbox, not on the API host.
- Limit CORS to the Vercel origin. The API currently allows every origin and does not use credentials.
- Add the screenshot files listed above.
- Publish a production frontend container. The current frontend Dockerfile runs the Vite dev server for local Compose.

## Team

| | |
| --- | --- |
| Developer | Rudra |
| GitHub | [Rudra-113](https://github.com/Rudra-113) |
| Repository | [patchpilot-ai](https://github.com/Rudra-113/patchpilot-ai) |
