// Idempotent boot-time seed: creates the 9 test accounts + one test client business.
// Safe to run on every startup — uses upsert so existing users aren't disturbed.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const staff = [
  { email: 'admin@afoodlebanon.com',      password: 'Admin@2026',      firstName: 'Super',     lastName: 'Admin',   role: 'SUPER_ADMIN' },
  { email: 'purchase@afoodlebanon.com',   password: 'Purchase@2026',   firstName: 'Purchase',  lastName: 'Manager', role: 'PURCHASE_MANAGER' },
  { email: 'operations@afoodlebanon.com', password: 'Operations@2026', firstName: 'Ops',       lastName: 'Manager', role: 'OPERATIONS_MANAGER' },
  { email: 'qc@afoodlebanon.com',         password: 'QC@2026',         firstName: 'Quality',   lastName: 'Control', role: 'QUALITY_COST_CONTROL' },
  { email: 'receiving@afoodlebanon.com',  password: 'Receiving@2026',  firstName: 'Receiving', lastName: 'Team',    role: 'RECEIVING' },
  { email: 'logistics@afoodlebanon.com',  password: 'Logistics@2026',  firstName: 'Logistics', lastName: 'Team',    role: 'LOGISTICS_TEAM' },
  { email: 'driver@afoodlebanon.com',     password: 'Driver@2026',     firstName: 'Test',      lastName: 'Driver',  role: 'DRIVER' },
  { email: 'accounting@afoodlebanon.com', password: 'Accounting@2026', firstName: 'Accounts',  lastName: 'Payable', role: 'ACCOUNTANT' },
];

async function main() {
  console.log('[SeedBoot] Ensuring 9 test accounts exist...');

  for (const u of staff) {
    const hashed = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashed,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        mustChangePassword: false,
        isActive: true,
      },
    });
    console.log('[SeedBoot]  ensured ' + u.email);
  }

  const clientBiz = await prisma.client.upsert({
    where: { email: 'testclient@afoodlebanon.com' },
    update: {},
    create: {
      businessName: 'Afood Test Kitchen',
      businessType: 'RESTAURANT',
      email: 'testclient@afoodlebanon.com',
      phone: '+96170000000',
      address: 'Beirut, Lebanon',
      contactPerson: 'Test Client',
      isApproved: true,
    },
  });

  const clientPwd = await bcrypt.hash('Client@2026', 12);
  await prisma.user.upsert({
    where: { email: 'testclient@afoodlebanon.com' },
    update: {},
    create: {
      email: 'testclient@afoodlebanon.com',
      password: clientPwd,
      firstName: 'Test',
      lastName: 'Client',
      role: 'CLIENT_ADMIN',
      clientId: clientBiz.id,
      mustChangePassword: false,
      isActive: true,
    },
  });
  console.log('[SeedBoot]  ensured testclient@afoodlebanon.com + Afood Test Kitchen');

  // Product catalog seed (from products-data.json). Idempotent.
  try {
    const seedProducts = require('./seed-products');
    await seedProducts.main();
  } catch (e) {
    console.error('[SeedBoot] Product seed failed (continuing):', e.message);
  }

  console.log('[SeedBoot] Done.');
}

module.exports = { main };

// Also runnable directly: `node prisma/seed-boot.js`
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('[SeedBoot] Failed:', e);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
