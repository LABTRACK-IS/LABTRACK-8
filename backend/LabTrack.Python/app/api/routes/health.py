from datetime import datetime
import platform
import psutil
from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.db.connection import check_main_db_health as _check_database
from app.db.vector_db import check_vector_db_health

router = APIRouter()


class DatabaseHealth(BaseModel):
    status: str
    database: str | None = None
    user: str | None = None
    server_version: str | None = None
    pgvector_version: str | None = None
    error: str | None = None


class VectorDatabaseHealth(BaseModel):
    status: str
    database: str | None = None
    server_version: str | None = None
    pgvector_version: str | None = None
    error: str | None = None


class SystemHealthResponse(BaseModel):
    status: str
    service_name: str = "LabTrack.Python AI Engine"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = "1.0.0"
    system_metrics: dict
    database: DatabaseHealth
    vector_database: VectorDatabaseHealth


@router.get("/", response_model=SystemHealthResponse, status_code=status.HTTP_200_OK)
async def check_health():
    cpu_percent = psutil.cpu_percent(interval=None)
    memory_info = psutil.virtual_memory()

    metrics = {
        "os": platform.system(),
        "python_version": platform.python_version(),
        "cpu_usage_pct": cpu_percent,
        "memory_used_mb": round(memory_info.used / (1024 * 1024), 2),
        "memory_total_mb": round(memory_info.total / (1024 * 1024), 2),
        "memory_usage_pct": memory_info.percent,
    }

    db_health = await _check_database(silent=True)
    main_ok = db_health.get("status") == "connected"
    vector_health = (
        await check_vector_db_health(silent=True)
        if main_ok
        else {"status": "disconnected", "pgvector_version": "unavailable"}
    )

    is_degraded = (
        cpu_percent > 90.0
        or memory_info.percent > 90.0
        or not main_ok
        or vector_health.get("status") != "connected"
    )
    status_label = "degraded" if is_degraded else "healthy"

    return SystemHealthResponse(
        status=status_label,
        system_metrics=metrics,
        database=DatabaseHealth(**db_health),
        vector_database=VectorDatabaseHealth(**vector_health),
    )
