@echo off
title Skainet FI - Iniciador de Modulos
echo ======================================================
echo           SKAINET FI - CONTROL DE TALLER
echo        Iniciando todos los modulos del sistema
echo ======================================================
echo.

set BASE_DIR=%~dp0
set PATH=%BASE_DIR%Skainet-Node;%PATH%

echo [1/4] Iniciando Skainet REST API (Puerto 3000)...
start "Skainet API [REST :3000]" cmd /k "cd /d %BASE_DIR%Skainet-API && set PATH=%BASE_DIR%Skainet-Node;%%PATH%% && node dist/main.js"

timeout /t 2 /nobreak >nul

echo [2/4] Iniciando Skainet Backend Worker & Automation (Puerto 3001)...
start "Skainet Backend [Worker :3001]" cmd /k "cd /d %BASE_DIR%Skainet-Backend && set PATH=%BASE_DIR%Skainet-Node;%%PATH%% && node dist/main.js"

timeout /t 2 /nobreak >nul

echo [3/4] Iniciando Skainet Frontend Web (Puerto 5173)...
start "Skainet Frontend [Web :5173]" cmd /k "cd /d %BASE_DIR%Skainet-Frontend && set PATH=%BASE_DIR%Skainet-Node;%%PATH%% && node node_modules/vite/bin/vite.js --host"

timeout /t 2 /nobreak >nul

echo [4/4] Preparando Skainet Mobile...
echo (Si tienes Flutter instalado, se abrira la aplicacion movil)
start "Skainet Mobile [Flutter]" cmd /k "cd /d %BASE_DIR%Skainet-Mobile && flutter run"

echo.
echo ======================================================
echo  Todos los modulos han sido lanzados:
echo   * API REST:         http://localhost:3000 (Swagger: /api)
echo   * Backend Worker:   http://localhost:3001 (Swagger: /api)
echo   * Frontend Web:     http://localhost:5173
echo   * Mobile (Flutter): Terminal lanzada
echo ======================================================
echo.
pause
