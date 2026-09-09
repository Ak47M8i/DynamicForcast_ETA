# ==============================================================================
# RailGati-AI / GatiDrishti Local Server Launcher (PowerShell)
# SIH 2026 Problem Statement 26028: Dynamic Forecast of ETA for Coaching Trains
# ==============================================================================

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  RAILGATI-AI: DYNAMIC COACHING TRAIN ETA FORECAST SYSTEM (SIH 26028)" -ForegroundColor Yellow
Write-Host "  Ministry of Railways • HDN-1 Corridor (NDLS ↔ DDU, 786.5 KM)" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path $PSScriptRoot

# Step 1: Check Python
try {
    $pyVer = python --version
    Write-Host "[✓] Python detected: $pyVer" -ForegroundColor Green
} catch {
    Write-Host "[✗] ERROR: Python 3.10+ is required but not found in PATH." -ForegroundColor Red
    exit 1
}

# Step 2: Virtualenv check
if (-Not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "[*] Creating virtual environment (venv)..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "[*] Installing backend dependencies..." -ForegroundColor Yellow
    .\venv\Scripts\pip.exe install -r backend\requirements.txt
} else {
    Write-Host "[✓] Python virtual environment ready." -ForegroundColor Green
}

# Step 3: Frontend build check
if (-Not (Test-Path "frontend\dist\index.html")) {
    Write-Host "[*] Building frontend application..." -ForegroundColor Yellow
    Set-Location -Path "frontend"
    npm install
    npm run build
    Set-Location -Path ".."
} else {
    Write-Host "[✓] Frontend production bundle verified." -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  [OK] RailGati-AI Server Starting at:" -ForegroundColor White
Write-Host "  👉 Web Application UI:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "  👉 Interactive API Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  Press Ctrl+C to shut down the server." -ForegroundColor Gray
Write-Host ""

& ".\venv\Scripts\python.exe" main.py
