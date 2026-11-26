from fastapi import APIRouter
from datetime import datetime
from app.db.postgres import count_rows as _count

router = APIRouter()

@router.get("/")
async def get_recommendations():
    broken_assets = await _count("Assets", "\"Status\" = 'OUT_OF_ORDER'") or 0
    open_repairs = await _count("RepairTickets") or 0
    recs = [
        {"id": "rec-1", "priority": "High" if broken_assets > 0 else "Normal", "title": "Preventive Thermal & Hardware Check", "description": f"Monitor {broken_assets} flagged assets and {open_repairs} repair tickets across laboratories.", "generated_by": "gemini-2.5-pro", "timestamp": datetime.utcnow().isoformat()},
        {"id": "rec-2", "priority": "Normal", "title": "Workstation Idle Session Optimization", "description": "Ensure 59-second heartbeat auto-logout is active on all lab workstations.", "generated_by": "gemini-2.5-pro", "timestamp": datetime.utcnow().isoformat()}
    ]
    return {"success": True, "recommendations": recs}
