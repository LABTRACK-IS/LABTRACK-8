from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional
from app.services.telemetry_service import telemetry_service
from app.services.diagnostics_service import diagnostics_service

router = APIRouter()

class TelemetryData(BaseModel):
    workstation_id: str = Field(..., description="Workstation UUID or code")
    cpu_pct: float = Field(0.0, ge=0.0, le=100.0)
    memory_pct: float = Field(0.0, ge=0.0, le=100.0)
    temperature_celsius: Optional[float] = 45.0

@router.post("/")
async def receive_telemetry(data: TelemetryData):
    entry = await telemetry_service.record(data.workstation_id, data.model_dump())
    diag = await diagnostics_service.diagnose_workstation(data.workstation_id)
    return {"success": True, "status": "received", "recorded": entry, "diagnostics": diag}

@router.get("/{workstation_id}")
async def get_workstation_telemetry(workstation_id: str):
    latest = await telemetry_service.get_latest(workstation_id)
    diag = await diagnostics_service.diagnose_workstation(workstation_id)
    return {"success": True, "workstation_id": workstation_id, "latest": latest, "diagnostics": diag}
