const { PrismaClient } = require('@prisma/client');
const notificationService = require('../services/notificationService');

const prisma = new PrismaClient();

const LOW_STOCK_THRESHOLD = 10;

async function getStockLevels(req, res, next) {
  try {
    const { productId, category, belowThreshold } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (category) where.product = { category };

    let grades = await prisma.qualityGrade.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, unit: true, category: true } },
      },
      orderBy: [{ product: { name: 'asc' } }, { grade: 'asc' }],
    });

    if (belowThreshold === 'true') {
      grades = grades.filter((g) => g.currentStock < LOW_STOCK_THRESHOLD);
    }

    // Compute TODAY's aggregate movements per grade so the frontend can show
    // a live "opening → +receipts −sales −waste = current" picture.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const movesToday = await prisma.inventoryMovement.groupBy({
      by: ['qualityGradeId', 'type'],
      where: { createdAt: { gte: todayStart } },
      _sum: { quantity: true },
    });

    const perGradeToday = {}; // qualityGradeId -> { received, sold, wasted, returned, adjusted }
    for (const row of movesToday) {
      const bucket = (perGradeToday[row.qualityGradeId] ||= {
        received: 0, sold: 0, wasted: 0, returned: 0, adjusted: 0,
      });
      const q = row._sum.quantity || 0;
      if (row.type === 'PURCHASE_IN') bucket.received += q;
      else if (row.type === 'SALE_OUT') bucket.sold += q;
      else if (row.type === 'WASTE')   bucket.wasted += q;
      else if (row.type === 'RETURN')  bucket.returned += q;
      else if (row.type === 'ADJUSTMENT') bucket.adjusted += q;
    }

    // Group by product
    const byProduct = {};
    for (const grade of grades) {
      const today = perGradeToday[grade.id] || { received: 0, sold: 0, wasted: 0, returned: 0, adjusted: 0 };
      const netToday = today.received + today.returned - today.sold - today.wasted;
      const openingStock = Math.max(0, grade.currentStock - netToday);

      if (!byProduct[grade.productId]) {
        byProduct[grade.productId] = {
          product: grade.product,
          grades: [],
          totalStock: 0,
          openingStock: 0,
          receivedToday: 0,
          soldToday: 0,
          wastedToday: 0,
        };
      }
      byProduct[grade.productId].grades.push({
        id: grade.id,
        grade: grade.grade,
        clientFacingGrade: grade.clientFacingGrade,
        currentStock: grade.currentStock,
        price: grade.price,
        isLow: grade.currentStock < LOW_STOCK_THRESHOLD,
        openingStock,
        today,
        netToday,
      });
      byProduct[grade.productId].totalStock += grade.currentStock;
      byProduct[grade.productId].openingStock += openingStock;
      byProduct[grade.productId].receivedToday += today.received;
      byProduct[grade.productId].soldToday += today.sold;
      byProduct[grade.productId].wastedToday += today.wasted;
    }

    res.json(Object.values(byProduct));
  } catch (error) {
    next(error);
  }
}

async function recordMovement(req, res, next) {
  try {
    const { productId, qualityGradeId, type, quantity, reference, notes } = req.body;

    if (!productId || !qualityGradeId || !type || quantity == null) {
      return res.status(400).json({ error: 'productId, qualityGradeId, type, and quantity are required' });
    }

    const movement = await prisma.$transaction(async (tx) => {
      const mov = await tx.inventoryMovement.create({
        data: {
          productId,
          qualityGradeId,
          type,
          quantity,
          reference,
          notes,
          createdById: req.user.id,
        },
      });

      // Update stock level
      const grade = await tx.qualityGrade.findUnique({
        where: { id: qualityGradeId },
      });

      let newStock = grade.currentStock;
      if (['PURCHASE_IN', 'RETURN'].includes(type)) {
        newStock += quantity;
      } else if (['SALE_OUT', 'WASTE'].includes(type)) {
        newStock -= quantity;
      } else if (type === 'ADJUSTMENT') {
        newStock = quantity; // Absolute adjustment
      }

      newStock = Math.max(0, newStock);

      await tx.qualityGrade.update({
        where: { id: qualityGradeId },
        data: { currentStock: newStock },
      });

      // Check for low stock
      if (newStock < LOW_STOCK_THRESHOLD) {
        const product = await tx.product.findUnique({ where: { id: productId } });
        notificationService.lowStockAlert(product, { ...grade, currentStock: newStock });
      }

      return mov;
    });

    const result = await prisma.inventoryMovement.findUnique({
      where: { id: movement.id },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        qualityGrade: { select: { id: true, grade: true, currentStock: true } },
      },
    });

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function getMovementHistory(req, res, next) {
  try {
    const { productId, qualityGradeId, type, startDate, endDate, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (productId) where.productId = productId;
    if (qualityGradeId) where.qualityGradeId = qualityGradeId;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          qualityGrade: { select: { id: true, grade: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    res.json({
      data: movements,
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

async function createSpotCheck(req, res, next) {
  try {
    const { productId, qualityGradeId, physicalCount } = req.body;

    const grade = await prisma.qualityGrade.findUnique({
      where: { id: qualityGradeId },
    });

    if (!grade) {
      return res.status(404).json({ error: 'Quality grade not found' });
    }

    const discrepancy = physicalCount - grade.currentStock;

    const spotCheck = await prisma.spotCheck.create({
      data: {
        productId,
        qualityGradeId,
        systemCount: grade.currentStock,
        physicalCount,
        discrepancy,
        checkedById: req.user.id,
      },
      include: {
        product: { select: { id: true, name: true } },
        qualityGrade: { select: { id: true, grade: true } },
        checkedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'SPOT_CHECK',
        entityType: 'SpotCheck',
        entityId: spotCheck.id,
        metadata: { discrepancy, productId, qualityGradeId },
      },
    });

    res.status(201).json(spotCheck);
  } catch (error) {
    next(error);
  }
}

async function listSpotChecks(req, res, next) {
  try {
    const { productId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (productId) where.productId = productId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [checks, total] = await Promise.all([
      prisma.spotCheck.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          qualityGrade: { select: { id: true, grade: true } },
          checkedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.spotCheck.count({ where }),
    ]);

    res.json({
      data: checks,
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

async function getLowStockAlerts(req, res, next) {
  try {
    const threshold = parseInt(req.query.threshold) || LOW_STOCK_THRESHOLD;

    const lowStockGrades = await prisma.qualityGrade.findMany({
      where: { currentStock: { lt: threshold } },
      include: {
        product: { select: { id: true, name: true, unit: true, category: true } },
      },
      orderBy: { currentStock: 'asc' },
    });

    res.json(lowStockGrades);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStockLevels,
  recordMovement,
  getMovementHistory,
  createSpotCheck,
  listSpotChecks,
  getLowStockAlerts,
};
