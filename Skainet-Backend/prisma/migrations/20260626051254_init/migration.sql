-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Fuera de Turno',
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "lastLogin" TIMESTAMP(3),
    "history" JSONB NOT NULL DEFAULT '[]',
    "securityQuestions" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "entryWeight" DOUBLE PRECISION NOT NULL,
    "exitWeight" DOUBLE PRECISION NOT NULL,
    "ringsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ring" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "securePin" TEXT NOT NULL DEFAULT '0000',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchId" TEXT NOT NULL,

    CONSTRAINT "Ring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "ringId" TEXT NOT NULL,
    "ringName" TEXT NOT NULL,
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
    "weights" JSONB NOT NULL,
    "providedPin" TEXT NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "ClientOrder_shortId_key" ON "ClientOrder"("shortId");

-- AddForeignKey
ALTER TABLE "Ring" ADD CONSTRAINT "Ring_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
