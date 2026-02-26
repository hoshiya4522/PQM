@echo off
echo ========================================
echo    PQM - Windows Installation
echo ========================================

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b
)

echo 📦 Installing Backend dependencies...
cd server
call npm install

echo.
echo 📦 Installing Frontend dependencies...
cd ../client
call npm install

echo.
echo ✅ Installation complete!
echo 🚀 To start the app, run: start-windows.bat
echo ========================================
pause