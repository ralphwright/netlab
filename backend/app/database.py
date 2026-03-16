"""Async database engine & session factory."""

import os
import logging
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

log = logging.getLogger("netlab")


def _build_url() -> str:
    """Convert Railway's DATABASE_URL (postgres://) to asyncpg format."""
    url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://netlab:netlab_secret@localhost:5432/netlab",
    )
    # Railway provides postgres:// or postgresql:// — swap to asyncpg driver
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # Strip sslmode from URL query params — we handle SSL via connect_args
    # Railway URLs sometimes include ?sslmode=require which conflicts
    if "?" in url:
        base, params = url.split("?", 1)
        filtered = "&".join(
            p for p in params.split("&")
            if not p.startswith("sslmode=")
        )
        url = f"{base}?{filtered}" if filtered else base

    log.info(f"[netlab] DB host: {'Railway' if _is_railway() else 'local'}")
    return url


def _is_railway() -> bool:
    return bool(
        os.getenv("RAILWAY_ENVIRONMENT")
        or os.getenv("RAILWAY_PROJECT_ID")
        or os.getenv("RAILWAY_SERVICE_ID")
    )


DATABASE_URL = _build_url()

# Railway private networking: no SSL needed (services share a VPC).
# Do NOT pass an ssl.SSLContext — it causes "unexpected eof" / "connection reset"
# because asyncpg's SSLContext negotiation clashes with Railway's Postgres config.
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=300,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
