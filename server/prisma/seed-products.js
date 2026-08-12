// Idempotent product catalog seed — loaded from products-data.json.
// Each product is upserted by (name + category), so re-running is safe:
// - New rows are inserted.
// - Existing rows have their description/subDescription/unit refreshed.
// - Nothing is deleted, so any operator-added products are preserved.
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, 'products-data.json');
  if (!fs.existsSync(dataPath)) {
    console.log('[SeedProducts] products-data.json not found, skipping.');
    return;
  }
  const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`[SeedProducts] Ensuring ${products.length} products in catalog...`);

  let created = 0;
  let updated = 0;

  for (const p of products) {
    // Look up first — Prisma's Product model doesn't have a compound unique
    // key on (name, category), so we do a manual findFirst + upsert-by-id.
    const existing = await prisma.product.findFirst({
      where: { name: p.name, category: p.category },
      select: { id: true },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: p.description ?? null,
          subDescription: p.subDescription ?? null,
          unit: p.unit,
          isActive: true,
        },
      });
      updated++;
    } else {
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description ?? null,
          subDescription: p.subDescription ?? null,
          category: p.category,
          unit: p.unit,
          isActive: true,
        },
      });
      created++;
    }
  }

  console.log(`[SeedProducts] Done. Created ${created}, updated ${updated}.`);
}

module.exports = { main };

// Also runnable directly: `node prisma/seed-products.js`
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('[SeedProducts] Failed:', e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
