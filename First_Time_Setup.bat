@echo off
TITLE 5Star Online Mart ERP - First Time Setup
COLOR 0B
CLS

echo ====================================================================
echo             5STAR ONLINE MART ERP - FIRST TIME SETUP                
echo ====================================================================
echo.
echo [1/4] Checking Node.js Environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js (LTS version) from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js is installed successfully!

echo.
echo [2/4] Installing Required Packages (npm install)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm packages. Please check internet connection.
    pause
    exit /b 1
)

echo.
echo [3/4] Initializing Database & Prisma Client...
call npx prisma generate
call npx prisma db push

echo.
echo [4/4] Creating Desktop Shortcut...
call Create_Desktop_Shortcut.bat

echo.
echo ====================================================================
echo  SETUP COMPLETE! 
echo  You can now start the app using the Desktop Shortcut or Launch_5Star_ERP.bat
echo ====================================================================
echo.
pause
