from fastapi import APIRouter, HTTPException, Query
from app.services.chat_engine import (
    Any,
    AssetClassificationRequestSchema,
    ChatRequest,
    ChatResponse,
    ClassificationService,
    DiagnoseRequest,
    DiagnoseResponse,
    Dict,
    LLMClient,
    LLMCompletionRequest,
    LLMMessage,
    Optional,
    PredictiveMaintenanceRequest,
    PredictiveMaintenanceResponse,
    RepairCostRequest,
    RepairCostResponse,
    SafetyEvaluationRequestSchema,
    SafetyService,
    _build_response,
    _get_fast_db_state,
    _get_session,
    _norm_role,
    _sanitize_branding,
    count_rows,
    datetime,
    ensure_vector_extension,
    fetch_query,
    json,
    settings,
    time,
    timedelta,
    uuid,
)

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    start = time.perf_counter()
    context: Dict[str, Any] = {}
    if request.system_context:
        try:
            parsed = json.loads(request.system_context) if isinstance(request.system_context, str) else request.system_context
            context = parsed if isinstance(parsed, dict) else {"role": str(parsed)}
        except Exception:
            context = {"role": str(request.system_context)}
    role = _norm_role(context.get("role"), context.get("path"))
    sid = request.session_id or f"{role.lower()}-{uuid.uuid4()}"
    session = _get_session(sid)
    text, sugg, acts = await _build_response(request.prompt, context, session, sid=sid)
    return ChatResponse(
        session_id=sid,
        response=text,
        processing_time_ms=round((time.perf_counter() - start) * 1000, 2),
        tokens_used=len(text.split()),
        created_at=datetime.utcnow().isoformat(),
        suggestions=sugg,
        actions=acts,
    )

@router.get("/sessions")
async def list_ai_sessions(userId: Optional[str] = None, laboratoryId: Optional[str] = None, role: Optional[str] = Query(None)):
    await ensure_vector_extension()
    norm_r = _norm_role(role) if role else None
    if norm_r:
        db_rows = await fetch_query("SELECT session_id, role, history_json, last_active FROM labtrack_schema.ai_chat_sessions WHERE UPPER(role) = $1 ORDER BY last_active DESC LIMIT 30", (norm_r,))
    else:
        db_rows = await fetch_query("SELECT session_id, role, history_json, last_active FROM labtrack_schema.ai_chat_sessions ORDER BY last_active DESC LIMIT 30")
    items = []
    for r in db_rows:
        try: hist = json.loads(r["history_json"] or "[]")
        except Exception: hist = []
        items.append({
            "session_id": r["session_id"],
            "role": r["role"],
            "last_active": r["last_active"].isoformat() if hasattr(r["last_active"], "isoformat") else str(r["last_active"]),
            "message_count": len(hist),
        })
    return {"success": True, "data": items, "model": "labtrack-ai-assistant"}

@router.get("/health")
async def health():
    await ensure_vector_extension()
    db_state = await _get_fast_db_state()
    ok = len(db_state.get("tables", {})) > 0
    vec_cnt = await count_rows("ai_vector_memory") or 0
    sess_cnt = await count_rows("ai_chat_sessions") or 0
    return {
        "status": "ok" if ok else "degraded",
        "db": ok,
        "llm": "LabTrack AI Assistant",
        "capabilities": ["accurate_tagalog_english_pictures", "full_system_flow_knowledge", "random_general_qa", "live_ui_ux_screenshot", "tiktok_dugss_playlists", "video_player", "pdf_generator"],
        "tables_discovered": len(db_state.get("tables", {})),
        "vector_memories_stored": vec_cnt,
        "persisted_sessions": sess_cnt,
    }

@router.post("/predictive-maintenance", response_model=PredictiveMaintenanceResponse)
async def predictive_maintenance(request: PredictiveMaintenanceRequest):
    llm = LLMClient(api_key=settings.GEMINI_API_KEY or settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
    h = max(0, int(request.system_usage_hours or 0))
    risk = round(min(98.0, 5.0 + (h / 25.0)), 1)
    days = max(1, int(180 - (risk * 1.8)))
    comp = await llm.generate_completion(LLMCompletionRequest(
        messages=[LLMMessage(role="system", content="Provide a 1-sentence predictive maintenance recommendation."), LLMMessage(role="user", content=f"Asset {request.asset_id} has {h} usage hours (risk: {risk}%).")],
        model=settings.LLM_DEFAULT_MODEL
    ))
    return PredictiveMaintenanceResponse(asset_id=str(request.asset_id), failure_risk_percentage=risk, recommendation=_sanitize_branding(comp.content), next_maintenance_due=(datetime.utcnow() + timedelta(days=days)).isoformat())

@router.post("/estimate-repair-cost", response_model=RepairCostResponse)
async def estimate_repair_cost(request: RepairCostRequest):
    from app.services.estimation_service import EstimationService, RepairCostEstimationRequestSchema
    llm = LLMClient(api_key=settings.GEMINI_API_KEY or settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
    svc = EstimationService(llm_client=llm)
    try: aid = uuid.UUID(str(request.problem_report_id))
    except Exception: aid = uuid.uuid4()
    est = await svc.estimate_repair_cost(RepairCostEstimationRequestSchema(asset_id=aid, damage_description=request.issue_description or "Hardware issue", damage_type="Hardware", hardware_category=request.hardware_model or "Workstation"))
    complexity = "HIGH" if est.estimated_cost_usd >= 400 else ("MODERATE" if est.estimated_cost_usd >= 250 else "LOW")
    return RepairCostResponse(problem_report_id=str(request.problem_report_id), estimated_cost=round(est.estimated_cost_usd * 56.0, 2), currency="PHP", labor_complexity=complexity)

@router.post("/diagnose", response_model=DiagnoseResponse)
async def diagnose(request: DiagnoseRequest):
    if not request.error_logs: raise HTTPException(status_code=400, detail="error_logs required.")
    from app.services.ai_service import AIService
    from app.schemas.ai import DiagnosticsAnalysisRequestSchema
    llm = LLMClient(api_key=settings.GEMINI_API_KEY or settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
    svc = AIService(llm_client=llm)
    try: aid = uuid.UUID(str(request.asset_id)) if request.asset_id else uuid.uuid4()
    except Exception: aid = uuid.uuid4()
    res = await svc.analyze_diagnostics(DiagnosticsAnalysisRequestSchema(asset_id=aid, error_logs=request.error_logs, telemetry_summary=request.telemetry_summary))
    return DiagnoseResponse(asset_id=str(res.asset_id), diagnosis=_sanitize_branding(res.diagnosis), recommended_actions=res.recommended_actions, severity=res.severity.upper(), confidence_score=res.confidence_score, analyzed_at=res.analyzed_at.isoformat())

@router.post("/classify")
async def classify_hardware(request: AssetClassificationRequestSchema):
    llm = LLMClient(api_key=settings.GEMINI_API_KEY or settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
    return await ClassificationService(llm_client=llm).classify_asset(request)

@router.post("/safety-eval")
async def evaluate_safety(request: SafetyEvaluationRequestSchema):
    llm = LLMClient(api_key=settings.GEMINI_API_KEY or settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
    return await SafetyService(llm_client=llm).evaluate_operational_safety(request)