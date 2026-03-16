# ══════════════════════════════════════════════════════════════
# NetLab — Single-Container Production Build
# Stage 1: Build React frontend
# Stage 2: Run FastAPI serving both API + static SPA
# ══════════════════════════════════════════════════════════════

# ── Stage 1: Frontend Build ───────────────────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /build

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .

# Empty VITE_API_URL = same-origin requests (API and UI on same domain)
ENV VITE_API_URL=""

RUN npm run build


# ── Stage 2: Backend + Serve ──────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl && rm -rf /var/lib/apt/lists/*

# Python deps
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY backend/app/ /app/app/

# Database SQL for auto-init
COPY db/ /app/db/

# Frontend static build from stage 1
COPY --from=frontend-build /build/dist /app/static

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

EXPOSE 8000

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
