# PSA Code Sprint 2025 – Problem Statement 3

> **AI Co-Pilot for Level 2 Product Operations at PORTNET®**  
> Automates triage, diagnostics, and resolution planning using application logs, historical cases, and knowledge base articles.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://psa-code-sprint-25-frontend.vercel.app)

---

## 📁 Repository Structure

```
/
├── Code Sprint 2025 Problem Statements copy.pdf  # Competition brief
├── Problem Statement 3.../                       # Provided hackathon data
│   ├── Application Logs/                        # 6 microservice log files
│   ├── Case Log.xlsx                            # Historical incident cases
│   ├── Knowledge Base.txt                       # SOPs and procedures
│   ├── Database/                                # SQL schema and sample data
│   └── Test Cases.pdf                           # Evaluation scenarios
│
├── api/                                         # Vercel serverless functions (root level for Vercel)
│   ├── diagnose/index.py                       # Main diagnostic endpoint
│   ├── test.py                                 # Health check endpoint
│   └── hello.py                                # Simple test endpoint
│
├── my_solution/                                  # ← Solution source code
│   ├── backend/                                 # Core Python diagnostic engine
│   │   ├── app/
│   │   │   ├── diagnostic_system.py            # Main orchestrator
│   │   │   ├── gpt_analyzer.py                 # Azure OpenAI integration
│   │   │   ├── log_searcher.py                 # Application log parser
│   │   │   ├── kb_searcher.py                  # Knowledge base search
│   │   │   ├── case_log_searcher.py            # Historical case matcher
│   │   │   └── config.py                       # Configuration & paths
│   │   ├── webapp.py                           # Flask API for local dev
│   │   ├── test_all_cases.py                   # Automated test suite
│   │   └── requirements.txt                    # Python dependencies
│   │
│   ├── frontend/                                # React + Vite UI
│   │   ├── src/
│   │   │   ├── App.jsx                         # Main application component
│   │   │   ├── api.js                          # API client
│   │   │   └── styles.css                      # Styling
│   │   └── package.json                        # Frontend dependencies
│   │
│   ├── vercel.json                             # Vercel deployment config
│   ├── package.json                            # Root package config
│   ├── build.js                                # Build orchestration script
│   ├── requirements.txt                        # Root Python dependencies
│   │
│   ├── start_backend.sh                        # Quick start: Flask API
│   ├── start_frontend.sh                       # Quick start: Vite dev server
│   └── test_setup.sh                           # Environment verification
│
└── README.md                                     # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** with `venv`
- **Node.js 18+** with `npm`
- **Azure OpenAI API Key** from PSA Code Sprint portal

---

### Option 1: Production (Vercel Deployment)

**Live Demo**: [https://psa-code-sprint-25-frontend.vercel.app](https://psa-code-sprint-25-frontend.vercel.app)

The application is deployed on Vercel with:
- Frontend served as static site
- API functions as serverless Python endpoints
- Environment variables configured in Vercel dashboard

---

### Option 2: Local Development

#### Step 1: Setup Backend

```bash
cd my_solution

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

#### Step 2: Start Backend Server

```bash
# From my_solution/backend/
source ../venv/bin/activate
python webapp.py --port 5001
```

The Flask API will run at `http://localhost:5001`

**Test it:**
```bash
curl http://localhost:5001/health
# Should return: {"status": "ok"}
```

#### Step 3: Start Frontend

```bash
# Open a new terminal
cd my_solution/frontend
npm install
npm run dev
```

The React app will open at `http://localhost:5173`

---

### Option 3: Quick Start Scripts

We provide convenience scripts:

```bash
cd my_solution

# Terminal 1: Backend
./start_backend.sh

# Terminal 2: Frontend
./start_frontend.sh

# Test your setup
./test_setup.sh
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 User (Browser)                          │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼──────────┐
         │  React Frontend      │
         │  (Vite + React)      │
         │  localhost:5173      │
         └───────────┬──────────┘
                     │ POST /api/diagnose
         ┌───────────▼──────────┐
         │  API Layer           │
         │  Flask (local) or    │
         │  Vercel Functions    │
         └───────────┬──────────┘
                     │
    ┌────────────────▼────────────────────┐
    │     L2 Diagnostic System            │
    │  (diagnostic_system.py)             │
    │                                     │
    │  ┌────────────────────────────┐    │
    │  │ 1. Parse Alert (GPT)       │    │
    │  └────────────────────────────┘    │
    │  ┌────────────────────────────┐    │
    │  │ 2. Search Application Logs │    │
    │  └────────────────────────────┘    │
    │  ┌────────────────────────────┐    │
    │  │ 3. Find Similar Cases      │    │
    │  └────────────────────────────┘    │
    │  ┌────────────────────────────┐    │
    │  │ 4. Search Knowledge Base   │    │
    │  └────────────────────────────┘    │
    │  ┌────────────────────────────┐    │
    │  │ 5. Analyze Root Cause(GPT) │    │
    │  └────────────────────────────┘    │
    │  ┌────────────────────────────┐    │
    │  │ 6. Generate Resolution(GPT)│    │
    │  └────────────────────────────┘    │
    │  ┌────────────────────────────┐    │
    │  │ 7. Create Report (GPT)     │    │
    │  └────────────────────────────┘    │
    └─────────────────┬───────────────────┘
                      │
          ┌───────────▼──────────┐
          │  Azure OpenAI API    │
          │  gpt-4.1-nano        │
          └──────────────────────┘
```

---

## 🧪 Testing

### Run Automated Test Suite

```bash
cd my_solution/backend
source ../venv/bin/activate
export $(grep -v '^#' .env | xargs) 2>/dev/null
python test_all_cases.py
```

This will test all scenarios from `Test Cases.pdf` and generate diagnostic reports.

### Test Individual Endpoints

```bash
# Health check
curl http://localhost:5001/health

# Diagnose endpoint
curl -X POST http://localhost:5001/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "alertText": "RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received"
  }'
```

---

## 🎯 Key Features

### 1. Intelligent Alert Parsing
- Extracts ticket ID, module, entity ID, priority from unstructured text
- Identifies symptoms and error codes using GPT-4

### 2. Multi-Source Evidence Gathering
- **Application Logs**: Searches 6 microservice logs for relevant entries
- **Historical Cases**: Finds similar past incidents from Case Log
- **Knowledge Base**: Retrieves relevant SOPs and procedures

### 3. Root Cause Analysis
- Synthesizes evidence from multiple sources
- Provides confidence score and technical details
- Lists supporting evidence

### 4. Resolution Planning
- Step-by-step resolution instructions
- Estimated time to resolve
- SQL queries and verification steps
- Escalation recommendations

### 5. Professional Reporting
- Markdown-formatted diagnostic reports
- Clear sections for all findings
- Ready to share with team

---

## 📊 Technology Stack

**Backend:**
- Python 3.13
- Azure OpenAI API (GPT-4.1-nano)
- Flask (local dev)
- Vercel Serverless Functions (production)

**Frontend:**
- React 18
- Vite 5
- Vanilla CSS

**Deployment:**
- Vercel (static site + serverless functions)
- Git-based CI/CD

**Data Processing:**
- XML parsing (Case Log without openpyxl)
- Regex-based log searching
- Text similarity matching

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AZURE_OPENAI_API_KEY` | Your Azure OpenAI API key | ✅ Yes |
| `AZURE_OPENAI_ENDPOINT` | API endpoint URL | ✅ Yes |
| `AZURE_OPENAI_API_VERSION` | API version | ✅ Yes |
| `AZURE_OPENAI_DEPLOYMENT` | Model deployment name | ✅ Yes |

**For local development**: Set in `my_solution/backend/.env`  
**For Vercel**: Set in Vercel Dashboard → Settings → Environment Variables

---

## 📝 API Documentation

### POST `/api/diagnose`

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
    "root_cause": "...",
    "technical_details": "...",
    "confidence": 85,
    "evidence_summary": [...]
  },
  "resolution": {
    "resolution_steps": [...],
    "estimated_time": "30 minutes",
    "escalate": false,
    "verification_steps": [...],
    "sql_queries": [...]
  },
  "report": "# Diagnostic Report\n\n...",
  "logEvidence": [...],
  "knowledgeBase": [...],
  "similarCases": [...]
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

---

## 🐛 Troubleshooting

### Port Conflicts (macOS)

If port 5000 is occupied by macOS Control Center:
```bash
python webapp.py --port 5001
```

Then update `frontend/vite.config.js`:
```js
proxy: {
  '/api': {
    target: 'http://localhost:5001',  // Changed from 5000
    changeOrigin: true,
  },
}
```

### Missing Dependencies

```bash
# Backend
cd my_solution
source venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm install
```

### API Key Issues

Verify your `.env` file:
```bash
cd my_solution/backend
cat .env
```

Ensure no extra spaces or quotes around the API key.

### Vercel Deployment Issues

1. Check Root Directory setting: Should be `my_solution`
2. Check environment variables in Vercel Dashboard
3. View function logs: Vercel Dashboard → Functions → Logs

---

## 📚 Additional Documentation

- **`my_solution/STARTUP_GUIDE.md`** - Comprehensive setup guide
- **`my_solution/VERCEL_DEPLOYMENT.md`** - Vercel deployment details
- **`my_solution/VERCEL_QUICK_FIX.md`** - Common deployment fixes
- **`my_solution/FIXES_APPLIED.md`** - Technical fixes log
- **`my_solution/backend/docs/`** - Backend implementation docs

---

## 🎓 Design Decisions

### Why No External Excel Libraries?
We parse `Case Log.xlsx` using Python's built-in `zipfile` and `xml.etree.ElementTree` to avoid heavy dependencies like `openpyxl` or `pandas`. This keeps the deployment lightweight for serverless environments.

### Why `/api` at Root Level?
- Vercel requires serverless functions to be in `/api` directory at repository root
- This is a Vercel platform requirement for automatic function detection
- `/api` imports from `/my_solution/backend` for the actual diagnostic logic
- This separation keeps most code organized in `/my_solution` while meeting Vercel's requirements

### Why GPT-4.1-nano?
Balances performance and cost for rapid diagnostics while maintaining high accuracy for production-critical operations.

---

## 👥 Team & Competition

**PSA Code Sprint 2025**  
**Problem Statement 3**: Redefining Level 2 Product Ops

Built for Singapore's Port Operations with ❤️

---

## 📄 License

This project is submitted as part of PSA Code Sprint 2025.

---

## 🚀 Live Demo

**Try it now**: [https://psa-code-sprint-25-frontend.vercel.app](https://psa-code-sprint-25-frontend.vercel.app)

Paste an alert and watch the AI co-pilot diagnose it in seconds! 🎯
