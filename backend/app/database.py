"""Async database engine & session factory."""

import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker


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
    return url


DATABASE_URL = _build_url()

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,          # reconnect on stale connections
    pool_recycle=300,             # recycle connections every 5 min
)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
