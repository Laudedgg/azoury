const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function recordWaste(req, res, next) {
  try {
    const { productId, qualityGradeId, quantity, wasteType, reason, cost } = req.body;

    if (!productId || !qualityGradeId || !quantity || !wasteType || !reason) {
      return res.status(400).json({
        error: 'productId, qualityGradeId, quantity, wasteType, and reason are required',
      });
    }

    const waste = await prisma.$transaction(async (tx) => {
      const entry = await tx.wasteEntry.create({
        data: {
          productId,
          qualityGradeId,
          quantity,
          wasteType,
          reason,
          cost: cost || 0,
          createdById: req.user.id,
        },
      });

      // Reduce stock
      const grade = await tx.qualityGrade.findUnique({
        where: { id: qualityGradeId },
      });

      await tx.qualityGrade.update({
        where: { id: qualityGradeId },
        data: { currentStock: Math.max(0, grade.currentStock - quantity) },
      });

      // Create inventory movement
      await tx.inventoryMovement.create({
        data: {
          productId,
          qualityGradeId,
          type: 'WASTE',
          quantity,
          reference: `Waste: ${wasteType}`,
          notes: reason,
          createdById: req.user.id,
        },
      });

      return entry;
    });

    const result = await prisma.wasteEntry.findUnique({
      where: { id: waste.id },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        qualityGrade: { select: { id: true, grade: true, currentStock: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'RECORD_WASTE',
        entityType: 'WasteEntry',
        entityId: waste.id,
        metadata: { productId, quantity, wasteType, cost },
      },
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function listWaste(req, res, next) {
  try {
    const { wasteType, productId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (wasteType) where.wasteType = wasteType;
    if (productId) where.productId = productId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      prisma.wasteEntry.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          qualityGrade: { select: { id: true, grade: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          authorizedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.wasteEntry.count({ where }),
    ]);

    res.json({
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function authorizeWaste(req, res, next) {
  try {
    const waste = await prisma.wasteEntry.update({
      where: { id: req.params.id },
      data: { authorizedById: req.user.id },
      include: {
        product: { select: { id: true, name: true } },
        authorizedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({ message: 'Waste entry authorized', waste });
  } catch (error) {
    next(error);
  }
}

async function getWasteAnalytics(req, res, next) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [daily, weekly, monthly, byType, byProduct] = await Promise.all([
      prisma.wasteEntry.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { quantity: true, cost: true },
        _count: { id: true },
      }),
      prisma.wasteEntry.aggregate({
        where: { createdAt: { gte: weekStart } },
        _sum: { quantity: true, cost: true },
        _count: { id: true },
      }),
      prisma.wasteEntry.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { quantity: true, cost: true },
        _count: { id: true },
      }),
      prisma.wasteEntry.groupBy({
        by: ['wasteType'],
        where: { createdAt: { gte: monthStart } },
        _sum: { quantity: true, cost: true },
        _count: { id: true },
      }),
      prisma.wasteEntry.groupBy({
        by: ['productId'],
        where: { createdAt: { gte: monthStart } },
        _sum: { quantity: true, cost: true },
        _count: { id: true },
        orderBy: { _sum: { cost: 'desc' } },
        take: 10,
      }),
    ]);

    // Get product names for top waste products
    const productIds = byProduct.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, unit: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    res.json({
      daily: {
        totalQuantity: daily._sum.quantity || 0,
        totalCost: daily._sum.cost || 0,
        count: daily._count.id,
      },
      weekly: {
        totalQuantity: weekly._sum.quantity || 0,
        totalCost: weekly._sum.cost || 0,
        count: weekly._count.id,
      },
      monthly: {
        totalQuantity: monthly._sum.quantity || 0,
        totalCost: monthly._sum.cost || 0,
        count: monthly._count.id,
      },
      byType: byType.map((t) => ({
        wasteType: t.wasteType,
        totalQuantity: t._sum.quantity || 0,
        totalCost: t._sum.cost || 0,
        count: t._count.id,
      })),
      topWasteProducts: byProduct.map((p) => ({
        product: productMap.get(p.productId),
        totalQuantity: p._sum.quantity || 0,
        totalCost: p._sum.cost || 0,
        count: p._count.id,
      })),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  recordWaste,
  listWaste,
  authorizeWaste,
  getWasteAnalytics,
};
