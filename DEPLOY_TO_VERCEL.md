# 🚀 Deploy to Vercel - CRITICAL SETUP

## ⚠️ IMPORTANT: Root Directory Must Be Set!

After pushing the reorganized code, you **MUST** update Vercel's Root Directory setting.

---

## 🔧 Required Steps

### Step 1: Update Root Directory in Vercel

1. Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **General**

2. Find: **Root Directory**

3. **Change from blank to**: `my_solution`

4. Click **Save**

### Step 2: Redeploy

1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes

---

## ✅ What This Does

With `Root Directory` set to `my_solution`, Vercel will:

1. ✅ Find `package.json` at `my_solution/package.json`
2. ✅ Find `vercel.json` at `my_solution/vercel.json`
3. ✅ Find API functions at `my_solution/api/**/*.py`
4. ✅ Build frontend from `my_solution/frontend/`
5. ✅ Deploy everything correctly

---

## 🧪 Verify Deployment

After redeployment, test:

```bash
# Test endpoint should work
curl https://psa-code-sprint-25-frontend.vercel.app/api/test

# Should return:
{"message": "Test endpoint works!", "method": "GET"}
```

Then try submitting an alert in the UI!

---

## 📊 New Structure

```
Vercel sees (with Root Directory = my_solution):
/my_solution/              ← This is now the "root" for Vercel
├── api/                   ← Vercel finds API functions here
├── backend/               ← Imported by API functions
├── frontend/              ← Source for build
├── vercel.json           ← Vercel config
├── package.json          ← Build config
└── requirements.txt      ← Python deps
```

---

## 🚨 If You Forget This Step

Without setting Root Directory to `my_solution`:
- ❌ Vercel won't find `vercel.json`
- ❌ API functions won't deploy
- ❌ You'll get 404 errors again

**Don't forget: Root Directory = `my_solution`**

---

## ✨ That's It!

Once you:
1. Set Root Directory to `my_solution`
2. Redeploy

Everything should work perfectly! 🎉

