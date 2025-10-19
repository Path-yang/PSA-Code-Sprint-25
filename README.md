# PSA Code Sprint 2025 – Problem Statement 3

> **AI Co-Pilot for Level 2 Product Operations at PORTNET®**  
> Automates triage, diagnostics, and resolution planning using application logs, historical cases, and knowledge base articles.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://psa-code-sprint-25-frontend.vercel.app)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Configuration](#configuration)

---

## 🎯 Overview

This solution addresses the challenge of automating Level 2 support operations at PORTNET®. Our AI-powered diagnostic assistant:

- **Analyzes** unstructured alerts from multiple channels (Email, SMS, Phone)
- **Searches** application logs, knowledge base, and historical cases
- **Provides** root cause analysis with confidence scores
- **Generates** step-by-step resolution plans with SQL queries
- **Manages** tickets with full CRUD operations and permanent storage

### The Challenge

L2 Product Operations teams spend significant time triaging alerts, searching through logs, and consulting documentation. Our solution automates this entire workflow while maintaining accuracy and providing transparent reasoning.

---

## ✨ Key Features

### 1. Intelligent Alert Parsing
- Extracts ticket ID, module, entity ID, and priority from unstructured text
- Identifies symptoms and error codes using GPT-4
- Supports Email, SMS, and Phone channel inputs

### 2. Multi-Source Evidence Gathering
- **Application Logs**: Searches 6 microservice logs for relevant entries
- **Historical Cases**: Finds similar past incidents from Case Log
- **Knowledge Base**: Retrieves relevant SOPs and procedures

### 3. AI-Powered Root Cause Analysis
- Synthesizes evidence from multiple sources
- Provides confidence scores and technical details
- Lists supporting evidence for transparency

### 4. Resolution Planning
- Step-by-step resolution instructions
- Estimated time to resolve
- SQL queries and verification steps
- Escalation recommendations when needed

### 5. Ticketing System 🆕
- **Save diagnoses as tickets** with one-click
- **Active/Closed ticket management** with tabs
- **Full editing capabilities**:
  - Modify root cause and technical details
  - Edit resolution steps
  - Add custom fields (key-value pairs)
  - Add notes for team collaboration
- **Accurate time tracking**: "Open for X hours" or "Resolved in X hours"
- **Neon Postgres database** (Singapore region) with permanent storage
- **SQLite locally** for easy development (no setup needed)
- Beautiful, modern UI with status badges and responsive design

---

## 📊 Technology Stack

**Backend:**
- Python 3.13
- Azure OpenAI API (GPT-4.1-nano)
- Flask (local development)
- Vercel Serverless Functions (production)
- Neon Postgres (production database - Singapore region)
- SQLite (local development database)

**Frontend:**
- React 18
- Vite 5
- Vanilla CSS (modern, responsive design)

**Deployment:**
- Vercel (static site + serverless functions)
- Git-based CI/CD
- Automatic database backend selection

**Data Processing:**
- XML parsing (Case Log without heavy dependencies)
- Regex-based log searching
- Text similarity matching
- JSONB for efficient JSON storage

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** with `venv`
- **Node.js 18+** with `npm`
- **Azure OpenAI API Key** (provided by PSA Code Sprint portal)

---

### Production (Live Demo)

**🌐 Visit**: [https://psa-code-sprint-25-frontend.vercel.app](https://psa-code-sprint-25-frontend.vercel.app)

The application is fully deployed on Vercel with:
- Frontend served as static site
- API functions as serverless Python endpoints
- Neon Postgres database (Singapore region)
- Pre-seeded demo tickets for judges

---

### Local Development

#### 1. Clone and Setup Backend

```bash
cd our_solution

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cd backend
cp env_template.txt .env
nano .env  # Add your Azure OpenAI API key
```

Your `.env` should contain:
```bash
AZURE_OPENAI_API_KEY=your-api-key-here
AZURE_OPENAI_ENDPOINT=https://psacodesprint2025.azure-api.net/
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-nano
```

#### 2. Start Backend Server

```bash
# From our_solution/backend/
source ../venv/bin/activate
python webapp.py --port 5001
```

The Flask API will run at `http://localhost:5001`

**Test it:**
```bash
curl http://localhost:5001/health
# Should return: {"status": "ok"}
```

#### 3. Start Frontend

```bash
# Open a new terminal
cd our_solution/frontend
npm install
npm run dev
```

The React app will open at `http://localhost:5173`

---

## 📁 Project Structure

```
PSA'25/
├── Hackathon Documents/                     # Competition materials
│   ├── Problem Statements.pdf
│   └── Info Pack for Participants.pdf
│
├── Problem Statement 3.../                  # Provided hackathon data
│   ├── Application Logs/                    # 6 microservice log files
│   ├── Case Log.xlsx                        # Historical incident cases
│   ├── Knowledge Base.txt                   # SOPs and procedures
│   ├── Database/db.sql                      # SQL schema and sample data
│   └── Test Cases.pdf                       # Evaluation scenarios
│
├── api/                                     # Vercel serverless functions
│   ├── diagnose/index.py                   # Main diagnostic endpoint
│   ├── tickets.py                          # Ticket management endpoint
│   ├── test.py                             # Health check endpoint
│   └── hello.py                            # Simple test endpoint
│
├── our_solution/                            # ← Complete solution
│   ├── backend/                            # Core Python diagnostic engine
│   │   ├── app/
│   │   │   ├── diagnostic_system.py        # Main orchestrator
│   │   │   ├── gpt_analyzer.py             # Azure OpenAI integration
│   │   │   ├── log_searcher.py             # Application log parser
│   │   │   ├── kb_searcher.py              # Knowledge base search
│   │   │   ├── case_log_searcher.py        # Historical case matcher
│   │   │   ├── database.py                 # Ticket database operations
│   │   │   ├── db_schema.sql               # Database schema
│   │   │   ├── seed_demo_tickets.py        # SQLite demo data
│   │   │   ├── seed_neon.py                # Neon Postgres demo data
│   │   │   └── config.py                   # Configuration & paths
│   │   ├── docs/                           # Technical documentation
│   │   ├── tickets.db                      # SQLite database (local dev)
│   │   ├── webapp.py                       # Flask API (local dev)
│   │   ├── test_all_cases.py               # Automated test suite
│   │   └── requirements.txt                # Python dependencies
│   │
│   ├── frontend/                           # React + Vite UI
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── TicketList.jsx         # Ticket list view
│   │   │   │   └── TicketDetail.jsx       # Ticket edit view
│   │   │   ├── App.jsx                     # Main app component
│   │   │   ├── api.js                      # API client
│   │   │   └── styles.css                  # Styling
│   │   ├── package.json                    # Frontend dependencies
│   │   └── vite.config.js                  # Vite configuration
│   │
│   ├── package.json                        # Workspace configuration
│   ├── build.js                            # Build orchestration
│   ├── start_backend.sh                    # Quick start: Flask API
│   ├── start_frontend.sh                   # Quick start: Vite dev
│   └── test_setup.sh                       # Environment verification
│
├── requirements.txt                        # Python deps (Vercel functions)
├── vercel.json                            # Vercel deployment config
└── README.md                              # This file
```

---

## 📝 API Documentation

### Diagnostic Endpoint

**POST `/api/diagnose`**

Analyzes an alert and returns comprehensive diagnostic information.

**Request:**
```json
{
  "alertText": "RE: Email ALR-861600 | CMAU0000020 - Duplicate Container..."
}
```

**Response:**
```json
{
  "parsed": {
    "ticket_id": "ALR-861600",
    "module": "Container",
    "entity_id": "CMAU0000020",
    "priority": "Medium",
    "channel": "Email",
    "symptoms": ["duplicate", "container", "information"]
  },
  "rootCause": {
    "root_cause": "Duplicate container records in database",
    "technical_details": "Multiple EDI messages processed for same container",
    "confidence": 85,
    "evidence_summary": ["Found duplicate entries in container_service.log"]
  },
  "resolution": {
    "resolution_steps": [
      "Query database for duplicate container entries",
      "Identify source EDI messages",
      "Remove duplicate record",
      "Verify with customer"
    ],
    "estimated_time": "30 minutes",
    "escalate": false,
    "verification_steps": ["Check PORTNET display", "Confirm with customer"],
    "sql_queries": ["SELECT * FROM containers WHERE container_no = 'CMAU0000020'"]
  },
  "report": "# Diagnostic Report\n\n...",
  "logEvidence": [...],
  "knowledgeBase": [...],
  "similarCases": [...]
}
```

### Ticketing System API

**POST `/api/tickets`** - Create a new ticket from diagnostic data  
**GET `/api/tickets?status=active`** - List tickets (status: active, closed, or all)  
**GET `/api/tickets/:id`** - Get a specific ticket by ID  
**PUT `/api/tickets/:id`** - Update ticket fields (edited_diagnosis, notes, custom_fields)  
**POST `/api/tickets/:id/close`** - Close a ticket (sets status and closed_at timestamp)  
**DELETE `/api/tickets/:id`** - Delete a ticket (for cleanup)

---

## 🚀 Deployment

### Vercel Configuration

The project is configured for automatic deployment via Vercel:

1. **Frontend**: Built from `our_solution/` and deployed as static site
2. **API Functions**: Python serverless functions in `/api` directory
3. **Database**: Neon Postgres (Singapore region) for permanent storage
4. **Root Directory**: Leave **BLANK** in Vercel settings

### Environment Variables (Vercel Dashboard)

Required environment variables:
- `AZURE_OPENAI_API_KEY` - Your Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT` - API endpoint URL
- `AZURE_OPENAI_API_VERSION` - API version
- `AZURE_OPENAI_DEPLOYMENT` - Model deployment name
- `NEONSTORAGE_URL` - Neon Postgres connection string (auto-added by Vercel)

### Deployment Process

1. Push to GitHub `main` branch
2. Vercel automatically detects changes
3. Builds frontend: `cd our_solution && npm run build`
4. Installs Python dependencies from `/requirements.txt`
5. Deploys API functions from `/api` directory
6. Connects to Neon Postgres database automatically

---

## 🔧 Configuration

### Python Dependencies

The project has **two** `requirements.txt` files:

| File | Purpose | Used By |
|------|---------|---------|
| `/requirements.txt` (root) | Vercel serverless functions | `/api` functions on Vercel |
| `/our_solution/backend/requirements.txt` | Local Flask development | Local dev (`python webapp.py`) |

### Database Backend Selection

The code automatically selects the appropriate database:

**Production (Vercel):**
- Detects `NEONSTORAGE_URL` environment variable
- Uses Neon Postgres (Singapore region)
- Permanent storage with JSONB support

**Local Development:**
- Uses SQLite at `our_solution/backend/tickets.db`
- No setup required
- Permanent local storage

### Design Decisions

**Why No External Excel Libraries?**  
We parse `Case Log.xlsx` using Python's built-in `zipfile` and `xml.etree.ElementTree` to avoid heavy dependencies like `openpyxl` or `pandas`. This keeps the deployment lightweight for serverless environments.

**Why `/api` at Root?**  
Vercel requires serverless functions to be in `/api` at the repository root. This is a hard platform requirement and cannot be configured differently.

**Why GPT-4.1-nano?**  
Balances performance and cost for rapid diagnostics while maintaining high accuracy for production-critical operations.

---

## 🎓 For Hackathon Judges

### Demo Tickets

The live site includes 3 pre-seeded demo tickets:
1. **Container Duplicate** (ALR-861600) - Active
2. **EDI Message Error** (INC-154599) - Closed
3. **Vessel Not Found** (OCEANIA) - Active

### Testing the Solution

1. **Run a diagnosis** - Use test cases from `Test Cases.pdf`
2. **Create a ticket** - Click "💾 Save as Ticket" after diagnosis
3. **Manage tickets** - Click "📋 View Tickets" to see all tickets
4. **Edit ticket** - Click on a ticket to modify AI-generated content
5. **Close ticket** - Mark tickets as resolved

### Why This Solution Stands Out

✅ **Production-Grade Architecture** - Uses industry-standard Postgres database  
✅ **Smart Backend Selection** - Automatically chooses the right database  
✅ **Comprehensive Features** - Full ticket lifecycle management  
✅ **Clean Code** - Well-documented, maintainable, testable  
✅ **Modern UI/UX** - Beautiful, responsive, intuitive design  
✅ **Zero Setup** - Works out of the box locally and on Vercel  

---

## 👥 Team

**PSA Code Sprint 2025**  
**Problem Statement 3**: Redefining Level 2 Product Ops

Built for Singapore's Port Operations with ❤️

---

## 🚀 Live Demo

**Try it now**: [https://psa-code-sprint-25-frontend.vercel.app](https://psa-code-sprint-25-frontend.vercel.app)

Paste an alert and watch the AI co-pilot diagnose it in seconds! 🎯
