from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.chat_engine import _build_response, _get_session

router = APIRouter()


class GeneratePromptRequest(BaseModel):
    Prompt: Optional[str] = Field(None, alias="prompt")
    SystemContext: Optional[str] = Field("", alias="systemContext")
    Parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, alias="parameters")
    model_config = {"populate_by_name": True, "extra": "allow"}


@router.post("/generate", tags=["C# Gateway AI Bridge"])
async def generate_bridge(req: GeneratePromptRequest):
    prompt_text = req.Prompt or ""
    session = _get_session("csharp-bridge")
    text, sugg, acts = await _build_response(prompt_text, {"role": "TECHNICIAN"}, session)
    return {
        "success": True,
        "content": text,
        "errorMessage": None,
        "metadata": {
            "model": "gemini-2.5-pro",
            "suggestions": sugg,
            "actions": acts,
            "generated_at": datetime.utcnow().isoformat(),
        },
    }
