# Applies pending EF Core migrations from LabTrack.Infrastructure to labtrack_db.
$ErrorActionPreference = "Stop"
$backendRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$csDir = Join-Path $backendRoot "LabTrack.CSharp"

Push-Location $csDir
try {
    Write-Host "Applying EF Core migrations to LabTrack database..." -ForegroundColor Cyan
    dotnet ef database update `
        --project .\src\LabTrack.Infrastructure\LabTrack.Infrastructure.csproj `
        --startup-project .\src\LabTrack.Api\LabTrack.Api.csproj
} finally {
    Pop-Location
}
