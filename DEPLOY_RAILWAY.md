# Deploying NetLab on Railway

## Overview

Railway runs each service (frontend, backend, database) as separate containers
with automatic HTTPS, internal networking, and managed PostgreSQL. Your project
will deploy as three Railway services from a single GitHub repo.

```
┌───────────────────── Railway Project ─────────────────────┐
│                                                           │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │ Frontend │──▶│   Backend    │──▶│   PostgreSQL     │  │
│  │ (nginx)  │   │  (FastAPI)   │   │   (managed)      │  │
│  │ :PORT    │   │  :PORT       │   │   :5432          │  │
│  └──────────┘   └──────────────┘   └──────────────────┘  │
│   public URL     public + private      private only       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Prerequisites

1. A [Railway account](https://railway.app) (free tier works to start)
2. This repo pushed to GitHub
3. [Railway CLI](https://docs.railway.app/develop/cli) installed (optional but helpful)

---

## Step-by-step Deployment

### 1. Push to GitHub

```bash
cd netlab
git init
git add .
git commit -m "Initial commit — NetLab"
git remote add origin https://github.com/YOUR_USER/netlab.git
git push -u origin main
```

### 2. Create a Railway Project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub Repo"**
3. Select your `netlab` repo
4. Railway auto-creates a service — we'll configure it next

### 3. Add PostgreSQL

1. In your Railway project, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Railway provisions a managed Postgres instance instantly
3. Click on the Postgres service → **"Connect"** tab
4. Copy the `DATABASE_URL` — you'll need it for the backend

### 4. Configure the Backend Service

1. Click **"+ New"** → **"GitHub Repo"** → select `netlab` again
2. Name this service **"backend"**
3. Go to **Settings** tab:
   - **Root Directory**: `/` (repo root — the Dockerfile references `backend/` and `db/`)
   - **Dockerfile Path**: `Dockerfile.backend`
   - **Watch Paths**: `/backend/**`, `/db/**`
4. Go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (click "Add Reference" → select your Postgres service) |
| `FRONTEND_URL` | *(set this after deploying frontend — paste the frontend's public URL)* |

5. Go to **Networking** tab:
   - Enable **Public Networking** to generate a `.up.railway.app` domain
   - Note this URL (e.g. `https://netlab-backend-production.up.railway.app`)

### 5. Seed the Database

The backend auto-runs `db/init.sql` and `db/seed.sql` on first startup if the
`labs` table doesn't exist. Just trigger a deploy and check the logs.

If you need to manually seed:

```bash
# Option A: Railway CLI
railway run --service backend -- python -c "
import asyncio; from app.main import _init_db; asyncio.run(_init_db())
"

# Option B: Connect directly with psql
railway connect postgres
\i db/init.sql
\i db/seed.sql
```

### 6. Configure the Frontend Service

1. Click **"+ New"** → **"GitHub Repo"** → select `netlab` again
2. Name this service **"frontend"**
3. Go to **Settings** tab:
   - **Root Directory**: `/` (repo root)
   - **Dockerfile Path**: `Dockerfile.frontend`
   - **Watch Paths**: `/frontend/**`
4. Go to **Variables** tab and add:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://netlab-backend-production.up.railway.app` *(your backend's public URL from step 4)* |

> **Important**: `VITE_API_URL` is a *build-time* variable. After setting it,
> trigger a **redeploy** so Vite bakes the URL into the JavaScript bundle.

5. Go to **Networking** tab:
   - Enable **Public Networking**
   - This is your public-facing URL (e.g. `https://netlab-production.up.railway.app`)

### 7. Update Backend CORS

Go back to your **backend** service → **Variables** and set:

| Variable | Value |
|----------|-------|
| `FRONTEND_URL` | `https://netlab-production.up.railway.app` *(your frontend's public URL)* |

The backend also allows all `*.up.railway.app` origins by regex, so this is an
extra safety layer for custom domains.

### 8. Verify

```bash
# Backend health
curl https://YOUR-BACKEND.up.railway.app/health
# → {"status":"ok","service":"netlab-api"}

# Labs API
curl https://YOUR-BACKEND.up.railway.app/api/labs/
# → [...22 labs + integration lab...]

# Frontend
open https://YOUR-FRONTEND.up.railway.app
```

---

## Custom Domain (Optional)

1. In Railway, click on a service → **Settings** → **Networking**
2. Click **"+ Custom Domain"**
3. Enter your domain (e.g. `labs.yourdomain.com`)
4. Add the CNAME record Railway provides to your DNS
5. Railway auto-provisions HTTPS via Let's Encrypt

If using a custom domain on the frontend, update the backend's `FRONTEND_URL`
variable to match.

---

## Environment Variable Summary

### Backend Service

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `${{Postgres.DATABASE_URL}}` (Railway reference) |
| `FRONTEND_URL` | Recommended | `https://your-frontend.up.railway.app` |
| `PORT` | Auto-set | Railway injects this automatically |

### Frontend Service

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_API_URL` | Yes | `https://your-backend.up.railway.app` |
| `PORT` | Auto-set | Railway injects this automatically |

---

## Cost Estimate

Railway's free **Trial** plan gives you $5 in credits. After that, the **Hobby**
plan at $5/month typically covers this stack comfortably:

| Service | Estimated Monthly Cost |
|---------|----------------------|
| PostgreSQL | ~$1–2 (Dev plan) |
| Backend (FastAPI) | ~$1–3 |
| Frontend (nginx) | ~$0.50–1 |
| **Total** | **~$3–5/month** |

---

## Troubleshooting

**Frontend shows blank page / API errors:**
→ Check that `VITE_API_URL` points to the backend's *public* URL with `https://`
→ Redeploy the frontend after changing the variable (it's build-time)

**Database connection errors in backend logs:**
→ Verify `DATABASE_URL` is set as a Railway reference (`${{Postgres.DATABASE_URL}}`)
→ The backend auto-converts `postgres://` to `postgresql+asyncpg://`

**CORS errors in browser console:**
→ Set `FRONTEND_URL` on the backend service
→ The regex fallback covers `*.up.railway.app` but custom domains need explicit config

**Tables not created:**
→ Check backend deploy logs for the `[netlab] DB init` message
→ If it says "already initialised", the tables exist. If errors, manually run the SQL via `railway connect postgres`

**502 errors:**
→ Railway's health check may time out during first deploy while DB seeds
→ Wait 30–60 seconds and refresh

---

## Alternative: Single-Container Mode

If you prefer a single Railway service (cheaper, simpler), you can serve
the frontend static build directly from FastAPI:

```bash
# Build frontend locally
cd frontend && npm run build

# Copy dist into backend
cp -r dist/ ../backend/static/

# Deploy just the backend with the static files baked in
# The FastAPI app auto-serves /static if the directory exists
```

Then deploy only the backend service + Postgres. The SPA catch-all route
in `main.py` serves `index.html` for all non-API paths.
