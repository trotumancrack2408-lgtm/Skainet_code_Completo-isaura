@echo off
setlocal

rem Uso: ejecutar_sonarqube.bat [TOKEN] [URL_SONARQUBE]
rem Ejemplo: ejecutar_sonarqube.bat sqa_xxx http://localhost:9000
set "SONAR_TOKEN=%~1"
set "SONAR_HOST_URL=%~2"
if "%SONAR_HOST_URL%"=="" set "SONAR_HOST_URL=http://localhost:9000"

if "%SONAR_TOKEN%"=="" (
  set /p "SONAR_TOKEN=Token de SonarQube: "
)
if "%SONAR_TOKEN%"=="" (
  echo ERROR: se necesita un token de SonarQube.
  exit /b 1
)

echo Generando cobertura de Skainet-API...
pushd Skainet-API
call npm run test:cov
if errorlevel 1 goto :error
popd

echo Generando cobertura de Skainet-Backend...
pushd Skainet-Backend
rem Este modulo aun no tiene carpeta de pruebas; no detenemos el reporte por ello.
call npm run test:cov -- --passWithNoTests --runInBand
if errorlevel 1 goto :error
popd

where flutter >nul 2>nul
if errorlevel 1 (
  echo AVISO: Flutter no esta disponible; se analizara el codigo movil sin cobertura.
) else (
  echo Generando cobertura de Skainet-Mobile...
  pushd Skainet-Mobile
  call flutter test --coverage
  if errorlevel 1 goto :error
  popd
)

echo Enviando analisis a %SONAR_HOST_URL%...
call npx --yes sonar-scanner -Dsonar.host.url=%SONAR_HOST_URL% -Dsonar.token=%SONAR_TOKEN%
if errorlevel 1 goto :error

echo.
echo Analisis terminado. Abre %SONAR_HOST_URL% y selecciona el proyecto Skainet FI.
exit /b 0

:error
popd
echo.
echo ERROR: no se pudo completar el analisis. Revisa el mensaje anterior.
exit /b 1
