# Diccionario de datos — Skainet

Base documentada: `skainet_db` (PostgreSQL).  
Alcance: estructura vigente, datos de prueba y relaciones del sistema.

## Convenciones

- **PK**: clave primaria.
- **FK**: clave foránea.
- Los identificadores se almacenan como `TEXT`; los UUID se generan desde la aplicación cuando corresponde.
- Las fechas usan `TIMESTAMP(3)` sin zona horaria.

## User

Usuarios, credenciales y estado operativo.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. Identificador o documento del usuario. |
| documentType | TEXT | Tipo de documento, por ejemplo `CC`. |
| name | TEXT | Nombre completo. Obligatorio. |
| role | TEXT | Rol: Super Administrador, Administrador o Joyero. |
| position | TEXT | Cargo operativo del joyero. Opcional. |
| status | TEXT | Estado operativo. Predeterminado: `Fuera de Turno`. |
| accountStatus | TEXT | Estado de cuenta. Predeterminado: `Activo`. |
| password | TEXT | Contraseña almacenada como hash al iniciar la API. |
| email | TEXT | Correo electrónico. Opcional. |
| phone | TEXT | Teléfono. Opcional. |
| mustChangePassword | BOOLEAN | Obliga el cambio de contraseña. Predeterminado: `true`. |
| failedAttempts | INTEGER | Intentos fallidos. Predeterminado: `0`. |
| lockoutUntil | TIMESTAMP(3) | Fecha de desbloqueo, si aplica. |
| lastLogin | TIMESTAMP(3) | Último acceso. |
| history | TEXT | Historial de estados codificado como JSON. Predeterminado: `[]`. |
| securityQuestions | TEXT | Preguntas de seguridad codificadas como JSON. Predeterminado: `[]`. |

## AuditLog

Bitácora de acciones relevantes del sistema.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. UUID por defecto. |
| actorId | TEXT | Identificador del usuario que ejecutó la acción. |
| actorRole | TEXT | Rol del actor. Opcional. |
| action | TEXT | Acción realizada, por ejemplo `CREATE`. |
| module | TEXT | Módulo afectado. |
| details | TEXT | Descripción de la acción. |
| createdAt | TIMESTAMP(3) | Fecha de creación. Predeterminado: fecha actual. |

## Material

Inventario de materiales e insumos.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. UUID por defecto. |
| name | TEXT | Nombre del material. |
| category | TEXT | Categoría, por ejemplo Metal precioso. |
| unit | TEXT | Unidad de medida. |
| stock | DOUBLE PRECISION | Existencia actual. Predeterminado: `0`. |
| minStock | DOUBLE PRECISION | Stock mínimo permitido. Predeterminado: `0`. |
| status | TEXT | Estado del material. Predeterminado: `Activo`. |
| createdAt | TIMESTAMP(3) | Fecha de registro. |

## KardexMovement

Entradas y salidas de inventario.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. UUID por defecto. |
| materialId | TEXT | **FK** a `Material.id`; al borrar el material se borran sus movimientos. |
| type | TEXT | Tipo de movimiento: `ENTRADA` o `SALIDA`. |
| quantity | DOUBLE PRECISION | Cantidad movilizada. |
| originProvider | TEXT | Proveedor u origen. Opcional. |
| workOrderId | TEXT | Orden asociada. Opcional. |
| observations | TEXT | Observaciones del movimiento. Opcional. |
| responsibleId | TEXT | Usuario responsable. |
| createdAt | TIMESTAMP(3) | Fecha del movimiento. |

## Batch

Lotes de producción.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. Identificador del lote, por ejemplo `B-201`. |
| entryWeight | DOUBLE PRECISION | Peso de entrada. |
| exitWeight | DOUBLE PRECISION | Peso de salida. |
| itemsCount | INTEGER | Número esperado de piezas en el lote. |
| createdAt | TIMESTAMP(3) | Fecha de creación. |

## ProductType

Catálogo de tipos de producto.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. Código, por ejemplo `PT-ANILLO`. |
| name | TEXT | Nombre único del tipo de producto. |
| category | TEXT | Categoría del producto. |
| description | TEXT | Descripción opcional. |
| status | TEXT | Estado del tipo. Predeterminado: `Activo`. |
| createdAt | TIMESTAMP(3) | Fecha de creación. |

## ProductionItem

Piezas pertenecientes a un lote.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. Identificador de pieza. |
| name | TEXT | Nombre de la pieza. |
| status | TEXT | Estado. Predeterminado: `PENDING`. |
| securePin | TEXT | PIN de control. Predeterminado: `0000`. |
| createdAt | TIMESTAMP(3) | Fecha de creación. |
| batchId | TEXT | **FK** a `Batch.id`; borrado en cascada. |
| productTypeId | TEXT | **FK** a `ProductType.id`; obligatorio. |

## WorkOrder

Órdenes de trabajo asignadas a producción.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. UUID por defecto o código de orden. |
| productionItemId | TEXT | Identificador de la pieza trabajada. |
| productionItemName | TEXT | Nombre de la pieza al crear la orden. |
| receiverId | TEXT | Usuario que recibe o asigna. |
| executorId | TEXT | Usuario que ejecuta el trabajo. |
| totalWeight | DOUBLE PRECISION | Peso total inicial. |
| status | TEXT | Estado. Predeterminado: `OPEN`. |
| startTime | TIMESTAMP(3) | Inicio de la orden. |
| endTime | TIMESTAMP(3) | Finalización, si existe. |
| durationMinutes | INTEGER | Duración calculada. |
| loss | DOUBLE PRECISION | Merma calculada. |
| isAnomaly | BOOLEAN | Marca una merma anómala. |
| explanation | TEXT | Justificación de anomalía. Opcional. |
| weights | TEXT | Pesos de componentes codificados como JSON. |
| providedPin | TEXT | PIN proporcionado para tomar la pieza. |

## ClientOrder

Pedidos realizados por clientes.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. UUID por defecto. |
| shortId | TEXT | Código único corto del pedido. |
| clientName | TEXT | Nombre del cliente. |
| email | TEXT | Correo del cliente. Opcional. |
| phone | TEXT | Teléfono del cliente. Opcional. |
| design | TEXT | Diseño solicitado. |
| estimatedWeight | DOUBLE PRECISION | Peso estimado. |
| status | TEXT | Estado. Predeterminado: `En Espera`. |
| stepIndex | INTEGER | Paso del flujo. Predeterminado: `0`. |
| createdAt | TIMESTAMP(3) | Fecha de creación. |

## Alert

Alertas operativas, de seguridad y mantenimiento.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. UUID por defecto. |
| type | TEXT | Tipo de alerta. |
| message | TEXT | Mensaje descriptivo. |
| severity | TEXT | Severidad. Predeterminado: `WARNING`. |
| timestamp | TIMESTAMP(3) | Fecha de emisión. |
| orderId | TEXT | Orden relacionada. Opcional. |
| jewelerName | TEXT | Nombre del joyero o responsable. |

## Machine

Maquinaria controlada por el sistema.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. Código de máquina. |
| name | TEXT | Nombre de la máquina. |
| type | TEXT | Tipo. Predeterminado: `LASER`. |
| status | TEXT | Estado operativo. Predeterminado: `OPERATIONAL`. |
| cycleCount | INTEGER | Ciclos acumulados. |
| maintenanceThreshold | INTEGER | Ciclos máximos antes de mantenimiento. |
| lastMaintenance | TIMESTAMP(3) | Último mantenimiento. |

## PhaseTimeLog

Tiempos registrados por fase de una orden.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. UUID por defecto. |
| workOrderId | TEXT | Orden asociada. |
| jewelerId | TEXT | Joyero responsable. |
| phase | TEXT | Fase de producción. |
| action | TEXT | Acción registrada. |
| durationSeconds | INTEGER | Duración en segundos. |
| createdAt | TIMESTAMP(3) | Fecha del registro. |

## TripleWeightLog

Control de calidad por triple pesaje.

| Campo | Tipo | Reglas / descripción |
|---|---|---|
| id | TEXT | **PK**. UUID por defecto. |
| workOrderId | TEXT | Orden evaluada. |
| jewelerId | TEXT | Joyero responsable. |
| phase | TEXT | Fase evaluada. |
| weight1 | DOUBLE PRECISION | Primer pesaje. |
| weight2 | DOUBLE PRECISION | Segundo pesaje. |
| weight3 | DOUBLE PRECISION | Tercer pesaje. |
| lossPercentage | DOUBLE PRECISION | Porcentaje de pérdida calculado. |
| createdAt | TIMESTAMP(3) | Fecha del control. |

## _prisma_migrations

Tabla técnica gestionada por Prisma. Registra las migraciones aplicadas; no se modifica manualmente.

## Relaciones principales

```text
Material 1 ──< KardexMovement
Batch 1 ──< ProductionItem >── 1 ProductType
WorkOrder ── ProductionItem (referencia lógica por productionItemId)
Alert ── WorkOrder (referencia lógica por orderId)
```
