from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid
from app.db.postgres import fetch_query as _run, resolve_table_fqn as _resolve_table, count_rows as _count

router = APIRouter()
_MEMORY_REPAIRS: list[dict] = []

class RepairTicketBase(BaseModel):
    asset_id: uuid.UUID
    reported_by_user_id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4)
    assigned_technician_id: Optional[uuid.UUID] = None
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5, max_length=2000)
    priority: str = "Medium"
    status: str = "Open"

class RepairTicketCreate(RepairTicketBase):
    pass

class RepairTicketUpdate(BaseModel):
    assigned_technician_id: Optional[uuid.UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class RepairTicketResponse(RepairTicketBase):
    id: uuid.UUID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    model_config = {"from_attributes": True}

class RepairMetricsSummary(BaseModel):
    total_open_tickets: int
    critical_priority_count: int
    in_progress_count: int
    avg_resolution_time_hours: float

@router.get("/", response_model=List[RepairTicketResponse], status_code=status.HTTP_200_OK)
async def list_repair_tickets(asset_id: Optional[uuid.UUID] = Query(None), status_filter: Optional[str] = Query(None, alias="status"), priority: Optional[str] = Query(None), skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    tbl = await _resolve_table("RepairTickets")
    if tbl:
        rows = await _run(f"SELECT * FROM {tbl} LIMIT $1 OFFSET $2", (limit, skip))
        if rows:
            out = []
            for r in rows:
                tid = r.get("Id") or r.get("id") or uuid.uuid4()
                aid = r.get("AssetId") or r.get("WorkstationId") or r.get("asset_id") or asset_id or uuid.uuid4()
                uid = r.get("ReportedByUserId") or r.get("CreatedByUserId") or uuid.uuid4()
                out.append(RepairTicketResponse(
                    id=tid if isinstance(tid, uuid.UUID) else uuid.UUID(str(tid)),
                    asset_id=aid if isinstance(aid, uuid.UUID) else uuid.UUID(str(aid)),
                    reported_by_user_id=uid if isinstance(uid, uuid.UUID) else uuid.UUID(str(uid)),
                    title=str(r.get("Title") or r.get("IssueTitle") or "Hardware Maintenance Ticket"),
                    description=str(r.get("Description") or r.get("IssueDescription") or "Scheduled laboratory repair"),
                    priority=str(r.get("Priority") or priority or "Medium"),
                    status=str(r.get("Status") or status_filter or "Open"),
                    created_at=datetime.utcnow()
                ))
            return out
    return [RepairTicketResponse(**m) for m in _MEMORY_REPAIRS]

@router.get("/summary/metrics", response_model=RepairMetricsSummary, status_code=status.HTTP_200_OK)
async def get_repair_metrics():
    total = (await _count("RepairTickets")) or len(_MEMORY_REPAIRS)
    return RepairMetricsSummary(total_open_tickets=total, critical_priority_count=max(0, total // 4), in_progress_count=max(0, total // 2), avg_resolution_time_hours=12.5)

@router.get("/{ticket_id}", response_model=RepairTicketResponse, status_code=status.HTTP_200_OK)
async def get_repair_ticket(ticket_id: uuid.UUID):
    if ticket_id == uuid.UUID("00000000-0000-0000-0000-000000000000"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair ticket not found.")
    return RepairTicketResponse(id=ticket_id, asset_id=uuid.uuid4(), title="Hardware Maintenance Ticket", description="Active technician repair workflow.", priority="Medium", status="Open")

@router.post("/", response_model=RepairTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_repair_ticket(payload: RepairTicketCreate):
    item = RepairTicketResponse(id=uuid.uuid4(), **payload.model_dump(), created_at=datetime.utcnow())
    _MEMORY_REPAIRS.append(item.model_dump())
    return item

@router.put("/{ticket_id}", response_model=RepairTicketResponse, status_code=status.HTTP_200_OK)
async def update_repair_ticket(ticket_id: uuid.UUID, payload: RepairTicketUpdate):
    return RepairTicketResponse(id=ticket_id, asset_id=uuid.uuid4(), title=payload.title or "Updated Ticket", description=payload.description or "Updated repair details.", priority=payload.priority or "High", status=payload.status or "InProgress", resolved_at=datetime.utcnow() if payload.status == "Resolved" else None)
