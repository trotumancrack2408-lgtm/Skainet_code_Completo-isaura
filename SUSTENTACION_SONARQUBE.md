# Pruebas automatizadas y SonarQube: Skainet API

## Resultado comprobado

La ejecución local realizada para esta preparación terminó con 58 suites aprobadas y 239 pruebas aprobadas, sin fallos. Cobertura de Jest: sentencias 51,16 %, ramas 53,73 %, funciones 50,93 % y líneas 52,43 %.

Estos son resultados locales de Jest, no resultados publicados en SonarQube. No se ha ejecutado el análisis remoto ni comprobado el Quality Gate. El alcance es Skainet-API; no representa frontend, aplicación móvil ni el worker Skainet-Backend.

## Repetir la demostración

Desde PowerShell, en la raíz del repositorio:

```powershell
.\ejecutar_cobertura.bat
```

El comando usa el Node incluido en el proyecto y las dependencias ya instaladas de la API. Ejecuta las pruebas configuradas en Skainet-API/jest.config.json y genera:

- `Skainet-API/coverage/lcov.info`: cobertura que importa SonarQube.
- `Skainet-API/coverage/lcov-report/index.html`: reporte visual para explorar archivos y líneas.
- `Skainet-API/coverage/coverage-summary.json`: resumen de métricas.

Para mostrar únicamente los cinco casos existentes de autenticación:

```powershell
.\Skainet-Node\node.exe Skainet-API/node_modules/jest/bin/jest.js --config Skainet-API/jest.config.json --runInBand --runTestsByPath Skainet-API/pruebas/auth.service.spec.ts
```

## Enviar a SonarQube

Primero se necesita la URL del servidor, la clave del proyecto y un token con permiso de análisis. No guardar el token en el repositorio ni mostrarlo en capturas. El archivo `sonar-project.properties` contiene una clave inicial `skainet-api`; ajustar esa clave al proyecto real.

Con SonarScanner CLI instalado y disponible en PATH, ejecutar desde la raíz, después de generar cobertura:

```powershell
$env:SONAR_HOST_URL = 'https://TU-SERVIDOR-SONARQUBE'
# SONAR_TOKEN debe estar configurado en el entorno de forma privada.
sonar-scanner
```

Esta instrucción corresponde a un servidor SonarQube. Si se usa SonarQube Cloud, completar la configuración que indique ese proyecto, incluida la organización. El escáner no se encontró en el PATH durante la revisión inicial.

Abrir el enlace del análisis y esperar su procesamiento. Verificar cobertura importada, archivos analizados, incidencias y Quality Gate. No afirmar que el Quality Gate aprobó hasta verlo en el servidor. La cobertura general de SonarQube puede diferir de la cobertura de líneas de Jest: comparar métricas equivalentes y el mismo alcance. LCOV informa cobertura; no basta para mostrar el conteo de 239 pruebas en SonarQube.

## Guion de sustentación (3 a 5 minutos)

“En Skainet usamos Jest para ejecutar pruebas automatizadas sobre la API escrita en TypeScript con NestJS. SonarQube analiza estáticamente el código e importa la cobertura generada por Jest. Son herramientas complementarias.”

“Voy a mostrar la autenticación. Primero preparo un usuario ficticio y simulo UsersService y JwtService. Después ejecuto login. Finalmente uso expect para comparar el resultado con el comportamiento esperado. Esta estructura se llama preparar, actuar y verificar.”

Mostrar `Skainet-API/pruebas/auth.service.spec.ts` y explicar:

| Caso existente | Preparación y acción | Verificación |
| --- | --- | --- |
| Credenciales válidas | validatePassword devuelve un usuario; se llama login | Se consultan las credenciales esperadas y se devuelve el token simulado |
| Contraseña incorrecta | validatePassword devuelve null | Se lanza UnauthorizedException y no se firma un token |
| Usuario inexistente | validatePassword devuelve null para otro identificador | Se rechaza el acceso |
| Datos del token | Se autentica al usuario ficticio | sign recibe sub, username y role esperados |
| Respuesta de login | Se ejecuta login válido | La respuesta conserva id, name y access_token |

“Un mock es una dependencia simulada que permite controlar el escenario sin depender de servicios externos. Estos casos validan decisiones de AuthService; no prueban que la contraseña se verifique correctamente en una base de datos ni que el token tenga una firma real.”

Ejecutar la suite completa y mostrar el resumen real. “En esta ejecución aprobaron 239 pruebas. La cobertura de líneas fue 52,43 %. Que todas aprueben significa que se cumplen las verificaciones escritas; no significa que todo el sistema esté probado. La cobertura muestra qué código fue recorrido y ayuda a localizar trabajo pendiente.”

Abrir el reporte HTML y seleccionar un archivo con líneas sin cubrir. “Por ejemplo, production-logs.service.ts quedó con 0 % en esta ejecución, mientras recovery.service.ts tuvo 100 % de líneas. Priorizaremos pruebas según el riesgo funcional y los caminos pendientes, sin excluir código para inflar la cifra.”

Si ya se ejecutó el escáner, mostrar el análisis real de SonarQube y explicar su estado. Si no, decir: “La cobertura y la configuración están preparadas; falta ejecutar el análisis en el servidor asignado.”

## Preguntas habituales

- **¿SonarQube ejecuta las pruebas?** En este flujo las ejecuta Jest. SonarQube recibe LCOV y analiza el código.
- **¿Qué es cobertura de ramas?** Mide las alternativas de decisión recorridas, como caminos de éxito y rechazo de una condición.
- **¿Un 100 % garantiza que no hay errores?** No. Recorrer una línea no garantiza verificar todos sus posibles comportamientos.
- **¿Son todas pruebas de integración real?** No debe afirmarse por el nombre de la carpeta. Por ejemplo, la suite de autenticación en test/integracion sustituye UsersService y JwtService por mocks. No demuestra conexión real a la base de datos, firma JWT ni navegación de la interfaz.
- **¿Qué es el Quality Gate?** El conjunto de condiciones de calidad configuradas en el servidor que determina si el análisis cumple los criterios. Sus umbrales deben revisarse en el proyecto real.
- **¿Qué falta?** Confirmar la rúbrica, ejecutar el escáner en el servidor asignado y ampliar pruebas de caminos relevantes sin cobertura según el alcance exigido.

## Evidencias para entregar

1. Captura del comando y resumen final de Jest, con el resultado de tu ejecución.
2. Captura del caso de autenticación y explicación de su entrada, resultado esperado y expect.
3. Reporte HTML y archivo LCOV generados.
4. Captura del análisis de SonarQube y su Quality Gate cuando esté disponible.

Documentación oficial: https://docs.sonarsource.com/sonarqube/latest/analysis/test-coverage/javascript-typescript-test-coverage
