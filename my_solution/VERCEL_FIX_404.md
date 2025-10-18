# 🚨 URGENT FIX for Vercel 404 - API Functions Not Deploying

## 🐛 The Problem

Your API functions (`/api/diagnose`, `/api/test`, `/api/hello`) are **NOT being deployed to Vercel**.

Testing shows:
```
❌ https://psa-code-sprint-25-frontend.vercel.app/api/diagnose → 404
❌ https://psa-code-sprint-25-frontend.vercel.app/api/test → 404
❌ https://psa-code-sprint-25-frontend.vercel.app/api/hello → 404
✅ https://psa-code-sprint-25-frontend.vercel.app/ → Frontend works
```

**The frontend works, but Vercel isn't deploying your Python serverless functions.**

---

## ✅ Solution: Fix Vercel Project Settings

### Step 1: Check Root Directory Setting

This is the most common issue!

1. Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **General**

2. Find: **Root Directory**

3. It should be:
   - ✅ **`.`** (a dot) - meaning project root
   - ✅ **Blank/Empty** - also means project root
   - ❌ **NOT** `my_solution/frontend`
   - ❌ **NOT** `frontend`
   - ❌ **NOT** `my_solution`

4. If it's wrong, click **Edit** and set it to **`.`** or leave it blank

5. **Save** and **Redeploy**

---

### Step 2: Verify Framework Preset

1. In Settings → General

2. Find: **Framework Preset**

3. Should be: **Other** or **Vite** (NOT Next.js, React, etc.)

4. If wrong, change it and redeploy

---

### Step 3: Check Build & Output Settings

1. **Build Command**: Should auto-detect or be `npm run build`
2. **Output Directory**: Should be `dist`
3. **Install Command**: Should be `npm install`

---

### Step 4: Redeploy

After fixing the settings:

1. Go to: **Deployments** tab
2. Click the **⋯** menu on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

---

## 🧪 How to Verify It's Fixed

After redeployment, test these URLs in your browser or terminal:

```bash
# Should return JSON, not 404
curl https://psa-code-sprint-25-frontend.vercel.app/api/test

# Should return: {"message": "Test endpoint works!", ...}
```

---

## 🔍 Check Deployment Logs

To see why Python functions aren't deploying:

1. Go to **Vercel Dashboard** → **Deployments**
2. Click on the latest deployment
3. Look at the **Building** section
4. You should see:
   ```
   Building api/test.py
   Building api/hello.py
   Building api/diagnose/index.py
   ```

If you DON'T see these, the Root Directory is wrong!

---

## 📊 What Changed in Latest Push

I updated `vercel.json` to explicitly tell Vercel to:

1. **Build the frontend** from `package.json` → `dist` folder
2. **Build Python functions** from `api/**/*.py`
3. **Route `/api/*`** requests to Python functions
4. **Route everything else** to the React SPA

This should force Vercel to detect and deploy the Python functions.

---

## 🆘 Still Not Working?

### Option A: Check if it's a project structure issue

Run this command to see your project structure:
```bash
cd "/Users/zhenduoyang/Desktop/PSA'25"
tree -L 2 -I 'node_modules|venv|dist'
```

Your structure should look like:
```
.
├── api/                    ← Python functions
│   ├── diagnose/
│   ├── test.py
│   └── hello.py
├── dist/                   ← Built frontend
│   ├── index.html
│   └── assets/
├── my_solution/            ← Source code
├── package.json            ← Root package.json
├── requirements.txt        ← Python dependencies
└── vercel.json            ← Vercel config
```

### Option B: Try connecting the repo again

If settings don't work:

1. **Vercel Dashboard** → **Add New Project**
2. **Import** your GitHub repo: `Path-yang/PSA-Code-Sprint-25`
3. **Root Directory**: Leave blank or set to `.`
4. **Framework**: Other
5. **Deploy**

This will create a new deployment with correct settings.

### Option C: Check Environment Variables

Make sure these are still set (they should be):
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_API_VERSION`
- `AZURE_OPENAI_DEPLOYMENT`

---

## 📸 Screenshot Guide

**Where to find Root Directory setting:**

```
Vercel Dashboard
  → Your Project (psa-code-sprint-25-frontend)
    → Settings (top menu)
      → General (left sidebar)
        → Root Directory (scroll down)
```

It will look like:
```
┌─────────────────────────────────────┐
│ Root Directory                      │
│ ──────────────────────────────────  │
│ [  .  ] or [ blank ]         [Edit] │
│                                     │
│ ⚠️ If this says "frontend" or      │
│    "my_solution/frontend", that's  │
│    the problem!                    │
└─────────────────────────────────────┘
```

---

## ✅ Success Checklist

After fixing and redeploying:

- [ ] Deployment shows "Building api/*.py" in logs
- [ ] `curl https://your-url.vercel.app/api/test` returns JSON (not 404)
- [ ] `curl https://your-url.vercel.app/api/hello` returns JSON (not 404)
- [ ] Frontend still loads at root URL
- [ ] Can submit test case in UI without 404 error

---

## 🎯 TL;DR

1. **Vercel Settings → Root Directory → Set to `.` or blank**
2. **Redeploy**
3. **Test**: `curl https://psa-code-sprint-25-frontend.vercel.app/api/test`
4. **Should work!** 🎉

---

*The Root Directory setting is almost always the culprit when API functions don't deploy!*

