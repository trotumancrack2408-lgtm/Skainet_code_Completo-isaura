# ⚙️ Skainet-Backend — Motor de Automatización, Worker e IoT

Módulo especializado en tareas en segundo plano (Background Worker), monitores automáticos y recepción de telemetría de taller de joyería.

## 🚀 Características y Responsabilidades

1. **Monitoreo Automático de Stock**: Revisa periódicamente los niveles de stock de materiales e insumos emitiendo alertas `STOCK_CRITICO` si caen bajo el stock mínimo.
2. **Monitoreo de Máquinas Láser**: Controla el ciclo de vida y uso del láser emitiendo alertas de mantenimiento preventivo (`MANTENIMIENTO_MAQUINA`).
3. **Auditor de Mermas y Pesajes**: Detecta anomalías y pérdidas excesivas de oro en las órdenes de trabajo (`ANOMALIA_MERMA`).
4. **Telemetría e Ingesta IoT**:
   - Lecturas de básculas analíticas de precisión (`POST /telemetry/scale`).
   - Ciclos y estados de máquinas de grabado y corte láser (`POST /telemetry/laser`).
   - Consulta de dispositivos conectados (`GET /telemetry/devices`).

## 🔌 Puerto y Swagger
- **Puerto:** `3001`
- **Documentación Swagger:** `http://localhost:3001/api`
- **Estado del Worker:** `GET http://localhost:3001/automation/status`

## 🏃‍♂️ Ejecución
```bash
iniciar_backend.bat
```
