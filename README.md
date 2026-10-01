# PatchPilot AI

Your autonomous AI security engineer.

Detect. Understand. Fix. Test. Prove.

Security scanners find vulnerabilities. AI coding tools write code. PatchPilot does both, then proves the original finding is gone.

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

**PATCH VERIFIED** is shown only when three things are true: the patch was applied, tests passed, and a rescan no longer reports the original finding. A generated diff is not verification.

## Features

- Landing page and command center for repository posture and security score
- GitHub URL and ZIP ingest
- Scan pipeline and agent terminal
- Normalized findings from Semgrep, Bandit, pip-audit, Gitleaks, and Trivy
- AI explanation, root cause, impact, and a minimal patch
- Before/after diff, apply, pytest, rescan, and an evidence checklist
- Agent activity, scan history, and configuration status
- Demo mode that runs the full workflow with no API keys, scanner binaries, or Docker

The demo workspace is `patchpilot-demo`. Its opening score is **72 / 100**, from 2 critical, 3 high, 4 medium, and 1 low finding:

`100 − (critical×7 + high×3 + medium×1 + low×1)`

Verifying the SQL injection finding moves the score to 79. Verifying every open finding reaches 100 and **SECURE**.

## Architecture

```
frontend/   React, Vite, TypeScript, Tailwind
backend/    FastAPI
docker/     Container build files
```

```
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

## Tech stack

Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, Axios, Lucide, Framer Motion, Recharts.

Backend: Python, FastAPI, Pydantic, Uvicorn, Pytest.

Scanners: Semgrep, Bandit, pip-audit, Gitleaks, Trivy, each behind `BaseScanner`.

Models: OpenAI-compatible APIs, OpenRouter, and Anthropic. Keys come from the environment.

## Installation

```bash
cd frontend
npm install

cd ../backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` if you want to override the defaults. Do not commit real keys.

## Frontend

```bash
cd frontend
npm run dev
```

The dev server listens on [http://127.0.0.1:43123](http://127.0.0.1:43123).

Production build:

```bash
npm run build
```

`frontend/.env.development` sets `VITE_API_BASE_URL=http://127.0.0.1:8000/api`.

## Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Tests:

```bash
cd backend
pytest
```

## Environment

```
VITE_API_BASE_URL=http://localhost:8000/api
DEMO_MODE=true
OPENAI_API_KEY=
OPENROUTER_API_KEY=
ANTHROPIC_API_KEY=
AI_MODEL=
GITHUB_TOKEN=
```

`DEMO_MODE` defaults to true. Leave the key fields empty unless you are running a live scan.

## Demo mode

Demo mode is the path that works with nothing else installed.

- GitHub URLs are validated and recorded. They are not cloned.
- ZIP uploads are accepted and are not extracted or executed.
- Findings, explanations, and patches are deterministic fixtures.
- The terminal says that scanner binaries are not being executed.
- pytest results are the bundled `12 passed / 0 failed` record. The host suite is not run.
- Verification still requires the same evidence chain. Calling verify before apply and tests returns `verified: false` and does not change the score.

The UI labels this state **DEMO MODE**.

## Scanners

`BaseScanner` implementations:

| Scanner | Binary | Role |
| --- | --- | --- |
| Semgrep | `semgrep` | Code rules |
| Bandit | `bandit` | Python security |
| pip-audit | `pip-audit` | Python dependencies |
| Gitleaks | `gitleaks` | Secrets |
| Trivy | `trivy` | Filesystem, misconfig, secrets |

Each returns normalized findings: severity, title, file, line, scanner, CWE, description, status. If a binary is missing, that scanner reports `available: false` and the scan continues.

Set `DEMO_MODE=false` to clone a repository or extract a ZIP and run whichever tools are installed. Live mode never invents findings for a tool that did not run.

## AI

`AIService` exposes `analyze_finding`, `generate_fix`, `review_patch`, and `explain_verification`.

Provider order: OpenRouter, then OpenAI, then Anthropic. `AI_MODEL` overrides the default model. In demo mode the service returns the bundled analysis and patch and does not call a provider.

The prompt tells the model to explain the supplied finding, produce the smallest safe change, stay in that file, and not invent scanner evidence. `review_patch` rejects path escapes, unrelated files, and patches that do not match the scanned snippet.

Verification text can be rephrased by a model outside demo mode. The verified flag itself comes only from tests and the rescan comparison.

## Patch workflow

1. Validate the patch path and the before/after snippet.
2. Apply it only inside the scan workspace, and only when the snippet occurs once.
3. Run `pytest` as a fixed argument list. Demo mode does not run it.
4. Rescan with the installed scanners.
5. Compare the new results with the original finding.
6. Mark the finding verified only when the original issue is gone and no new finding was introduced.

Model output is never passed to a shell.

## Verification workflow

Checks stored with the finding:

- Security scan
- Tests
- Original vulnerability
- Regression

Failure copy includes the scanner, file, and line, for example: `Semgrep still reports the original vulnerability at app/database.py:42.` The UI offers **Review patch** and does not show **PATCH VERIFIED**.

## Docker

```bash
docker compose up --build
```

The API is published on port 8000 and the console on port 43123. If Docker is unavailable at runtime, sandbox execution is labeled `development_fallback`.

## API

- `POST /api/scan`
- `POST /api/repositories/upload`
- `GET /api/scans`
- `GET /api/scans/{scan_id}` (`current` is the active scan)
- `GET /api/scans/{scan_id}/findings`
- `GET /api/findings/{finding_id}`
- `POST /api/findings/{finding_id}/generate-fix`
- `POST /api/findings/{finding_id}/apply-fix`
- `POST /api/findings/{finding_id}/test`
- `POST /api/findings/{finding_id}/verify`
- `GET /api/activity/{scan_id}`
- `GET /api/settings`
- `GET /api/health`
