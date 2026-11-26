$ErrorActionPreference = "Stop"
$backendRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pyDir = Join-Path $backendRoot "LabTrack.Python"
$csDir = Join-Path $backendRoot "LabTrack.CSharp"
$pyExe = Join-Path $pyDir "venv\Scripts\python.exe"

if (-not (Test-Path $pyExe)) { throw "Python virtualenv not found at $pyExe" }

Write-Host "[1/2] Launching LabTrack.Python AI Engine (http://localhost:8000)..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $pyDir -ArgumentList @("-NoExit", "-Command", "& `"$pyExe`" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")

Write-Host "[2/2] Launching LabTrack.CSharp API (http://localhost:5000)..." -ForegroundColor Cyan
Start-Process powershell -WorkingDirectory $csDir -ArgumentList @("-NoExit", "-Command", "dotnet run --project .\src\LabTrack.Api\LabTrack.Api.csproj")
