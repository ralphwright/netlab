# Deploying NetLab on Railway

## How It Works

The project is pre-configured for Railway with a unified single-container build.
FastAPI serves both the API (`/api/*`) and the React frontend (everything else)
from one service. The database auto-seeds on first boot.

```
┌────────── Railway Project ──────────┐
│                                     │
│  ┌───────────────┐  ┌───────────┐  │
│  │   NetLab      │─▶│ PostgreSQL│  │
│  │  (FastAPI +   │  │ (managed) │  │
│  │   React SPA)  │  │           │  │
│  │   :PORT       │  │  :5432    │  │
│  └───────────────┘  └───────────┘  │
│    public URL         private       │
│                                     │
└─────────────────────────────────────┘
```

**You configure: nothing.**
Railway reads `railway.toml` and `Dockerfile` automatically.

---

## Deploy in 4 Steps

### 1. Push to GitHub

```bash
cd netlab
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/netlab.git
git push -u origin main
```

### 2. Create Railway Project

1. Go to [railway.app/new](https://railway.app/new)
2. Click **"Deploy from GitHub Repo"**
3. Select your `netlab` repo
4. Railway reads `railway.toml`, detects the `Dockerfile`, and starts building

### 3. Add PostgreSQL

1. In your Railway project dashboard, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Click on the Postgres service → **"Variables"** tab
3. Copy the `DATABASE_URL` variable
4. Click on your **netlab** service → **"Variables"** tab
5. Add a new variable:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` ← click "Add Reference" and select your Postgres service |

6. Railway will auto-redeploy with the database connected

### 4. Generate a Public URL

1. Click on the netlab service → **"Settings"** tab → **"Networking"**
2. Click **"Generate Domain"**
3. Open the generated `https://_____.up.railway.app` URL

That's it. The app auto-creates all tables and seeds 23 labs on first boot.

---

## What Happens Automatically

| Step | How |
|------|-----|
| Builder selection | `railway.toml` forces `Dockerfile` builder (no railpack errors) |
| Frontend build | Multi-stage `Dockerfile` compiles React with Vite in stage 1 |
| Backend setup | Stage 2 installs Python deps, copies API code + DB SQL files |
| Static serving | FastAPI mounts `/assets` and serves SPA fallback for client routes |
| DB initialization | On startup, checks if `labs` table exists; if not, runs `init.sql` + `seed.sql` |
| Health checks | `railway.toml` configures `/health` endpoint monitoring |
| CORS | Auto-allows all `*.up.railway.app` origins via regex |
| Port binding | Reads Railway's `PORT` env var automatically |

---

## Custom Domain (Optional)

1. Click on the service → **Settings** → **Networking** → **"+ Custom Domain"**
2. Enter your domain (e.g. `labs.yourdomain.com`)
3. Add the CNAME record Railway shows to your DNS provider
4. Railway auto-provisions HTTPS

---

## Environment Variables

Only **one** is required:

| Variable | Required | How to Set |
|----------|----------|------------|
| `DATABASE_URL` | **Yes** | Add as Railway reference: `${{Postgres.DATABASE_URL}}` |

Optional:

| Variable | Purpose |
|----------|---------|
| `FRONTEND_URL` | Extra CORS origin (custom domains) |
| `PORT` | Auto-injected by Railway |

---

## Cost

Railway's Hobby plan ($5/month) easily covers this:

| Service | Monthly |
|---------|---------|
| App container | ~$1–3 |
| PostgreSQL | ~$1–2 |
| **Total** | **~$2–5** |

---

## Troubleshooting

**"Error creating build plan with railpack":**
→ The `railway.toml` in this repo should prevent this. If it still happens,
go to **Settings** → **Build** → change **Builder** from `Railpack` to `Dockerfile`

**Blank page / no data:**
→ Check that `DATABASE_URL` is set on the service (Variables tab)
→ Check deploy logs for `[netlab] DB init` messages

**502 after deploy:**
→ First deploy may take 30–60s while the DB seeds. Wait and refresh.

**Want to re-seed the database:**
→ Delete and re-add the Postgres service, or run via Railway CLI:
```bash
railway connect postgres
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
\i db/init.sql
\i db/seed.sql
```

---

## Local Development

The `docker-compose.yml` still works for local dev with hot reload:

```bash
docker compose up --build
# Frontend: http://localhost:3000 (Vite dev server with HMR)
# Backend:  http://localhost:8000 (auto-reload)
# Postgres: localhost:5432
```

---

## Multi-Service Deploy (Alternative)

If you prefer separate frontend/backend services (e.g. for independent scaling),
the repo also includes `Dockerfile.backend` and `Dockerfile.frontend` for that
approach. See the comments in those files for Railway settings.
