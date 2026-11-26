from fastapi import APIRouter
from app.api.routes.bridge import router as bridge_router
from app.api.routes.ai_chat import router as ai_chat_router
from app.api.routes.asset import router as asset_router
from app.api.routes.damage import router as damage_router
from app.api.routes.repair import router as repair_router
from app.api.routes.telemetry import router as telemetry_router
from app.api.routes.recommendations import router as recommendations_router
from app.api.routes.health import router as health_router

api_router = APIRouter()

api_router.include_router(bridge_router)
api_router.include_router(ai_chat_router, prefix="/ai", tags=["AI Assistance (Gemini 2.5 Pro)"])
api_router.include_router(asset_router, prefix="/assets", tags=["Laboratory Assets"])
api_router.include_router(damage_router, prefix="/damage", tags=["Damage Reports"])
api_router.include_router(repair_router, prefix="/repairs", tags=["Repair Tickets"])
api_router.include_router(telemetry_router, prefix="/telemetry", tags=["PC Telemetry"])
api_router.include_router(recommendations_router, prefix="/recommendations", tags=["Smart Recommendations"])
api_router.include_router(health_router, prefix="/health", tags=["Detailed System Health"])

__all__ = ["api_router"]
