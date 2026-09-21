-- EVIDENCIA 1: DDL - estructura creada por Prisma/PostgreSQL
SELECT table_name AS tabla
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ClientOrder'
ORDER BY ordinal_position;

-- EVIDENCIA 2: DML - datos de prueba, INSERT y JOIN
INSERT INTO "Material" (id, name, category, unit, stock, "minStock", status)
VALUES ('EVID-MAT-001', 'Oro de prueba', 'Metal', 'gramos', 25, 5, 'Activo')
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock;

INSERT INTO "KardexMovement" (id, "materialId", type, quantity, "originProvider", observations, "responsibleId")
VALUES ('EVID-MOV-001', 'EVID-MAT-001', 'ENTRADA', 25, 'Proveedor de prueba', 'Registro para evidencia DML', '1000000000')
ON CONFLICT (id) DO UPDATE SET quantity = EXCLUDED.quantity;

INSERT INTO "Material" (id, name, category, unit, stock, "minStock", status)
VALUES ('EVID-MAT-002', 'Plata de prueba', 'Metal', 'gramos', 5, 2, 'Activo')
ON CONFLICT (id) DO UPDATE SET stock = EXCLUDED.stock;

-- JOIN: movimiento de inventario con su material relacionado.
SELECT k.id AS movimiento, m.name AS material, k.type, k.quantity, k."createdAt"
FROM "KardexMovement" k
JOIN "Material" m ON m.id = k."materialId"
WHERE k.id = 'EVID-MOV-001';

-- Subconsulta: materiales cuyo stock está por encima del promedio registrado.
SELECT name, stock, "minStock"
FROM "Material"
WHERE stock > (SELECT AVG(stock) FROM "Material");

-- Consulta de datos insertados desde el sistema web/API.
SELECT "shortId", "clientName", design, "estimatedWeight", "createdAt"
FROM "ClientOrder"
ORDER BY "createdAt" DESC;

-- EVIDENCIA 3: seguridad - no se revelan hashes, solo su algoritmo y cantidad.
SELECT COUNT(*) AS usuarios_con_hash_scrypt
FROM "User"
WHERE password LIKE 'scrypt$%';
