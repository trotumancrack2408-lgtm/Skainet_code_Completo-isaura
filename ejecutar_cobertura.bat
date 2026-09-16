@echo off
setlocal
cd /d "%~dp0"
"%~dp0Skainet-Node\node.exe" Skainet-API/node_modules/jest/bin/jest.js --config Skainet-API/jest.config.json --runInBand --coverage --coverageReporters=text --coverageReporters=lcov --coverageReporters=json-summary
exit /b %errorlevel%
