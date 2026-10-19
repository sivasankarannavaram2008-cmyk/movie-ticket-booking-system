@echo off
setlocal
cd /d "%~dp0"

echo ===================================================
echo  Movie Ticket Booking System - Customer Portal
echo ===================================================
echo [1/3] Checking for active processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Terminating stale process on port 3000 (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

echo [2/3] Compiling and building refined modules...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed! Please review errors above.
    pause
    exit /b %ERRORLEVEL%
)

echo [3/3] Launching Customer Portal in browser and starting server...
start "" "http://localhost:3000"
npm run start
