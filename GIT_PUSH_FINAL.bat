@echo off
SET GIT="C:\Users\ASUS\Downloads\PortableGit\cmd\git.exe"
SET REPO="D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

echo ============================
echo Git Push - harga.com
echo ============================
cd /d %REPO%

%GIT% config user.name "Reynathaniel"
%GIT% config user.email "secrettrader011200@gmail.com"

echo.
echo === Git Status ===
%GIT% status

echo.
echo === Git Add ===
%GIT% add .

echo.
echo === Git Commit ===
%GIT% commit -m "feat: add referral system, checkout flow, and migration 003"

echo.
echo === Git Push ===
%GIT% push origin main

echo.
echo === DONE! ===
echo Check output above for results.
pause
