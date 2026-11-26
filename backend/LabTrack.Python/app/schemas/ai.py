from pydantic import Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import uuid
from app.schemas import BaseSchema

class ChatRequestSchema(BaseSchema):
    session_id: Optional[uuid.UUID] = Field(None)
    prompt: str = Field(..., min_length=1)
    context_asset_id: Optional[uuid.UUID] = Field(None)

class ChatResponseSchema(BaseSchema):
    session_id: uuid.UUID
    response: str
    tokens_used: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DiagnosticsAnalysisRequestSchema(BaseSchema):
    asset_id: uuid.UUID = Field(...)
    error_logs: List[str] = Field(...)
    telemetry_summary: Optional[Union[Dict[str, Any], str]] = Field(None)

class DiagnosticsAnalysisResponseSchema(BaseSchema):
    asset_id: uuid.UUID
    diagnosis: str = Field(...)
    recommended_actions: List[str] = Field(...)
    severity: str = Field(...)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
