@echo off
SET GIT="C:\Users\ASUS\Downloads\PortableGit\cmd\git.exe"
SET REPO="D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"
cd /d %REPO%

IF EXIST ".git\index.lock" DEL /F ".git\index.lock"

echo Fetching remote...
%GIT% fetch origin

echo Rebasing on top of remote main...
%GIT% rebase origin/main

echo Pushing...
%GIT% push origin master:main

echo.
echo === DONE! ===
pause
