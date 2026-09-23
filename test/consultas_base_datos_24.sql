-- SKAINET: 24 consultas para PostgreSQL y el esquema actual.
-- Ejecutar en desarrollo o QA. Las consultas 1 a 4 usan ROLLBACK.

-- 1-4. DML temporal: insertar, relacionar, actualizar y verificar.
BEGIN;
INSERT INTO "Material" (id, name, category, unit, stock, "minStock", status)
VALUES ('EVID-MAT-003', 'Cobre para evidencia', 'Metal', 'gramos', 18, 5, 'Activo')
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock, "minStock" = EXCLUDED."minStock";

INSERT INTO "KardexMovement" (id, "materialId", type, quantity, "originProvider", observations, "responsibleId")
VALUES ('EVID-MOV-003', 'EVID-MAT-003', 'ENTRADA', 18, 'Proveedor QA',
        'Movimiento creado como evidencia DML', '1000000000')
ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity, observations = EXCLUDED.observations;

UPDATE "Material" SET stock = stock + 2, status = 'Activo' WHERE id = 'EVID-MAT-003';

SELECT m.id, m.name, m.stock, k.type, k.quantity
FROM "Material" m JOIN "KardexMovement" k ON k."materialId" = m.id
WHERE m.id = 'EVID-MAT-003';
ROLLBACK;

-- 5. Conteo de las tablas principales.
SELECT 'Material' AS tabla, COUNT(*) AS registros FROM "Material"
UNION ALL SELECT 'KardexMovement', COUNT(*) FROM "KardexMovement"
UNION ALL SELECT 'WorkOrder', COUNT(*) FROM "WorkOrder"
UNION ALL SELECT 'ClientOrder', COUNT(*) FROM "ClientOrder"
UNION ALL SELECT 'User', COUNT(*) FROM "User";

-- 6. Materiales activos.
SELECT id, name, category, unit, stock, "minStock" FROM "Material"
WHERE status = 'Activo' ORDER BY stock DESC;

-- 7. Materiales con inventario bajo.
SELECT id, name, stock, "minStock", unit FROM "Material"
WHERE stock <= "minStock" ORDER BY ("minStock" - stock) DESC;

-- 8. JOIN de movimientos y materiales.
SELECT k.id AS movimiento, m.name AS material, k.type, k.quantity, k."originProvider", k."createdAt"
FROM "KardexMovement" k INNER JOIN "Material" m ON m.id = k."materialId"
ORDER BY k."createdAt" DESC;

-- 9. Entradas y salidas acumuladas por material.
SELECT m.id, m.name,
       COALESCE(SUM(CASE WHEN k.type = 'ENTRADA' THEN k.quantity ELSE 0 END), 0) AS entradas,
       COALESCE(SUM(CASE WHEN k.type = 'SALIDA' THEN k.quantity ELSE 0 END), 0) AS salidas
FROM "Material" m LEFT JOIN "KardexMovement" k ON k."materialId" = m.id
GROUP BY m.id, m.name ORDER BY m.name;

-- 10. Materiales sin movimientos.
SELECT m.id, m.name, m.stock FROM "Material" m
LEFT JOIN "KardexMovement" k ON k."materialId" = m.id WHERE k.id IS NULL;

-- 11. Materiales por encima del stock promedio.
SELECT name, stock, "minStock" FROM "Material"
WHERE stock > (SELECT AVG(stock) FROM "Material") ORDER BY stock DESC;

-- 12. Último movimiento de cada material.
SELECT k.id, m.name AS material, k.type, k.quantity, k."createdAt"
FROM "KardexMovement" k JOIN "Material" m ON m.id = k."materialId"
WHERE k."createdAt" = (SELECT MAX(k2."createdAt") FROM "KardexMovement" k2 WHERE k2."materialId" = k."materialId")
ORDER BY k."createdAt" DESC;

-- 13. Órdenes abiertas.
SELECT id, "productionItemName", "receiverId", "executorId", "totalWeight", "startTime"
FROM "WorkOrder" WHERE status = 'OPEN' ORDER BY "startTime" DESC;

-- 14. Órdenes terminadas sobre la duración promedio.
SELECT id, "productionItemName", "durationMinutes", loss FROM "WorkOrder"
WHERE status <> 'OPEN' AND "durationMinutes" > (
  SELECT AVG("durationMinutes") FROM "WorkOrder" WHERE "durationMinutes" IS NOT NULL
) ORDER BY "durationMinutes" DESC;

-- 15. Órdenes con anomalías.
SELECT id, "productionItemName", status, loss, explanation, "endTime" FROM "WorkOrder"
WHERE "isAnomaly" = TRUE ORDER BY "startTime" DESC;

-- 16. JOIN de lotes, piezas y tipos de producto.
SELECT b.id AS lote, b."entryWeight", b."exitWeight", b."itemsCount",
       p.id AS pieza, p.name AS nombre_pieza, p.status AS estado_pieza, t.name AS tipo_producto
FROM "Batch" b JOIN "ProductionItem" p ON p."batchId" = b.id
JOIN "ProductType" t ON t.id = p."productTypeId"
ORDER BY b."createdAt" DESC, p.name;

-- 17. Lotes cuya cantidad registrada difiere de sus piezas reales.
SELECT b.id, b."itemsCount" AS cantidad_registrada, COUNT(p.id) AS cantidad_real
FROM "Batch" b LEFT JOIN "ProductionItem" p ON p."batchId" = b.id
GROUP BY b.id, b."itemsCount" HAVING COUNT(p.id) <> b."itemsCount";

-- 18. Pedidos de clientes por estado.
SELECT status, COUNT(*) AS total_pedidos, ROUND(AVG("estimatedWeight")::numeric, 2) AS peso_promedio
FROM "ClientOrder" GROUP BY status ORDER BY total_pedidos DESC;

-- 19. Pedidos sobre el peso estimado promedio.
SELECT "shortId", "clientName", design, "estimatedWeight", status FROM "ClientOrder"
WHERE "estimatedWeight" > (SELECT AVG("estimatedWeight") FROM "ClientOrder")
ORDER BY "estimatedWeight" DESC;

-- 20. Máquinas que requieren mantenimiento.
SELECT id, name, type, "cycleCount", "maintenanceThreshold", "lastMaintenance" FROM "Machine"
WHERE "cycleCount" >= "maintenanceThreshold"
ORDER BY ("cycleCount" - "maintenanceThreshold") DESC;

-- 21. Alertas altas o críticas.
SELECT id, type, severity, message, "orderId", "jewelerName", timestamp FROM "Alert"
WHERE severity IN ('HIGH', 'CRITICAL') ORDER BY timestamp DESC;

-- 22. Alertas vinculadas a órdenes de trabajo.
SELECT a.id AS alerta, a.severity, a.message, w."productionItemName", w.status AS estado_orden
FROM "Alert" a JOIN "WorkOrder" w ON w.id = a."orderId" ORDER BY a.timestamp DESC;

-- 23. Tiempo total por orden y fase.
SELECT "workOrderId", phase, COUNT(*) AS eventos, SUM("durationSeconds") AS segundos_totales,
       ROUND((SUM("durationSeconds") / 60.0)::numeric, 2) AS minutos_totales
FROM "PhaseTimeLog" GROUP BY "workOrderId", phase ORDER BY segundos_totales DESC;

-- 24. Controles de triple pesaje por encima del promedio de pérdida.
SELECT id, "workOrderId", phase, weight1, weight2, weight3, "lossPercentage"
FROM "TripleWeightLog"
WHERE "lossPercentage" > (SELECT AVG("lossPercentage") FROM "TripleWeightLog")
ORDER BY "lossPercentage" DESC;
