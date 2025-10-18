# 🚀 Startup Guide - PSA L2 Diagnostic Assistant

## Issues Fixed ✅

1. **Installed missing dependencies**: `Flask-CORS` and `python-dotenv`
2. **Fixed port conflict**: Changed from port 5000 → 5001 (macOS Control Center was blocking port 5000)
3. **Updated frontend proxy**: Vite now points to `http://localhost:5001`

---

## 📋 Prerequisites

Before starting, you need:

1. **Azure OpenAI API Key** from PSA Code Sprint 2025 portal
2. **Python 3.13** with virtual environment activated
3. **Node.js** for the frontend

---

## 🔧 Setup Instructions

### Step 1: Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd "/Users/zhenduoyang/Desktop/PSA'25/my_solution/backend"
cp env_template.txt .env
```

Then edit `.env` and replace `your-api-key-here` with your actual Azure OpenAI API key:

```bash
# Use your favorite editor
nano .env
# or
code .env
```

### Step 2: Start the Backend Server

```bash
cd "/Users/zhenduoyang/Desktop/PSA'25/my_solution/backend"
source ../venv/bin/activate
python webapp.py --port 5001
```

You should see:
```
🔧 Initializing L2 Diagnostic System...
   ✓ Log searcher initialized (X log files)
   ✓ Knowledge Base loaded (X articles)
   ✓ Case Log loaded (X historical cases)
   ✓ Azure OpenAI connected

 * Running on http://127.0.0.1:5001
```

### Step 3: Start the Frontend (in a new terminal)

```bash
cd "/Users/zhenduoyang/Desktop/PSA'25/my_solution/frontend"
npm run dev
```

You should see:
```
  VITE v5.2.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

### Step 4: Test the Application

1. Open your browser to `http://localhost:5173/`
2. Paste a test alert (example provided in the UI)
3. Click "Run diagnostics"

---

## 🐛 Troubleshooting

### Error: "Port 5001 already in use"

Check what's using the port:
```bash
lsof -ti:5001
```

Kill the process if needed:
```bash
kill -9 $(lsof -ti:5001)
```

Or use a different port:
```bash
python webapp.py --port 5002
```
(Don't forget to update `vite.config.js` accordingly!)

### Error: "Azure OpenAI API key is missing"

Make sure:
1. You created the `.env` file in the `backend` directory
2. The file contains: `AZURE_OPENAI_API_KEY=your-actual-key`
3. There are no extra spaces or quotes around the key

### Error: "ModuleNotFoundError: No module named 'flask_cors'"

Reinstall dependencies:
```bash
cd "/Users/zhenduoyang/Desktop/PSA'25/my_solution/backend"
source ../venv/bin/activate
pip install -r requirements.txt
```

### Error: 404 Not Found

Make sure both servers are running:
- Backend on port 5001: `http://localhost:5001/health` should return `{"status": "ok"}`
- Frontend on port 5173: `http://localhost:5173/` should show the UI

---

## 📝 Test Alert Example

```
RE: Email ALR-861600 | CMAU0000020 - Duplicate Container information received

To: Ops Team Duty; Jen
Cc: Customer Service

Hi Jen,

Please assist in checking container CMAU0000020. Customer on PORTNET is seeing 2
identical containers information.

Thanks.

Regards,
Kenny
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite)                    │
│  http://localhost:5173                      │
│                                             │
│  - User pastes alert text                  │
│  - Sends POST to /api/diagnose             │
└─────────────────┬───────────────────────────┘
                  │ Vite Proxy
                  ↓
┌─────────────────────────────────────────────┐
│  Backend (Flask + Python)                   │
│  http://localhost:5001                      │
│                                             │
│  POST /api/diagnose                         │
│  ├─ Parse alert (GPT)                       │
│  ├─ Search logs                             │
│  ├─ Search knowledge base                   │
│  ├─ Find similar cases                      │
│  ├─ Analyze root cause (GPT)                │
│  └─ Generate resolution (GPT)               │
└─────────────────┬───────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────┐
│  Azure OpenAI API                           │
│  gpt-4.1-nano                               │
└─────────────────────────────────────────────┘
```

---

## 📊 API Endpoints

### GET `/health`
Health check endpoint
- **Response**: `{"status": "ok"}`

### POST `/api/diagnose`
Run diagnostic analysis
- **Request Body**: 
  ```json
  {
    "alertText": "your alert text here"
  }
  ```
- **Response**: Diagnostic results with root cause, resolution, evidence, etc.

---

## 🎯 Next Steps

1. ✅ Setup complete - both servers should be running
2. Test with the example alert above
3. Try with real alerts from `Test Cases.pdf`
4. Review the diagnostic output
5. Iterate and improve based on results

---

**Need Help?**
- Check that both servers are running
- Verify API key is set correctly
- Look at terminal logs for error messages
- Make sure you're using port 5001 (not 5000)

