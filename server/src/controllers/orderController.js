const { PrismaClient } = require('@prisma/client');
const { createOrderSchema, updateOrderStatusSchema } = require('../utils/validators');
const notificationService = require('../services/notificationService');

const prisma = new PrismaClient();

async function createOrder(req, res, next) {
  try {
    const data = createOrderSchema.parse(req.body);

    // Determine client ID based on user role
    let clientId = data.clientId;
    if (['CLIENT_ADMIN', 'CLIENT_STAFF'].includes(req.user.role)) {
      clientId = req.user.clientId;
    }

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Fetch quality grades for pricing
    const gradeIds = data.items.map((item) => item.qualityGradeId);
    const grades = await prisma.qualityGrade.findMany({
      where: { id: { in: gradeIds } },
    });

    const gradeMap = new Map(grades.map((g) => [g.id, g]));

    const items = data.items.map((item) => {
      const grade = gradeMap.get(item.qualityGradeId);
      if (!grade) throw new Error(`Quality grade not found: ${item.qualityGradeId}`);
      return {
        productId: item.productId,
        qualityGradeId: item.qualityGradeId,
        quantity: item.quantity,
        unitPrice: grade.price,
        specialInstructions: item.specialInstructions || null,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const order = await prisma.clientOrder.create({
      data: {
        clientId,
        placedById: req.user.id,
        deliveryDate: new Date(data.deliveryDate),
        specialInstructions: data.specialInstructions,
        totalAmount: Math.round(totalAmount * 100) / 100,
        items: {
          create: items,
        },
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
            qualityGrade: { select: { id: true, grade: true, clientFacingGrade: true } },
          },
        },
        client: { select: { id: true, businessName: true } },
        placedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_ORDER',
        entityType: 'ClientOrder',
        entityId: order.id,
        metadata: { totalAmount: order.totalAmount, itemCount: items.length },
      },
    });

    notificationService.orderPlaced(order);

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

async function listOrders(req, res, next) {
  try {
    const { status, clientId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Client users can only see their own orders
    if (['CLIENT_ADMIN', 'CLIENT_STAFF'].includes(req.user.role)) {
      where.clientId = req.user.clientId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      prisma.clientOrder.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, businessName: true } },
          placedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.clientOrder.count({ where }),
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

async function getOrder(req, res, next) {
  try {
    const order = await prisma.clientOrder.findUnique({
      where: { id: req.params.id },
      include: {
        client: { select: { id: true, businessName: true, contactPerson: true, phone: true } },
        placedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true, category: true } },
            qualityGrade: { select: { id: true, grade: true, clientFacingGrade: true, price: true, currentStock: true } },
          },
        },
        dispatchItems: {
          include: {
            dispatch: {
              select: { id: true, status: true, driverId: true, freeBonusProduct: true, startKm: true, endKm: true },
            },
          },
        },
        returnAmendments: true,
        invoices: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Client users can only see their own orders
    if (['CLIENT_ADMIN', 'CLIENT_STAFF'].includes(req.user.role)) {
      if (order.clientId !== req.user.clientId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
}

async function prepareOrder(req, res, next) {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const order = await prisma.clientOrder.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Map provided real quantities back to the actual OrderItems
    const updates = [];
    for (const inbound of items) {
      const existing = order.items.find((it) => it.id === inbound.orderItemId);
      if (!existing) {
        return res.status(400).json({ error: `Unknown order item: ${inbound.orderItemId}` });
      }
      const realQty = Number(inbound.realQuantity);
      if (Number.isNaN(realQty) || realQty < 0) {
        return res.status(400).json({ error: 'realQuantity must be a non-negative number' });
      }
      updates.push({ existing, realQty, inbound });
    }

    // Apply in a transaction: update OrderItem.fulfilledQuantity, adjust stock, log movement
    await prisma.$transaction(async (tx) => {
      for (const { existing, realQty, inbound } of updates) {
        // Inventory decrement is ONLY based on what the dispatcher tagged as "from inventory".
        // Items "from new supply" never sat in inventory in the first place, and free items
        // are tracked separately for the invoice (default: free deducts from inventory too).
        const fromInventory = Number(inbound.fulfilledFromInventory ?? realQty) || 0;
        const fromSupply = Number(inbound.fulfilledFromSupply ?? 0) || 0;
        const freeQty = Number(inbound.freeQuantity ?? 0) || 0;
        const sourceNote = inbound.sourceNote ? String(inbound.sourceNote).trim() : null;

        const prior = existing.fulfilledFromInventory ?? existing.fulfilledQuantity ?? 0;
        const inventoryDelta = (fromInventory + freeQty) - (prior + (existing.freeQuantity || 0));

        await tx.orderItem.update({
          where: { id: existing.id },
          data: {
            fulfilledQuantity: realQty,
            fulfilledFromInventory: fromInventory,
            fulfilledFromSupply: fromSupply,
            freeQuantity: freeQty,
            sourceNote: sourceNote,
          },
        });

        if (inventoryDelta !== 0) {
          await tx.qualityGrade.update({
            where: { id: existing.qualityGradeId },
            data: { currentStock: { decrement: inventoryDelta } },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: existing.productId,
              qualityGradeId: existing.qualityGradeId,
              type: 'SALE_OUT',
              quantity: -inventoryDelta,
              reference: `Order ${order.id}`,
              notes: `Prepared for client order (inventory + free)`,
              createdById: req.user.id,
            },
          });
        }
      }

      // Recalculate totalAmount from real quantities for accurate billing
      const refreshed = await tx.orderItem.findMany({ where: { clientOrderId: order.id } });
      const newTotal = refreshed.reduce((s, i) => s + (i.fulfilledQuantity || 0) * (i.unitPrice || 0), 0);

      await tx.clientOrder.update({
        where: { id: order.id },
        data: {
          status: 'PREPARING',
          totalAmount: Math.round(newTotal * 100) / 100,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          action: 'PREPARE_ORDER',
          entityType: 'ClientOrder',
          entityId: order.id,
          metadata: { itemCount: updates.length, newTotal },
        },
      });
    });

    const updated = await prisma.clientOrder.findUnique({
      where: { id: order.id },
      include: {
        client: { select: { id: true, businessName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, unit: true } },
            qualityGrade: { select: { id: true, grade: true, clientFacingGrade: true, price: true, currentStock: true } },
          },
        },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function verifyOrderItemQc(req, res, next) {
  try {
    const { verified, notes } = req.body;
    const item = await prisma.orderItem.update({
      where: { id: req.params.itemId },
      data: {
        qcVerified: !!verified,
        qcVerifiedAt: verified ? new Date() : null,
        qcVerifiedById: verified ? req.user.id : null,
        qcNotes: notes !== undefined ? (notes || null) : undefined,
      },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        qcVerifier: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: verified ? 'QC_VERIFY_ITEM' : 'QC_UNVERIFY_ITEM',
        entityType: 'OrderItem',
        entityId: item.id,
        metadata: { product: item.product?.name },
      },
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
}

async function captureItemDelivery(req, res, next) {
  try {
    const { deliveredQuantity, refusedQuantity, refusalReason } = req.body;
    const delivered = deliveredQuantity !== undefined ? Number(deliveredQuantity) : undefined;
    const refused = refusedQuantity !== undefined ? Number(refusedQuantity) : undefined;
    if (delivered !== undefined && (Number.isNaN(delivered) || delivered < 0)) {
      return res.status(400).json({ error: 'deliveredQuantity must be a non-negative number' });
    }
    if (refused !== undefined && (Number.isNaN(refused) || refused < 0)) {
      return res.status(400).json({ error: 'refusedQuantity must be a non-negative number' });
    }
    const item = await prisma.orderItem.update({
      where: { id: req.params.itemId },
      data: {
        ...(delivered !== undefined && { deliveredQuantity: delivered }),
        ...(refused !== undefined && { refusedQuantity: refused }),
        ...(refusalReason !== undefined && { refusalReason: refusalReason || null }),
        deliveredAt: new Date(),
      },
      include: {
        product: { select: { id: true, name: true, unit: true } },
      },
    });
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CAPTURE_ITEM_DELIVERY',
        entityType: 'OrderItem',
        entityId: item.id,
        metadata: { delivered, refused, refusalReason: refusalReason || null },
      },
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = updateOrderStatusSchema.parse(req.body);

    const existing = await prisma.clientOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const previousStatus = existing.status;

    const order = await prisma.clientOrder.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        client: { select: { id: true, businessName: true } },
      },
    });

    // If confirmed, create inventory sale movements
    if (status === 'CONFIRMED' && previousStatus === 'PENDING') {
      const items = await prisma.orderItem.findMany({
        where: { clientOrderId: order.id },
      });

      for (const item of items) {
        await prisma.inventoryMovement.create({
          data: {
            productId: item.productId,
            qualityGradeId: item.qualityGradeId,
            type: 'SALE_OUT',
            quantity: item.quantity,
            reference: `Order ${order.id}`,
            createdById: req.user.id,
          },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_ORDER_STATUS',
        entityType: 'ClientOrder',
        entityId: order.id,
        metadata: { previousStatus, newStatus: status },
      },
    });

    notificationService.orderStatusChanged(order, previousStatus);

    res.json(order);
  } catch (error) {
    next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const existing = await prisma.clientOrder.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (['DELIVERED', 'CANCELLED'].includes(existing.status)) {
      return res.status(400).json({ error: `Cannot cancel order with status ${existing.status}` });
    }

    // Client users can only cancel their own orders
    if (['CLIENT_ADMIN', 'CLIENT_STAFF'].includes(req.user.role)) {
      if (existing.clientId !== req.user.clientId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const order = await prisma.clientOrder.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CANCEL_ORDER',
        entityType: 'ClientOrder',
        entityId: order.id,
      },
    });

    notificationService.orderStatusChanged(order, existing.status);

    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    next(error);
  }
}

async function getCombinedOrdersView(req, res, next) {
  try {
    const { deliveryDate, status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['PENDING', 'CONFIRMED', 'PREPARING'] };
    }
    if (deliveryDate) {
      const date = new Date(deliveryDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.deliveryDate = { gte: date, lt: nextDay };
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { clientOrder: where },
      include: {
        product: { select: { id: true, name: true, unit: true, category: true } },
        qualityGrade: { select: { id: true, grade: true, clientFacingGrade: true, currentStock: true } },
        clientOrder: {
          select: { id: true, clientId: true, status: true, deliveryDate: true },
        },
      },
    });

    // Aggregate by product and grade
    const aggregated = {};
    for (const item of orderItems) {
      const key = `${item.productId}-${item.qualityGradeId}`;
      if (!aggregated[key]) {
        aggregated[key] = {
          productId: item.productId,
          productName: item.product.name,
          unit: item.product.unit,
          category: item.product.category,
          qualityGradeId: item.qualityGradeId,
          grade: item.qualityGrade.grade,
          clientFacingGrade: item.qualityGrade.clientFacingGrade,
          currentStock: item.qualityGrade.currentStock,
          totalQuantityNeeded: 0,
          orderCount: 0,
          orders: [],
        };
      }
      aggregated[key].totalQuantityNeeded += item.quantity;
      aggregated[key].orderCount += 1;
      aggregated[key].orders.push({
        orderId: item.clientOrder.id,
        clientId: item.clientOrder.clientId,
        quantity: item.quantity,
        deliveryDate: item.clientOrder.deliveryDate,
      });
    }

    const result = Object.values(aggregated).map((item) => ({
      ...item,
      shortfall: Math.max(0, item.totalQuantityNeeded - item.currentStock),
      isCovered: item.currentStock >= item.totalQuantityNeeded,
    }));

    result.sort((a, b) => (a.isCovered === b.isCovered ? 0 : a.isCovered ? 1 : -1));

    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getReturnAmendments(req, res, next) {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      prisma.returnAmendment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          clientOrder: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              client: { select: { id: true, businessName: true } },
            },
          },
          requestedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.returnAmendment.count({ where }),
    ]);

    res.json({
      data: items,
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

async function createReturnAmendment(req, res, next) {
  try {
    const { clientOrderId, type, reason } = req.body;

    if (!clientOrderId || !type || !reason) {
      return res.status(400).json({ error: 'clientOrderId, type, and reason are required' });
    }

    if (!['RETURN', 'AMENDMENT'].includes(type)) {
      return res.status(400).json({ error: 'type must be RETURN or AMENDMENT' });
    }

    const order = await prisma.clientOrder.findUnique({
      where: { id: clientOrderId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Client order not found' });
    }

    const returnAmendment = await prisma.returnAmendment.create({
      data: {
        clientOrderId,
        type,
        reason,
        status: 'PENDING',
        requestedById: req.user.id,
      },
      include: {
        clientOrder: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            client: { select: { id: true, businessName: true } },
          },
        },
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_RETURN_AMENDMENT',
        entityType: 'ReturnAmendment',
        entityId: returnAmendment.id,
        metadata: { type, clientOrderId },
      },
    });

    res.status(201).json(returnAmendment);
  } catch (error) {
    next(error);
  }
}

async function updateReturnAmendment(req, res, next) {
  try {
    const { opsManagerApproval, qcApproval, opsManagerComment, qcComment } = req.body;

    const existing = await prisma.returnAmendment.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Return/amendment not found' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({ error: 'Can only update pending return/amendments' });
    }

    const data = {};

    // Only OPERATIONS_MANAGER can set ops manager fields
    if (req.user.role === 'OPERATIONS_MANAGER') {
      if (opsManagerApproval !== undefined) data.opsManagerApproval = opsManagerApproval;
      if (opsManagerComment !== undefined) data.opsManagerComment = opsManagerComment;
    }

    // Only QUALITY_COST_CONTROL can set QC fields
    if (req.user.role === 'QUALITY_COST_CONTROL') {
      if (qcApproval !== undefined) data.qcApproval = qcApproval;
      if (qcComment !== undefined) data.qcComment = qcComment;
    }

    // SUPER_ADMIN can set any field
    if (req.user.role === 'SUPER_ADMIN') {
      if (opsManagerApproval !== undefined) data.opsManagerApproval = opsManagerApproval;
      if (opsManagerComment !== undefined) data.opsManagerComment = opsManagerComment;
      if (qcApproval !== undefined) data.qcApproval = qcApproval;
      if (qcComment !== undefined) data.qcComment = qcComment;
    }

    if (Object.keys(data).length === 0) {
      return res.status(403).json({ error: 'You do not have permission to update these fields' });
    }

    // Determine final status based on merged approvals
    const mergedOps = data.opsManagerApproval !== undefined ? data.opsManagerApproval : existing.opsManagerApproval;
    const mergedQc = data.qcApproval !== undefined ? data.qcApproval : existing.qcApproval;

    if (mergedOps === false || mergedQc === false) {
      data.status = 'REJECTED';
    } else if (mergedOps === true && mergedQc === true) {
      data.status = 'APPROVED';
    }

    const updated = await prisma.returnAmendment.update({
      where: { id: req.params.id },
      data,
      include: {
        clientOrder: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            client: { select: { id: true, businessName: true } },
          },
        },
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_RETURN_AMENDMENT',
        entityType: 'ReturnAmendment',
        entityId: updated.id,
        metadata: { status: updated.status },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  updateStatus,
  prepareOrder,
  cancelOrder,
  getCombinedOrdersView,
  getReturnAmendments,
  createReturnAmendment,
  updateReturnAmendment,
  verifyOrderItemQc,
  captureItemDelivery,
};
