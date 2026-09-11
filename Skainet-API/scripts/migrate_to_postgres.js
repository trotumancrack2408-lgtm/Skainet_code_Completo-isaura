const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const SNAPSHOT_PATH = path.join(__dirname, '..', 'backups', 'migration_snapshot.json');

async function exportSqliteData() {
  console.log('🔄 [PASO 1] Leyendo y exportando datos desde SQLite (dev.db)...');

  try {
    const data = {
      users: await prisma.user.findMany(),
      materials: await prisma.material.findMany(),
      batches: await prisma.batch.findMany(),
      rings: await prisma.ring.findMany(),
      workOrders: await prisma.workOrder.findMany(),
      clientOrders: await prisma.clientOrder.findMany(),
      machines: await prisma.machine.findMany(),
      alerts: await prisma.alert.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      kardexMovements: await prisma.kardexMovement.findMany(),
      phaseTimeLogs: await prisma.phaseTimeLog.findMany(),
      tripleWeightLogs: await prisma.tripleWeightLog.findMany(),
    };

    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, 2));

    console.log('✅ Datos exportados exitosamente a snapshot JSON:');
    console.log(`   - Archivo: ${SNAPSHOT_PATH}`);
    console.log(`   - Usuarios: ${data.users.length}`);
    console.log(`   - Materiales: ${data.materials.length}`);
    console.log(`   - Lotes: ${data.batches.length}`);
    console.log(`   - Anillos: ${data.rings.length}`);
    console.log(`   - Órdenes de Trabajo: ${data.workOrders.length}`);
    console.log(`   - Movimientos Kardex: ${data.kardexMovements.length}`);
    console.log(`   - Logs de Auditoría: ${data.auditLogs.length}`);
  } catch (error) {
    console.error('❌ Error exportando datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportSqliteData();
