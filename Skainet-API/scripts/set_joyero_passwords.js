const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: 'Joyero' },
    data: {
      password: '123',
      mustChangePassword: false,
    },
  });
  console.log(`✅ Contraseñas actualizadas a "123" para ${result.count} usuarios Joyero.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
