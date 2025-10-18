# ⚡ Quick Fix for Vercel 404 Errors

## 🐛 The Problem

You're getting **404 errors** when submitting test cases on your Vercel deployment because:

1. **Wrong Python handler format** - Vercel expects `BaseHTTPRequestHandler` class
2. **Missing CORS headers** - Browser blocks requests without proper headers
3. **Missing SPA routing** - React Router routes return 404

## ✅ What I Fixed

### Files Changed:

1. **`api/diagnose/index.py`** ✅
   - Changed handler to use `BaseHTTPRequestHandler` (Vercel's expected format)
   - Added CORS headers
   - Fixed request/response handling

2. **`vercel.json`** ✅
   - Added SPA rewrites for React Router
   - Added CORS headers configuration

3. **`api/test.py`** ✅ NEW
   - Created test endpoint to verify deployment works

4. **`.vercelignore`** ✅ NEW
   - Exclude unnecessary files from deployment

---

## 🚀 What You Need to Do

### Step 1: Set Environment Variables in Vercel

**This is the most important step!**

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add these:

```
Variable Name: AZURE_OPENAI_API_KEY
Value: your-actual-api-key-here
Environment: Production, Preview, Development

Variable Name: AZURE_OPENAI_ENDPOINT
Value: https://psacodesprint2025.azure-api.net/
Environment: Production, Preview, Development

Variable Name: AZURE_OPENAI_API_VERSION
Value: 2025-01-01-preview
Environment: Production, Preview, Development

Variable Name: AZURE_OPENAI_DEPLOYMENT
Value: gpt-4.1-nano
Environment: Production, Preview, Development
```

### Step 2: Deploy the Changes

```bash
cd "/Users/zhenduoyang/Desktop/PSA'25"
git add .
git commit -m "Fix Vercel 404 errors - update handler format and add CORS"
git push
```

Vercel will automatically deploy the changes.

### Step 3: Test the Deployment

Once deployed, test in your browser or with curl (replace `YOUR-URL` with your actual Vercel URL):

**Test 1: Basic test endpoint**
```bash
curl https://YOUR-URL.vercel.app/api/test
```
Should return: `{"message": "Test endpoint works!", ...}`

**Test 2: Diagnose endpoint**
```bash
curl -X POST https://YOUR-URL.vercel.app/api/diagnose \
  -H "Content-Type: application/json" \
  -d '{"alertText": "Test alert CMAU0000020"}'
```
Should return diagnostic data (not 404).

**Test 3: Frontend**
Open `https://YOUR-URL.vercel.app/` and submit a test case.

---

## 🔍 Verification

After deploying, check:

- ✅ No 404 errors when submitting test cases
- ✅ No CORS errors in browser console (F12)
- ✅ Diagnostic results appear (or meaningful error like "API key missing")

---

## 🐛 Still Getting Errors?

### If still 404:
1. Check Vercel deployment logs - any Python errors?
2. Verify `api/diagnose/index.py` appears in deployment
3. Try the `/api/test` endpoint first

### If 500 error:
1. Check Vercel function logs (Dashboard → Functions)
2. Most likely: Missing or invalid API key
3. Verify environment variables are set correctly

### If CORS errors:
1. Check that latest code is deployed
2. Look for "Access-Control-Allow-Origin" in response headers
3. Redeploy if needed

---

## 📝 Changes Summary

| File | Change | Why |
|------|--------|-----|
| `api/diagnose/index.py` | Changed handler format | Vercel expects BaseHTTPRequestHandler |
| `api/diagnose/index.py` | Added CORS headers | Fix browser blocking requests |
| `vercel.json` | Added rewrites | Fix React Router 404s |
| `vercel.json` | Added headers | Fix CORS at platform level |
| `api/test.py` | New file | Test endpoint for debugging |
| `.vercelignore` | New file | Optimize deployment size |

---

## ⚡ TL;DR

1. **Add API key** to Vercel environment variables (Settings → Environment Variables)
2. **Push changes**: `git add . && git commit -m "Fix 404" && git push`
3. **Wait for deployment** (2-3 minutes)
4. **Test at your Vercel URL**

The 404 should be gone! 🎉

---

**What's your Vercel URL?** Share it and I can help test if it's working!

