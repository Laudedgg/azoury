const { PrismaClient } = require('@prisma/client');
const { createProductSchema } = require('../utils/validators');

const prisma = new PrismaClient();

async function listProducts(req, res, next) {
  try {
    const { category, search, isActive, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' },
        include: {
          qualityGrades: {
            orderBy: { grade: 'asc' },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      data: products,
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

async function getProduct(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        qualityGrades: {
          orderBy: { grade: 'asc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const data = createProductSchema.parse(req.body);

    const gradesToCreate = data.qualityGrades && data.qualityGrades.length > 0
      ? data.qualityGrades.map((qg) => ({
          grade: qg.grade,
          clientFacingGrade: qg.clientFacingGrade,
          price: qg.price,
          currentStock: qg.currentStock || 0,
        }))
      // Default hidden grade so clients can place orders before pricing is configured
      : [{ grade: 'A', clientFacingGrade: 'QUALITY_A', price: 0, currentStock: 0 }];

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        subDescription: data.subDescription,
        category: data.category,
        unit: data.unit,
        imageUrl: data.imageUrl,
        qualityGrades: { create: gradesToCreate },
      },
      include: {
        qualityGrades: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_PRODUCT',
        entityType: 'Product',
        entityId: product.id,
        metadata: { name: product.name, category: product.category },
      },
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

async function bulkCreateProducts(req, res, next) {
  try {
    const { products } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'products array is required' });
    }
    if (products.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 products per upload' });
    }

    const validCategories = new Set(['FRUITS', 'VEGETABLES', 'MEATS', 'DAIRY', 'DRY_GOODS', 'BEVERAGES', 'FROZEN', 'OTHER']);

    // Pre-load existing (name + description) keys for dedup so multiple
    // varieties of the same product name can each be imported.
    const existing = await prisma.product.findMany({ select: { name: true, description: true } });
    const dedupKey = (name, desc) => `${(name || '').trim().toLowerCase()}|${(desc || '').trim().toLowerCase()}`;
    const existingKeys = new Set(existing.map((p) => dedupKey(p.name, p.description)));

    const created = [];
    const skipped = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const row = products[i] || {};
      const rowNum = i + 1;
      const name = (row.name || '').trim();
      const category = (row.category || '').trim().toUpperCase();
      const unit = (row.unit || 'kg').trim().toLowerCase();

      if (!name) {
        errors.push({ row: rowNum, message: 'Name is required' });
        continue;
      }
      if (!validCategories.has(category)) {
        errors.push({ row: rowNum, message: `Invalid category "${row.category}"` });
        continue;
      }
      const description = row.description ? String(row.description).trim() : '';
      const subDescription = row.subDescription ? String(row.subDescription).trim() : '';
      const key = dedupKey(name, description);
      if (existingKeys.has(key)) {
        skipped.push({ row: rowNum, name, reason: 'Duplicate (name + description)' });
        continue;
      }

      try {
        const product = await prisma.product.create({
          data: {
            name,
            description: description || undefined,
            subDescription: subDescription || undefined,
            category,
            unit,
            qualityGrades: {
              create: [{ grade: 'A', clientFacingGrade: 'QUALITY_A', price: 0, currentStock: 0 }],
            },
          },
          select: { id: true, name: true, category: true, unit: true },
        });
        existingKeys.add(key);
        created.push(product);
      } catch (err) {
        errors.push({ row: rowNum, message: err.message || 'Database error' });
      }
    }

    if (created.length > 0) {
      await prisma.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'BULK_CREATE_PRODUCTS',
          entityType: 'Product',
          entityId: 'bulk',
          metadata: { created: created.length, skipped: skipped.length, errors: errors.length },
        },
      });
    }

    res.status(201).json({ created, skipped, errors });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { name, description, subDescription, category, unit, imageUrl, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(subDescription !== undefined && { subDescription }),
        ...(category && { category }),
        ...(unit && { unit }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        qualityGrades: true,
      },
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Product deactivated' });
  } catch (error) {
    next(error);
  }
}

async function updateQualityGradePrice(req, res, next) {
  try {
    const { price, currentStock } = req.body;

    const grade = await prisma.qualityGrade.update({
      where: { id: req.params.gradeId },
      data: {
        ...(price !== undefined && { price }),
        ...(currentStock !== undefined && { currentStock }),
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_QUALITY_GRADE',
        entityType: 'QualityGrade',
        entityId: grade.id,
        metadata: { price, currentStock },
      },
    });

    res.json(grade);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  bulkCreateProducts,
  updateProduct,
  deleteProduct,
  updateQualityGradePrice,
};
