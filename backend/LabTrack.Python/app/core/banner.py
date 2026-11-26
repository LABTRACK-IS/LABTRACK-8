import asyncio
import logging
from datetime import datetime
from app.core.config import settings
from app.db.connection import check_main_db_health
from app.db.vector_db import (
    ensure_vector_extension,
    check_vector_db_health,
    dispose_vector_db,
)

logger = logging.getLogger("LabTrack.Python.Main")


def log_status_box(db_health: dict, vector_health: dict, event_label: str = "") -> None:
    """Print an aligned live status box showing genuine CONNECTED / DISCONNECTED PostgreSQL state."""
    main_ok = db_health.get("status") == "connected"
    vec_ok = vector_health.get("status") == "connected"

    main_status = "CONNECTED" if main_ok else "DISCONNECTED"
    vec_status = "CONNECTED" if vec_ok else "DISCONNECTED"

    main_db = db_health.get("database") or settings.DB_NAME
    main_user = db_health.get("user") or settings.DB_USER
    vec_version = vector_health.get("pgvector_version") or "unavailable"

    if main_ok and vec_ok:
        ready = "READY"
    elif not main_ok and not vec_ok:
        ready = "DISCONNECTED (PostgreSQL is OFF)"
    else:
        ready = "DEGRADED"

    main_line = (
        f"MAIN DB     : {main_status} - {main_db} @ {main_user}"
        if main_ok
        else f"MAIN DB     : {main_status} - {settings.DB_HOST}:{settings.DB_PORT} offline"
    )
    vec_line = f"VECTOR DB   : {vec_status} - pgvector {vec_version}"

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    header = "LabTrack.Python - AI ENGINE" if not event_label else f"LabTrack.Python - {event_label}"

    w = 56
    border = "+" + "-" * (w + 2) + "+"
    logger.info(border)
    logger.info(f"| {header[:w]:<{w}} |")
    logger.info(border)
    logger.info(f"| {f'Date        : {now}'[:w]:<{w}} |")
    logger.info(f"| {f'App         : {settings.APP_NAME}'[:w]:<{w}} |")
    logger.info(f"| {f'Environment : {settings.ENVIRONMENT}'[:w]:<{w}} |")
    logger.info(f"| {main_line[:w]:<{w}} |")
    logger.info(f"| {vec_line[:w]:<{w}} |")
    logger.info(f"| {f'Status      : {ready}'[:w]:<{w}} |")
    logger.info(border)


async def db_connection_watcher(initial_state: tuple[bool, bool], interval_sec: float = 4.0) -> None:
    """Continuously monitors PostgreSQL & pgvector; prints an updated box on ON/OFF transitions."""
    last_state = initial_state
    while True:
        await asyncio.sleep(interval_sec)
        try:
            db_health = await check_main_db_health(silent=True)
            main_ok = db_health.get("status") == "connected"

            if main_ok:
                if not last_state[0]:
                    await ensure_vector_extension()
                vector_health = await check_vector_db_health(silent=True)
            else:
                await dispose_vector_db()
                vector_health = {"status": "disconnected", "pgvector_version": "unavailable"}

            vec_ok = vector_health.get("status") == "connected"
            current_state = (main_ok, vec_ok)

            if current_state != last_state:
                label = "DB RECONNECTED" if (main_ok and vec_ok) else "DB DISCONNECTED"
                log_status_box(db_health, vector_health, event_label=label)
                last_state = current_state
        except asyncio.CancelledError:
            raise
        except Exception:
            pass
