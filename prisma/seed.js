/**
 * Seed optionnel – crée un admin de test
 * Usage: npm run db:seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@lookforhome.com';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const hashed = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        name: 'Admin LookForHome',
        firstName: 'Super',
        email: adminEmail,
        password: hashed,
        gender: 'HOMME',
        whatsapp: '+237600000000',
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin créé : admin@lookforhome.com / admin123');
  } else {
    console.log('ℹ️  Admin déjà existant');
  }

  // Settings
  const settings = await prisma.setting.findFirst();
  if (!settings) {
    await prisma.setting.create({
      data: {
        defaultVisitPrice: 2000,
        supportWhatsapp: '+2376XXXXXXXX',
        supportSms: '+2376XXXXXXXX',
        adminCode: 'LFH-ADMIN-2026',
      },
    });
    console.log('✅ Settings créés');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
