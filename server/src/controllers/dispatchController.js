const { PrismaClient } = require('@prisma/client');
const notificationService = require('../services/notificationService');
const { parseStatusFilter } = require('../utils/parseStatus');

const prisma = new PrismaClient();

async function getDispatchQcChecklist(req, res, next) {
  try {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: req.params.id },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        truck: { select: { id: true, plateNumber: true } },
        items: {
          include: {
            clientOrder: {
              include: {
                client: { select: { id: true, businessName: true } },
                items: {
                  include: {
                    product: { select: { id: true, name: true, unit: true } },
                    qualityGrade: { select: { id: true, grade: true, clientFacingGrade: true } },
                    qcVerifier: { select: { id: true, firstName: true, lastName: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!dispatch) return res.status(404).json({ error: 'Dispatch not found' });
    res.json(dispatch);
  } catch (error) {
    next(error);
  }
}

async function createDispatch(req, res, next) {
  try {
    const { driverId, truckId, orderIds, routeOrder, freeBonusProduct } = req.body;

    if (!driverId || !truckId) {
      return res.status(400).json({ error: 'driverId and truckId are required' });
    }

    const dispatch = await prisma.dispatch.create({
      data: {
        driverId,
        truckId,
        routeOrder: routeOrder || null,
        freeBonusProduct: freeBonusProduct?.trim() || null,
        items: orderIds
          ? {
              create: orderIds.map((orderId) => ({
                clientOrderId: orderId,
              })),
            }
          : undefined,
      },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        truck: { select: { id: true, plateNumber: true, model: true } },
        items: {
          include: {
            clientOrder: {
              select: {
                id: true,
                clientId: true,
                status: true,
                totalAmount: true,
                client: { select: { businessName: true, address: true, phone: true } },
              },
            },
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_DISPATCH',
        entityType: 'Dispatch',
        entityId: dispatch.id,
        metadata: { driverId, truckId, orderCount: orderIds?.length || 0 },
      },
    });

    res.status(201).json(dispatch);
  } catch (error) {
    next(error);
  }
}

async function assignOrders(req, res, next) {
  try {
    const { orderIds } = req.body;

    if (!orderIds || !orderIds.length) {
      return res.status(400).json({ error: 'orderIds are required' });
    }

    const items = await Promise.all(
      orderIds.map((orderId) =>
        prisma.dispatchItem.create({
          data: {
            dispatchId: req.params.id,
            clientOrderId: orderId,
          },
        })
      )
    );

    res.json({ message: `${items.length} orders assigned to dispatch`, items });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status, km } = req.body;

    const updateData = { status };
    const kmNumber = km !== undefined && km !== null && km !== '' ? Number(km) : null;
    if (kmNumber !== null && (Number.isNaN(kmNumber) || kmNumber < 0)) {
      return res.status(400).json({ error: 'km must be a non-negative number' });
    }

    if (status === 'IN_TRANSIT') {
      updateData.departedAt = new Date();
      if (kmNumber !== null) updateData.startKm = kmNumber;
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (kmNumber !== null) updateData.endKm = kmNumber;
    }

    const dispatch = await prisma.dispatch.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        driver: { select: { id: true, firstName: true, lastName: true } },
        truck: { select: { id: true, plateNumber: true } },
      },
    });

    // Propagate latest odometer reading to the fleet vehicle for consumption tracking
    if (status === 'COMPLETED' && kmNumber !== null) {
      try {
        await prisma.fleetVehicle.update({
          where: { id: dispatch.truckId },
          data: { mileage: kmNumber },
        });
      } catch (_) { /* ignore if truck missing */ }
    }

    // If loading, update all dispatch items to LOADED
    if (status === 'LOADING') {
      await prisma.dispatchItem.updateMany({
        where: { dispatchId: dispatch.id, status: 'PENDING' },
        data: { status: 'LOADED' },
      });
    }

    // If dispatched, update associated orders
    if (status === 'IN_TRANSIT') {
      const dispatchItems = await prisma.dispatchItem.findMany({
        where: { dispatchId: dispatch.id },
      });
      for (const item of dispatchItems) {
        await prisma.clientOrder.update({
          where: { id: item.clientOrderId },
          data: { status: 'DISPATCHED' },
        });
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'UPDATE_DISPATCH_STATUS',
        entityType: 'Dispatch',
        entityId: dispatch.id,
        metadata: { status },
      },
    });

    notificationService.dispatchUpdate(dispatch, status);

    res.json(dispatch);
  } catch (error) {
    next(error);
  }
}

async function uploadPhoto(req, res, next) {
  try {
    const { dispatchItemId, caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const photo = await prisma.dispatchPhoto.create({
      data: {
        dispatchItemId,
        imageUrl: `/uploads/${req.file.filename}`,
        caption,
        uploadedById: req.user.id,
      },
    });

    res.status(201).json(photo);
  } catch (error) {
    next(error);
  }
}

async function getDispatch(req, res, next) {
  try {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: req.params.id },
      include: {
        driver: { select: { id: true, firstName: true, lastName: true, phone: true } },
        truck: { select: { id: true, plateNumber: true, model: true, type: true } },
        items: {
          include: {
            clientOrder: {
              include: {
                client: { select: { id: true, businessName: true, address: true, phone: true } },
                items: {
                  include: {
                    product: { select: { name: true, unit: true } },
                    qualityGrade: { select: { grade: true, clientFacingGrade: true } },
                  },
                },
              },
            },
            photos: true,
          },
        },
      },
    });

    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch not found' });
    }

    res.json(dispatch);
  } catch (error) {
    next(error);
  }
}

async function listDispatches(req, res, next) {
  try {
    const { status, driverId, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    const sf = parseStatusFilter(status);
    if (sf !== undefined) where.status = sf;
    if (driverId) where.driverId = driverId;

    // Drivers can only see their own dispatches
    if (req.user.role === 'DRIVER') {
      where.driverId = req.user.id;
    }

    const [dispatches, total] = await Promise.all([
      prisma.dispatch.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          driver: { select: { id: true, firstName: true, lastName: true } },
          truck: { select: { id: true, plateNumber: true, model: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.dispatch.count({ where }),
    ]);

    res.json({
      data: dispatches,
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

async function confirmDelivery(req, res, next) {
  try {
    const { dispatchItemId, deliveryNotes, signatureUrl } = req.body;

    const dispatchItem = await prisma.dispatchItem.update({
      where: { id: dispatchItemId },
      data: {
        status: 'DELIVERED',
        deliveryNotes,
        signatureUrl,
      },
      include: {
        clientOrder: true,
      },
    });

    // Update the client order status
    await prisma.clientOrder.update({
      where: { id: dispatchItem.clientOrderId },
      data: { status: 'DELIVERED' },
    });

    // Update fulfilled quantities
    const orderItems = await prisma.orderItem.findMany({
      where: { clientOrderId: dispatchItem.clientOrderId },
    });
    for (const item of orderItems) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { fulfilledQuantity: item.quantity },
      });
    }

    // Check if all items in dispatch are delivered
    const allItems = await prisma.dispatchItem.findMany({
      where: { dispatchId: dispatchItem.dispatchId },
    });
    const allDelivered = allItems.every(
      (item) => item.status === 'DELIVERED' || item.status === 'RETURNED'
    );

    if (allDelivered) {
      await prisma.dispatch.update({
        where: { id: dispatchItem.dispatchId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CONFIRM_DELIVERY',
        entityType: 'DispatchItem',
        entityId: dispatchItemId,
        metadata: { orderId: dispatchItem.clientOrderId },
      },
    });

    res.json({ message: 'Delivery confirmed', dispatchItem });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDispatch,
  assignOrders,
  updateStatus,
  uploadPhoto,
  getDispatch,
  listDispatches,
  confirmDelivery,
  getDispatchQcChecklist,
};
