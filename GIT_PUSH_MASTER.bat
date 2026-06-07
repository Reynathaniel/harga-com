@echo off
SET GIT="C:\Users\ASUS\Downloads\PortableGit\cmd\git.exe"
SET REPO="D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"

echo ============================
echo Complete Git Push - harga.com
echo ============================
cd /d %REPO%

echo.
echo === Set Remote Origin ===
%GIT% remote remove origin 2>nul
%GIT% remote add origin https://github.com/Reynathaniel/harga-com.git

echo.
echo === Remote verify ===
%GIT% remote -v

echo.
echo === Branch ===
%GIT% branch

echo.
echo === Push master to main (force) ===
%GIT% push origin master:main --force

echo.
echo === DONE! ===
pause