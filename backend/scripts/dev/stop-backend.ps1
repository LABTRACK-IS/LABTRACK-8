# Stops local LabTrack.Api and Python uvicorn processes.
Write-Host "Stopping LabTrack backend processes..." -ForegroundColor Yellow

Get-Process -Name "LabTrack.Api" -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force
    Write-Host "  Stopped LabTrack.Api (PID $($_.Id))" -ForegroundColor Green
}

Get-CimInstance Win32_Process -Filter "Name='python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match "uvicorn\s+app\.main:app" } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force
        Write-Host "  Stopped LabTrack.Python uvicorn (PID $($_.ProcessId))" -ForegroundColor Green
    }

Write-Host "Done." -ForegroundColor Cyan
