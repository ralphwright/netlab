"""NetLab — Interactive Network Engineering Labs API."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import labs, topology, cli, progress
from app.database import engine


async def _init_db():
    """Run schema + seed SQL on first boot if tables don't exist."""
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import AsyncSession

    async with AsyncSession(engine) as session:
        # Check if tables already exist
        result = await session.execute(text(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'labs')"
        ))
        exists = result.scalar()
        if exists:
            return  # already initialised

    # Tables don't exist — run init + seed
    import asyncpg

    db_url = os.getenv("DATABASE_URL", "")
    # asyncpg needs raw postgres:// URL
    raw_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)
    if not raw_url:
        raw_url = "postgresql://netlab:netlab_secret@localhost:5432/netlab"

    conn = await asyncpg.connect(raw_url)
    try:
        for sql_file in ["/app/db/init.sql", "/app/db/seed.sql"]:
            if os.path.exists(sql_file):
                with open(sql_file) as f:
                    await conn.execute(f.read())
    finally:
        await conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: ensure DB schema + seed data exist."""
    try:
        await _init_db()
    except Exception as e:
        print(f"[netlab] DB init note: {e}")
    yield


app = FastAPI(
    title="NetLab API",
    description="Backend for interactive network engineering labs",
    version="1.0.0",
    lifespan=lifespan,
)

# --- CORS: allow Railway domains, localhost, and any custom domain ---
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Railway sets RAILWAY_PUBLIC_DOMAIN for each service
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    allowed_origins.append(frontend_url)
    if not frontend_url.startswith("http"):
        allowed_origins.append(f"https://{frontend_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.up\.railway\.app",  # all Railway preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "netlab-api"}


app.include_router(labs.router, prefix="/api/labs", tags=["Labs"])
app.include_router(topology.router, prefix="/api/topology", tags=["Topology"])
app.include_router(cli.router, prefix="/api/cli", tags=["CLI"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])

# --- Serve frontend static build if present (single-container mode) ---
STATIC_DIR = "/app/static"
if os.path.isdir(STATIC_DIR):
    from fastapi.responses import FileResponse, HTMLResponse

    # Mount /assets for JS/CSS/images with correct MIME types and caching
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount(
            "/assets",
            StaticFiles(directory=assets_dir),
            name="static-assets",
        )

    # Serve other static root files (favicon, manifest, robots.txt, etc.)
    @app.get("/{filename:path}", include_in_schema=False)
    async def serve_spa(filename: str):
        # Don't intercept /api or /health or /docs or /openapi.json
        if filename.startswith(("api/", "health", "docs", "openapi.json", "redoc")):
            return  # falls through to 404, but these are already routed above

        file_path = os.path.join(STATIC_DIR, filename)
        if filename and os.path.isfile(file_path):
            return FileResponse(file_path)

        # SPA fallback — serve index.html for client-side routing
        index = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)

        return HTMLResponse("<h1>NetLab</h1><p>Frontend not built.</p>", status_code=404)


