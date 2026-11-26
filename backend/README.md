# LabTrack Backend

Multi-service backend for **LabTrack**: a **.NET 8 Clean Architecture API** (LabTrack.CSharp) and a **Python FastAPI AI Engine** (LabTrack.Python) backed by **PostgreSQL + pgvector** (labtrack_db, public schema).

## Structure
- LabTrack.CSharp/ - .NET 8 API Gateway, Clean Architecture, EF Core, SignalR, xUnit (94 tests)
- LabTrack.Python/ - FastAPI AI Engine (Gemini + pgvector), pytest (22 tests)
- database/ - PostgreSQL init extensions (pgvector, uuid-ossp) and schema docs
- docker/ - Nginx reverse proxy configuration
- docs/ - System documentation
- scripts/ - PowerShell scripts (dev/, test/, database/)

## Quick Start
1. Start both services: .\scripts\dev\start-backend.ps1
2. Check health: .\scripts\dev\health-check.ps1
3. Run all 116 tests: .\scripts\test\test-all.ps1
