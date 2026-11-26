# Creates a timestamped read-only SQL dump of labtrack_db (public schema).
param(
    [string]$DbHost = "localhost",
    [int]$DbPort    = 5432,
    [string]$DbName = "labtrack_db",
    [string]$DbUser = "postgres",
    [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"
$backendRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not $OutDir) { $OutDir = Join-Path $backendRoot "backups" }
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$outFile = Join-Path $OutDir "${DbName}_${stamp}.sql"

Write-Host "Creating read-only backup of $DbName -> $outFile ..." -ForegroundColor Cyan
pg_dump -h $DbHost -p $DbPort -U $DbUser -d $DbName --schema=public --no-owner --no-privileges -f $outFile
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE" }
Write-Host "Backup created successfully: $outFile" -ForegroundColor Green
