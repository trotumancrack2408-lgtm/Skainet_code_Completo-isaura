@echo off
echo Iniciando Skainet API (REST Server & Swagger - Puerto 3000)...
set PATH=%~dp0..\Skainet-Node;%PATH%
cd /d "%~dp0"
node dist/main.js
pause
