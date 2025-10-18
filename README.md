# PSA Code Sprint 2025 – Problem Statement 3

> AI co-pilot for Level 2 Product Operations at PORTNET®  
> Automates triage, diagnostics, and report generation using logs, case history, and runbooks.

## Repository Layout

- `Problem Statement 3 - Redefining Level 2 Product Ops copy/` – official hackathon assets  
- `my_solution/` – diagnostic toolkit (Python modules, CLI harness, Flask web console)  
- `Code Sprint 2025 Problem Statements copy.pdf` – overall challenge brief  
- `.gitignore` – excludes local venvs, caches, macOS artifacts, generated reports

## Quick Start

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r my_solution/requirements.txt
```

Export Azure OpenAI credentials (values from the hackathon API portal):

```bash
export AZURE_OPENAI_API_KEY="..."
export AZURE_OPENAI_ENDPOINT="https://psacodesprint2025.azure-api.net/"
export AZURE_OPENAI_API_VERSION="2025-01-01-preview"
export AZURE_OPENAI_DEPLOYMENT="gpt-4.1-nano"   # or chosen deployment
```

## Run Automated Tests

```bash
cd my_solution
source ../venv/bin/activate        # or the venv you created above
python test_all_cases.py
```

Follow the prompts (press Enter between scenarios). Markdown reports are written to the working directory unless `.gitignore` removes them.

## Launch the Web Console

```bash
cd my_solution
source ../venv/bin/activate
python webapp.py --port 7001 --debug   # adjust port if needed
```

Open `http://127.0.0.1:7001/`, paste any alert (email/SMS/call transcript), and the tool will display:
- Parsed ticket metadata  
- Root-cause reasoning  
- Resolution & verification steps  
- Generated incident report

## Core Modules

- `diagnostic_system.py` – orchestrates alert parsing, evidence retrieval, GPT analysis  
- `log_searcher.py` – scans the six sample application logs  
- `case_log_searcher.py` – parses `Case Log.xlsx` without external Excel libs  
- `kb_searcher.py` – extracts procedures from `Knowledge Base.txt`  
- `gpt_analyzer.py` – wraps Azure OpenAI calls for parsing, reasoning, and reporting  
- `webapp.py` – Flask UI for interactive diagnostics

## Notes

- Secrets (API keys) are read from environment variables only. Rotate keys if you previously committed any.  
- The solution relies on the seeded data/logs in the provided assets; no database server is required.  
- Use `kill <pid>` on macOS if a chosen port is already in use (e.g., by AirPlay/Control Center).

Happy debugging and good luck with PSA Code Sprint 2025! 🚢🚀
