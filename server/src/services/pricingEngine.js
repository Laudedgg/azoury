const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const GRADE_MARGINS = {
  EXTRA: 0.35,
  A: 0.28,
  B: 0.22,
  C_PLUS_PLUS: 0.18,
  C: 0.12,
};

function calculateClientPrice(baseCost, margin, grade) {
  const gradeMargin = margin != null ? margin : GRADE_MARGINS[grade] || 0.2;
  const clientPrice = baseCost * (1 + gradeMargin);
  return Math.round(clientPrice * 100) / 100;
}

async function getMarginAnalysis(productId) {
  const qualityGrades = await prisma.qualityGrade.findMany({
    where: { productId },
    include: { product: true },
  });

  const recentPurchases = await prisma.purchaseItem.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const avgCost =
    recentPurchases.length > 0
      ? recentPurchases.reduce((sum, item) => sum + item.unitPrice, 0) / recentPurchases.length
      : 0;

  const analysis = qualityGrades.map((qg) => {
    const margin = avgCost > 0 ? ((qg.price - avgCost) / avgCost) * 100 : 0;
    return {
      gradeId: qg.id,
      grade: qg.grade,
      clientFacingGrade: qg.clientFacingGrade,
      sellingPrice: qg.price,
      avgCost: Math.round(avgCost * 100) / 100,
      marginPercent: Math.round(margin * 100) / 100,
      marginAmount: Math.round((qg.price - avgCost) * 100) / 100,
      currentStock: qg.currentStock,
    };
  });

  return {
    productId,
    productName: qualityGrades[0]?.product?.name || 'Unknown',
    avgPurchaseCost: Math.round(avgCost * 100) / 100,
    grades: analysis,
  };
}

async function getPriceHistory(productId, supplierId, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where = {
    productId,
    surveyDate: { gte: since },
  };

  if (supplierId) {
    where.supplierId = supplierId;
  }

  const surveys = await prisma.priceSurvey.findMany({
    where,
    orderBy: { surveyDate: 'asc' },
    include: {
      supplier: { select: { id: true, name: true } },
    },
  });

  const purchasePrices = await prisma.purchaseItem.findMany({
    where: {
      productId,
      createdAt: { gte: since },
      purchaseOrder: supplierId ? { supplierId } : undefined,
    },
    orderBy: { createdAt: 'asc' },
    include: {
      purchaseOrder: {
        select: { supplier: { select: { id: true, name: true } } },
      },
    },
  });

  return {
    surveys: surveys.map((s) => ({
      date: s.surveyDate,
      price: s.price,
      supplier: s.supplier,
    })),
    purchasePrices: purchasePrices.map((p) => ({
      date: p.createdAt,
      unitPrice: p.unitPrice,
      quantity: p.quantity,
      supplier: p.purchaseOrder.supplier,
    })),
  };
}

module.exports = {
  calculateClientPrice,
  getMarginAnalysis,
  getPriceHistory,
};
