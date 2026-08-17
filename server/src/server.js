require('dotenv').config();

const path = require('path');
const { execSync } = require('child_process');
const { server } = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

function runBootMigrate() {
  if (process.env.SKIP_BOOT_MIGRATE === 'true') {
    console.log('[BootMigrate] SKIP_BOOT_MIGRATE=true, skipping.');
    return;
  }
  try {
    console.log('[BootMigrate] Applying prisma schema (db push)...');
    execSync('npx prisma db push --accept-data-loss --skip-generate', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      env: process.env,
    });
    console.log('[BootMigrate] Schema in sync.');
  } catch (e) {
    // Log but keep going — server can still start on the existing schema.
    console.error('[BootMigrate] Failed (continuing):', e.message);
  }
}

async function runBootSeed() {
  if (process.env.SKIP_BOOT_SEED === 'true') {
    console.log('[BootSeed] SKIP_BOOT_SEED=true, skipping.');
    return;
  }
  try {
    const seedBoot = require(path.join(__dirname, '..', 'prisma', 'seed-boot'));
    await seedBoot.main();
  } catch (e) {
    // Never crash the server if the seed fails; just log it and continue.
    console.error('[BootSeed] Failed (continuing to start server):', e.message);
  }
}

async function main() {
  try {
    runBootMigrate();

    await prisma.$connect();
    console.log('[Database] Connected to PostgreSQL');

    await runBootSeed();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] Azoury API running on http://0.0.0.0:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Server] Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Server] Received SIGTERM, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

main();
