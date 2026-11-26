from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class LabTrackBaseException(Exception):
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

class AssetNotFoundException(LabTrackBaseException):
    def __init__(self, asset_id: str):
        super().__init__(message=f"Laboratory asset with ID '{asset_id}' was not found.", status_code=status.HTTP_404_NOT_FOUND, details={"asset_id": asset_id})

class CSharpServiceUnavailableException(LabTrackBaseException):
    def __init__(self, endpoint: str, detail: Optional[str] = None):
        super().__init__(message=f"Failed to communicate with C# backend service at endpoint '{endpoint}'.", status_code=status.HTTP_503_SERVICE_UNAVAILABLE, details={"endpoint": endpoint, "error": detail})

class LLMInferenceException(LabTrackBaseException):
    def __init__(self, provider_message: str):
        super().__init__(message=f"LLM inference provider failed to produce a valid response: {provider_message}", status_code=status.HTTP_502_BAD_GATEWAY, details={"provider_error": provider_message})

class ErrorResponseModel(BaseModel):
    error: str
    status_code: int
    message: str
    details: Optional[Dict[str, Any]] = None

async def labtrack_exception_handler(request: Request, exc: LabTrackBaseException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=ErrorResponseModel(error=exc.__class__.__name__, status_code=exc.status_code, message=exc.message, details=exc.details).model_dump())

LabTrackException = LabTrackBaseException
__all__ = ["LabTrackBaseException", "LabTrackException", "AssetNotFoundException", "CSharpServiceUnavailableException", "LLMInferenceException", "ErrorResponseModel", "labtrack_exception_handler"]

