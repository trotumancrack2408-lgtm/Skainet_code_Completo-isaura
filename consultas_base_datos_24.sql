-- SKAINET: 24 consultas SQL para evidencia de base de datos (PostgreSQL)
-- Ejecutar en una base de QA o desarrollo. Las consultas 1-4 usan ROLLBACK,
-- por lo que no dejan cambios persistentes.

-- 1. DML: inserta (o actualiza) un material de prueba.
BEGIN;
INSERT INTO "Material" (id, name, category, unit, stock, "minStock", status)
VALUES ('EVID-MAT-003', 'Cobre para evidencia', 'Metal', 'gramos', 18, 5, 'Activo')
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, "minStock" = EXCLUDED."minStock";

-- 2. DML: inserta (o actualiza) un movimiento asociado al material de prueba.
INSERT INTO "KardexMovement" (id, "materialId", type, quantity, "originProvider", observations, "responsibleId")
VALUES ('EVID-MOV-003', 'EVID-MAT-003', 'ENTRADA', 18, 'Proveedor QA',
        'Movimiento creado como evidencia DML', '1000000000')
ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, observations = EXCLUDED.observations;

-- 3. DML: actualiza el material de prueba.
UPDATE "Material"
SET stock = stock + 2, status = 'Activo'
WHERE id = 'EVID-MAT-003';

-- 4. Verificación del DML; finalizar sin guardar los datos temporales.
SELECT m.id, m.name, m.stock, k.type, k.quantity
FROM "Material" m
JOIN "KardexMovement" k ON k."materialId" = m.id
WHERE m.id = 'EVID-MAT-003';
ROLLBACK;

-- 5. Existencia y cantidad de registros por tabla principal.
SELECT 'Material' AS tabla, COUNT(*) AS registros FROM "Material"
UNION ALL SELECT 'KardexMovement', COUNT(*) FROM "KardexMovement"
UNION ALL SELECT 'WorkOrder', COUNT(*) FROM "WorkOrder"
UNION ALL SELECT 'ClientOrder', COUNT(*) FROM "ClientOrder"
UNION ALL SELECT 'User', COUNT(*) FROM "User";

-- 6. Materiales activos y su nivel actual de inventario.
SELECT id, name, category, unit, stock, "minStock"
FROM "Material"
WHERE status = 'Activo'
ORDER BY stock DESC;

-- 7. Materiales con inventario bajo o igual al mínimo.
SELECT id, name, stock, "minStock", unit
FROM "Material"
WHERE stock <= "minStock"
ORDER BY ("minStock" - stock) DESC;

-- 8. JOIN: cada movimiento de kardex con el material correspondiente.
SELECT k.id AS movimiento, m.name AS material, k.type, k.quantity,
       k."originProvider", k."createdAt"
FROM "KardexMovement" k
INNER JOIN "Material" m ON m.id = k."materialId"
ORDER BY k."createdAt" DESC;

-- 9. JOIN + agregación: entradas y salidas acumuladas por material.
SELECT m.id, m.name,
       COALESCE(SUM(CASE WHEN k.type = 'ENTRADA' THEN k.quantity ELSE 0 END), 0) AS entradas,
       COALESCE(SUM(CASE WHEN k.type = 'SALIDA' THEN k.quantity ELSE 0 END), 0) AS salidas
FROM "Material" m
LEFT JOIN "KardexMovement" k ON k."materialId" = m.id
GROUP BY m.id, m.name
ORDER BY m.name;

-- 10. Materiales que aún no tienen movimientos (LEFT JOIN).
SELECT m.id, m.name, m.stock
FROM "Material" m
LEFT JOIN "KardexMovement" k ON k."materialId" = m.id
WHERE k.id IS NULL;

-- 11. Subconsulta: materiales por encima del stock promedio.
SELECT name, stock, "minStock"
FROM "Material"
WHERE stock > (SELECT AVG(stock) FROM "Material")
ORDER BY stock DESC;

-- 12. Subconsulta correlacionada: último movimiento de cada material.
SELECT k.id, m.name AS material, k.type, k.quantity, k."createdAt"
FROM "KardexMovement" k
JOIN "Material" m ON m.id = k."materialId"
WHERE k."createdAt" = (
  SELECT MAX(k2."createdAt") FROM "KardexMovement" k2
  WHERE k2."materialId" = k."materialId"
)
ORDER BY k."createdAt" DESC;

-- 13. Órdenes de trabajo abiertas, con responsable y ejecutor.
SELECT id, "ringName", "receiverId", "executorId", "totalWeight", "startTime"
FROM "WorkOrder"
WHERE status = 'OPEN'
ORDER BY "startTime" DESC;

-- 14. Órdenes terminadas cuya duración está sobre el promedio de las terminadas.
SELECT id, "ringName", "durationMinutes", loss
FROM "WorkOrder"
WHERE status <> 'OPEN'
  AND "durationMinutes" > (
    SELECT AVG("durationMinutes") FROM "WorkOrder"
    WHERE "durationMinutes" IS NOT NULL
  )
ORDER BY "durationMinutes" DESC;

-- 15. Órdenes con anomalías detectadas.
SELECT id, "ringName", status, loss, explanation, "endTime"
FROM "WorkOrder"
WHERE "isAnomaly" = TRUE
ORDER BY "startTime" DESC;

-- 16. JOIN: lotes, piezas de producción y su tipo de producto.
SELECT b.id AS lote, b."entryWeight", b."exitWeight", b."itemsCount",
       p.id AS pieza, p.name AS nombre_pieza, p.status AS estado_pieza,
       t.name AS tipo_producto
FROM "Batch" b
JOIN "ProductionItem" p ON p."batchId" = b.id
JOIN "ProductType" t ON t.id = p."productTypeId"
ORDER BY b."createdAt" DESC, p.name;

-- 17. Lotes cuyo número real de piezas no coincide con el registrado.
SELECT b.id, b."itemsCount" AS cantidad_registrada, COUNT(p.id) AS cantidad_real
FROM "Batch" b
LEFT JOIN "ProductionItem" p ON p."batchId" = b.id
GROUP BY b.id, b."itemsCount"
HAVING COUNT(p.id) <> b."itemsCount";

-- 18. Pedidos de clientes agrupados por estado.
SELECT status, COUNT(*) AS total_pedidos, ROUND(AVG("estimatedWeight")::numeric, 2) AS peso_promedio
FROM "ClientOrder"
GROUP BY status
ORDER BY total_pedidos DESC;

-- 19. Pedidos cuyo peso estimado es superior al promedio de pedidos.
SELECT "shortId", "clientName", design, "estimatedWeight", status
FROM "ClientOrder"
WHERE "estimatedWeight" > (SELECT AVG("estimatedWeight") FROM "ClientOrder")
ORDER BY "estimatedWeight" DESC;

-- 20. Máquinas que ya alcanzaron o superaron su umbral de mantenimiento.
SELECT id, name, type, "cycleCount", "maintenanceThreshold", "lastMaintenance"
FROM "Machine"
WHERE "cycleCount" >= "maintenanceThreshold"
ORDER BY ("cycleCount" - "maintenanceThreshold") DESC;

-- 21. Alertas de severidad alta, con o sin orden asociada.
SELECT id, type, severity, message, "orderId", "jewelerName", timestamp
FROM "Alert"
WHERE severity IN ('HIGH', 'CRITICAL')
ORDER BY timestamp DESC;

-- 22. JOIN lógico: alertas vinculadas a órdenes de trabajo por orderId.
SELECT a.id AS alerta, a.severity, a.message, w."ringName", w.status AS estado_orden
FROM "Alert" a
JOIN "WorkOrder" w ON w.id = a."orderId"
ORDER BY a.timestamp DESC;

-- 23. Registro de tiempos: duración total por orden y fase.
SELECT "workOrderId", phase, COUNT(*) AS eventos,
       SUM("durationSeconds") AS segundos_totales,
       ROUND((SUM("durationSeconds") / 60.0)::numeric, 2) AS minutos_totales
FROM "PhaseTimeLog"
GROUP BY "workOrderId", phase
ORDER BY segundos_totales DESC;

-- 24. Control de calidad: registros de triple pesaje con pérdida superior al promedio.
SELECT id, "workOrderId", phase, weight1, weight2, weight3, "lossPercentage"
FROM "TripleWeightLog"
WHERE "lossPercentage" > (SELECT AVG("lossPercentage") FROM "TripleWeightLog")
ORDER BY "lossPercentage" DESC;
