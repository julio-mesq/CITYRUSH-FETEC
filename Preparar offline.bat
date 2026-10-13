@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Preparando o City Rush para jogar OFFLINE (precisa de internet so agora)...
py -3 tools\offline.py 2>nul || python tools\offline.py
echo.
pause
