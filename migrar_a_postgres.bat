@echo off
title Skainet - Migrador SQLite a PostgreSQL
echo ======================================================
echo   SKAINET FI - MIGRADOR DE BASE DE DATOS
echo       SQLite (dev.db) ---^> PostgreSQL
echo ======================================================
echo.

set BASE_DIR=%~dp0
set PATH=%BASE_DIR%Skainet-Node;%PATH%

cd /d "%BASE_DIR%Skainet-API"

echo [PASO 1/5] Exportando datos actuales de SQLite...
echo Esto creara un archivo JSON de respaldo con todos tus datos.
echo.

REM Usar DB SQLite temporalmente para exportar
set DATABASE_URL=file:./prisma/dev.db
node scripts/migrate_to_postgres.js

echo.
echo [PASO 2/5] Cambiando schema.prisma a PostgreSQL...
echo Asegurate de que PostgreSQL este corriendo en localhost:5432
echo y que la base de datos "skainet_db" exista.
echo.
echo   Para crear la BD, abre psql y ejecuta:
echo   CREATE DATABASE skainet_db;
echo.
pause

echo [PASO 3/5] Generando cliente Prisma para PostgreSQL...
node node_modules/prisma/build/index.js generate

echo.
echo [PASO 4/5] Ejecutando migraciones en PostgreSQL...
node node_modules/prisma/build/index.js migrate deploy

echo.
echo [PASO 5/5] Importando datos desde el snapshot JSON a PostgreSQL...
node scripts/import_to_postgres.js

echo.
echo ======================================================
echo  Migracion completada exitosamente!
echo  La base de datos PostgreSQL "skainet_db" esta lista.
echo ======================================================
pause
