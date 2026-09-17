@echo off
echo ===============================================
echo  RecoveryPath — Starting Next.js dev server
echo ===============================================

cd /d "%~dp0"

echo.
echo [1/1] Starting Next.js (port 3000)...
start "RecoveryPath Next.js" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul
echo.
echo App running at: http://localhost:3000
echo.
echo ---- Legacy FastAPI server (preserved, not started) ----
echo To start it manually: cd server ^&^& uvicorn main:app --reload
echo =========================================================
pause
