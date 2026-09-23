-- Skainet: base de datos completa para PostgreSQL.
-- Generado desde prisma/schema.prisma el 2026-09-22.
-- Este archivo crea estructura, catálogo, datos de prueba e historial de Prisma.
--
-- Uso:
--   createdb -U postgres nombre_de_tu_base
--   psql -U postgres -d nombre_de_tu_base -f prisma/base_datos_inicial.sql

BEGIN;

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "documentType" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Fuera de Turno',
    "accountStatus" TEXT NOT NULL DEFAULT 'Activo',
    "password" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockoutUntil" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "history" TEXT NOT NULL DEFAULT '[]',
    "securityQuestions" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KardexMovement" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "originProvider" TEXT,
    "workOrderId" TEXT,
    "observations" TEXT,
    "responsibleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KardexMovement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PhaseTimeLog" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "jewelerId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PhaseTimeLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TripleWeightLog" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "jewelerId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "weight1" DOUBLE PRECISION NOT NULL,
    "weight2" DOUBLE PRECISION NOT NULL,
    "weight3" DOUBLE PRECISION NOT NULL,
    "lossPercentage" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TripleWeightLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "entryWeight" DOUBLE PRECISION NOT NULL,
    "exitWeight" DOUBLE PRECISION NOT NULL,
    "itemsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductionItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "securePin" TEXT NOT NULL DEFAULT '0000',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchId" TEXT NOT NULL,
    "productTypeId" TEXT NOT NULL,
    CONSTRAINT "ProductionItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "productionItemId" TEXT NOT NULL,
    "productionItemName" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "executorId" TEXT NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "loss" DOUBLE PRECISION,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "weights" TEXT NOT NULL,
    "providedPin" TEXT NOT NULL,
    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientOrder" (
    "id" TEXT NOT NULL,
    "shortId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "design" TEXT NOT NULL,
    "estimatedWeight" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'En Espera',
    "stepIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClientOrder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orderId" TEXT,
    "jewelerName" TEXT NOT NULL,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LASER',
    "status" TEXT NOT NULL DEFAULT 'OPERATIONAL',
    "cycleCount" INTEGER NOT NULL DEFAULT 0,
    "maintenanceThreshold" INTEGER NOT NULL DEFAULT 500,
    "lastMaintenance" TIMESTAMP(3),
    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductType_name_key" ON "ProductType"("name");
CREATE UNIQUE INDEX "ClientOrder_shortId_key" ON "ClientOrder"("shortId");

ALTER TABLE "KardexMovement" ADD CONSTRAINT "KardexMovement_materialId_fkey"
  FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_batchId_fkey"
  FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_productTypeId_fkey"
  FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Catálogo mínimo requerido para crear piezas de producción.
INSERT INTO "ProductType" ("id", "name", "category", "description") VALUES
  ('PT-ANILLO', 'Anillo', 'Joyería', 'Anillo fabricado a medida'),
  ('PT-CADENA', 'Cadena', 'Joyería', 'Cadena de joyería'),
  ('PT-DIJE', 'Dije', 'Joyería', 'Dije o colgante'),
  ('PT-PULSERA', 'Pulsera', 'Joyería', 'Pulsera de joyería'),
  ('PT-ARETES', 'Aretes', 'Joyería', 'Par de aretes');

-- Datos de prueba actuales.
INSERT INTO "User" ("id", "documentType", "name", "role", "status", "accountStatus", "password", "email", "phone", "mustChangePassword", "failedAttempts", "history", "securityQuestions") VALUES
  ('1000100010', 'CC', 'Super Administrador Prueba', 'Super Administrador', 'Disponible', 'Activo', 'Skainet#2026', 'superadmin.prueba@skainet.com', '+573001234567', true, 0, '[]', '[]'),
  ('2000200020', 'CC', 'Administrador Prueba', 'Administrador', 'Disponible', 'Activo', 'Skainet#2026', 'admin.prueba@skainet.com', '+573001234568', true, 0, '[]', '[]'),
  ('3000300030', 'CC', 'Joyero Prueba', 'Joyero', 'Disponible', 'Activo', '123', 'joyero.prueba@skainet.com', '+573001234569', false, 0, '[]', '[]');

INSERT INTO "Material" ("id", "name", "category", "unit", "stock", "minStock", "status") VALUES
  ('9b39573a-62f6-4ea9-870a-f2685c7b0eb0', 'Oro 18k', 'Metal precioso', 'Gramos', 150, 20, 'Activo');

INSERT INTO "Batch" ("id", "entryWeight", "exitWeight", "itemsCount") VALUES
  ('B-102', 180, 176.8, 3);

INSERT INTO "ProductionItem" ("id", "name", "status", "securePin", "batchId", "productTypeId") VALUES
  ('B-102-P3', 'Cadena 3', 'PENDING', '8888', 'B-102', 'PT-CADENA');

INSERT INTO "WorkOrder" ("id", "productionItemId", "productionItemName", "receiverId", "executorId", "totalWeight", "status", "weights", "providedPin") VALUES
  ('OT-000123', 'B-102-P3', 'Cadena 3 (Lote B-102)', '2000200020', '3000300030', 10.5, 'OPEN', '{"anillo":8.5,"plastilina":1.2,"bolsa":0.8}', '8888');

-- Prisma utiliza esta tabla para no volver a ejecutar las migraciones ya incluidas.
CREATE TABLE "_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "started_at", "applied_steps_count") VALUES
  ('2ffa404d-1e93-496f-b1a1-6163ef874e3e', '896d226f9f68d06ee41538b103a529c36f66c4f168a4952a84e6bc4e29fe7c16', CURRENT_TIMESTAMP, '20260626051254_init', '', CURRENT_TIMESTAMP, 0),
  ('e6c8a89f-2058-407a-a44d-c500706a6647', '4c3c5dc9467bc826bc85b18a31cbc79fb57a24a078c5e56f3deac54edb724a99', CURRENT_TIMESTAMP, '20260920000000_generalize_products', '', CURRENT_TIMESTAMP, 0),
  ('b1a28192-034b-4e6b-97ee-ee28dfae0f83', '7a9855d2cd303d0fb562e4b1017a9c8015ba3e0b6a5821ae005a7c55de277576', CURRENT_TIMESTAMP, '20260920010000_add_user_position', '', CURRENT_TIMESTAMP, 0);

COMMIT;
