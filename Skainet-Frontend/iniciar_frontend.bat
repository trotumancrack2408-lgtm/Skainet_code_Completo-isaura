@echo off
echo Iniciando Skainet Frontend (React + Vite)...
set PATH=%~dp0..\Skainet-Node;%PATH%
cd /d "%~dp0"
node node_modules/vite/bin/vite.js --host
pause
