import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from app.core.config import settings
from app.db.connection import get_database_url

logger = logging.getLogger("labtrack.vector_db")
_vector_engine: AsyncEngine | None = None

def init_vector_db() -> dict:
    """Create the async Vector DB engine lazily (does NOT report connected until live ping passes)."""
    global _vector_engine
    try:
        if _vector_engine is None:
            _vector_engine = create_async_engine(
                get_database_url(),
                echo=False,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"timeout": 3},
            )
        return {"status": "initialized", "uri": get_database_url()}
    except Exception as e:
        logger.error("Vector DB engine creation failed: %s", e)
        return {"status": "disconnected", "error": str(e)}

async def dispose_vector_db() -> None:
    """Safely dispose stale pooled connections so reconnection succeeds cleanly."""
    global _vector_engine
    if _vector_engine is not None:
        try:
            await _vector_engine.dispose()
        except Exception:
            pass

async def ensure_vector_extension() -> bool:
    global _vector_engine
    if _vector_engine is None:
        init_vector_db()
    if _vector_engine is None:
        return False
    try:
        async with _vector_engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.execute(text("CREATE SCHEMA IF NOT EXISTS labtrack_schema"))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS labtrack_schema.ai_chat_sessions (
                    session_id VARCHAR(128) PRIMARY KEY,
                    user_id VARCHAR(128),
                    role VARCHAR(64) DEFAULT 'ADMIN',
                    history_json TEXT DEFAULT '[]',
                    last_active TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS labtrack_schema.telemetry_logs (
                    id SERIAL PRIMARY KEY,
                    workstation_id VARCHAR(128) NOT NULL,
                    cpu_pct DOUBLE PRECISION DEFAULT 0.0,
                    memory_pct DOUBLE PRECISION DEFAULT 0.0,
                    temperature_celsius DOUBLE PRECISION DEFAULT 45.0,
                    status VARCHAR(64) DEFAULT 'Normal',
                    payload_json TEXT DEFAULT '{}',
                    received_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS labtrack_schema.ai_vector_memory (
                    id SERIAL PRIMARY KEY,
                    topic VARCHAR(128),
                    content TEXT NOT NULL,
                    embedding vector(8),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))
        return True
    except Exception as e:
        logger.debug("Could not initialize vector/persistent tables: %s", e)
        return False

async def check_vector_db_health(silent: bool = False) -> dict:
    """Perform a REAL live ping against PostgreSQL + pgvector."""
    if _vector_engine is None:
        init_vector_db()
    if _vector_engine is None:
        return {"status": "disconnected", "pgvector_version": "unavailable"}

    try:
        async with _vector_engine.connect() as conn:
            row = (
                await conn.execute(text("SELECT version(), current_database()"))
            ).fetchone()
            vec_row = (
                await conn.execute(
                    text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
                )
            ).fetchone()

        if not vec_row:
            await ensure_vector_extension()
            async with _vector_engine.connect() as conn:
                vec_row = (
                    await conn.execute(
                        text("SELECT extversion FROM pg_extension WHERE extname = 'vector'")
                    )
                ).fetchone()

        pgvec_ver = vec_row[0] if vec_row else None
        if not pgvec_ver:
            return {
                "status": "disconnected",
                "database": row[1] if row else settings.DB_NAME,
                "server_version": (row[0] or "").split(",")[0] if row else None,
                "pgvector_version": "not_installed",
            }

        return {
            "status": "connected",
            "database": row[1] if row else settings.DB_NAME,
            "server_version": (row[0] or "").split(",")[0] if row else None,
            "pgvector_version": pgvec_ver,
        }
    except Exception as e:
        await dispose_vector_db()
        if not silent:
            logger.debug("Vector DB health check failed: %s", e)
        return {
            "status": "disconnected",
            "pgvector_version": "unavailable",
            "error": str(e),
        }
