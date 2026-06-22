@echo off
cd /d "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"
echo Finding git... > git_result.txt
where git >> git_result.txt 2>&1
echo. >> git_result.txt
for /f "tokens=*" %%i in ('where git 2^>nul') do set GITPATH=%%i
if "%GITPATH%"=="" (
    echo Git not found in PATH. Trying GitHub Desktop location... >> git_result.txt
    set GITPATH=C:\Users\ASUS\AppData\Local\GitHubDesktop\app-3.4.14\resources\app\git\cmd\git.exe
    if not exist "%GITPATH%" set GITPATH=
    dir "C:\Users\ASUS\AppData\Local\GitHubDesktop\" >> git_result.txt 2>&1
)
echo GITPATH=%GITPATH% >> git_result.txt
if "%GITPATH%"=="" (
    echo ERROR: Cannot find git! >> git_result.txt
    goto :end
)
echo. >> git_result.txt
echo === git status === >> git_result.txt
"%GITPATH%" status >> git_result.txt 2>&1
echo. >> git_result.txt
echo === git add === >> git_result.txt
"%GITPATH%" add . >> git_result.txt 2>&1
echo. >> git_result.txt
echo === git commit === >> git_result.txt
"%GITPATH%" commit -m "feat: referral and checkout system" >> git_result.txt 2>&1
echo. >> git_result.txt
echo === git push === >> git_result.txt
"%GITPATH%" push origin main >> git_result.txt 2>&1
echo. >> git_result.txt
echo === DONE === >> git_result.txt
:end
type git_result.txt
pause
