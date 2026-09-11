const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const SNAPSHOT_PATH = path.join(__dirname, '..', 'backups', 'migration_snapshot.json');

async function importToPostgres() {
  console.log('🚀 Iniciando proceso de carga a PostgreSQL...');

  if (!fs.existsSync(SNAPSHOT_PATH)) {
    console.error(`❌ Error: No se encontró el archivo de datos ${SNAPSHOT_PATH}. Ejecuta primero node scripts/migrate_to_postgres.js`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
  const prisma = new PrismaClient();

  try {
    console.log('🔄 Limpiando e insertando datos en PostgreSQL respetando relaciones...');

    // 1. Usuarios
    if (data.users && data.users.length > 0) {
      for (const u of data.users) {
        await prisma.user.upsert({
          where: { id: u.id },
          update: u,
          create: u,
        });
      }
      console.log(`✅ ${data.users.length} usuarios cargados en PostgreSQL.`);
    }

    // 2. Materiales
    if (data.materials && data.materials.length > 0) {
      for (const m of data.materials) {
        await prisma.material.upsert({
          where: { id: m.id },
          update: m,
          create: m,
        });
      }
      console.log(`✅ ${data.materials.length} materiales cargados.`);
    }

    // 3. Lotes
    if (data.batches && data.batches.length > 0) {
      for (const b of data.batches) {
        await prisma.batch.upsert({
          where: { id: b.id },
          update: b,
          create: b,
        });
      }
      console.log(`✅ ${data.batches.length} lotes cargados.`);
    }

    // 4. Anillos
    if (data.rings && data.rings.length > 0) {
      for (const r of data.rings) {
        await prisma.ring.upsert({
          where: { id: r.id },
          update: r,
          create: r,
        });
      }
      console.log(`✅ ${data.rings.length} anillos cargados.`);
    }

    // 5. Órdenes de Trabajo
    if (data.workOrders && data.workOrders.length > 0) {
      for (const wo of data.workOrders) {
        await prisma.workOrder.upsert({
          where: { id: wo.id },
          update: wo,
          create: wo,
        });
      }
      console.log(`✅ ${data.workOrders.length} órdenes de trabajo cargadas.`);
    }

    // 6. Auditoría
    if (data.auditLogs && data.auditLogs.length > 0) {
      for (const log of data.auditLogs) {
        await prisma.auditLog.upsert({
          where: { id: log.id },
          update: log,
          create: log,
        });
      }
      console.log(`✅ ${data.auditLogs.length} logs de auditoría cargados.`);
    }

    console.log('🎉 Migración completa hacia PostgreSQL finalizada exitosamente.');
  } catch (error) {
    console.error('❌ Error durante la carga a PostgreSQL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importToPostgres();
