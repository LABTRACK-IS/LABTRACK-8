# LabTrack.Python — AI & Diagnostics Engine

FastAPI microservice for JRMSU LabTrack: AI assistant, PostgreSQL + pgvector RAG memory, telemetry diagnostics, hardware classification, repair cost estimation, and EHS safety checks.

## Structure
- app/main.py — FastAPI entrypoint, middleware, exception handlers, and lifespan
- app/core/ — config.py, exceptions.py, middleware.py, banner.py (live DB status box & reconnect watcher)
- app/db/ — connection.py, postgres.py, vector_db.py
- app/api/routes/ — bridge.py, ai_chat.py, asset.py, damage.py, repair.py, telemetry.py, recommendations.py, health.py
- app/clients/, app/schemas/, app/security/, app/services/
- tests/ — Automated pytest suite

## Endpoints
- GET  /health & GET /api/v1/health/
- POST /api/v1/generate
- POST /api/v1/ai/chat, GET /api/v1/ai/sessions, GET /api/v1/ai/health
- POST /api/v1/ai/{predictive-maintenance,estimate-repair-cost,diagnose,classify,safety-eval}
- /api/v1/{assets,damage,repairs,telemetry,recommendations}

## Run

    .\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    .\venv\Scripts\python.exe -m pytest -v
