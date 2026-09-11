@echo off
echo Iniciando Skainet Backend (Worker & Automatizacion - Puerto 3001)...
set PATH=%~dp0..\Skainet-Node;%PATH%
cd /d "%~dp0"
node dist/main.js
pause
