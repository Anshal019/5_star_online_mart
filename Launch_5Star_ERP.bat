@echo off
TITLE 5Star Online Mart ERP - POS Launcher
COLOR 0A
CLS

echo ====================================================================
echo               5STAR ONLINE MART ERP - LOCAL SYSTEM                  
echo ====================================================================
echo.
echo [1/4] Checking Node.js Environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ to run this app locally.
    pause
    exit /b 1
)

if not exist "%~dp0node_modules\" (
    echo.
    echo [NOTICE] node_modules not found. Running First-Time Setup...
    call "%~dp0First_Time_Setup.bat"
)

echo.
echo [2/4] Detecting Local Wi-Fi IP for Phone Scanner...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
)
set LOCAL_IP=%LOCAL_IP: =%

echo.
echo ====================================================================
echo  LOCAL ERP POS SYSTEM READY:
echo  -------------------------------------------------------------------
echo  Main POS System URL:   http://localhost:3000/pos
echo  Phone Scanner URL:    http://%LOCAL_IP%:3000/phone-scan
echo ====================================================================
echo.

echo [3/4] Starting Local Server and Opening Browser...
start "" "http://localhost:3000/pos"

echo [4/4] Launching Next.js Dev Server...
npm run dev
