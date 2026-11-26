import logging
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from app.core.config import settings

logger = logging.getLogger("labtrack.db.connection")
_main_engine: AsyncEngine | None = None


def get_database_url() -> str:
    env_url = os.getenv("DATABASE_URL")
    if env_url and env_url.startswith("postgres"):
        if "+asyncpg" not in env_url:
            return env_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return env_url
    return settings.database_url


def get_main_engine() -> AsyncEngine:
    global _main_engine
    if _main_engine is None:
        _main_engine = create_async_engine(
            get_database_url(),
            echo=False,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            connect_args={"timeout": 3},
        )
    return _main_engine


async def dispose_main_db() -> None:
    """Dispose stale pooled connections so reconnection succeeds immediately when Postgres starts."""
    global _main_engine
    if _main_engine is not None:
        try:
            await _main_engine.dispose()
        except Exception:
            pass


async def check_main_db_health(silent: bool = False) -> dict:
    """Perform a REAL live query against PostgreSQL (returns disconnected when Postgres is OFF)."""
    engine = get_main_engine()
    try:
        async with engine.connect() as conn:
            row = (
                await conn.execute(text("SELECT version(), current_database(), current_user"))
            ).fetchone()
            vector_row = (
                await conn.execute(
                    text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
                )
            ).fetchone()

        return {
            "status": "connected",
            "database": row[1] if row else settings.DB_NAME,
            "user": row[2] if row else settings.DB_USER,
            "server_version": (row[0] or "").split(",")[0] if row else None,
            "pgvector_version": vector_row[0] if vector_row else "not_installed",
        }
    except Exception as e:
        await dispose_main_db()
        if not silent:
            logger.debug("Main DB health check failed: %s", e)
        return {
            "status": "disconnected",
            "database": settings.DB_NAME,
            "user": settings.DB_USER,
            "error": str(e),
        }
