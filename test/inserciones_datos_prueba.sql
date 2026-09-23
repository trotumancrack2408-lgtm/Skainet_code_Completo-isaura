-- SKAINET: datos de prueba reutilizables para PostgreSQL.
-- Se puede ejecutar más de una vez: los registros se actualizan por su identificador.

BEGIN;

INSERT INTO "Material" (id, name, category, unit, stock, "minStock", status) VALUES
  ('MAT-PLATA-925', 'Plata 925', 'Metal precioso', 'Gramos', 45, 15, 'Activo'),
  ('MAT-ORO-24K', 'Oro 24k', 'Metal precioso', 'Gramos', 12, 20, 'Activo'),
  ('MAT-PIEDRA-ZAFIRO', 'Zafiro azul', 'Piedras preciosas', 'Unidad', 8, 3, 'Activo')
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, "minStock" = EXCLUDED."minStock", status = EXCLUDED.status;

INSERT INTO "KardexMovement" (id, "materialId", type, quantity, "originProvider", observations, "responsibleId") VALUES
  ('MOV-001', 'MAT-PLATA-925', 'ENTRADA', 50, 'Proveedor Andino', 'Compra inicial de plata', '1000100010'),
  ('MOV-002', 'MAT-PLATA-925', 'SALIDA', 5, NULL, 'Uso en lote B-201', '3000300030'),
  ('MOV-003', 'MAT-ORO-24K', 'ENTRADA', 12, 'Proveedor Oro Seguro', 'Ingreso para producción', '1000100010'),
  ('MOV-004', 'MAT-PIEDRA-ZAFIRO', 'ENTRADA', 8, 'Gemas Colombia', 'Inventario de piedras', '2000200020')
ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, observations = EXCLUDED.observations;

INSERT INTO "Batch" (id, "entryWeight", "exitWeight", "itemsCount") VALUES
  ('B-201', 85.5, 82.3, 3),
  ('B-202', 42.0, 40.8, 2)
ON CONFLICT (id) DO UPDATE SET "entryWeight" = EXCLUDED."entryWeight", "exitWeight" = EXCLUDED."exitWeight", "itemsCount" = EXCLUDED."itemsCount";

INSERT INTO "ProductionItem" (id, name, status, "securePin", "batchId", "productTypeId") VALUES
  ('B-201-P1', 'Anillo de compromiso', 'COMPLETED', '3141', 'B-201', 'PT-ANILLO'),
  ('B-201-P2', 'Dije corazón', 'PENDING', '2718', 'B-201', 'PT-DIJE'),
  ('B-201-P3', 'Pulsera clásica', 'PENDING', '1618', 'B-201', 'PT-PULSERA'),
  ('B-202-P1', 'Cadena italiana', 'COMPLETED', '1122', 'B-202', 'PT-CADENA'),
  ('B-202-P2', 'Aretes zafiro', 'PENDING', '3344', 'B-202', 'PT-ARETES')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, "securePin" = EXCLUDED."securePin";

INSERT INTO "WorkOrder" (id, "productionItemId", "productionItemName", "receiverId", "executorId", "totalWeight", status, "startTime", "endTime", "durationMinutes", loss, "isAnomaly", explanation, weights, "providedPin") VALUES
  ('OT-201', 'B-201-P1', 'Anillo de compromiso (Lote B-201)', '2000200020', '3000300030', 12.5, 'CLOSED', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '90 minutes', 90, 0.03, false, NULL, '{"anillo":10.2,"plastilina":1.5,"bolsa":0.8}', '3141'),
  ('OT-202', 'B-202-P1', 'Cadena italiana (Lote B-202)', '2000200020', '3000300030', 8.6, 'CLOSED', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '2 days' + INTERVAL '150 minutes', 150, 0.18, true, 'Merma superior a la tolerancia durante el pulido.', '{"anillo":6.8,"plastilina":1.0,"bolsa":0.8}', '1122')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, "endTime" = EXCLUDED."endTime", "durationMinutes" = EXCLUDED."durationMinutes", loss = EXCLUDED.loss, "isAnomaly" = EXCLUDED."isAnomaly", explanation = EXCLUDED.explanation;

INSERT INTO "ClientOrder" (id, "shortId", "clientName", email, phone, design, "estimatedWeight", status, "stepIndex") VALUES
  ('CO-001', '1001', 'Laura Gómez', 'laura.gomez@example.com', '+573101112233', 'Anillo de compromiso con zafiro', 5.8, 'En Proceso', 2),
  ('CO-002', '1002', 'Carlos Ruiz', 'carlos.ruiz@example.com', '+573104445566', 'Cadena italiana en plata', 12.0, 'En Espera', 0),
  ('CO-003', '1003', 'María Torres', 'maria.torres@example.com', '+573107778899', 'Aretes con zafiro azul', 4.2, 'Finalizado', 4)
ON CONFLICT ("shortId") DO UPDATE SET status = EXCLUDED.status, "stepIndex" = EXCLUDED."stepIndex", "estimatedWeight" = EXCLUDED."estimatedWeight";

INSERT INTO "Machine" (id, name, type, status, "cycleCount", "maintenanceThreshold", "lastMaintenance") VALUES
  ('M-001', 'Láser de marcado', 'LASER', 'OPERATIONAL', 510, 500, CURRENT_TIMESTAMP - INTERVAL '45 days'),
  ('M-002', 'Pulidora industrial', 'PULIDORA', 'OPERATIONAL', 120, 500, CURRENT_TIMESTAMP - INTERVAL '10 days')
ON CONFLICT (id) DO UPDATE SET "cycleCount" = EXCLUDED."cycleCount", "lastMaintenance" = EXCLUDED."lastMaintenance", status = EXCLUDED.status;

INSERT INTO "Alert" (id, type, message, severity, "orderId", "jewelerName") VALUES
  ('ALT-001', 'WEIGHT', 'Merma elevada detectada en la orden OT-202.', 'CRITICAL', 'OT-202', 'Joyero Prueba'),
  ('ALT-002', 'MAINTENANCE', 'La máquina M-001 alcanzó el umbral de mantenimiento.', 'HIGH', NULL, 'Administrador Prueba')
ON CONFLICT (id) DO UPDATE SET message = EXCLUDED.message, severity = EXCLUDED.severity;

INSERT INTO "PhaseTimeLog" (id, "workOrderId", "jewelerId", phase, action, "durationSeconds") VALUES
  ('TIME-001', 'OT-201', '3000300030', 'Fundición', 'COMPLETED', 1800),
  ('TIME-002', 'OT-201', '3000300030', 'Pulido', 'COMPLETED', 2700),
  ('TIME-003', 'OT-202', '3000300030', 'Pulido', 'COMPLETED', 4200)
ON CONFLICT (id) DO UPDATE SET "durationSeconds" = EXCLUDED."durationSeconds";

INSERT INTO "TripleWeightLog" (id, "workOrderId", "jewelerId", phase, weight1, weight2, weight3, "lossPercentage") VALUES
  ('TW-001', 'OT-201', '3000300030', 'Fundición', 12.50, 12.48, 12.47, 0.24),
  ('TW-002', 'OT-202', '3000300030', 'Pulido', 8.60, 8.48, 8.42, 2.09)
ON CONFLICT (id) DO UPDATE SET "lossPercentage" = EXCLUDED."lossPercentage", weight1 = EXCLUDED.weight1, weight2 = EXCLUDED.weight2, weight3 = EXCLUDED.weight3;

INSERT INTO "AuditLog" (id, "actorId", "actorRole", action, module, details) VALUES
  ('AUD-001', '1000100010', 'Super Administrador', 'CREATE', 'Inventario', 'Se registraron datos de prueba para el inventario.'),
  ('AUD-002', '2000200020', 'Administrador', 'CREATE', 'Producción', 'Se registraron lotes y órdenes de prueba.')
ON CONFLICT (id) DO UPDATE SET details = EXCLUDED.details;

COMMIT;
