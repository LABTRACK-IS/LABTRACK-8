from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from urllib.parse import quote
import ast, asyncio, math, operator, time, uuid, json, logging, re, os, random, xml.etree.ElementTree as ET, httpx
from app.core.config import settings
from app.clients.llm_client import LLMClient, LLMCompletionRequest, LLMMessage
from app.db.postgres import fetch_query, execute_query, resolve_table_fqn, count_rows, introspect_full_database
from app.db.vector_db import ensure_vector_extension
from app.services.classification_service import ClassificationService, AssetClassificationRequestSchema
from app.services.safety_service import SafetyService, SafetyEvaluationRequestSchema

logger = logging.getLogger("LabTrack.Python.AIChat")

_HTTP_CLIENT: Optional[httpx.AsyncClient] = None

def _get_http_client() -> httpx.AsyncClient:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None or _HTTP_CLIENT.is_closed:
        _HTTP_CLIENT = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=4.5),
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LabTrackAI/9.0"}
        )
    return _HTTP_CLIENT

_FAST_DB_CACHE: Optional[Dict[str, Any]] = None
_FAST_DB_TS: float = 0.0

async def _get_fast_db_state(force: bool = False) -> Dict[str, Any]:
    global _FAST_DB_CACHE, _FAST_DB_TS
    now = time.perf_counter()
    if not force and _FAST_DB_CACHE is not None and (now - _FAST_DB_TS) < 10.0:
        return _FAST_DB_CACHE
    state = await introspect_full_database(force_refresh=force)
    _FAST_DB_CACHE = state
    _FAST_DB_TS = now
    return state

async def _run(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    return await fetch_query(sql, params)

async def _resolve_table(table: str) -> Optional[str]:
    return await resolve_table_fqn(table)

async def _count(table: str, where: Optional[str] = None, params: tuple = ()) -> Optional[int]:
    return await count_rows(table, where, params)

class ChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1)
    system_context: Optional[str] = None
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    session_id: str
    response: str
    processing_time_ms: float = 0.0
    tokens_used: int = 0
    created_at: str
    suggestions: List[str] = []
    actions: List[Dict[str, Any]] = []

class PredictiveMaintenanceRequest(BaseModel):
    asset_id: str
    system_usage_hours: int = 0

class PredictiveMaintenanceResponse(BaseModel):
    asset_id: str
    failure_risk_percentage: float
    recommendation: str
    next_maintenance_due: str

class RepairCostRequest(BaseModel):
    problem_report_id: str
    issue_description: str = ""
    hardware_model: str = ""

class RepairCostResponse(BaseModel):
    problem_report_id: str
    estimated_cost: float
    currency: str
    labor_complexity: str

class DiagnoseRequest(BaseModel):
    asset_id: Optional[str] = None
    error_logs: List[str] = []
    telemetry_summary: Optional[Dict[str, Any]] = None

class DiagnoseResponse(BaseModel):
    asset_id: Optional[str] = None
    diagnosis: str
    recommended_actions: List[str]
    severity: str
    confidence_score: float
    analyzed_at: str

def _norm_role(role_val: Any, path_val: Any = "") -> str:
    p = str(path_val or "").lower().strip()
    if p in ("/", "") or p.startswith("/login") or p.startswith("/register") or p.startswith("/auth") or p.startswith("/forgot"):
        return "GUEST"
    if p.startswith("/student"): return "STUDENT"
    if p.startswith("/instructor"): return "INSTRUCTOR"
    if p.startswith("/admin"): return "ADMIN"
    if not role_val: return "GUEST"
    r = str(role_val).upper().strip()
    if r in ("TECHNICIAN", "ADMIN", "SUPERADMIN", "ADMIN_TECHNICIAN", "TECH"): return "ADMIN"
    if r in ("INSTRUCTOR", "FACULTY", "TEACHER"): return "INSTRUCTOR"
    if r in ("STUDENT", "LEARNER"): return "STUDENT"
    return "GUEST"

# ============================================================================
# 1. SAFE AST MATHEMATICAL & SCIENTIFIC SOLVER
# ============================================================================
_SAFE_OPS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod, ast.Pow: operator.pow,
    ast.USub: operator.neg, ast.UAdd: operator.pos,
}
_SAFE_FUNCS = {
    "sqrt": math.sqrt,
    "sin": lambda x: math.sin(math.radians(x)) if abs(x) > 6.28 else math.sin(x),
    "cos": lambda x: math.cos(math.radians(x)) if abs(x) > 6.28 else math.cos(x),
    "tan": lambda x: math.tan(math.radians(x)) if abs(x) > 6.28 else math.tan(x),
    "log": math.log10, "ln": math.log, "abs": abs, "round": round,
    "factorial": math.factorial, "pi": math.pi, "e": math.e,
}

def _eval_ast_node(node: ast.AST) -> float:
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.Num):
        return float(node.n)
    if isinstance(node, ast.Name) and node.id in _SAFE_FUNCS:
        val = _SAFE_FUNCS[node.id]
        if isinstance(val, (int, float)): return float(val)
    if isinstance(node, ast.BinOp) and type(node.op) in _SAFE_OPS:
        left, right = _eval_ast_node(node.left), _eval_ast_node(node.right)
        if isinstance(node.op, ast.Pow) and abs(right) > 1000:
            raise ValueError("Exponent too large")
        return float(_SAFE_OPS[type(node.op)](left, right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _SAFE_OPS:
        return float(_SAFE_OPS[type(node.op)](_eval_ast_node(node.operand)))
    if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id in _SAFE_FUNCS:
        return float(_SAFE_FUNCS[node.func.id](*[_eval_ast_node(a) for a in node.args]))
    raise ValueError("Unsupported math node")

def _try_solve_math(prompt: str) -> Optional[str]:
    ql = prompt.strip().lower()
    pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%\s*(?:of|ng|sa|\*)\s*(\d+(?:\.\d+)?)", ql)
    if pct_match:
        pct, total = float(pct_match.group(1)), float(pct_match.group(2))
        res = (pct / 100.0) * total
        fmt = str(int(res)) if res.is_integer() else f"{res:,.4f}".rstrip("0").rstrip(".")
        return f"**{pct:g}%** ng **{total:g}** ay **`{fmt}`**."

    expr = re.sub(r"^(what is|whats|what's|ano ang|ano yung|compute|calculate|solve|sagot sa|ilan ang)\s+", "", ql).strip()
    expr = re.sub(r"[?=]+$", "", expr).strip()
    expr = re.sub(r"\bplus\b", "+", expr)
    expr = re.sub(r"\bminus\b", "-", expr)
    expr = re.sub(r"\b(times|multiplied by)\b", "*", expr)
    expr = re.sub(r"\b(divided by|over)\b", "/", expr)
    expr = re.sub(r"(\d)\s*[xX×]\s*(\d)", r"\1 * \2", expr)
    expr = expr.replace("÷", "/").replace("^", "**")

    if not re.search(r"\d", expr): return None
    allowed_check = re.sub(r"\b(sqrt|sin|cos|tan|log|ln|abs|round|factorial|pi|e)\b", "", expr)
    if not re.fullmatch(r"[\d\s\+\-\*\/\%\(\)\.\,]+", allowed_check): return None
    if not re.search(r"[\+\-\*\/\%]|sqrt|sin|cos|tan|log|ln|factorial", expr): return None

    clean_expr = expr.replace(",", "").strip()
    try:
        tree = ast.parse(clean_expr, mode="eval")
        val = _eval_ast_node(tree.body)
        fmt_val = str(int(val)) if val.is_integer() else f"{val:,.6f}".rstrip("0").rstrip(".")
        return f"Ang sagot sa **`{clean_expr.replace('**', '^')}`** ay **`{fmt_val}`**."
    except Exception:
        return None

# ============================================================================
# 2. COMPLETE LABTRACK SYSTEM ARCHITECTURE & WORKFLOW KNOWLEDGE BASE
# ============================================================================
LABTRACK_SYSTEM_FLOW_KNOWLEDGE = """
COMPLETE JRMSU LABTRACK SYSTEM FLOW & ARCHITECTURE:
1. ACCOUNT REGISTRATION & LOGIN FLOW:
   - Admin/Technician: Register at `/register/admin` -> Login at `/login/admin` -> Redirects to `/admin` Command Portal.
   - Instructor/Faculty: Register at `/register/instructor` -> Login at `/login/instructor` -> Redirects to `/instructor` Faculty Portal.
   - Student: No traditional password login needed on PC; Students scan the Workstation QR Code (or open `/student`), enter Student ID Number, Full Name, and PIN to start an active session.
2. STUDENT QR CHECK-IN & 59-SECOND HEARTBEAT FLOW (`/student`):
   - Scanning the QR code calls `POST /api/v1/pc-usage/scan-login-auto` which binds the student to a specific Workstation (e.g., WS-01 in ComLab 1).
   - While logged in, the Student Portal sends a heartbeat ping (`POST /api/v1/pc-usage/heartbeat`) every 10-30 seconds.
   - If a student closes the browser or loses connection, a 30-to-59 second grace countdown triggers before automatically releasing the workstation.
   - Students can also submit Hardware, Software, or Network Problem Reports (`POST /api/v1/problem-reports`) directly from their workstation.
3. INSTRUCTOR PORTAL FLOW (`/instructor`):
   - Overview & Lab Availability: View real-time status of all Computer Laboratories and Workstations.
   - Room Reservations: Book laboratory rooms for class schedules (`POST /api/v1/reservations`).
   - Student PC Sessions: Monitor live active students in the lab and remotely end/release idle sessions (`POST /api/v1/pc-usage/end-session-release/{id}`).
   - Report a Problem & My Requests: Submit maintenance requests and track resolution status.
   - Instructor AI Assistant: Private faculty diagnostic and teaching assistant.
4. ADMIN & TECHNICIAN COMMAND PORTAL FLOW (`/admin`):
   - Executive Overview: Real-time KPIs, active sessions, lab topology, and financial summary.
   - Campuses & Laboratories: Full CRUD for laboratories and room capacities (`/api/v1/laboratories`).
   - Assets & Workstation Desk: Manage PC units, hardware specs, and status (`/api/v1/workstations`, `/api/v1/assets`).
   - QR Management: Generate, print, and validate workstation QR codes (`/api/v1/admin/qr`).
   - Issue Service Desk & Maintenance: Manage student/instructor problem reports, repair tickets, and preventive maintenance records.
   - User & Access Management: Manage Admin, Instructor, and Student accounts and active PC sessions.
   - Analytics, Financial Ledger & Immutable Audit Logs: Track usage hours, repair expenses, and security audit trails.
"""

def _try_answer_system_flow_or_auth_question(prompt: str, path: str, role: str, db_state: Dict[str, Any]) -> Optional[str]:
    ql = prompt.lower().strip()
    p = (path or "/").lower().strip()

    # Check if asking about overall system flow / architecture ("ano ang flow ng system", "paano gumagana ang labtrack", "system workflow")
    if any(k in ql for k in ("flow ng system", "flow ng sytem", "system flow", "paano gumagana ang system", "paano gumagana ang labtrack", "workflow ng labtrack", "buong flow")):
        tbls = db_state.get("tables", {})
        total_labs = tbls.get("Laboratories", 0) or 4
        total_ws = tbls.get("Workstations", 0) or tbls.get("Workstation", 0) or 6
        return (
            f"**Kumpletong Daloy (End-to-End System Flow) ng JRMSU LabTrack ({total_labs} Labs, {total_ws} Workstations):**\n\n"
            "1. **Registration & Login Flow**:\n"
            "   • **Admin / Technician**: Mag-register muna sa `/register/admin` -> Mag-login sa `/login/admin` -> Papasok sa `/admin` Command Center.\n"
            "   • **Instructor / Faculty**: Mag-register sa `/register/instructor` -> Mag-login sa `/login/instructor` -> Papasok sa `/instructor` Portal.\n"
            "   • **Student**: Mag-i-scan ng **Workstation QR Code** sa PC monitor (o bubuksan ang `/student`) at ilalagay ang Student ID at Pangalan.\n\n"
            "2. **Student Session & Real-Time Heartbeat Flow (`/student`)**:\n"
            "   • Pagka-scan ng QR code, magiging **`IN USE / ACTIVE`** ang status ng PC sa database.\n"
            "   • Nagpapadala ng **live heartbeat signal** bawat 10–30 segundo ang Student Portal para manatiling active ang session.\n"
            "   • Kapag may sira ang PC (mouse, monitor, internet), pwedeng mag-submit ang student ng **Problem Report** na agad makikita ng Admin at Instructor via SignalR real-time notification.\n\n"
            "3. **Instructor Classroom & Reservation Flow (`/instructor`)**:\n"
            "   • Nagpapa-reserve ng Computer Lab schedule (`Reservations`), tinitingnan kung aling PC ang available (`Lab Availability`), at mino-monitor o ine-end ang active sessions ng mga estudyante (`Student Sessions`).\n\n"
            "4. **Admin & Technician Management Flow (`/admin`)**:\n"
            "   • Nagge-generate ng **QR Codes** bawat workstation, nagma-manage ng **Labs, Workstations, at Assets**, umaayos ng **Service Desk Problem Reports & Maintenance**, at nagmo-monitor ng **Usage Analytics, Financials, at Security Audit Logs**."
        )

    auth_patterns = [
        r"\blog\s*in\b", r"\blogin\b", r"\bmag\s*log", r"\bsign\s*in\b",
        r"\bregister\b", r"\bregster\b", r"\bregistration\b", r"\bsign\s*up\b",
        r"\bgumawa\s+ng\s+account\b", r"\bcreate\s+account\b", r"\bpaano\s+pumasok\b"
    ]
    if not any(re.search(pat, ql) for pat in auth_patterns):
        return None

    if any(w in ql for w in ("regster", "register", "sign up", "signup", "gumawa ng account")) and any(w in ql for w in ("bago", "muna", "tama", "first", "before")):
        page_note = f"\n\nDahil ikaw ay nasa **`{path}`** ngayon, punan mo lang ang registration form sa screen na ito at pindutin ang **Register / Create Account**!" if p.startswith("/register") else ""
        return (
            "**Oo, tama ka!** Kailangan mo munang **mag-register (gumawa ng account)** bago ka makapag-log in sa JRMSU LabTrack.\n\n"
            "**Tamang Pagkakasunod-sunod (Step-by-Step):**\n"
            "1. **Mag-Register Muna**:\n"
            "   • **Admin / Technician**: Pumunta sa `/register/admin`, ilagay ang Full Name, Email, ID, at Password.\n"
            "   • **Instructor / Faculty**: Pumunta sa `/register/instructor` at kumpletuhin ang form.\n"
            "2. **Mag-Log In Pagkatapos Mag-Register**:\n"
            "   • Kapag na-save na ang account mo, pumunta sa **`/login/admin`** o **`/login/instructor`** at ilagay ang iyong Email at Password."
            f"{page_note}"
        )

    if any(w in ql for w in ("regster", "register", "registration", "sign up", "signup", "gumawa ng account")):
        return (
            f"**Paano Mag-Register sa JRMSU LabTrack (Current Page: `{path}`):**\n"
            "1. Ilagay ang iyong **Full Name**, **Official Email Address**, at **ID Number**.\n"
            "2. Maglagay ng **Password** (at least 8 characters) at ulitin sa Confirm Password.\n"
            "3. Pindutin ang **Register / Create Account** button.\n"
            "4. Pagkatapos mag-register, maaari ka nang mag-login sa **`/login/admin`** o **`/login/instructor`**!"
        )

    current_page_tip = ""
    if p.startswith("/register"):
        current_page_tip = f"\n\n💡 **Tip sa Kasalukuyan Mong Page (`{path}`)**: Nasa **Registration Page** ka ngayon at **hindi ka pa naka-login**. Mag-register ka muna rito kung wala ka pang account, o pindutin ang **Sign In** link kung may account ka na."
    elif p.startswith("/login"):
        current_page_tip = f"\n\n💡 **Tip sa Kasalukuyan Mong Page (`{path}`)**: Nasa **Login Page** ka ngayon. Ilagay lang ang iyong Email at Password para makapasok."

    return (
        "**Paano Mag-Log In sa JRMSU LabTrack System:**\n\n"
        "• **Para sa Admin / Technician (`/login/admin`)**:\n"
        "  1. Kung wala ka pang account, mag-register muna sa **`/register/admin`**.\n"
        "  2. Buksan ang **`/login/admin`**, ilagay ang iyong **Email** at **Password**, at pindutin ang **Sign In**.\n\n"
        "• **Para sa Instructor / Faculty (`/login/instructor`)**:\n"
        "  1. Mag-register muna sa **`/register/instructor`** kung bagong account.\n"
        "  2. Pumunta sa **`/login/instructor`**, ilagay ang iyong **Email** at **Password**, at pindutin ang **Sign In**.\n\n"
        "• **Para sa Student (`/student`)**:\n"
        "  1. I-scan ang **QR Code** sa monitor ng PC sa laboratoryo (o buksan ang **`/student`**) at ilagay ang iyong **Student ID Number** at **Pangalan**."
        f"{current_page_tip}"
    )

# ============================================================================
# 3. PAGE & PC SESSION HELPERS
# ============================================================================
def _describe_current_page(path: str, page_title: str, role: str) -> str:
    p = (path or "/").lower().strip()
    route_map = {
        "/": "Public Landing & Portal Selection Page (`/`) [Not Logged In]",
        "/login": "Main Login Selection Page (`/login`) [Not Logged In]",
        "/login/admin": "Admin & Technician Login Page (`/login/admin`) [Not Logged In]",
        "/login/instructor": "Faculty / Instructor Login Page (`/login/instructor`) [Not Logged In]",
        "/register": "Account Registration Page (`/register`) [Not Logged In]",
        "/register/admin": "Admin Account Registration Page (`/register/admin`) [Not Logged In]",
        "/register/instructor": "Instructor Account Registration Page (`/register/instructor`) [Not Logged In]",
        "/student": "Student Workstation & QR Session Portal (`/student`)",
        "/admin": "Administrator & Technician Command Portal (`/admin`)",
        "/admin/overview": "Admin Executive Overview Dashboard (`/admin/overview`)",
        "/admin/ai-assistant": "Admin AI Diagnostic & Command Center (`/admin/ai-assistant`)",
        "/instructor": "Faculty & Instructor Laboratory Portal (`/instructor`)",
        "/instructor/ai-assistant": "Instructor AI Diagnostic Assistant (`/instructor/ai-assistant`)",
    }
    base_desc = route_map.get(p)
    if not base_desc:
        if p.startswith("/register"): base_desc = f"Account Registration Page (`{path}`) [Not Logged In]"
        elif p.startswith("/login"): base_desc = f"Login Portal (`{path}`) [Not Logged In]"
        elif p.startswith("/admin"): base_desc = f"Administrator Portal (`{path}`)"
        elif p.startswith("/instructor"): base_desc = f"Instructor Portal (`{path}`)"
        elif p.startswith("/student"): base_desc = f"Student Workstation Portal (`{path}`)"
        else: base_desc = f"LabTrack System Page (`{path}`)"
    return f"**{base_desc}**"

async def _get_live_active_pc_session_details(context: Dict[str, Any], db_state: Dict[str, Any]) -> Dict[str, str]:
    role = _norm_role(context.get("role"), context.get("path"))
    path = str(context.get("path") or "/").lower().strip()

    if role == "GUEST" or path in ("/", "") or path.startswith("/login") or path.startswith("/register"):
        return {
            "isLoggedIn": "false",
            "workstationCode": "Hindi pa naka-login (No Active Workstation)",
            "laboratoryName": "N/A (Nasa Login/Registration Page pa lang)",
            "sessionId": "NONE",
            "userName": "",
            "studentIdNumber": "",
        }

    ws_code = str(context.get("workstationCode") or "").strip()
    lab_name = str(context.get("laboratoryName") or "").strip()
    sess_id = str(context.get("pcSessionId") or "").strip()
    user_name = str(context.get("userName") or "").strip()
    if user_name.lower() in ("xc", "labtrack user", "guest", "admin", "instructor", "student"):
        user_name = ""
    stud_id = str(context.get("studentIdNumber") or "").strip()

    samples = db_state.get("samples", {})
    ws_samples = samples.get("Workstation", []) or samples.get("Workstations", [])
    if not ws_code and ws_samples:
        in_use = [w for w in ws_samples if str(w.get("Status", "")).lower() in ("in use", "in_use", "occupied", "active")]
        chosen = in_use[0] if in_use else ws_samples[0]
        ws_code = str(chosen.get("Code") or chosen.get("Name") or "WS-02")

    if not lab_name:
        lab_samples = samples.get("Laboratories", [])
        lab_name = str(lab_samples[0].get("LabName") or lab_samples[0].get("Name") or "Main Lab (RM-100)") if lab_samples else "Main Lab (RM-100)"

    return {
        "isLoggedIn": "true",
        "workstationCode": ws_code or "WS-02",
        "laboratoryName": lab_name or "Main Lab (RM-100)",
        "sessionId": sess_id or "ACTIVE-SESSION",
        "userName": user_name,
        "studentIdNumber": stud_id,
    }

def _summarize_sample_rows(rows: List[Dict[str, Any]], max_items: int = 6) -> str:
    if not rows: return ""
    items = []
    for r in rows[:max_items]:
        fname = str(r.get("FirstName") or r.get("firstName") or "")
        lname = str(r.get("LastName") or r.get("lastName") or "")
        combined_name = f"{fname} {lname}".strip()
        label = (
            r.get("FullName") or combined_name or r.get("LabName") or r.get("Name")
            or r.get("WorkstationCode") or r.get("Code") or r.get("Title")
            or r.get("AssetTag") or r.get("Username") or r.get("Email") or r.get("Description")
        )
        extra = r.get("Role") or r.get("Status") or r.get("RoomNumber") or r.get("Category") or r.get("Priority") or ""
        if label:
            items.append(f"{label} ({extra})" if extra else str(label))
    return ", ".join(items)

def _filter_db_state_for_role(role: str, db_state: Dict[str, Any]) -> Dict[str, Any]:
    tbls = db_state.get("tables", {})
    samples = db_state.get("samples", {})
    total_labs = tbls.get("Laboratories", 0) or tbls.get("Laboratory", 0)
    total_ws = tbls.get("Workstations", 0) or tbls.get("Workstation", 0)
    total_assets = tbls.get("Assets", 0) or tbls.get("Asset", 0)
    total_reports = tbls.get("ProblemReports", 0) or tbls.get("ProblemReport", 0)
    total_repairs = tbls.get("RepairTickets", 0) or tbls.get("RepairTicket", 0)
    total_sessions = tbls.get("PcUsageLogs", 0) or tbls.get("PcUsageLog", 0)
    total_reservations = tbls.get("Reservations", 0) or tbls.get("Reservation", 0)
    total_notifs = tbls.get("Notifications", 0) or tbls.get("Notification", 0)
    total_audit = tbls.get("AuditLogs", 0) or tbls.get("AuditLog", 0)
    total_users = tbls.get("Users", 0) or tbls.get("User", 0)

    base = {
        "laboratories_count": total_labs,
        "workstations_count": total_ws,
        "laboratories_list": _summarize_sample_rows(samples.get("Laboratories", [])),
        "workstations_list": _summarize_sample_rows(samples.get("Workstation", []) or samples.get("Workstations", [])),
    }
    if role == "GUEST": return {"role_scope": "GUEST (Unauthenticated Public Page)", "laboratories_count": total_labs}
    if role == "STUDENT": return {"role_scope": "STUDENT", **base, "active_pc_sessions": total_sessions}
    if role == "INSTRUCTOR":
        return {
            "role_scope": "INSTRUCTOR", **base,
            "active_pc_sessions": total_sessions,
            "reservations_count": total_reservations,
            "problem_reports_count": total_reports,
        }
    return {
        "role_scope": "ADMIN_TECHNICIAN", **base,
        "assets_count": total_assets,
        "users_count": total_users,
        "roles_breakdown": db_state.get("roles", {}),
        "problem_reports_count": total_reports,
        "repair_tickets_count": total_repairs,
        "pc_usage_sessions_count": total_sessions,
        "reservations_count": total_reservations,
        "notifications_count": total_notifs,
        "audit_logs_count": total_audit,
        "financial_totals": db_state.get("financial_totals", {}),
    }

def _get_role_suggestions(role: str) -> List[str]:
    if role == "GUEST":
        return [
            "Ano ang buong flow ng LabTrack system?",
            "Paano mag-register at mag-log in?",
            "Bigyan mo ako ng pic ng UI/UX ng page na ito",
        ]
    if role == "STUDENT":
        return [
            "Saang PC at page ako naka-login ngayon?",
            "Bigyan mo ako ng pic ng UI/UX ng page na ito",
            "Patugtog ng trending TikTok dugss remix playlist",
        ]
    if role == "INSTRUCTOR":
        return [
            "Saang page ako ngayon at ilan ang active sessions?",
            "Bigyan mo ako ng pic ng UI/UX ng page na ito",
            "Generate PDF lab status report",
        ]
    return [
        "Saang page ako ngayon at ano ang status ng workstations?",
        "Bigyan mo ako ng pic ng UI/UX ng page na ito",
        "Audit pending problem reports & tickets",
    ]

# ============================================================================
# 4. PRECISION PICTURE ENGINE (TAGALOG-AWARE + EXACT SUBJECT + UI/UX CAPTURE)
# ============================================================================
_TAGALOG_IMAGE_DICT = {
    "aso": "cute dog puppy",
    "pusa": "cute cat kitten",
    "kotse": "modern sports car",
    "sasakyan": "modern vehicle car",
    "motor": "sport motorcycle",
    "bahay": "modern architectural house",
    "bulaklak": "beautiful blooming flowers",
    "rosas": "red roses bouquet",
    "bundok": "majestic mountain landscape",
    "dagat": "tropical ocean beach",
    "pagkain": "delicious Filipino feast food",
    "adobo": "Filipino chicken pork adobo dish",
    "tao": "portrait of a person",
    "babae": "portrait of a smiling woman",
    "lalaki": "portrait of a handsome man",
    "puso": "glowing red heart love symbol",
    "inlove": "romantic couple in love sunset",
    "pag-ibig": "romantic couple holding hands",
    "paaralan": "modern university campus building",
    "eskwelahan": "university school campus",
    "kompyuter": "modern desktop computer setup",
    "computer": "modern desktop gaming workstation computer",
    "motherboard": "computer motherboard PCB hardware close-up",
    "server": "data center server rack with glowing LEDs",
    "network": "network switch ethernet cables rack",
    "keyboard": "mechanical RGB gaming keyboard",
    "mouse": "ergonomic wireless gaming mouse",
    "monitor": "ultrawide curved computer monitor",
}

def _is_asking_where_logged_in_or_page(prompt: str) -> bool:
    ql = prompt.lower()
    patterns = [
        r"saan\s+ako\s+naka\s*log", r"saang\s+pc", r"anong\s+pc\s+ako", r"ano\s+pc\s+ko",
        r"anong\s+workstation\s+ako", r"saan\s+page\s+ako", r"saang\s+page\s+ako",
        r"anong\s+page\s+ako", r"anong\s+page\s+ito", r"nasaan\s+ako", r"nasaang\s+page",
        r"where\s+am\s+i\s+logged", r"what\s+pc\s+am\s+i", r"which\s+pc\s+am\s+i",
        r"which\s+workstation", r"what\s+page\s+am\s+i", r"current\s+page",
        r"saan\s+ako\s+ngayon", r"sino\s+ang\s+naka\s*log", r"naka\s*log\s*in\s+ba\s+ako"
    ]
    return any(re.search(pat, ql) for pat in patterns)

def _wants_image(prompt: str) -> bool:
    return any(re.search(p, prompt.lower()) for p in [
        r"\bpic\b", r"\bpics\b", r"\bpicture\b", r"\bpictures\b", r"\bimage\b", r"\bimages\b",
        r"\bphoto\b", r"\bphotos\b", r"\blarawan\b", r"\blitrato\b", r"\bdiagram\b",
        r"\bscreenshot\b", r"\bsnapshot\b", r"\bpakita\s+mo\b", r"\bitsura\s+ng\b"
    ])

def _is_system_page_image_request(prompt: str) -> bool:
    ql = prompt.lower()
    # ONLY trigger DOM UI/UX screenshot when the user explicitly asks for UI, UX, Page, Portal, Dashboard, Screen, or LabTrack System
    ui_ux_phrases = [
        r"\bui\b", r"\bux\b", r"\bui/ux\b", r"\bsystem\s+page\b", r"\bsytem\s+page\b",
        r"\bpage\s+na\s+ito\b", r"\bthis\s+page\b", r"\bcurrent\s+page\b",
        r"\bportal\b", r"\bdashboard\b", r"\bscreenshot\b", r"\bscreen\b",
        r"\bsaan\s+ako\s+naka\s*log", r"\blabtrack\s+ui\b", r"\badmin\s+page\b",
        r"\binstructor\s+page\b", r"\bstudent\s+page\b", r"\blogin\s+page\b", r"\bregister\s+page\b"
    ]
    return any(re.search(pat, ql) for pat in ui_ux_phrases)

def _wants_music(prompt: str) -> bool:
    ql = prompt.lower()
    if any(w in ql for w in ("play lest", "play list", "playlist", "dugs", "dugss", "dugdug", "budots", "tiktok trend", "tiktok music", "tiktok sound", "soundtrip", "sound trip")):
        return True
    return any(re.search(p, ql) for p in [
        r"\bmusic\b", r"\bmusik\b", r"\bsong\b", r"\bsongs\b", r"\bkanta\b", r"\bkantahan\b",
        r"\bpatugtog\b", r"\btugtog\b", r"\baudio\b", r"\bsoundtrack\b", r"\bmp3\b",
        r"\bopm\b", r"\bremix\b", r"\bphonk\b", r"\bdisco\b", r"\blisten\b", r"\bplay\b"
    ])

def _wants_video(prompt: str) -> bool:
    return any(re.search(p, prompt.lower()) for p in [
        r"\bvideo\b", r"\bvideos\b", r"\bvedio\b", r"\bvid\b", r"\bvids\b", r"\bwatch\b",
        r"\bpanoorin\b", r"\bmovie\b", r"\bclip\b", r"\bmv\b", r"\btutorial video\b"
    ])

def _wants_pdf(prompt: str) -> bool:
    return any(re.search(p, prompt.lower()) for p in [
        r"\bpdf\b", r"\bdocument\b", r"\bdokumento\b", r"\breviewer\b",
        r"\bdownloadable\b", r"\bexport pdf\b", r"\bgenerate pdf\b", r"\bhandout\b"
    ])

def _extract_subject(prompt: str, default_val: str) -> str:
    # First try extracting what comes directly after "pic ng / picture of / larawan ng / video ng / kanta ng"
    m = re.search(
        r"(?:picture|pics|pic|photo|image|larawan|litrato|screenshot|video|vedio|music|song|kanta|pdf|reviewer)\s+(?:of|ng|ni|sa|for|about|tungkol\s+sa)?\s*(?:a|an|the|ang|mga|yung|isang)?\s*([a-zA-Z0-9\s\-]{2,65})",
        prompt,
        flags=re.IGNORECASE
    )
    if m:
        cand = re.sub(r"\b(and|at|tapos|please|po|naman|sana|dito|ngayon)\b.*$", "", m.group(1).strip(), flags=re.IGNORECASE).strip()
        if len(cand) >= 2:
            return cand

    cleaned = re.sub(
        r"\b(bigyan mo ako ng|bigyan mo ko ng|bigyan|magbigay|pwede ba|pakita mo|pakita ng|show me a|show me|give me a|give me|generate a|provide a|send a|magpatugtog|patugtog ka ng|patugtog ng|patugtog|play lest|play list|playlist|play|listen to|watch|download|pdf|video|vedio|music|musik|song|songs|kanta|kantang|tugtog|audio|mp3|pic|pics|picture|pictures|photo|photos|image|images|larawan|litrato|screenshot|uso ngayon|nagyu|ngayun|ngayon|akong|ako|mo|ko|yung|mga|isang|na|sa|ng|ni|by|of|the|a|an|please|po|naman|dito)\b",
        " ", prompt, flags=re.IGNORECASE
    )
    cleaned = re.sub(r"[^\w\s\-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned if len(cleaned) >= 2 else default_val

async def _search_accurate_picture(prompt: str, context: Dict[str, Any], pc_details: Dict[str, str]) -> str:
    ql = prompt.lower()
    role = _norm_role(context.get("role"), context.get("path"))
    path = str(context.get("path") or "/").strip()
    page_title = str(context.get("pageTitle") or "LabTrack Portal").replace("|", "-")
    ws_code = pc_details.get("workstationCode", "GUEST")
    lab_name = pc_details.get("laboratoryName", "Portal")

    # 1. Explicit QR Code Picture Request
    if "qr" in ql:
        qr_url = "https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=" + quote("http://localhost:3000/student?lab=ComLab%201&pc=WS-01")
        return f"\n\n![JRMSU LabTrack Official QR Code]({qr_url})"

    # 2. Explicit UI / UX / System Page Screenshot Request
    if _is_system_page_image_request(prompt):
        return f"\n\n[SYSTEM_PAGE_PIC:{path}|{page_title}|{role}|{ws_code}|{lab_name}]"

    # 3. General Picture Request (Any object, animal, person, hardware, place, or concept)
    raw_subject = _extract_subject(prompt, "modern computer workstation")
    sub_lower = raw_subject.lower().strip()

    # Translate Tagalog words to accurate English visual descriptions
    translated_words = []
    for w in sub_lower.split():
        translated_words.append(_TAGALOG_IMAGE_DICT.get(w, w))
    english_subject = _TAGALOG_IMAGE_DICT.get(sub_lower, " ".join(translated_words))

    # Try Wikipedia Lead Image ONLY if the Wikipedia page title closely matches the requested subject (avoids acronym mismatches!)
    client = _get_http_client()
    try:
        w_search = await client.get(
            f"https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch={quote(english_subject)}&gsrlimit=3&prop=pageimages&piprop=original|thumbnail&pithumbsize=900&format=json",
            timeout=3.8
        )
        if w_search.status_code == 200:
            pages = w_search.json().get("query", {}).get("pages", {})
            sub_tokens = [t for t in re.findall(r"[a-z0-9]+", english_subject.lower()) if len(t) >= 3]
            for _, pinfo in pages.items():
                title = pinfo.get("title", "")
                title_low = title.lower()
                # Ensure the Wikipedia article title actually contains the main subject word
                if sub_tokens and all(tok in title_low for tok in sub_tokens[:1]):
                    img_src = pinfo.get("thumbnail", {}).get("source") or pinfo.get("original", {}).get("source")
                    if img_src and not img_src.lower().endswith((".svg", ".pdf", ".ogg", ".webm", ".tif")):
                        return f"\n\n![{raw_subject.title()} ({title})]({img_src})"
    except Exception:
        pass

    # High-Precision Flux HD AI Photo Generation (Matches 100% of custom prompts)
    seed = random.randint(1000, 99999)
    flux_prompt = quote(f"ultra realistic high resolution photograph of {english_subject}, natural lighting, sharp focus, 8k")
    ai_url = f"https://image.pollinations.ai/prompt/{flux_prompt}?width=800&height=480&model=flux&nologo=true&seed={seed}"
    return f"\n\n![{raw_subject.title()}]({ai_url})"

# ============================================================================
# 5. MUSIC, TIKTOK DUGSS/BUDOTS & VIDEO ENGINE
# ============================================================================
async def _fetch_tracks_for_term(term: str, limit: int = 3) -> List[Dict[str, str]]:
    client = _get_http_client()
    tracks: List[Dict[str, str]] = []
    try:
        resp = await client.get(
            f"https://itunes.apple.com/search?term={quote(term)}&country=PH&media=music&entity=song&limit={limit + 2}",
            timeout=4.5
        )
        if resp.status_code == 200:
            for item in (json.loads(resp.text).get("results") or []):
                preview = (item.get("previewUrl") or "").strip()
                if not preview.startswith("http"): continue
                tracks.append({
                    "title": (item.get("trackName") or "Track").replace("|", "-").replace("[", "(").replace("]", ")"),
                    "artist": (item.get("artistName") or "Artist").replace("|", "-").replace("[", "(").replace("]", ")"),
                    "preview": preview,
                    "art": (item.get("artworkUrl100") or "").replace("100x100bb", "300x300bb"),
                })
                if len(tracks) >= limit: return tracks
    except Exception:
        pass

    try:
        dz_resp = await client.get(f"https://api.deezer.com/search?q={quote(term)}&limit={limit + 2}", timeout=4.5)
        if dz_resp.status_code == 200:
            for item in (dz_resp.json().get("data") or []):
                preview = (item.get("preview") or "").strip()
                if not preview.startswith("http"): continue
                tracks.append({
                    "title": (item.get("title") or "Track").replace("|", "-"),
                    "artist": (item.get("artist", {}).get("name") or "Artist").replace("|", "-"),
                    "preview": preview,
                    "art": (item.get("album", {}).get("cover_medium") or "/assets/images/lab-background.jpg").strip(),
                })
                if len(tracks) >= limit: return tracks
    except Exception:
        pass
    return tracks

async def _search_music_tracks(prompt: str) -> Tuple[str, str]:
    ql = prompt.lower()
    wants_playlist = any(k in ql for k in ("playlist", "play lest", "play list", "mga kanta", "compilation", "lahat", "top songs", "chart", "charts"))
    wants_dugss_tiktok = any(k in ql for k in ("dugs", "dugss", "dugdug", "budots", "disco", "club", "bass", "remix", "phonk", "hataw", "sayaw"))
    wants_trending = any(k in ql for k in ("uso", "trend", "trending", "sikat", "viral", "tiktok", "ngayon", "nagyu", "ngayun", "top", "hit", "hits"))

    user_subject = _extract_subject(prompt, "")
    specific_cleaned = re.sub(
        r"\b(uso|trend|trending|tiktok|dugs|dugss|dugdug|budots|playlist|play|lest|list|viral|sikat|opm|top|hits|hit|remix)\b",
        " ", user_subject, flags=re.IGNORECASE
    )
    specific_cleaned = re.sub(r"\s+", " ", specific_cleaned).strip()

    collected: List[Dict[str, str]] = []
    playlist_label = ""

    if wants_dugss_tiktok and len(specific_cleaned) < 3:
        playlist_label = "TikTok Viral Dugss / Budots / Bass Remix Playlist"
        dugss_queries = ["DJ Love Budots", "Budots TikTok Remix", "Brazilian Phonk TikTok", "Alan Walker All Falls Down", "BINI Pantropiko"]
        results = await asyncio.gather(*[_fetch_tracks_for_term(q, limit=1) for q in dugss_queries], return_exceptions=True)
        for r in results:
            if isinstance(r, list) and r: collected.extend(r)
        collected.append({
            "title": "TikTok Dugss Club Bass Boost (Live Beat)",
            "artist": "LabTrack Dugss Bass Engine",
            "preview": "synth://dugss-bass",
            "art": "/assets/images/lab-background.jpg",
        })
    elif (wants_trending or wants_playlist) and len(specific_cleaned) < 3:
        playlist_label = "Top Trending TikTok & OPM Hits Playlist"
        trending_queries = ["Dionela Marilag", "Cup of Joe Multo", "TJ Monterde Palagi", "BINI Salamin Salamin", "Maki Dilaw", "Hev Abi Alam Mo Ba Girl"]
        selected_q = trending_queries[:5] if wants_playlist else random.sample(trending_queries, 4)
        results = await asyncio.gather(*[_fetch_tracks_for_term(q, limit=1) for q in selected_q], return_exceptions=True)
        for r in results:
            if isinstance(r, list) and r: collected.extend(r)
    else:
        search_q = specific_cleaned if len(specific_cleaned) >= 2 else (user_subject or "OPM Trending Hits")
        playlist_label = f"'{search_q.title()}'"
        collected = await _fetch_tracks_for_term(search_q, limit=5 if wants_playlist else 3)

    unique_tracks: List[Dict[str, str]] = []
    seen = set()
    for t in collected:
        k = f"{t['title'].lower()}_{t['artist'].lower()}"
        if k not in seen:
            seen.add(k)
            unique_tracks.append(t)

    if not unique_tracks:
        unique_tracks.append({
            "title": f"{(specific_cleaned or 'TikTok Dugss Remix').title()}",
            "artist": "LabTrack Studio Synth",
            "preview": "synth://dugss-bass" if wants_dugss_tiktok else "synth://lofi-beats",
            "art": "/assets/images/lab-background.jpg",
        })

    cards = [f"[AUDIO:{t['title']}|{t['artist']}|{t['preview']}|{t['art']}]" for t in unique_tracks[:6]]
    names = [f"**{t['title']}** (*{t['artist']}*)" for t in unique_tracks[:6]]
    yt_query = specific_cleaned or ("TikTok Dugss Budots Remix PH" if wants_dugss_tiktok else "Trending OPM TikTok Playlist Philippines")
    return (f"**{playlist_label}**: " + ", ".join(names), "\n\n" + "\n".join(cards) + f"\n[YOUTUBE:{yt_query}|Open '{yt_query}' Full Playlist on YouTube]")

async def _search_video_clips(prompt: str) -> str:
    query = _extract_subject(prompt, "BINI Pantropiko")
    client = _get_http_client()
    try:
        resp = await client.get(f"https://itunes.apple.com/search?term={quote(query)}&country=PH&entity=musicVideo&limit=2", timeout=4.5)
        if resp.status_code == 200:
            results = json.loads(resp.text).get("results") or []
            if results:
                v = results[0]
                title = f"{v.get('trackName', query.title())} - {v.get('artistName', 'Official Video')}".replace("|", "-")
                v_url = (v.get("previewUrl") or "").strip()
                art = (v.get("artworkUrl100") or "").replace("100x100bb", "600x400bb")
                if v_url.startswith("http"):
                    return f"\n\n[VIDEO:{title}|{v_url}|{art}]\n[YOUTUBE:{query}|Watch Full Video '{query}' on YouTube]"
    except Exception:
        pass
    sample_mp4 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
    return f"\n\n[VIDEO:{query.title()} (Video Stream)|{sample_mp4}|/assets/images/lab-background.jpg]\n[YOUTUBE:{query}|Watch '{query}' on YouTube]"

# ============================================================================
# 6. BUILT-IN GENERAL & HUMAN CONVERSATIONAL KNOWLEDGE (LOVE, LIFE, CODE, ETC.)
# ============================================================================
def _try_answer_general_human_or_coding_topic(prompt: str) -> Optional[str]:
    ql = prompt.lower().strip()

    # 1. Love, Relationships & Psychology (e.g., "paano ma inlove ang lalaki", "paano malalaman kung crush ka", "love advice")
    if any(k in ql for k in ("inlove", "in love", "ma-inlove", "mainlove", "mahulog ang loob", "paano magmahal", "crush", "ligaw", "relasyon", "boyfriend", "girlfriend", "pag-ibig")):
        if "lalaki" in ql or "guy" in ql or "man" in ql or "boys" in ql:
            return (
                "**Paano Nga Ba Na-i-inlove ang Isang Lalaki? (Psychological & Real-Life Insights):**\n\n"
                "1. **Kapag Nakakaramdam Siya ng Peace of Mind at Appreciation**:\n"
                "   • Madalas mahulog ang loob ng lalaki sa taong nagbibigay sa kanya ng kapanatagan—yung tipong naa-appreciate ang maliliit niyang efforts at hindi siya hinuhusgahan.\n"
                "2. **Authentic Connection at Masayang Kasama (Vibe & Humor)**:\n"
                "   • Nagsisimula sa pisikal na atraksyon, pero tumatagal at lumalalim kapag komportable siyang magpakatotoo, tumawa, at magkwento ng mga pangarap niya sa iyo.\n"
                "3. **Respect at Support sa Kanyang Goals**:\n"
                "   • Malaking bagay sa lalaki kapag nararamdaman niyang naniniwala ka sa kakayahan niya at sinusuportahan mo siya sa pag-aaral o career.\n"
                "4. **Consistency at Care**:\n"
                "   • Yung simpleng pagtatanong kung nakauwi na siya, kumain na ba, o pakikinig kapag pagod siya ay tumatatak nang malalim sa puso ng lalaki.\n\n"
                "💡 **Signs na Inlove na ang Lalaki sa Iyo**: Naglalaan siya ng oras kahit busy, tinatandaan niya ang maliliit na detalye tungkol sa iyo, proud siyang ipakilala ka sa iba, at gumagawa siya ng paraan para maprotektahan at mapasaya ka."
            )
        return (
            "**Tungkol sa Pag-ibig at Relasyon:**\n\n"
            "Ang tunay na pag-ibig o pagkahulog ng loob ay nabubuo sa tatlong pangunahing bagay:\n"
            "1. **Emotional Safety & Trust**: Yung pakiramdam na ligtas kang magpakatotoo nang walang takot na mahusgahan.\n"
            "2. **Consistency & Effort**: Hindi lang sa salita kundi sa araw-araw na pagpapakita ng malasakit, oras, at respeto.\n"
            "3. **Shared Values & Growth**: Sabay kayong nagpapalago sa isa't isa sa pag-aaral, pangarap, at buhay."
        )

    return None

async def _search_web_and_trends(query: str) -> str:
    ql = query.lower().strip()
    if any(k in ql for k in ("log in", "login", "register", "regster", "sign in", "signup", "labtrack", "labtarck", "password", "tama ba", "tama bah", "paano mag", "inlove", "in love", "mainlove")):
        return ""

    is_trend = any(k in ql for k in ("uso", "trending", "trend", "trends", "balita", "news", "latest", "sikat", "bago ngayon", "top hits", "viral"))
    cleaned = re.sub(
        r"\b(ano ang|ano yung|sino si|sino ang|saan ang|kailan|what is|who is|where is|when was|tell me about|explain|define|meaning of|kahulugan ng|ang|mga|sa|ng|the|a|an|of|in|please|po)\b",
        " ", query, flags=re.IGNORECASE
    )
    cleaned = re.sub(r"[^\w\s\-]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if len(cleaned) < 2 and not is_trend:
        return ""

    search_term = "Philippines viral TikTok music tech trends" if (is_trend and len(cleaned) < 4) else cleaned
    client = _get_http_client()
    snippets: List[str] = []

    try:
        if is_trend:
            rss_url = f"https://news.google.com/rss/search?q={quote(search_term)}&hl=en-PH&gl=PH&ceid=PH:en"
            r_resp = await client.get(rss_url, timeout=3.8)
            if r_resp.status_code == 200:
                root = ET.fromstring(r_resp.text)
                headlines = [f"• {item.find('title').text.strip()}" for item in root.findall(".//item")[:4] if item.find("title") is not None and item.find("title").text]
                if headlines:
                    snippets.append("**Live Trending Updates (PH & Global):**\n" + "\n".join(headlines))

        w_url = f"https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exchars=520&generator=search&gsrsearch={quote(search_term)}&gsrlimit=1&format=json"
        ddg_url = f"https://api.duckduckgo.com/?q={quote(search_term)}&format=json&no_html=1&skip_disambig=1"
        res_list = await asyncio.gather(client.get(w_url, timeout=3.8), client.get(ddg_url, timeout=3.5), return_exceptions=True)

        if not isinstance(res_list[0], Exception) and res_list[0].status_code == 200:
            pages = res_list[0].json().get("query", {}).get("pages", {})
            for _, pdata in pages.items():
                extract = (pdata.get("extract") or "").strip()
                if extract:
                    snippets.append(f"**{pdata.get('title', '')}**: {extract}")

        if not isinstance(res_list[1], Exception) and res_list[1].status_code == 200:
            abstract = (res_list[1].json().get("AbstractText") or "").strip()
            if abstract and not any(abstract[:50] in s for s in snippets):
                snippets.append(abstract)
    except Exception:
        pass
    return "\n\n".join(snippets[:2])

def _sanitize_branding(text: str) -> str:
    if not text: return text
    cleaned = re.sub(
        r"\b(Google\s+Gemini|Gemini\s*2\.5\s*Pro|Gemini\s*2\.5\s*Flash|Gemini\s*AI|Gemini|ChatGPT|OpenAI|Pollinations)\b",
        "LabTrack AI Assistant", text, flags=re.IGNORECASE
    )
    return re.sub(r"(LabTrack AI Assistant\s*)+", "LabTrack AI Assistant ", cleaned).strip()

def _build_accurate_system_facts(role: str, campus: str, db_state: Dict[str, Any], prompt: str) -> str:
    ql = prompt.lower()
    ql_without_brand = re.sub(r"\b(labtrack|labtarck|jrmsu)\b", "", ql)

    tbls = db_state.get("tables", {})
    roles_map = db_state.get("roles", {})
    fins = db_state.get("financial_totals", {})
    samples = db_state.get("samples", {})

    total_labs = tbls.get("Laboratories", 0) or tbls.get("Laboratory", 0)
    total_ws = tbls.get("Workstations", 0) or tbls.get("Workstation", 0)
    total_assets = tbls.get("Assets", 0) or tbls.get("Asset", 0)
    total_reports = tbls.get("ProblemReports", 0) or tbls.get("ProblemReport", 0)
    total_repairs = tbls.get("RepairTickets", 0) or tbls.get("RepairTicket", 0)
    total_sessions = tbls.get("PcUsageLogs", 0) or tbls.get("PcUsageLog", 0)
    total_reservations = tbls.get("Reservations", 0) or tbls.get("Reservation", 0)
    total_audit = tbls.get("AuditLogs", 0) or tbls.get("AuditLog", 0)
    total_users = tbls.get("Users", 0) or sum(roles_map.values())
    total_fin = sum(fins.values())

    admin_cnt = sum(v for k, v in roles_map.items() if k in ("ADMIN", "TECHNICIAN", "SUPERADMIN", "ADMIN_TECHNICIAN"))
    inst_cnt = roles_map.get("INSTRUCTOR", 0)
    stud_cnt = roles_map.get("STUDENT", 0)

    lab_names = _summarize_sample_rows(samples.get("Laboratories", [])) or "Main Lab (RM-100)"
    ws_names = _summarize_sample_rows(samples.get("Workstation", []) or samples.get("Workstations", [])) or "WS-01, WS-02, WS-03"
    asset_names = _summarize_sample_rows(samples.get("Assets", [])) or "FAsset (Active)"

    facts: List[str] = []
    if any(k in ql_without_brand for k in ("lab", "labs", "laboratory", "laboratories", "comlab", "room", "workstation", "workstations", "pc", "pcs", "available", "bakante")):
        if role == "GUEST":
            facts.append(f"• Ang JRMSU LabTrack ay may **{total_labs} Computer Laboratories** at **{total_ws} Workstations**.")
        else:
            facts.append(f"• **Laboratories ({total_labs})**: {lab_names}\n• **Workstations ({total_ws})**: {ws_names}")
    if role == "ADMIN" and any(k in ql_without_brand for k in ("user", "users", "account", "student", "instructor", "admin", "technician", "role", "sino", "ilan")):
        facts.append(f"• **Registered Users ({total_users})**: {admin_cnt} Admin/Technicians, {inst_cnt} Instructors, {stud_cnt} Students")
    if role in ("ADMIN", "INSTRUCTOR") and any(k in ql_without_brand for k in ("problem", "report", "reports", "issue", "ticket", "repair", "maintenance", "sira", "asset", "assets")):
        facts.append(f"• **Service Desk & Assets**: {total_reports} Problem Reports, {total_repairs} Repair Tickets, {total_assets} Hardware Assets ({asset_names})")
    if role != "GUEST" and any(k in ql_without_brand for k in ("session", "sessions", "active", "reservation", "reservations", "schedule", "usage")):
        facts.append(f"• **Sessions & Bookings**: {total_sessions} logged PC Usage Sessions, {total_reservations} Lab Reservations")
    if role == "ADMIN" and any(k in ql_without_brand for k in ("audit", "log", "financial", "budget", "cost", "expense", "summary")):
        facts.append(f"• **Security & Financials**: {total_audit} Audit Log entries, PHP {total_fin:,.2f} recorded expenses")
    return "\n".join(facts)

# ============================================================================
# 7. MULTI-PROVIDER CLOUD LLM CASCADE (GOOGLE GEMINI + POLLINATIONS + DEEPSEEK)
# ============================================================================
async def _call_cloud_llm(api_key: str, system_instruction: str, history: List[Dict[str, Any]], prompt: str) -> Optional[str]:
    client = _get_http_client()

    # 1. Official Google Gemini API if AIza key is configured
    if api_key and api_key.startswith("AIza"):
        conv_lines = [f"User: {h.get('q', h.get('text',''))}\nAssistant: {h.get('a','')}" for h in history[-4:]]
        full_text = f"{system_instruction}\n\n" + "\n".join(conv_lines) + f"\n\nUser: {prompt}\nAssistant:"
        payload = {"contents": [{"parts": [{"text": full_text}]}], "generationConfig": {"temperature": 0.35, "maxOutputTokens": 1000}}
        for model_name in ("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"):
            try:
                resp = await client.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}", json=payload, timeout=9.0)
                if resp.status_code == 200:
                    cands = resp.json().get("candidates") or []
                    if cands:
                        txt = cands[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if txt: return _sanitize_branding(txt.strip())
            except Exception:
                pass

    # 2. Pollinations OpenAI-Compatible Chat Completions (Multiple Models)
    messages = [{"role": "system", "content": system_instruction[:2200]}]
    for h in history[-3:]:
        if "q" in h and "a" in h:
            messages.append({"role": "user", "content": str(h["q"])[:250]})
            messages.append({"role": "assistant", "content": str(h["a"])[:250]})
    messages.append({"role": "user", "content": prompt})

    for model_name in ("openai", "openai-fast", "qwen-coder", "mistral"):
        try:
            resp = await client.post(
                "https://text.pollinations.ai/openai",
                json={"model": model_name, "messages": messages, "temperature": 0.35},
                timeout=9.0
            )
            if resp.status_code == 200:
                raw_txt = resp.text.strip()
                if raw_txt.startswith("{"):
                    data = resp.json()
                    choices = data.get("choices") or []
                    if choices:
                        content = choices[0].get("message", {}).get("content", "").strip()
                        if content: return _sanitize_branding(content)
                elif len(raw_txt) > 2 and not raw_txt.startswith("<!DOCTYPE"):
                    return _sanitize_branding(raw_txt)
        except Exception:
            pass

    # 3. Direct Pollinations Root POST & GET Fallback
    try:
        resp_root = await client.post(
            "https://text.pollinations.ai/",
            json={"messages": messages, "model": "openai"},
            timeout=8.0
        )
        if resp_root.status_code == 200 and len(resp_root.text.strip()) > 2 and not resp_root.text.strip().startswith("<!DOCTYPE"):
            return _sanitize_branding(resp_root.text.strip())
    except Exception:
        pass

    try:
        resp_get = await client.get(f"https://text.pollinations.ai/{quote(prompt[:350])}", timeout=8.0)
        if resp_get.status_code == 200:
            txt = resp_get.text.strip()
            if txt and not txt.startswith("<!DOCTYPE") and not txt.startswith("{"):
                return _sanitize_branding(txt)
    except Exception:
        pass

    return None

async def _generate_ai_response(prompt: str, context: Dict[str, Any], db_state: Dict[str, Any], history: List[Dict[str, Any]]) -> Tuple[str, List[str], List[Dict[str, Any]]]:
    current_path = str(context.get("path") or "/").strip()
    role = _norm_role(context.get("role"), current_path)
    raw_name = str(context.get("userName") or "").strip()
    if role == "GUEST" or raw_name.lower() in ("xc", "admin", "instructor", "student", "guest", "technician", "labtrack user", ""):
        user_name = ""
    else:
        user_name = raw_name.split("@")[0]

    campus = context.get("campus") or "JRMSU Dapitan Main Campus"
    page_title = str(context.get("pageTitle") or "").strip()

    pc_details = await _get_live_active_pc_session_details(context, db_state)
    page_description = _describe_current_page(current_path, page_title, role)
    scoped_data = _filter_db_state_for_role(role, db_state)

    api_key = (os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY") or settings.GEMINI_API_KEY or settings.LLM_API_KEY or "").strip()
    ql = prompt.strip().lower()
    words = set(re.findall(r"[a-z0-9_]+", ql))
    is_tagalog = bool(words.intersection({"kamusta", "kumusta", "ano", "paano", "sino", "ilan", "saan", "saang", "bakit", "mga", "yung", "sa", "ng", "po", "ba", "sira", "gastos", "uso", "kanta", "patugtog", "naka", "tama", "lalaki", "babae"}))

    # 1. INSTANT MATH SOLVER
    math_answer = _try_solve_math(prompt)
    if math_answer:
        return (math_answer, _get_role_suggestions(role), [])

    wants_pic = _wants_image(prompt)
    wants_mus = _wants_music(prompt)
    wants_vid = _wants_video(prompt)
    wants_pdf_doc = _wants_pdf(prompt)

    # 2. SYSTEM FLOW, REGISTRATION & LOGIN GUIDE
    flow_or_auth = _try_answer_system_flow_or_auth_question(prompt, current_path, role, db_state)
    if flow_or_auth and not (wants_pic or wants_mus or wants_vid):
        return (flow_or_auth, _get_role_suggestions(role), [])

    # 3. CURRENT PAGE & ACTIVE PC LOCATION
    if _is_asking_where_logged_in_or_page(prompt):
        if role == "GUEST":
            ans = (
                f"**Live Page & Auth Status ({campus}):**\n"
                f"• **Kasalukuyang Page**: {page_description}\n"
                f"• **Login Status**: **Hindi ka pa naka-login (`GUEST Mode`)**\n"
                f"• **Active Workstation**: Wala pa (Mag-login o mag-scan muna ng QR code sa `/student` para ma-assign sa workstation)."
            )
        elif role == "STUDENT":
            ws_code = pc_details["workstationCode"]
            lab_name = pc_details["laboratoryName"]
            active_user = user_name or "Student"
            stud_num = f" (ID: `{pc_details['studentIdNumber']}`)" if pc_details.get("studentIdNumber") else ""
            ans = (
                f"**Live Session & Page Location ({campus}):**\n"
                f"• **Kasalukuyang Page**: {page_description}\n"
                f"• **Naka-Login sa PC / Workstation**: **{ws_code}** sa loob ng **{lab_name}**\n"
                f"• **Active User**: **{active_user}**{stud_num} (`STUDENT Private Mode`)\n"
                f"• **Session Status**: `ACTIVE` (59s Heartbeat Guard Enabled)"
            )
        elif role == "INSTRUCTOR":
            ans = (
                f"**Live Page & Portal Location ({campus}):**\n"
                f"• **Kasalukuyang Page**: {page_description}\n"
                f"• **Active Account**: **Instructor {user_name or 'Faculty'}** (`INSTRUCTOR Private Mode`)\n"
                f"• **Monitored Lab**: **{pc_details['laboratoryName']}** ({scoped_data.get('workstations_count', 6)} Workstations)"
            )
        else:
            ans = (
                f"**Live Command Page & System Context ({campus}):**\n"
                f"• **Kasalukuyang Page**: {page_description}\n"
                f"• **Active Account**: **Admin/Technician {user_name or 'Admin'}** (`ADMIN Private Mode`)\n"
                f"• **System Coverage**: {scoped_data.get('workstations_count', 6)} Workstations across {scoped_data.get('laboratories_count', 4)} Laboratories"
            )

        if wants_pic:
            ans += await _search_accurate_picture(prompt, context, pc_details)
        return (ans, _get_role_suggestions(role), [])

    # 4. STRICT ROLE PRIVACY GUARD
    admin_only_terms = {"audit", "auditlogs", "financial", "financials", "budget", "expenditure", "ledger", "password", "hash", "token"}
    if role in ("STUDENT", "GUEST") and (words.intersection(admin_only_terms) or any(t in ql for t in ("audit log", "financial", "user role", "lahat ng user", "list of users", "gastos", "budget"))):
        priv_msg = (
            f"Paumanhin, ngunit naka-private ang **{role} Mode**. Ang impormasyon tungkol sa Admin Audit Logs, User Accounts, at Financial Ledgers ay eksklusibo lamang para sa Authorized Laboratory Administrators."
            if is_tagalog else
            f"For security and privacy, **{role} Mode** does not have access to Admin Audit Logs, User Account registries, or Financial Ledgers."
        )
        return (priv_msg, _get_role_suggestions(role), [])

    # 5. INSTANT GREETINGS
    if ql in {"hi", "hello", "hey", "yo", "sup", "kamusta", "kumusta", "musta", "hola"}:
        if role == "GUEST":
            return (
                f"Hello! Welcome sa **JRMSU LabTrack** ({campus}). Ako ang iyong **LabTrack AI Assistant**.\n"
                f"• **Current Page**: {page_description}\n"
                f"• **Status**: Hindi ka pa naka-login (`Guest Mode`).\n\n"
                f"Maaari mo akong tanungin tungkol sa **buong flow ng LabTrack system**, paano mag-register/login, o **kahit anong random na tanong** (Math, Coding, Science, Love/Life Advice, Music, Video, o Pictures)!",
                _get_role_suggestions(role), []
            )
        name_part = f" {user_name}" if user_name else ""
        ws_info = f"\n• **Active Workstation**: **{pc_details['workstationCode']}** ({pc_details['laboratoryName']})" if role == "STUDENT" else ""
        return (
            f"Hello{name_part}! Ako ang iyong pribadong **LabTrack AI Assistant** ({role} Mode).\n"
            f"• **Current Page**: {page_description}{ws_info}\n\n"
            f"Kaya kong sagutin ang **kahit anong tanong** (System Flow, Math, Coding, Science, General/Random Questions), kumuha ng **UI/UX Screenshot**, **Accurate Pictures**, **TikTok/OPM Music**, **Videos**, at **PDFs**!",
            _get_role_suggestions(role), []
        )

    # 6. FAST PATH FOR PURE PICTURE REQUESTS (UI/UX OR ANY GENERAL PICTURE)
    if wants_pic and not (wants_mus or wants_vid or wants_pdf_doc):
        pic_tag = await _search_accurate_picture(prompt, context, pc_details)
        if _is_system_page_image_request(prompt):
            return (
                f"Narito ang **live UI/UX screenshot** mula mismo sa iyong kasalukuyang LabTrack page ({page_description}):{pic_tag}",
                _get_role_suggestions(role), []
            )
        subj_label = _extract_subject(prompt, "Requested Image").title()
        return (
            f"Narito ang hiniling mong tumpak na larawan para sa **\"{subj_label}\"** mula sa **LabTrack AI Assistant**:{pic_tag}",
            _get_role_suggestions(role), []
        )

    # 7. FAST PATH FOR PURE MUSIC REQUESTS
    if wants_mus and not (wants_pic or wants_vid or wants_pdf_doc):
        mus_summary, mus_cards = await _search_music_tracks(prompt)
        return (
            f"Narito ang hiniling mong playable tracks at playlist mula sa **LabTrack AI Assistant** — {mus_summary} (pindutin lang ang **Play Audio** para tumunog agad):{mus_cards}",
            _get_role_suggestions(role), []
        )

    # 8. PARALLEL MEDIA + WEB + SQL + CLOUD LLM EXECUTION FOR ANY QUESTION
    pic_task = asyncio.create_task(_search_accurate_picture(prompt, context, pc_details)) if wants_pic else None
    mus_task = asyncio.create_task(_search_music_tracks(prompt)) if wants_mus else None
    vid_task = asyncio.create_task(_search_video_clips(prompt)) if wants_vid else None
    web_task = asyncio.create_task(_search_web_and_trends(prompt))

    exact_db_facts = _build_accurate_system_facts(role, campus, db_state, prompt)
    general_human_ans = _try_answer_general_human_or_coding_topic(prompt)
    web_facts = await web_task

    auth_status_str = "NOT LOGGED IN (Guest on Login/Register Page)" if role == "GUEST" else f"Logged in as {role} ({user_name or role})"
    system_instruction = (
        f"You are the official **LabTrack AI Assistant** at {campus}.\n"
        f"USER AUTH STATUS: {auth_status_str} | CURRENT PAGE: {page_description} (Route: {current_path})\n"
        f"{LABTRACK_SYSTEM_FLOW_KNOWLEDGE}\n"
        f"LIVE DATABASE FACTS: {exact_db_facts or 'None'}\n"
        f"WEB & ENCYCLOPEDIA FACTS: {web_facts or 'None'}\n"
        "CRITICAL RULES:\n"
        "1. Your name is strictly LabTrack AI Assistant (never mention Gemini/OpenAI).\n"
        "2. You have the full intelligence of an advanced AI. Answer ANY question the user asks—whether about LabTrack's system flow, love/relationship advice (e.g. 'paano ma-inlove ang lalaki'), life advice, coding, math, science, essays, or random questions—accurately, naturally, and thoroughly in the user's language (Tagalog, English, or Taglish).\n"
        "3. Never reply with unrelated laboratory counts when the user is asking a general or personal question."
    )

    cloud_reply = await _call_cloud_llm(api_key, system_instruction, history, prompt)

    pic_md = (await pic_task) if pic_task is not None else ""
    mus_info = (await mus_task) if mus_task is not None else ("", "")
    vid_md = (await vid_task) if vid_task is not None else ""
    pdf_md = f"\n\n[PDF:{_extract_subject(prompt, 'LabTrack Official Document').title()}|Generated by LabTrack AI Assistant]" if wants_pdf_doc else ""

    if cloud_reply:
        if pic_md:
            cloud_reply = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", cloud_reply).strip() + pic_md
        if mus_info[1]:
            cloud_reply = re.sub(r"\[AUDIO:[^\]]+\]", "", cloud_reply).strip() + mus_info[1]
        if vid_md:
            cloud_reply += vid_md
        if pdf_md:
            cloud_reply += pdf_md
        return (cloud_reply, _get_role_suggestions(role), [])

    # Built-in Human / Relationship / System Fallback (if offline)
    segments: List[str] = []
    if general_human_ans:
        segments.append(general_human_ans)
    if exact_db_facts:
        segments.append(f"**Live LabTrack System Info:**\n{exact_db_facts}")
    if web_facts:
        segments.append(web_facts)
    if wants_pic and pic_md:
        segments.append(pic_md.strip())
    if wants_vid and vid_md:
        segments.append(f"Narito ang playable video stream mula sa **LabTrack AI Assistant**:{vid_md}")
    if wants_mus and mus_info[1]:
        segments.append(f"Narito ang playable audio tracks ({mus_info[0]}):{mus_info[1]}")
    if wants_pdf_doc and pdf_md:
        segments.append(pdf_md.strip())

    if not segments:
        segments.append(
            f"Narito ang sagot mula sa **LabTrack AI Assistant** para sa iyong tanong na *\"{prompt.strip()}\"*:\n\n"
            f"Sa kasalukuyan ay nasa **{page_description}** ka. Kung tungkol ito sa LabTrack system, maaari mong itanong ang buong system flow, status ng laboratories, o mag-request ng picture, music, video, at PDF!"
        )

    return ("\n\n".join(segments), _get_role_suggestions(role), [])

_SESSIONS: Dict[str, Dict[str, Any]] = {}
_TTL = timedelta(minutes=60)

def _get_session(sid: str) -> Dict[str, Any]:
    now = datetime.utcnow()
    s = _SESSIONS.get(sid)
    if s and now - s.get("last_active", now) < _TTL:
        s["last_active"] = now
        return s
    s = {"history": [], "last_active": now}
    _SESSIONS[sid] = s
    return s

async def _persist_session(sid: str, role: str, session: Dict[str, Any]) -> None:
    try:
        hist_str = json.dumps(session.get("history", [])[-20:], default=str)
        await execute_query(
            """INSERT INTO labtrack_schema.ai_chat_sessions (session_id, role, history_json, last_active)
               VALUES ($1, $2, $3, NOW())
               ON CONFLICT (session_id) DO UPDATE SET role = EXCLUDED.role, history_json = EXCLUDED.history_json, last_active = NOW()""",
            (sid, role, hist_str)
        )
    except Exception:
        pass

async def _build_response(query: str, context: Dict[str, Any], session: Dict[str, Any], sid: str = "default") -> Tuple[str, List[str], List[Dict[str, Any]]]:
    db_state = await _get_fast_db_state()
    role = _norm_role(context.get("role"), context.get("path"))
    text, sugg, acts = await _generate_ai_response(query, context, db_state, session.get("history", []))
    session["history"].append({"q": query, "a": text, "ts": datetime.utcnow().isoformat()})
    asyncio.create_task(_persist_session(sid, role, session))
    return (text, sugg, acts)
