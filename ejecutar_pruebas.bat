@echo off
title Skainet FI - Ejecutor de Pruebas Unitarias e Integracion
echo ======================================================
echo           SKAINET FI - SUITE DE PRUEBAS
echo     Ejecutando Pruebas Unitarias y de Integracion
echo ======================================================
echo.

set BASE_DIR=%~dp0
set PATH=%BASE_DIR%Skainet-Node;%PATH%

cd /d "%BASE_DIR%Skainet-API"
node node_modules/jest/bin/jest.js --config jest.config.json --runInBand

echo.
echo ======================================================
echo           Ejecucion de pruebas finalizada
echo ======================================================
pause
