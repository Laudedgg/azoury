const { PrismaClient } = require('@prisma/client');
const { createPurchaseOrderSchema } = require('../utils/validators');

const prisma = new PrismaClient();

async function listSuppliers(req, res, next) {
  try {
    const { search, isActive, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { purchaseOrders: true, supplierRatings: true } },
        },
      }),
      prisma.supplier.count({ where }),
    ]);

    res.json({
      data: suppliers,
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

async function getSupplier(req, res, next) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { items: true } },
          },
        },
        supplierRatings: {
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            ratedBy: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { purchaseOrders: true, supplierRatings: true, priceSurveys: true } },
      },
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    next(error);
  }
}

async function createSupplier(req, res, next) {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    const supplier = await prisma.supplier.create({
      data: { name, contactPerson, email, phone, address },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_SUPPLIER',
        entityType: 'Supplier',
        entityId: supplier.id,
        metadata: { name },
      },
    });

    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
}

async function updateSupplier(req, res, next) {
  try {
    const { name, contactPerson, email, phone, address, isActive } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(contactPerson && { contactPerson }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(supplier);
  } catch (error) {
    next(error);
  }
}

async function deleteSupplier(req, res, next) {
  try {
    await prisma.supplier.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Supplier deactivated' });
  } catch (error) {
    next(error);
  }
}

async function getRatingsHistory(req, res, next) {
  try {
    const ratings = await prisma.supplierRating.findMany({
      where: { supplierId: req.params.id },
      orderBy: { date: 'desc' },
      include: {
        ratedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

    res.json({
      supplierId: req.params.id,
      averageRating: Math.round(avgRating * 100) / 100,
      totalRatings: ratings.length,
      ratings,
    });
  } catch (error) {
    next(error);
  }
}

async function addRating(req, res, next) {
  try {
    const { rating, notes, date } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const supplierRating = await prisma.supplierRating.create({
      data: {
        supplierId: req.params.id,
        ratedById: req.user.id,
        rating,
        notes,
        date: date ? new Date(date) : new Date(),
      },
    });

    // Update supplier average rating
    const allRatings = await prisma.supplierRating.findMany({
      where: { supplierId: req.params.id },
    });
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await prisma.supplier.update({
      where: { id: req.params.id },
      data: { rating: Math.round(avgRating * 100) / 100 },
    });

    res.status(201).json(supplierRating);
  } catch (error) {
    next(error);
  }
}

async function getPriceComparison(req, res, next) {
  try {
    const { productId, days = 30 } = req.query;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const surveys = await prisma.priceSurvey.findMany({
      where: {
        productId,
        surveyDate: { gte: since },
      },
      include: {
        supplier: { select: { id: true, name: true, rating: true } },
      },
      orderBy: { surveyDate: 'desc' },
    });

    // Group by supplier
    const bySupplier = {};
    for (const survey of surveys) {
      if (!bySupplier[survey.supplierId]) {
        bySupplier[survey.supplierId] = {
          supplier: survey.supplier,
          prices: [],
          avgPrice: 0,
          minPrice: Infinity,
          maxPrice: 0,
        };
      }
      bySupplier[survey.supplierId].prices.push({
        price: survey.price,
        date: survey.surveyDate,
      });
      bySupplier[survey.supplierId].minPrice = Math.min(
        bySupplier[survey.supplierId].minPrice,
        survey.price
      );
      bySupplier[survey.supplierId].maxPrice = Math.max(
        bySupplier[survey.supplierId].maxPrice,
        survey.price
      );
    }

    const comparison = Object.values(bySupplier).map((s) => ({
      ...s,
      avgPrice:
        Math.round(
          (s.prices.reduce((sum, p) => sum + p.price, 0) / s.prices.length) * 100
        ) / 100,
      minPrice: s.minPrice === Infinity ? 0 : s.minPrice,
    }));

    comparison.sort((a, b) => a.avgPrice - b.avgPrice);

    res.json(comparison);
  } catch (error) {
    next(error);
  }
}

// Purchase order endpoints
async function createPurchaseOrder(req, res, next) {
  try {
    const data = createPurchaseOrderSchema.parse(req.body);

    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const po = await prisma.purchaseOrder.create({
      data: {
        supplierId: data.supplierId || null,
        createdById: req.user.id,
        totalAmount: Math.round(totalAmount * 100) / 100,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
          },
        },
        supplier: { select: { id: true, name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_PURCHASE_ORDER',
        entityType: 'PurchaseOrder',
        entityId: po.id,
        metadata: { supplierId: data.supplierId, totalAmount: po.totalAmount },
      },
    });

    res.status(201).json(po);
  } catch (error) {
    next(error);
  }
}

async function listPurchaseOrders(req, res, next) {
  try {
    const { status, supplierId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    const { parseStatusFilter } = require('../utils/parseStatus');
    const sf = parseStatusFilter(status);
    if (sf !== undefined) where.status = sf;
    if (supplierId) where.supplierId = supplierId;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({
      data: orders,
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

async function getPurchaseOrder(req, res, next) {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                qualityGrades: { orderBy: { createdAt: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
    });
    if (!po) return res.status(404).json({ error: 'Purchase order not found' });
    res.json(po);
  } catch (error) {
    next(error);
  }
}

async function updatePurchaseOrderStatus(req, res, next) {
  try {
    const { status, items } = req.body;

    const existing = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: { include: { qualityGrades: { orderBy: { createdAt: 'asc' }, take: 1 } } } } },
      },
    });
    if (!existing) return res.status(404).json({ error: 'Purchase order not found' });

    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrder.update({
        where: { id: req.params.id },
        data: { status: status || existing.status },
      });

      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const po = existing.items.find((i) => i.id === item.id);
          if (!po) continue;
          const received = Number(item.receivedQuantity);
          if (!Number.isFinite(received) || received < 0) continue;

          const prior = po.receivedQuantity || 0;
          const delta = received - prior;

          await tx.purchaseItem.update({
            where: { id: item.id },
            data: {
              receivedQuantity: received,
              receivedWeight: item.receivedWeight !== undefined ? Number(item.receivedWeight) : received,
            },
          });

          if (delta !== 0 && po.product.qualityGrades.length > 0) {
            const grade = po.product.qualityGrades[0];
            await tx.qualityGrade.update({
              where: { id: grade.id },
              data: { currentStock: { increment: delta } },
            });
            await tx.inventoryMovement.create({
              data: {
                productId: po.productId,
                qualityGradeId: grade.id,
                type: 'PURCHASE_IN',
                quantity: delta,
                reference: `PO ${existing.id.slice(0, 8)}`,
                notes: 'Received against purchase order',
                createdById: req.user.id,
              },
            });
          }
        }
      }

      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          action: status === 'RECEIVED' ? 'RECEIVE_PURCHASE_ORDER' : 'UPDATE_PURCHASE_ORDER_STATUS',
          entityType: 'PurchaseOrder',
          entityId: existing.id,
          metadata: { status, itemCount: items?.length || 0 },
        },
      });
    });

    const refreshed = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, unit: true } } } },
      },
    });
    res.json(refreshed);
  } catch (error) {
    next(error);
  }
}

async function getPriceSurveys(req, res, next) {
  try {
    const { productId, supplierId, days = 30, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const where = { surveyDate: { gte: since } };
    if (productId) where.productId = productId;
    if (supplierId) where.supplierId = supplierId;

    const [surveys, total] = await Promise.all([
      prisma.priceSurvey.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { surveyDate: 'desc' },
        include: {
          supplier: { select: { id: true, name: true, rating: true } },
          product: { select: { id: true, name: true, unit: true } },
        },
      }),
      prisma.priceSurvey.count({ where }),
    ]);

    res.json({
      data: surveys,
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

async function createPriceSurvey(req, res, next) {
  try {
    const { supplierId, productId, price, surveyDate } = req.body;

    if (!supplierId || !productId || price == null) {
      return res.status(400).json({ error: 'supplierId, productId, and price are required' });
    }

    const survey = await prisma.priceSurvey.create({
      data: {
        supplierId,
        productId,
        price,
        surveyDate: surveyDate ? new Date(surveyDate) : new Date(),
        createdById: req.user.id,
      },
      include: {
        supplier: { select: { id: true, name: true, rating: true } },
        product: { select: { id: true, name: true, unit: true } },
      },
    });

    res.status(201).json(survey);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getRatingsHistory,
  addRating,
  getPriceComparison,
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrder,
  updatePurchaseOrderStatus,
  getPriceSurveys,
  createPriceSurvey,
};
