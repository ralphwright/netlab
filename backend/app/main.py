"""NetLab — Interactive Network Engineering Labs API."""

import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.routers import labs, topology, cli, progress
from app.database import engine

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
log = logging.getLogger("netlab")

# ── SQL file locations (baked into Docker image) ─────────────
SQL_DIR = "/app/db"
# Fallback for local dev outside Docker
if not os.path.isdir(SQL_DIR):
    SQL_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "db")

INIT_SQL = os.path.join(SQL_DIR, "init.sql")
SEED_SQL = os.path.join(SQL_DIR, "seed.sql")


def _split_sql(filepath: str) -> list[str]:
    """Read a SQL file and split into individual statements.

    Handles comments, semicolons inside strings, and E'' escape strings.
    """
    if not os.path.isfile(filepath):
        log.warning(f"SQL file not found: {filepath}")
        return []

    with open(filepath) as f:
        raw = f.read()

    # Remove single-line comments
    lines = []
    for line in raw.split("\n"):
        stripped = line.strip()
        if stripped.startswith("--"):
            continue
        lines.append(line)
    cleaned = "\n".join(lines)

    # Split on semicolons that are NOT inside single quotes
    statements = []
    current = []
    in_string = False
    i = 0
    while i < len(cleaned):
        ch = cleaned[i]

        # Handle E'' escape strings and regular strings
        if ch == "'" and not in_string:
            in_string = True
            current.append(ch)
        elif ch == "'" and in_string:
            # Check for escaped quote ''
            if i + 1 < len(cleaned) and cleaned[i + 1] == "'":
                current.append("''")
                i += 2
                continue
            else:
                in_string = False
                current.append(ch)
        elif ch == ";" and not in_string:
            stmt = "".join(current).strip()
            if stmt:
                statements.append(stmt)
            current = []
        else:
            current.append(ch)
        i += 1

    # Last statement (no trailing semicolon)
    stmt = "".join(current).strip()
    if stmt:
        statements.append(stmt)

    return statements


async def _run_sql_file(filepath: str) -> tuple[int, list[str]]:
    """Execute all statements in a SQL file. Returns (success_count, errors).

    First tries running the full file via the raw asyncpg driver (fastest,
    handles all Postgres syntax). Falls back to statement-by-statement
    execution through SQLAlchemy if that fails.
    """
    if not os.path.isfile(filepath):
        return 0, [f"File not found: {filepath}"]

    with open(filepath) as f:
        raw_sql = f.read()

    if not raw_sql.strip():
        return 0, [f"Empty file: {filepath}"]

    # ── Approach 1: Raw driver (full file at once) ────────────
    try:
        async with engine.connect() as conn:
            raw_conn = await conn.get_raw_connection()
            # asyncpg's underlying connection supports multi-statement execute
            await raw_conn.driver_connection.execute(raw_sql)
            await conn.commit()
        log.info(f"[netlab] ✓ Executed {filepath} via raw driver (full file)")
        return 1, []
    except Exception as e:
        log.warning(f"[netlab] Raw driver execution failed for {filepath}: {e}")
        log.info("[netlab] Falling back to statement-by-statement...")

    # ── Approach 2: Split into statements and run individually ──
    statements = _split_sql(filepath)
    if not statements:
        return 0, [f"No statements parsed from {filepath}"]

    success = 0
    errors = []

    async with engine.begin() as conn:
        for i, stmt in enumerate(statements):
            try:
                await conn.execute(text(stmt))
                success += 1
            except Exception as e:
                err_msg = f"Stmt {i+1} failed: {str(e)[:200]}"
                errors.append(err_msg)
                log.warning(f"  {err_msg}")

    log.info(f"[netlab] Statement-by-statement: {success} OK, {len(errors)} errors")
    return success, errors


async def _init_db():
    """Run schema + seed SQL on first boot if tables don't exist."""
    log.info("[netlab] Checking database state...")

    # Check if tables already exist
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'labs')"
            ))
            exists = result.scalar()
    except Exception as e:
        log.error(f"[netlab] Cannot connect to database: {e}")
        return

    if exists:
        # Tables exist — check if they have data
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT count(*) FROM labs"))
            count = result.scalar()

        if count and count > 0:
            log.info(f"[netlab] Database ready — {count} labs found")
            return
        else:
            log.info("[netlab] Tables exist but are empty — running seed only")
            ok, errs = await _run_sql_file(SEED_SQL)
            log.info(f"[netlab] Seed: {ok} statements OK, {len(errs)} errors")
            return

    # Tables don't exist — run full init + seed
    log.info(f"[netlab] Fresh database — running init from {INIT_SQL}")
    ok1, errs1 = await _run_sql_file(INIT_SQL)
    log.info(f"[netlab] Init: {ok1} statements OK, {len(errs1)} errors")
    for e in errs1[:5]:
        log.warning(f"  {e}")

    log.info(f"[netlab] Running seed from {SEED_SQL}")
    ok2, errs2 = await _run_sql_file(SEED_SQL)
    log.info(f"[netlab] Seed: {ok2} statements OK, {len(errs2)} errors")
    for e in errs2[:5]:
        log.warning(f"  {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: ensure DB schema + seed data exist."""
    try:
        await _init_db()
    except Exception as e:
        log.error(f"[netlab] DB init FAILED: {e}", exc_info=True)
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

frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    allowed_origins.append(frontend_url)
    if not frontend_url.startswith("http"):
        allowed_origins.append(f"https://{frontend_url}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.up\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health & diagnostics ─────────────────────────────────────

@app.get("/health")
async def health():
    """Health check with DB status."""
    db_ok = False
    lab_count = 0
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT count(*) FROM labs"))
            lab_count = result.scalar() or 0
            db_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if db_ok else "degraded",
        "service": "netlab-api",
        "db_connected": db_ok,
        "lab_count": lab_count,
        "sql_dir": SQL_DIR,
        "init_sql_exists": os.path.isfile(INIT_SQL),
        "seed_sql_exists": os.path.isfile(SEED_SQL),
    }


@app.post("/api/seed")
async def manual_seed():
    """Manually trigger database init + seed (safe to call multiple times)."""
    results = {}

    # Check current state
    try:
        async with engine.connect() as conn:
            r = await conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'labs')"
            ))
            tables_exist = r.scalar()
    except Exception as e:
        return {"error": f"Cannot connect to database: {e}"}

    if not tables_exist:
        ok, errs = await _run_sql_file(INIT_SQL)
        results["init"] = {"ok": ok, "errors": errs[:10]}
    else:
        results["init"] = "skipped — tables already exist"

    # Check if data exists
    try:
        async with engine.connect() as conn:
            r = await conn.execute(text("SELECT count(*) FROM labs"))
            count = r.scalar() or 0
    except Exception:
        count = 0

    if count == 0:
        ok, errs = await _run_sql_file(SEED_SQL)
        results["seed"] = {"ok": ok, "errors": errs[:10]}
    else:
        results["seed"] = f"skipped — {count} labs already exist"

    # Final count
    try:
        async with engine.connect() as conn:
            r = await conn.execute(text("SELECT count(*) FROM labs"))
            results["final_lab_count"] = r.scalar() or 0
    except Exception as e:
        results["final_lab_count"] = f"error: {e}"

    return results


# ── API routers ──────────────────────────────────────────────

app.include_router(labs.router, prefix="/api/labs", tags=["Labs"])
app.include_router(topology.router, prefix="/api/topology", tags=["Topology"])
app.include_router(cli.router, prefix="/api/cli", tags=["CLI"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])

# ── Serve frontend static build (single-container mode) ──────

STATIC_DIR = "/app/static"
if os.path.isdir(STATIC_DIR):
    from fastapi.responses import FileResponse, HTMLResponse

    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount(
            "/assets",
            StaticFiles(directory=assets_dir),
            name="static-assets",
        )

    @app.get("/{filename:path}", include_in_schema=False)
    async def serve_spa(filename: str):
        if filename.startswith(("api/", "health", "docs", "openapi.json", "redoc")):
            return

        file_path = os.path.join(STATIC_DIR, filename)
        if filename and os.path.isfile(file_path):
            return FileResponse(file_path)

        index = os.path.join(STATIC_DIR, "index.html")
        if os.path.isfile(index):
            return FileResponse(index)

        return HTMLResponse("<h1>NetLab</h1><p>Frontend not built.</p>", status_code=404)


