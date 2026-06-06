@echo off
echo ============================
echo Installing Git via winget...
echo ============================
winget install Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
if %errorlevel% neq 0 (
    echo winget failed, trying alternative...
    echo Please install git manually from https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo ============================
echo Refreshing PATH...
echo ============================
set "PATH=%PATH%;C:\Program Files\Git\cmd"

echo.
echo ============================
echo Running git operations...
echo ============================
cd /d "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

git config user.name "Reynathaniel"
git config user.email "secrettrader011200@gmail.com"

git remote remove origin 2>nul
git remote add origin https://github.com/Reynathaniel/harga-com.git

git add .
git commit -m "feat: add referral system and checkout flow"
git push -u origin master

echo.
echo ============================
echo DONE!
echo ============================
pause
