# PSA Code Sprint 2025 – Problem Statement 3

> AI co-pilot for Level 2 Product Operations at PORTNET®  
> Automates triage, diagnostics, and report generation using logs, case history, and runbooks.

## Repository Layout

- `Problem Statement 3 - Redefining Level 2 Product Ops copy/` – official hackathon assets  
- `backend/` – Python toolkit (diagnostic engine, Flask API, docs)  
- `frontend/` – React UI powered by Vite  
- `Code Sprint 2025 Problem Statements copy.pdf` – overall challenge brief

## Backend Quick Start (Flask API)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# optional: scaffold env file with hackathon creds
cp backend/.env.example backend/.env
```

Fill `backend/.env` (or export variables manually) using the values from the PSA API portal:

```bash
export AZURE_OPENAI_API_KEY="..."
export AZURE_OPENAI_ENDPOINT="https://psacodesprint2025.azure-api.net/"
export AZURE_OPENAI_API_VERSION="2025-01-01-preview"
export AZURE_OPENAI_DEPLOYMENT="gpt-4.1-nano"  # or chosen deployment
```

### Run Automated Tests

```bash
cd backend
source ../venv/bin/activate
export $(grep -v '^#' .env | xargs) 2>/dev/null || true
python test_all_cases.py
```

Follow the prompts (press Enter between scenarios). Reports are written to the working directory (ignored by git).

### Launch the API

```bash
cd backend
source ../venv/bin/activate
export $(grep -v '^#' .env | xargs) 2>/dev/null || true
python webapp.py --port 5000 --debug
```

`POST http://127.0.0.1:5000/api/diagnose` with `{ "alertText": "..." }` to receive the structured GPT analysis. A simple `GET /health` returns service status.

## Frontend Quick Start (React)

```bash
cd frontend
npm install
npm run dev   # defaults to http://127.0.0.1:5173
```

Set `VITE_API_BASE_URL` in a `.env` file inside `frontend/` if your backend runs on a different host/port (defaults to `http://localhost:5000`). The dev server proxies `/api/*` to the Flask backend when both run locally.

The React UI lets you paste an alert, calls the Flask API, and renders ticket metadata, root cause, resolution steps, and the generated report.

## Backend Modules

- `app/diagnostic_system.py` – orchestrates alert parsing, evidence retrieval, GPT analysis  
- `app/log_searcher.py` – scans the six sample application logs  
- `app/case_log_searcher.py` – parses `Case Log.xlsx` without external Excel libs  
- `app/kb_searcher.py` – extracts procedures from `Knowledge Base.txt`  
- `app/gpt_analyzer.py` – wraps Azure OpenAI calls for parsing, reasoning, and reporting  
- `webapp.py` – Flask API exposing `/api/diagnose`

## Notes

- Secrets never live in source control; use `.env` locally and deployment-specific environment variables in production.  
- The diagnostic workflow relies on the seeded SQL/log/KB assets shipped with the problem statement. No live database is required.  
- If a port is already in use locally, choose another via `--port` or stop the conflicting process (on macOS, AirPlay/Control Center frequently occupies 5000).

Happy debugging and good luck with PSA Code Sprint 2025! 🚢🚀
