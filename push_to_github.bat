@echo off
title Git Push - harga.com
cd /d "D:\10. BUILD YOUR DREAM\07_HARGA_COM\app"
echo Running git push... > push_log.txt 2>&1
git status >> push_log.txt 2>&1
echo. >> push_log.txt
git add . >> push_log.txt 2>&1
echo. >> push_log.txt
git commit -m "feat: add referral system, sub-affiliate tracking, and direct checkout flow" >> push_log.txt 2>&1
echo. >> push_log.txt
git push origin main >> push_log.txt 2>&1
echo. >> push_log.txt
echo EXIT CODE: %ERRORLEVEL% >> push_log.txt
echo Done! Check push_log.txt for results.
pause
