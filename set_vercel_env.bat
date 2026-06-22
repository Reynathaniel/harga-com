@echo off
echo === Setting Vercel Environment Variables === > "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt" 2>&1
echo Date: %date% %time% >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt"

:: Check Python
where python >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt" 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Python found, running Python script... >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt"
    python "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\get_vercel_token.py" >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt" 2>&1
    goto :done
)

echo Python not found. >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt"

:: Try python3
where python3 >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt" 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Python3 found, running Python script... >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt"
    python3 "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\get_vercel_token.py" >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt" 2>&1
    goto :done
)

echo Python3 not found either. Trying PowerShell... >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt"
powershell -ExecutionPolicy Bypass -NoProfile -Command "[Console]::OutputEncoding=[System.Text.Encoding]::UTF8; $PSDefaultParameterValues['*:Encoding']='utf8'; & 'D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\set-vercel-env.ps1'" >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt" 2>&1

:done
echo Done. >> "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt"
type "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app\batch-log.txt"
pause
