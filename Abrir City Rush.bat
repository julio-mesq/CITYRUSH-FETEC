@echo off
chcp 65001 >nul
title City Rush - servidor local
cd /d "%~dp0"
set PORT=8765
set URL=http://localhost:%PORT%

rem Se a porta ja estiver em uso (City Rush antigo aberto), avisa em vez de abrir a versao velha
netstat -ano | findstr /R /C:":%PORT% .*LISTENING" >nul
if %errorlevel%==0 (
  echo ATENCAO: ja existe um servidor usando a porta %PORT%.
  echo Provavelmente e o City Rush antigo. Feche TODAS as outras janelas pretas
  echo do City Rush e abra este atalho de novo.
  echo.
  pause
  exit /b
)

set IP=
for /f "usebackq delims=" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ip.ps1"`) do set IP=%%i

echo ============================================
echo   CITY RUSH - iniciando o jogo...
echo   Deixe esta janela aberta enquanto joga.
echo   Para sair, feche esta janela.
echo.
echo   No computador:  %URL%
if defined IP (
  echo   No celular ^(mesmo Wi-Fi^):  http://%IP%:%PORT%
) else (
  echo   No celular: nao achei o IP. Digite ipconfig e use o "Endereco IPv4".
)
echo   QR code para o celular: %URL%/celular
echo.
echo   Celular nao abre? Rode "Liberar acesso do celular.bat" uma vez.
echo ============================================
echo.

rem 1) Python (py launcher ou python)
py -3 --version >nul 2>nul
if %errorlevel%==0 (
  start "" /b cmd /c "timeout /t 2 /nobreak >nul & start "" %URL%"
  py -3 "%~dp0servidor.py" %PORT% "%~dp0dist"
  goto :fim
)
python --version >nul 2>nul
if %errorlevel%==0 (
  start "" /b cmd /c "timeout /t 2 /nobreak >nul & start "" %URL%"
  python "%~dp0servidor.py" %PORT% "%~dp0dist"
  goto :fim
)

rem 2) Sem Python: usa o PowerShell (ja vem no Windows)
echo Python nao encontrado. Usando o PowerShell...
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start "" %URL%"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port %PORT% -Root "%~dp0dist"

:fim
echo.
echo O servidor foi encerrado. Se apareceu algum erro acima, tire uma foto/print e me envie.
pause
