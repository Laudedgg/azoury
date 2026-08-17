const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /inventory/counts
async function listCounts(req, res, next) {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      prisma.inventoryCount.findMany({
        where,
        include: {
          createdBy: { select: { firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.inventoryCount.count({ where }),
    ]);
    res.json({ data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
}

// POST /inventory/counts   { notes? }
// Starts a fresh DRAFT count. Items are added separately.
async function createCount(req, res, next) {
  try {
    const { notes } = req.body || {};
    const count = await prisma.inventoryCount.create({
      data: {
        notes: notes || null,
        createdById: req.user.id,
      },
    });
    res.status(201).json(count);
  } catch (error) {
    next(error);
  }
}

// GET /inventory/counts/:id
async function getCount(req, res, next) {
  try {
    const count = await prisma.inventoryCount.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
            qualityGrade: { select: { id: true, grade: true, clientFacingGrade: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!count) return res.status(404).json({ error: 'Count not found.' });
    res.json(count);
  } catch (error) {
    next(error);
  }
}

// POST /inventory/counts/:id/items   { qualityGradeIds: [...] }
// Adds new lines to a DRAFT count. For each grade we snapshot current stock
// as systemCount so the count is authoritative for the moment it was started.
async function addCountItems(req, res, next) {
  try {
    const count = await prisma.inventoryCount.findUnique({
      where: { id: req.params.id },
    });
    if (!count) return res.status(404).json({ error: 'Count not found.' });
    if (count.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Can only add items to a DRAFT count.' });
    }
    const { qualityGradeIds } = req.body || {};
    if (!Array.isArray(qualityGradeIds) || qualityGradeIds.length === 0) {
      return res.status(400).json({ error: 'qualityGradeIds array required.' });
    }

    // Snapshot current stock per grade
    const grades = await prisma.qualityGrade.findMany({
      where: { id: { in: qualityGradeIds } },
    });

    // Skip grades already in this count
    const existing = await prisma.inventoryCountItem.findMany({
      where: { countId: count.id, qualityGradeId: { in: qualityGradeIds } },
      select: { qualityGradeId: true },
    });
    const alreadyIn = new Set(existing.map((e) => e.qualityGradeId));

    const toInsert = grades
      .filter((g) => !alreadyIn.has(g.id))
      .map((g) => ({
        countId: count.id,
        productId: g.productId,
        qualityGradeId: g.id,
        systemCount: g.currentStock,
      }));
    if (toInsert.length > 0) {
      await prisma.inventoryCountItem.createMany({ data: toInsert });
    }

    const refreshed = await prisma.inventoryCount.findUnique({
      where: { id: count.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
            qualityGrade: { select: { id: true, grade: true, clientFacingGrade: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    res.json(refreshed);
  } catch (error) {
    next(error);
  }
}

// PATCH /inventory/counts/:id/items/:itemId   { physicalCount, notes? }
async function updateCountItem(req, res, next) {
  try {
    const item = await prisma.inventoryCountItem.findUnique({
      where: { id: req.params.itemId },
      include: { count: true },
    });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (item.count.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Cannot edit a submitted count.' });
    }
    const { physicalCount, notes } = req.body || {};
    const updated = await prisma.inventoryCountItem.update({
      where: { id: item.id },
      data: {
        physicalCount: physicalCount != null ? Number(physicalCount) : null,
        notes: notes === undefined ? item.notes : notes,
      },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

// DELETE /inventory/counts/:id/items/:itemId
async function removeCountItem(req, res, next) {
  try {
    const item = await prisma.inventoryCountItem.findUnique({
      where: { id: req.params.itemId },
      include: { count: true },
    });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    if (item.count.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Cannot edit a submitted count.' });
    }
    await prisma.inventoryCountItem.delete({ where: { id: item.id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

// POST /inventory/counts/:id/submit
// Locks the count, computes adjustments, generates ADJUSTMENT movements, and
// updates each grade's currentStock to the physical count.
async function submitCount(req, res, next) {
  try {
    const count = await prisma.inventoryCount.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!count) return res.status(404).json({ error: 'Count not found.' });
    if (count.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Count already submitted.' });
    }
    const linesToApply = count.items.filter((i) => i.physicalCount != null);
    if (linesToApply.length === 0) {
      return res.status(400).json({ error: 'No items have a physical count entered.' });
    }

    await prisma.$transaction(async (tx) => {
      for (const line of linesToApply) {
        const adjustment = Number(line.physicalCount) - Number(line.systemCount);
        await tx.inventoryCountItem.update({
          where: { id: line.id },
          data: { adjustment },
        });
        // Only create a movement + update stock if there's an actual delta
        if (adjustment !== 0) {
          await tx.inventoryMovement.create({
            data: {
              productId: line.productId,
              qualityGradeId: line.qualityGradeId,
              type: 'ADJUSTMENT',
              quantity: Math.abs(adjustment),
              reference: `Count ${count.id.slice(0, 8)}`,
              notes: `Cycle count reconciliation${line.notes ? ' — ' + line.notes : ''}`,
              createdById: req.user.id,
            },
          });
          await tx.qualityGrade.update({
            where: { id: line.qualityGradeId },
            data: { currentStock: Number(line.physicalCount) },
          });
        }
      }
      await tx.inventoryCount.update({
        where: { id: count.id },
        data: { status: 'SUBMITTED', submittedAt: new Date() },
      });
      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'SUBMIT_INVENTORY_COUNT',
          entityType: 'InventoryCount',
          entityId: count.id,
          metadata: { itemCount: linesToApply.length },
        },
      });
    });

    const refreshed = await prisma.inventoryCount.findUnique({
      where: { id: count.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
            qualityGrade: { select: { id: true, grade: true, clientFacingGrade: true } },
          },
        },
      },
    });
    res.json(refreshed);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCounts,
  createCount,
  getCount,
  addCountItems,
  updateCountItem,
  removeCountItem,
  submitCount,
};
