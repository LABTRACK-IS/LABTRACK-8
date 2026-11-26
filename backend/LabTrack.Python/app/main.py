import asyncio
import logging
from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import (
    AssetNotFoundException,
    CSharpServiceUnavailableException,
    LLMInferenceException,
    LabTrackException,
)
from app.core.middleware import CorrelationIdMiddleware, RequestLoggingMiddleware
from app.core.banner import log_status_box, db_connection_watcher
from app.schemas.common import APIResponseEnvelope
from app.api.routes import api_router
from app.db.connection import check_main_db_health, dispose_main_db
from app.db.vector_db import (
    init_vector_db,
    ensure_vector_extension,
    check_vector_db_health,
    dispose_vector_db,
)

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(message)s",
)
logging.getLogger("pgserver").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logger = logging.getLogger("LabTrack.Python.Main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    watcher_task: asyncio.Task | None = None
    try:
        init_vector_db()
        db_health = await check_main_db_health(silent=True)
        main_ok = db_health.get("status") == "connected"

        if main_ok:
            await ensure_vector_extension()
            vector_health = await check_vector_db_health(silent=True)
        else:
            vector_health = {"status": "disconnected", "pgvector_version": "unavailable"}

        vec_ok = vector_health.get("status") == "connected"
        log_status_box(db_health, vector_health)

        watcher_task = asyncio.create_task(db_connection_watcher((main_ok, vec_ok)))
    except Exception as exc:
        logger.exception(f"Startup check failed: {exc}")

    yield

    if watcher_task is not None:
        watcher_task.cancel()
        with suppress(asyncio.CancelledError):
            await watcher_task

    await dispose_vector_db()
    await dispose_main_db()
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-driven microservice for the LabTrack platform, providing automated "
        "diagnostics, hardware classification, cost estimation, and EHS safety evaluation."
    ),
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.exception_handler(LabTrackException)
async def handle_labtrack_exception(request: Request, exc: LabTrackException):
    correlation_id = getattr(request.state, "correlation_id", None)

    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    if isinstance(exc, AssetNotFoundException):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, CSharpServiceUnavailableException):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    elif isinstance(exc, LLMInferenceException):
        status_code = status.HTTP_502_BAD_GATEWAY

    response_payload = APIResponseEnvelope(
        success=False,
        message=exc.message,
        errors=[exc.message],
        correlation_id=correlation_id,
    )
    return JSONResponse(status_code=status_code, content=response_payload.model_dump(mode="json"))


@app.exception_handler(RequestValidationError)
async def handle_validation_exception(request: Request, exc: RequestValidationError):
    correlation_id = getattr(request.state, "correlation_id", None)
    error_messages = [f"{err['loc']}: {err['msg']}" for err in exc.errors()]

    response_payload = APIResponseEnvelope(
        success=False,
        message="Request payload validation failed.",
        errors=error_messages,
        correlation_id=correlation_id,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_payload.model_dump(mode="json"),
    )


@app.exception_handler(Exception)
async def handle_unhandled_exception(request: Request, exc: Exception):
    correlation_id = getattr(request.state, "correlation_id", None)
    logger.exception(f"Unhandled exception encountered: {str(exc)}")

    response_payload = APIResponseEnvelope(
        success=False,
        message="An unexpected internal server error occurred.",
        errors=[str(exc)] if settings.DEBUG else ["Internal server error."],
        correlation_id=correlation_id,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_payload.model_dump(mode="json"),
    )


@app.get("/health", tags=["Infrastructure"], response_model=APIResponseEnvelope[dict])
async def health_check():
    db_health = await check_main_db_health(silent=True)
    main_ok = db_health.get("status") == "connected"
    vector_health = (
        await check_vector_db_health(silent=True)
        if main_ok
        else {"status": "disconnected", "pgvector_version": "unavailable"}
    )
    vec_ok = vector_health.get("status") == "connected"
    is_healthy = main_ok and vec_ok

    return APIResponseEnvelope(
        success=is_healthy,
        message=(
            "Service is healthy and operational."
            if is_healthy
            else "Service degraded: PostgreSQL database disconnected."
        ),
        data={
            "app_name": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
            "status": "UP" if is_healthy else "DISCONNECTED",
            "database": db_health,
            "vector_database": vector_health,
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
    )
