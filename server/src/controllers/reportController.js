const { PrismaClient } = require('@prisma/client');
const { getMarginAnalysis } = require('../services/pricingEngine');

const prisma = new PrismaClient();

async function getDashboardKPIs(req, res, next) {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [
      todaysRevenue,
      activeOrders,
      pendingDispatches,
      activeClients,
      inventoryValue,
      monthlyWaste,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.clientOrder.aggregate({
        where: {
          status: 'DELIVERED',
          updatedAt: { gte: todayStart, lt: tomorrowStart },
        },
        _sum: { totalAmount: true },
      }),
      prisma.clientOrder.count({
        where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'DISPATCHED'] } },
      }),
      prisma.dispatch.count({
        where: { status: { in: ['PLANNING', 'LOADING'] } },
      }),
      prisma.client.count({ where: { isApproved: true } }),
      prisma.qualityGrade.aggregate({
        _sum: { currentStock: true },
      }),
      prisma.wasteEntry.aggregate({
        where: {
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
        _sum: { cost: true },
      }),
      prisma.clientOrder.aggregate({
        where: {
          status: 'DELIVERED',
          updatedAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    // Calculate inventory value
    const grades = await prisma.qualityGrade.findMany({
      select: { currentStock: true, price: true },
    });
    const totalInventoryValue = grades.reduce(
      (sum, g) => sum + g.currentStock * g.price,
      0
    );

    const monthRev = monthlyRevenue._sum.totalAmount || 1;
    const wastePercent =
      ((monthlyWaste._sum.cost || 0) / monthRev) * 100;

    res.json({
      todaysRevenue: todaysRevenue._sum.totalAmount || 0,
      activeOrders,
      pendingDispatches,
      activeClients,
      inventoryValue: Math.round(totalInventoryValue * 100) / 100,
      wastePercent: Math.round(wastePercent * 100) / 100,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      monthlyWasteCost: monthlyWaste._sum.cost || 0,
    });
  } catch (error) {
    next(error);
  }
}

async function revenueByPeriod(req, res, next) {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const orders = await prisma.clientOrder.findMany({
      where: {
        status: 'DELIVERED',
        updatedAt: { gte: since },
      },
      select: { totalAmount: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    const grouped = {};
    for (const order of orders) {
      let key;
      const d = order.updatedAt;
      if (period === 'daily') {
        key = d.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { period: key, revenue: 0, orderCount: 0 };
      }
      grouped[key].revenue += order.totalAmount;
      grouped[key].orderCount += 1;
    }

    const result = Object.values(grouped).map((g) => ({
      ...g,
      revenue: Math.round(g.revenue * 100) / 100,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function costVsRevenueByGrade(req, res, next) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const salesByGrade = await prisma.orderItem.groupBy({
      by: ['qualityGradeId'],
      where: {
        clientOrder: {
          status: 'DELIVERED',
          updatedAt: { gte: since },
        },
      },
      _sum: { quantity: true },
    });

    const grades = await prisma.qualityGrade.findMany({
      include: { product: { select: { name: true } } },
    });
    const gradeMap = new Map(grades.map((g) => [g.id, g]));

    const purchaseCosts = await prisma.purchaseItem.findMany({
      where: { createdAt: { gte: since } },
      select: { productId: true, unitPrice: true, quantity: true },
    });

    // Average cost per product
    const costByProduct = {};
    for (const p of purchaseCosts) {
      if (!costByProduct[p.productId]) {
        costByProduct[p.productId] = { totalCost: 0, totalQty: 0 };
      }
      costByProduct[p.productId].totalCost += p.unitPrice * p.quantity;
      costByProduct[p.productId].totalQty += p.quantity;
    }

    const result = salesByGrade.map((s) => {
      const grade = gradeMap.get(s.qualityGradeId);
      if (!grade) return null;

      const costData = costByProduct[grade.productId];
      const avgCost = costData ? costData.totalCost / costData.totalQty : 0;
      const revenue = (s._sum.quantity || 0) * grade.price;
      const cost = (s._sum.quantity || 0) * avgCost;

      return {
        gradeId: s.qualityGradeId,
        grade: grade.grade,
        clientFacingGrade: grade.clientFacingGrade,
        productName: grade.product.name,
        quantitySold: s._sum.quantity || 0,
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        profit: Math.round((revenue - cost) * 100) / 100,
        marginPercent: revenue > 0 ? Math.round(((revenue - cost) / revenue) * 10000) / 100 : 0,
      };
    }).filter(Boolean);

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function topClients(req, res, next) {
  try {
    const { days = 30, limit = 10 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const clientRevenue = await prisma.clientOrder.groupBy({
      by: ['clientId'],
      where: {
        status: 'DELIVERED',
        updatedAt: { gte: since },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: parseInt(limit),
    });

    const clientIds = clientRevenue.map((c) => c.clientId);
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } },
      select: { id: true, businessName: true, businessType: true },
    });
    const clientMap = new Map(clients.map((c) => [c.id, c]));

    const result = clientRevenue.map((c) => ({
      client: clientMap.get(c.clientId),
      totalRevenue: Math.round((c._sum.totalAmount || 0) * 100) / 100,
      orderCount: c._count.id,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function deliveryPerformance(req, res, next) {
  try {
    const { days = 30 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const [totalDispatches, completedDispatches, deliveredOrders, returnedItems] =
      await Promise.all([
        prisma.dispatch.count({
          where: { createdAt: { gte: since } },
        }),
        prisma.dispatch.count({
          where: { status: 'COMPLETED', createdAt: { gte: since } },
        }),
        prisma.dispatchItem.count({
          where: { status: 'DELIVERED', createdAt: { gte: since } },
        }),
        prisma.dispatchItem.count({
          where: { status: 'RETURNED', createdAt: { gte: since } },
        }),
      ]);

    const completionRate =
      totalDispatches > 0 ? (completedDispatches / totalDispatches) * 100 : 0;

    const deliveryRate =
      deliveredOrders + returnedItems > 0
        ? (deliveredOrders / (deliveredOrders + returnedItems)) * 100
        : 0;

    // Average dispatch duration for completed
    const completedWithTimes = await prisma.dispatch.findMany({
      where: {
        status: 'COMPLETED',
        departedAt: { not: null },
        completedAt: { not: null },
        createdAt: { gte: since },
      },
      select: { departedAt: true, completedAt: true },
    });

    let avgDurationMinutes = 0;
    if (completedWithTimes.length > 0) {
      const totalMs = completedWithTimes.reduce(
        (sum, d) => sum + (d.completedAt.getTime() - d.departedAt.getTime()),
        0
      );
      avgDurationMinutes = Math.round(totalMs / completedWithTimes.length / 60000);
    }

    res.json({
      totalDispatches,
      completedDispatches,
      completionRate: Math.round(completionRate * 100) / 100,
      deliveredOrders,
      returnedItems,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
      avgDurationMinutes,
    });
  } catch (error) {
    next(error);
  }
}

async function marginAnalysis(req, res, next) {
  try {
    const { productId } = req.query;

    if (productId) {
      const analysis = await getMarginAnalysis(productId);
      return res.json(analysis);
    }

    // Get top products by sales volume
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20,
    });

    const analyses = await Promise.all(
      topProducts.map((p) => getMarginAnalysis(p.productId))
    );

    res.json(analyses.filter((a) => a.grades.length > 0));
  } catch (error) {
    next(error);
  }
}

async function getActivityFeed(req, res, next) {
  try {
    const { limit = 50 } = req.query;

    const logs = await prisma.activityLog.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
}

async function getInvoices(req, res, next) {
  try {
    const { status, clientId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    // Client users only ever see their own
    if (['CLIENT_ADMIN', 'CLIENT_STAFF', 'CLIENT_ORDERER', 'CLIENT_RECEIVER'].includes(req.user.role)) {
      where.clientId = req.user.clientId;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, businessName: true } },
          clientOrder: { select: { id: true, totalAmount: true, status: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({
      data: invoices,
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

async function updateInvoiceStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!['DRAFT', 'SENT', 'PAID', 'OVERDUE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be DRAFT, SENT, PAID, or OVERDUE' });
    }

    const data = { status };
    if (status === 'PAID') {
      data.paidAt = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data,
      include: {
        client: { select: { id: true, businessName: true } },
        clientOrder: { select: { id: true, totalAmount: true, status: true } },
      },
    });

    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function approveInvoice(req, res, next) {
  try {
    const existing = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });
    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only DRAFT invoices can be approved' });
    }
    const invoice = await prisma.invoice.update({
      where: { id: req.params.id },
      data: {
        status: 'SENT',
        approvedAt: new Date(),
        approvedById: req.user.id,
      },
      include: {
        client: { select: { id: true, businessName: true } },
        clientOrder: { select: { id: true, totalAmount: true, status: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'APPROVE_INVOICE',
        entityType: 'Invoice',
        entityId: invoice.id,
        metadata: { clientId: invoice.clientId, amount: invoice.amount },
      },
    });
    res.json(invoice);
  } catch (error) {
    next(error);
  }
}

async function getClientStatement(req, res, next) {
  try {
    const clientId = req.params.id;
    // Self-scope for clients
    if (['CLIENT_ADMIN', 'CLIENT_STAFF', 'CLIENT_ORDERER', 'CLIENT_RECEIVER'].includes(req.user.role)) {
      if (clientId !== req.user.clientId) return res.status(403).json({ error: 'Access denied' });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, businessName: true, email: true, phone: true, address: true },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const invoices = await prisma.invoice.findMany({
      where: { clientId, status: { in: ['SENT', 'PAID', 'OVERDUE'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        clientOrder: { select: { id: true, deliveryDate: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const billed = invoices.reduce((s, i) => s + (i.amount || 0), 0);
    const paid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + (i.amount || 0), 0);
    const outstanding = billed - paid;
    const overdue = invoices
      .filter((i) => i.status !== 'PAID' && i.dueDate && new Date(i.dueDate) < now)
      .reduce((s, i) => s + (i.amount || 0), 0);
    const paidLast7 = invoices
      .filter((i) => i.status === 'PAID' && i.paidAt && new Date(i.paidAt) >= oneWeekAgo)
      .reduce((s, i) => s + (i.amount || 0), 0);
    const paidThisMonth = invoices
      .filter((i) => i.status === 'PAID' && i.paidAt && new Date(i.paidAt) >= monthStart)
      .reduce((s, i) => s + (i.amount || 0), 0);

    res.json({
      client,
      summary: { billed, paid, outstanding, overdue, paidLast7, paidThisMonth, count: invoices.length },
      invoices,
    });
  } catch (error) {
    next(error);
  }
}

async function missingItems(req, res, next) {
  try {
    // All line items on open orders (not delivered/cancelled)
    const openItems = await prisma.orderItem.findMany({
      where: {
        clientOrder: {
          status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DISPATCHED'] },
        },
      },
      select: {
        productId: true,
        qualityGradeId: true,
        quantity: true,
        fulfilledQuantity: true,
      },
    });

    if (openItems.length === 0) return res.json([]);

    // Aggregate by product+grade
    const byKey = {};
    for (const it of openItems) {
      const key = `${it.productId}:${it.qualityGradeId}`;
      if (!byKey[key]) {
        byKey[key] = { productId: it.productId, qualityGradeId: it.qualityGradeId, ordered: 0, fulfilled: 0 };
      }
      byKey[key].ordered += it.quantity || 0;
      byKey[key].fulfilled += it.fulfilledQuantity || 0;
    }

    const gradeIds = [...new Set(Object.values(byKey).map((b) => b.qualityGradeId))];
    const grades = await prisma.qualityGrade.findMany({
      where: { id: { in: gradeIds } },
      include: { product: { select: { id: true, name: true, unit: true } } },
    });
    const gradeMap = new Map(grades.map((g) => [g.id, g]));

    const rows = Object.values(byKey).map(({ productId, qualityGradeId, ordered, fulfilled }) => {
      const g = gradeMap.get(qualityGradeId);
      const stillNeeded = Math.max(0, ordered - fulfilled);
      const currentStock = g?.currentStock ?? 0;
      const missing = Math.max(0, stillNeeded - currentStock);
      return {
        productId,
        qualityGradeId,
        productName: g?.product?.name || '',
        unit: g?.product?.unit || 'kg',
        grade: g?.clientFacingGrade || g?.grade || '',
        ordered,
        fulfilled,
        stillNeeded,
        currentStock,
        missing,
      };
    }).sort((a, b) => b.missing - a.missing || b.stillNeeded - a.stillNeeded);

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  approveInvoice,
  getClientStatement,
  getDashboardKPIs,
  revenueByPeriod,
  costVsRevenueByGrade,
  topClients,
  deliveryPerformance,
  marginAnalysis,
  getActivityFeed,
  getInvoices,
  updateInvoiceStatus,
  missingItems,
};
