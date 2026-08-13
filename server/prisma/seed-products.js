// Idempotent product catalog seed — loaded from products-data.json.
// Each product is upserted by (name + category), so re-running is safe:
// - New rows are inserted.
// - Existing rows have their description/subDescription/unit refreshed.
// - Nothing is deleted, so any operator-added products are preserved.
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureDefaultGrade(productId) {
  // Every product needs at least one QualityGrade so clients can add it to
  // their cart. If ANY grade already exists (whether operator-added or a
  // previously-seeded default), leave it alone.
  const existing = await prisma.qualityGrade.findFirst({
    where: { productId },
    select: { id: true },
  });
  if (existing) return { added: false };

  await prisma.qualityGrade.create({
    data: {
      productId,
      grade: 'A',
      clientFacingGrade: 'QUALITY_A',
      currentStock: 0,
      price: 0,
    },
  });
  return { added: true };
}

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
  let gradesAdded = 0;

  for (const p of products) {
    // Prisma's Product model has no compound unique on (name, category), so
    // we do findFirst + upsert-by-id manually.
    let existing = await prisma.product.findFirst({
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
      const fresh = await prisma.product.create({
        data: {
          name: p.name,
          description: p.description ?? null,
          subDescription: p.subDescription ?? null,
          category: p.category,
          unit: p.unit,
          isActive: true,
        },
        select: { id: true },
      });
      existing = fresh;
      created++;
    }

    // Ensure at least one quality grade exists so clients can order it.
    const g = await ensureDefaultGrade(existing.id);
    if (g.added) gradesAdded++;
  }

  console.log(`[SeedProducts] Done. Created ${created}, updated ${updated}, default grades added ${gradesAdded}.`);
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
