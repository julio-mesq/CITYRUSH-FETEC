@echo off
chcp 65001 >nul
title City Rush - liberar acesso do celular
net session >nul 2>&1
if not %errorlevel%==0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
netsh advfirewall firewall delete rule name="City Rush (celular)" >nul 2>&1
netsh advfirewall firewall add rule name="City Rush (celular)" dir=in action=allow protocol=TCP localport=8765 remoteip=localsubnet profile=any
echo.
echo Pronto! Agora o celular (no mesmo Wi-Fi) consegue abrir o jogo.
echo A liberacao vale so para dispositivos da sua rede local, na porta 8765.
echo.
pause
