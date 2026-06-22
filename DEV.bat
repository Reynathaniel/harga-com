@echo off
title harga.app Dev Server
cd /d "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

echo.
echo  =====================================
echo   harga.app - Development Server
echo  =====================================

set "NODE_PORTABLE=C:\Users\ASUS\AppData\Local\node-portable\node-v20.18.1-win-x64"
if exist "%NODE_PORTABLE%\node.exe" (
    set "PATH=%NODE_PORTABLE%;%PATH%"
    echo  Using: node-portable v20
) else (
    echo  Using: system node
)

node --version 2>nul || (echo ERROR: Node.js tidak ditemukan! && pause && exit /b 1)

echo.
if not exist "node_modules" (
    echo  Installing dependencies... tunggu 3-5 menit
    call npm install --legacy-peer-deps
)

echo.
echo  Starting dev server...
echo  Buka: http://localhost:3000
echo.
call npm run dev
pause
