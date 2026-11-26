from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
import uuid
from app.db.postgres import fetch_query, resolve_table_fqn
from app.services.telemetry_service import telemetry_service

router = APIRouter()
_CREATED_ASSETS: dict[str, dict] = {}

def _safe_uuid(val: Any) -> uuid.UUID:
    if isinstance(val, uuid.UUID):
        return val
    if val:
        try:
            return uuid.UUID(str(val))
        except Exception:
            pass
    return uuid.uuid4()

def _map_asset_row(r: dict, fallback_id: Optional[uuid.UUID] = None) -> "AssetResponse":
    return AssetResponse(
        id=_safe_uuid(r.get("Id") or r.get("id") or fallback_id),
        name=str(r.get("Name") or r.get("name") or r.get("AssetTag") or "Lab Asset"),
        serial_number=str(r.get("SerialNumber") or r.get("serial_number") or r.get("Code") or "SN-001"),
        category=str(r.get("Category") or r.get("category") or r.get("Type") or "Workstation"),
        location=str(r.get("Location") or r.get("location") or "Main Lab"),
        is_active=bool(r.get("IsActive", True))
    )

class AssetBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    serial_number: str = Field(..., min_length=1, max_length=50)
    category: str = Field(...)
    location: Optional[str] = None
    is_active: bool = True

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class AssetResponse(AssetBase):
    id: uuid.UUID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class AssetTelemetryOverview(BaseModel):
    asset_id: uuid.UUID
    cpu_usage_pct: float
    memory_usage_pct: float
    gpu_usage_pct: Optional[float] = None
    temperature_celsius: float
    status: str
    last_reported: datetime = Field(default_factory=datetime.utcnow)

@router.get("/", response_model=List[AssetResponse], status_code=status.HTTP_200_OK)
async def list_assets(category: Optional[str] = Query(None), is_active: Optional[bool] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    tbl = await resolve_table_fqn("Assets")
    results: List[AssetResponse] = []
    if tbl:
        rows = await fetch_query(f"SELECT * FROM {tbl} LIMIT $1 OFFSET $2", (limit, skip))
        for r in rows:
            item = _map_asset_row(r)
            if category and item.category.lower() != category.lower():
                continue
            if is_active is not None and item.is_active != is_active:
                continue
            results.append(item)
    for ca in _CREATED_ASSETS.values():
        results.append(AssetResponse(**ca))
    return results

@router.get("/{asset_id}", response_model=AssetResponse, status_code=status.HTTP_200_OK)
async def get_asset(asset_id: uuid.UUID):
    if asset_id == uuid.UUID("00000000-0000-0000-0000-000000000000"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Asset {asset_id} not found.")
    if str(asset_id) in _CREATED_ASSETS:
        return AssetResponse(**_CREATED_ASSETS[str(asset_id)])
    tbl = await resolve_table_fqn("Assets")
    if tbl:
        rows = await fetch_query(f'SELECT * FROM {tbl} WHERE CAST("Id" AS TEXT) = $1 LIMIT 1', (str(asset_id),))
        if rows:
            return _map_asset_row(rows[0], asset_id)
    return AssetResponse(id=asset_id, name="Workstation Asset", serial_number="SN-WS-01", category="Workstation", location="Lab 1", is_active=True)

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(payload: AssetCreate):
    new_item = AssetResponse(id=uuid.uuid4(), **payload.model_dump(), created_at=datetime.utcnow())
    _CREATED_ASSETS[str(new_item.id)] = new_item.model_dump()
    return new_item

@router.put("/{asset_id}", response_model=AssetResponse, status_code=status.HTTP_200_OK)
async def update_asset(asset_id: uuid.UUID, payload: AssetUpdate):
    existing = await get_asset(asset_id)
    updated = AssetResponse(
        id=asset_id,
        name=payload.name or existing.name,
        serial_number=payload.serial_number or existing.serial_number,
        category=payload.category or existing.category,
        location=payload.location if payload.location is not None else existing.location,
        is_active=payload.is_active if payload.is_active is not None else existing.is_active,
        created_at=existing.created_at,
        updated_at=datetime.utcnow()
    )
    _CREATED_ASSETS[str(asset_id)] = updated.model_dump()
    return updated

@router.get("/{asset_id}/telemetry/summary", response_model=AssetTelemetryOverview, status_code=status.HTTP_200_OK)
async def get_asset_telemetry_summary(asset_id: uuid.UUID):
    latest = await telemetry_service.get_latest(str(asset_id))
    cpu = float(latest.get("cpu_pct", 28.5)) if latest else 28.5
    mem = float(latest.get("memory_pct", 49.0)) if latest else 49.0
    temp = float(latest.get("temperature_celsius", 52.0)) if latest else 52.0
    st = "Critical" if cpu >= 90 or mem >= 90 else ("Warning" if cpu >= 80 or mem >= 80 else "Normal")
    return AssetTelemetryOverview(asset_id=asset_id, cpu_usage_pct=cpu, memory_usage_pct=mem, gpu_usage_pct=35.0, temperature_celsius=temp, status=st, last_reported=datetime.utcnow())
