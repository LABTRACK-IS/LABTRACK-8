$ErrorActionPreference = "Stop"
$backendRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$csDir = Join-Path $backendRoot "LabTrack.CSharp"
$pyDir = Join-Path $backendRoot "LabTrack.Python"
$pyExe = Join-Path $pyDir "venv\Scripts\python.exe"

Write-Host "`n=== [1/2] LabTrack.CSharp (dotnet test) ===" -ForegroundColor Cyan
Push-Location $csDir
try {
    dotnet test --verbosity minimal
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }

Write-Host "`n=== [2/2] LabTrack.Python (pytest) ===" -ForegroundColor Cyan
Push-Location $pyDir
try {
    $env:PYTHONDONTWRITEBYTECODE = "1"
    & $pyExe -m pytest -v -p no:cacheprovider
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }

Write-Host "`nALL 116 BACKEND TESTS PASSED." -ForegroundColor Green
