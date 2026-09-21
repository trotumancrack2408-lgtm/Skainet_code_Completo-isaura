-- Generaliza el modelo: un lote contiene piezas de producción de distintos tipos,
-- en vez de estar limitado a anillos.
ALTER TABLE "Ring" RENAME TO "ProductionItem";
ALTER TABLE "Batch" RENAME COLUMN "ringsCount" TO "itemsCount";
ALTER TABLE "WorkOrder" RENAME COLUMN "ringId" TO "productionItemId";
ALTER TABLE "WorkOrder" RENAME COLUMN "ringName" TO "productionItemName";

CREATE TABLE "ProductType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Activo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductType_name_key" ON "ProductType"("name");

INSERT INTO "ProductType" ("id", "name", "category", "description") VALUES
  ('PT-ANILLO', 'Anillo', 'Joyería', 'Anillo fabricado a medida'),
  ('PT-CADENA', 'Cadena', 'Joyería', 'Cadena de joyería'),
  ('PT-DIJE', 'Dije', 'Joyería', 'Dije o colgante'),
  ('PT-PULSERA', 'Pulsera', 'Joyería', 'Pulsera de joyería'),
  ('PT-ARETES', 'Aretes', 'Joyería', 'Par de aretes');

ALTER TABLE "ProductionItem" ADD COLUMN "productTypeId" TEXT;
-- Los registros preexistentes eran anillos y se conservan como tal.
UPDATE "ProductionItem" SET "productTypeId" = 'PT-ANILLO' WHERE "productTypeId" IS NULL;
ALTER TABLE "ProductionItem" ALTER COLUMN "productTypeId" SET NOT NULL;
ALTER TABLE "ProductionItem" ADD CONSTRAINT "ProductionItem_productTypeId_fkey"
  FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
