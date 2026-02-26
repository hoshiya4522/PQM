@echo off
echo ========================================
echo    PQM - Starting (Windows)
echo ========================================

set IP_ADDR=localhost
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4 Address"') do (
    set IP_ADDR=%%a
    set IP_ADDR=%IP_ADDR: =%
)

echo Starting Backend Server...
cd server
start /b cmd /c "npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Client...
cd ../client
start cmd /c "npm run dev -- --host"

echo.
echo ✅ App is running!
echo ----------------------------------------
echo 💻 Local:   http://localhost:5173
echo 📱 LAN:     http://%IP_ADDR%:5173
echo ----------------------------------------
echo To stop, close the terminal windows.
echo ========================================