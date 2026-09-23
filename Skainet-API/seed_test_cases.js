const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding usability test case data...');

  // 1. Create or update Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { id: '1000100010' },
    update: {
      name: 'Super Administrador Prueba',
      role: 'Super Administrador',
      status: 'Disponible',
      accountStatus: 'Activo',
      password: 'Skainet#2026',
      email: 'superadmin.prueba@skainet.com',
      phone: '+573001234567',
      mustChangePassword: true,
    },
    create: {
      id: '1000100010',
      documentType: 'CC',
      name: 'Super Administrador Prueba',
      role: 'Super Administrador',
      status: 'Disponible',
      accountStatus: 'Activo',
      password: 'Skainet#2026',
      email: 'superadmin.prueba@skainet.com',
      phone: '+573001234567',
      mustChangePassword: true,
      history: '[]',
      securityQuestions: '[]',
    },
  });
  console.log('Super Admin user seeded/updated');

  // 2. Create or update Admin
  const admin = await prisma.user.upsert({
    where: { id: '2000200020' },
    update: {
      name: 'Administrador Prueba',
      role: 'Administrador',
      status: 'Disponible',
      accountStatus: 'Activo',
      password: 'Skainet#2026',
      email: 'admin.prueba@skainet.com',
      phone: '+573001234568',
      mustChangePassword: true,
    },
    create: {
      id: '2000200020',
      documentType: 'CC',
      name: 'Administrador Prueba',
      role: 'Administrador',
      status: 'Disponible',
      accountStatus: 'Activo',
      password: 'Skainet#2026',
      email: 'admin.prueba@skainet.com',
      phone: '+573001234568',
      mustChangePassword: true,
      history: '[]',
      securityQuestions: '[]',
    },
  });
  console.log('Admin user seeded/updated');

  // 3. Create or update Joyero
  const joyero = await prisma.user.upsert({
    where: { id: '3000300030' },
    update: {
      name: 'Joyero Prueba',
      role: 'Joyero',
      status: 'Disponible',
      accountStatus: 'Activo',
      password: '123',
      email: 'joyero.prueba@skainet.com',
      phone: '+573001234569',
      mustChangePassword: false,
    },
    create: {
      id: '3000300030',
      documentType: 'CC',
      name: 'Joyero Prueba',
      role: 'Joyero',
      status: 'Disponible',
      accountStatus: 'Activo',
      password: '123',
      email: 'joyero.prueba@skainet.com',
      phone: '+573001234569',
      mustChangePassword: false,
      history: '[]',
      securityQuestions: '[]',
    },
  });
  console.log('Joyero user seeded/updated');

  // 4. Create or update Material: Oro 18k
  // We check if "Oro 18k" material exists.
  let material = await prisma.material.findFirst({
    where: { name: 'Oro 18k', status: 'Activo' },
  });

  if (!material) {
    material = await prisma.material.create({
      data: {
        name: 'Oro 18k',
        category: 'Metal precioso',
        unit: 'Gramos',
        stock: 150,
        minStock: 20,
        status: 'Activo',
      },
    });
    console.log('Material "Oro 18k" seeded');
  } else {
    // Ensure stock and other fields match expected start
    material = await prisma.material.update({
      where: { id: material.id },
      data: {
        category: 'Metal precioso',
        unit: 'Gramos',
        stock: 150,
        minStock: 20,
        status: 'Activo',
      },
    });
    console.log('Material "Oro 18k" updated to 150g stock');
  }

  // 5. Ensure Batch and ProductionItem exist for work order
  // Batch B-102 must exist
  let batch = await prisma.batch.findUnique({
    where: { id: 'B-102' },
  });
  if (!batch) {
    batch = await prisma.batch.create({
      data: {
        id: 'B-102',
        entryWeight: 180.00,
        exitWeight: 176.80,
        itemsCount: 3,
      },
    });
  }

  let productionItem = await prisma.productionItem.findUnique({
    where: { id: 'B-102-P3' },
  });
  if (!productionItem) {
    productionItem = await prisma.productionItem.create({
      data: {
        id: 'B-102-P3',
        name: 'Cadena 3',
        status: 'PENDING',
        securePin: '8888',
        batchId: 'B-102',
        productTypeId: 'PT-CADENA',
      },
    });
  }

  // 6. Create or update WorkOrder OT-000123
  const workOrder = await prisma.workOrder.upsert({
    where: { id: 'OT-000123' },
    update: {
      productionItemId: 'B-102-P3',
      productionItemName: 'Cadena 3 (Lote B-102)',
      receiverId: '2000200020',
      executorId: '3000300030',
      totalWeight: 10.5,
      status: 'OPEN',
      weights: JSON.stringify({ anillo: 8.5, plastilina: 1.2, bolsa: 0.8 }),
      providedPin: '8888',
    },
    create: {
      id: 'OT-000123',
      productionItemId: 'B-102-P3',
      productionItemName: 'Cadena 3 (Lote B-102)',
      receiverId: '2000200020',
      executorId: '3000300030',
      totalWeight: 10.5,
      status: 'OPEN',
      weights: JSON.stringify({ anillo: 8.5, plastilina: 1.2, bolsa: 0.8 }),
      providedPin: '8888',
    },
  });
  console.log('Work Order OT-000123 seeded/updated');

  console.log('All usability test case data successfully seeded!');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
