# Skainet

Plataforma para la gestión operativa de un taller de joyería: usuarios, pedidos, órdenes de producción, pesajes, inventario, alertas y telemetría.

## Arquitectura

```text
Web (React) + Móvil (Flutter)
              |
              v
 API REST (NestJS, :3000) ---- Prisma/PostgreSQL
              ^                       ^
              |                       |
 Worker (NestJS, :3001): automatización y telemetría
```

| Componente | Responsabilidad | Ubicación |
| --- | --- | --- |
| Web | Operación administrativa y del joyero | `Skainet-Frontend/` |
| API | Reglas de negocio y endpoints REST | `Skainet-API/` |
| Worker | Alertas programadas y telemetría IoT | `Skainet-Backend/` |
| Móvil | Seguimiento y operación desde Flutter | `Skainet-Mobile/` |
| Pruebas | Pruebas unitarias y de integración del sistema | `test/` |

## Flujo demostrable

1. Registrar un pedido de cliente.
2. Crear y asignar una orden de producción.
3. Registrar pesajes y avance de fases.
4. Consultar inventario, alertas y trazabilidad.

## Ejecución local

Cada servicio conserva sus instrucciones y scripts propios:

- API: `Skainet-API/iniciar_api.bat` — Swagger: `http://localhost:3000/api`
- Worker: `Skainet-Backend/iniciar_backend.bat` — Swagger: `http://localhost:3001/api`
- Web: `Skainet-Frontend/iniciar_frontend.bat`
- Móvil: `Skainet-Mobile/iniciar_mobile.bat`

Antes de iniciar API o Worker, configure sus variables locales en un archivo `.env` no versionado, como `DATABASE_URL`, `JWT_SECRET` y `PORT`.

## Convenciones del repositorio

- Se versionan fuente, migraciones, configuración, pruebas y documentación.
- No se versionan dependencias, compilados, coberturas, bases locales, secretos, logs ni resultados generados.
- Las pruebas de alcance transversal permanecen en `test/`, fuera de los módulos ejecutables.
