@echo off
echo ==========================================
echo  FinanceAI - Khoi dong moi truong dev
echo ==========================================
echo.

REM -- Kill any existing process on port 3001
echo [1/2] Kiem tra port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo     -> Kill tien trinh cu (PID: %%a)
    taskkill /PID %%a /F >nul 2>&1
)
echo     -> Port 3001 san sang.

REM -- Start JSON Server in a new window
echo [2/2] Khoi dong JSON Server (port 3001)...
start "JSON Server - DB" cmd /k "cd /d %~dp0 && npx json-server db.json --port 3001"

REM -- Wait a moment for json-server to boot
timeout /t 2 /nobreak >nul

REM -- Start Vite in a new window
echo [3/3] Khoi dong Vite Dev Server (port 5173)...
start "Vite - App" cmd /k "cd /d %~dp0 && npx vite"

echo.
echo ==========================================
echo  Ca hai server da duoc khoi dong!
echo  - App:      http://localhost:5173
echo  - JSON API: http://localhost:3001
echo ==========================================
echo.
echo Dong cua so nay hoac nhan phim bat ky...
pause >nul
