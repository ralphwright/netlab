"""Async database engine & session factory."""

import os
import ssl
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

    log.info(f"[netlab] DB URL scheme: {url.split('@')[0].split('://')[0] if '@' in url else 'unknown'}://***")
    return url


DATABASE_URL = _build_url()

# Railway Postgres may require SSL — detect and configure
_is_railway = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"))
_connect_args = {}

if _is_railway:
    # Railway managed Postgres uses SSL but self-signed certs
    _ssl_ctx = ssl.create_default_context()
    _ssl_ctx.check_hostname = False
    _ssl_ctx.verify_mode = ssl.CERT_NONE
    _connect_args["ssl"] = _ssl_ctx
    log.info("[netlab] Railway detected — SSL enabled for DB connection")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args=_connect_args,
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
