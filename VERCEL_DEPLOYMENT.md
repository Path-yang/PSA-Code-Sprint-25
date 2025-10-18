# 🚀 Vercel Deployment Guide - Fixing 404 Errors

## 🐛 Issues Fixed

### 1. Wrong Handler Format ✅
**Problem**: The Python handler was using the wrong format for Vercel's serverless functions.

**Fix**: Changed from custom handler format to `BaseHTTPRequestHandler` class which Vercel expects:
```python
class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # Handle requests
```

### 2. Missing CORS Headers ✅
**Problem**: No CORS headers were being sent, causing browser to block requests.

**Fix**: Added CORS headers to both the Python handler and `vercel.json`:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

### 3. Missing SPA Rewrites ✅
**Problem**: React Router routes were returning 404 on Vercel.

**Fix**: Added rewrite rule in `vercel.json`:
```json
"rewrites": [
  {
    "source": "/((?!api/).*)",
    "destination": "/index.html"
  }
]
```

### 4. Missing Environment Variables ⚠️
**Problem**: Azure OpenAI API key not configured in Vercel environment.

**Action Required**: You need to add environment variables in Vercel dashboard.

---

## 📋 Step-by-Step Deployment

### Step 1: Set Environment Variables in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
AZURE_OPENAI_API_KEY=your-api-key-from-psa-portal
AZURE_OPENAI_ENDPOINT=https://psacodesprint2025.azure-api.net/
AZURE_OPENAI_API_VERSION=2025-01-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4.1-nano
```

⚠️ **Important**: Add these for **Production**, **Preview**, and **Development** environments.

### Step 2: Commit and Push Changes

```bash
cd "/Users/zhenduoyang/Desktop/PSA'25"
git add .
git commit -m "Fix Vercel 404 errors - update handler format and add CORS"
git push
```

This will trigger a new deployment on Vercel automatically.

### Step 3: Wait for Deployment

1. Watch the deployment progress in Vercel dashboard
2. Vercel will automatically:
   - Install Python dependencies from `requirements.txt`
   - Build the frontend using `npm run build`
   - Deploy API functions to `/api/*` endpoints
   - Deploy frontend to root

### Step 4: Test the Deployment

Once deployed, test these endpoints (replace `your-app-name` with your actual Vercel URL):

**Test 1: Check if site loads**
```bash
curl https://your-app-name.vercel.app/
```
Should return HTML.

**Test 2: Check API test endpoint**
```bash
curl https://your-app-name.vercel.app/api/test
```
Should return: `{"message": "Test endpoint works!", "method": "GET"}`

**Test 3: Check hello endpoint**
```bash
curl https://your-app-name.vercel.app/api/hello
```
Should return: `{"message": "hello from python"}`

**Test 4: Test diagnose endpoint**
```bash
curl -X POST https://your-app-name.vercel.app/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"alertText": "Test alert CMAU0000020"}'
```
Should return diagnostic data (or an error if API key not set).

---

## 🗂️ Project Structure for Vercel

```
/
├── api/                          # Serverless Python functions
│   ├── diagnose/
│   │   └── index.py             # → /api/diagnose endpoint
│   ├── test.py                  # → /api/test endpoint
│   └── hello.py                 # → /api/hello endpoint
│
├── my_solution/                 # Source code (not deployed directly)
│   ├── backend/
│   │   └── app/                # Imported by API functions
│   └── frontend/
│       └── src/                # Built and copied to /dist
│
├── dist/                        # Frontend build output (deployed to /)
│   ├── index.html
│   └── assets/
│
├── requirements.txt             # Python dependencies for API
├── package.json                # Node dependencies for build
├── vercel.json                 # Vercel configuration
└── build.js                    # Build script
```

---

## 🔧 How It Works

### Frontend → API Communication

1. **User visits**: `https://your-app.vercel.app/`
   - Vercel serves static files from `/dist`
   - React app loads

2. **User submits alert**:
   - Frontend calls: `POST /api/diagnose`
   - Vercel routes to: `api/diagnose/index.py`
   - Python handler processes request
   - Returns diagnostic data

### API Function Execution

```
Request: POST /api/diagnose
   ↓
Vercel Routes to: api/diagnose/index.py
   ↓
handler.do_POST() executes:
   1. Initialize L2DiagnosticSystem
   2. Parse request body
   3. Run diagnose(alert_text)
   4. Return JSON response
   ↓
Response sent back to browser
```

---

## 🐛 Troubleshooting

### Still Getting 404 After Deployment?

**Check 1: Verify API endpoint exists**
Look at the deployment logs in Vercel:
- Should see: `✓ api/diagnose/index.py`
- Should NOT see any Python import errors

**Check 2: Check browser console (F12)**
Look for the actual request URL:
- Should be: `https://your-app.vercel.app/api/diagnose`
- NOT: `http://localhost:5001/api/diagnose`

**Check 3: Check response in Network tab**
- 404 = Endpoint not found (deployment issue)
- 500 = Endpoint found but errored (likely missing API key)
- 400 = Missing alertText in request

### Getting 500 Internal Server Error?

**Most likely cause**: Missing or invalid Azure OpenAI API key

**Fix**:
1. Go to Vercel Settings → Environment Variables
2. Verify `AZURE_OPENAI_API_KEY` is set
3. Redeploy: Vercel → Deployments → Latest → ⋯ → Redeploy

### Getting CORS Errors?

**Check**: Browser console should show:
```
Access-Control-Allow-Origin: *
```

If not:
1. Verify `vercel.json` has headers configuration
2. Verify handler includes CORS headers
3. Redeploy

### Python Import Errors?

**Check deployment logs** for errors like:
```
ModuleNotFoundError: No module named 'openai'
```

**Fix**: Verify `requirements.txt` in project root contains:
```
openai>=1.0.0
python-dotenv>=1.0.0
```

---

## 📊 Monitoring

### View Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments** → Click latest deployment
4. Click **View Function Logs**

This shows real-time logs from your Python functions, including:
- Diagnostic system initialization
- Errors
- API calls

### Check Function Performance

In Vercel Dashboard → Analytics, you can see:
- Response times
- Error rates  
- Request counts

---

## ✅ Verification Checklist

Before considering deployment complete:

- [ ] Environment variables set in Vercel (especially `AZURE_OPENAI_API_KEY`)
- [ ] Latest code pushed to Git
- [ ] Vercel deployment successful (green checkmark)
- [ ] `/api/test` endpoint returns 200
- [ ] `/api/hello` endpoint returns 200  
- [ ] Website loads at root URL
- [ ] Can submit test case in UI
- [ ] Diagnostic results appear (or meaningful error message)
- [ ] No CORS errors in browser console
- [ ] No 404 errors in browser console

---

## 🎯 Quick Fix Summary

If you're still getting 404s after deploying:

1. **Check Vercel deployment logs** - Any Python errors?
2. **Add environment variables** - `AZURE_OPENAI_API_KEY` especially
3. **Redeploy** - Sometimes Vercel needs a fresh deployment
4. **Test API directly** - Use `curl` to test `/api/test` first
5. **Check browser console** - What's the actual error?

---

## 📞 Common Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `404 Not Found` | API endpoint not deployed | Check deployment logs, verify `api/diagnose/index.py` exists |
| `500 Internal Server Error` | Python error in handler | Check function logs in Vercel |
| `CORS policy blocked` | Missing CORS headers | Verify handler and vercel.json have CORS config |
| `alertText is required` | Frontend sending wrong format | Check request payload in Network tab |
| `Azure OpenAI API key is missing` | Environment variable not set | Add `AZURE_OPENAI_API_KEY` in Vercel settings |

---

## 🚀 After Deployment

Once everything works:

1. **Test with all provided test cases** from `Test Cases.pdf`
2. **Monitor function logs** for any errors
3. **Check cold start times** (first request after idle period)
4. **Consider adding rate limiting** if needed
5. **Update README** with your live Vercel URL

---

*Need help? Check the Vercel function logs first - they'll show exactly what's failing!*

