param(
    [string]$ApiUrl = "http://localhost:5000/health",
    [string]$AiUrl  = "http://localhost:8000/health",
    [string]$DbHost = "localhost",
    [int]$DbPort    = 5432
)

Write-Host "=== LabTrack Backend Health Check ===" -ForegroundColor Cyan
$pgOk = Test-NetConnection -ComputerName $DbHost -Port $DbPort -InformationLevel Quiet -WarningAction SilentlyContinue
Write-Host ("  PostgreSQL ({0}:{1}) : {2}" -f $DbHost, $DbPort, $(if ($pgOk) { "REACHABLE" } else { "OFFLINE" })) -ForegroundColor $(if ($pgOk) { "Green" } else { "Red" })

foreach ($svc in @(
    @{ Name = "LabTrack.CSharp API"; Url = $ApiUrl },
    @{ Name = "LabTrack.Python AI "; Url = $AiUrl  }
)) {
    try {
        $resp = Invoke-WebRequest -Uri $svc.Url -UseBasicParsing -TimeoutSec 5
        Write-Host ("  {0} ({1}) : HTTP {2}" -f $svc.Name, $svc.Url, $resp.StatusCode) -ForegroundColor Green
    } catch {
        Write-Host ("  {0} ({1}) : UNREACHABLE" -f $svc.Name, $svc.Url) -ForegroundColor Red
    }
}
