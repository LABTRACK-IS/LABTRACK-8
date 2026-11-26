import time
import uuid
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("labtrack.middleware")

class CorrelationMiddleware(BaseHTTPMiddleware):
    CORRELATION_HEADER = "X-Correlation-Id"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        correlation_id = request.headers.get(self.CORRELATION_HEADER) or str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers[self.CORRELATION_HEADER] = correlation_id
        return response

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        correlation_id = getattr(request.state, "correlation_id", "-")
        start = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.exception("request_failed correlation_id=%s method=%s path=%s elapsed_ms=%.2f", correlation_id, request.method, request.url.path, elapsed_ms)
            raise
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info("request correlation_id=%s method=%s path=%s status=%s elapsed_ms=%.2f", correlation_id, request.method, request.url.path, response.status_code, elapsed_ms)
        return response

CorrelationIdMiddleware = CorrelationMiddleware
RequestLoggingMiddleware = LoggingMiddleware
__all__ = ["CorrelationMiddleware", "CorrelationIdMiddleware", "LoggingMiddleware", "RequestLoggingMiddleware"]
