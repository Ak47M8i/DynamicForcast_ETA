@echo off
REM ==============================================================================
REM RailGati-AI / GatiDrishti Local Server Launcher (SIH Problem Statement 26028)
REM Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains
REM ==============================================================================

echo.
echo =====================================================================
echo   RAILGATI-AI: DYNAMIC COACHING TRAIN ETA FORECAST SYSTEM (SIH 26028)
echo =====================================================================
echo.

cd /d "%~dp0"

REM Step 1: Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10+ and re-run this script.
    pause
    exit /b 1
)

REM Step 2: Check Virtual Environment
if not exist "venv\Scripts\python.exe" (
    echo [*] Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [*] Installing backend dependencies...
    venv\Scripts\pip.exe install -r backend\requirements.txt
)

REM Step 3: Check if frontend is built
if not exist "frontend\dist\index.html" (
    echo [*] Frontend build not found. Checking Node.js/npm...
    call npm --version >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [*] Installing frontend packages and building...
        cd frontend
        call npm install
        call npm run build
        cd ..
    ) else (
        echo [!] Warning: Node.js/npm not detected. Backend will run in API-only mode.
    )
)

echo.
echo =====================================================================
echo   [OK] System Ready! Starting unified local server...
echo   Web Application:     http://localhost:8000
echo   Interactive Swagger: http://localhost:8000/docs
echo   Alternative OpenAPI: http://localhost:8000/redoc
echo =====================================================================
echo   Press Ctrl+C anytime to stop the server.
echo.

venv\Scripts\python.exe main.py

pause
