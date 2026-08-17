const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// GET /pricing/grades?clientId=&category=
// Returns every QualityGrade with its default sell price + cost price, plus
// the effective client-specific price if a clientId is given.
async function listGradePricing(req, res, next) {
  try {
    const { clientId, category } = req.query;

    const whereGrade = category ? { product: { category } } : {};
    const grades = await prisma.qualityGrade.findMany({
      where: whereGrade,
      include: {
        product: { select: { id: true, name: true, unit: true, category: true } },
      },
      orderBy: [{ product: { name: 'asc' } }, { grade: 'asc' }],
    });

    let clientOverrides = new Map();
    if (clientId) {
      const now = new Date();
      const rows = await prisma.clientPrice.findMany({
        where: {
          clientId,
          effectiveFrom: { lte: now },
          OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
        },
        orderBy: { effectiveFrom: 'desc' },
      });
      // Keep only the newest active row per grade
      for (const r of rows) {
        if (!clientOverrides.has(r.qualityGradeId)) {
          clientOverrides.set(r.qualityGradeId, r);
        }
      }
    }

    const result = grades.map((g) => {
      const override = clientOverrides.get(g.id);
      return {
        gradeId: g.id,
        product: g.product,
        grade: g.grade,
        clientFacingGrade: g.clientFacingGrade,
        currentStock: g.currentStock,
        costPrice: g.costPrice ?? null,
        defaultSellPrice: g.price ?? 0,
        clientSellPrice: override?.sellPrice ?? null,
        effectiveSellPrice: override?.sellPrice ?? g.price ?? 0,
        overrideId: override?.id ?? null,
        overrideEffectiveFrom: override?.effectiveFrom ?? null,
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
}

// PATCH /pricing/grades/:gradeId  { costPrice, sellPrice }
async function updateGradePricing(req, res, next) {
  try {
    const { gradeId } = req.params;
    const { costPrice, sellPrice } = req.body;

    const data = {};
    if (costPrice !== undefined) data.costPrice = Number(costPrice);
    if (sellPrice !== undefined) data.price = Number(sellPrice);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Provide costPrice and/or sellPrice.' });
    }

    const grade = await prisma.qualityGrade.update({
      where: { id: gradeId },
      data,
      include: { product: { select: { id: true, name: true, unit: true } } },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_GRADE_PRICING',
        entityType: 'QualityGrade',
        entityId: grade.id,
        metadata: { costPrice: grade.costPrice, sellPrice: grade.price },
      },
    });

    res.json(grade);
  } catch (error) {
    next(error);
  }
}

// POST /pricing/client/:clientId  { qualityGradeId, sellPrice, effectiveFrom?, effectiveTo?, notes? }
async function setClientPriceOverride(req, res, next) {
  try {
    const { clientId } = req.params;
    const { qualityGradeId, sellPrice, effectiveFrom, effectiveTo, notes } = req.body;

    if (!qualityGradeId || sellPrice == null) {
      return res.status(400).json({ error: 'qualityGradeId and sellPrice required.' });
    }

    // Close out any currently-active override on this grade for this client
    const now = new Date();
    await prisma.clientPrice.updateMany({
      where: {
        clientId,
        qualityGradeId,
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      data: { effectiveTo: now },
    });

    const row = await prisma.clientPrice.create({
      data: {
        clientId,
        qualityGradeId,
        sellPrice: Number(sellPrice),
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : now,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        notes: notes || null,
        createdById: req.user.id,
      },
    });

    res.status(201).json(row);
  } catch (error) {
    next(error);
  }
}

// GET /pricing/client/:clientId
async function listClientPriceOverrides(req, res, next) {
  try {
    const { clientId } = req.params;
    const rows = await prisma.clientPrice.findMany({
      where: { clientId },
      include: {
        qualityGrade: {
          include: { product: { select: { id: true, name: true, unit: true } } },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

// DELETE /pricing/client/:clientId/override/:overrideId
async function removeClientPriceOverride(req, res, next) {
  try {
    const { overrideId } = req.params;
    await prisma.clientPrice.delete({ where: { id: overrideId } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listGradePricing,
  updateGradePricing,
  setClientPriceOverride,
  listClientPriceOverrides,
  removeClientPriceOverride,
};
