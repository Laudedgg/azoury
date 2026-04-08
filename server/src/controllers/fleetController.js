const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listVehicles(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [vehicles, total] = await Promise.all([
      prisma.fleetVehicle.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { plateNumber: 'asc' },
        include: {
          _count: { select: { dispatches: true, maintenance: true } },
        },
      }),
      prisma.fleetVehicle.count({ where }),
    ]);

    res.json({
      data: vehicles,
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

async function getVehicle(req, res, next) {
  try {
    const vehicle = await prisma.fleetVehicle.findUnique({
      where: { id: req.params.id },
      include: {
        dispatches: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            departedAt: true,
            completedAt: true,
            driver: { select: { firstName: true, lastName: true } },
          },
        },
        maintenance: {
          take: 10,
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
}

async function createVehicle(req, res, next) {
  try {
    const { plateNumber, model, type, mileage, fuelConsumption } = req.body;

    const vehicle = await prisma.fleetVehicle.create({
      data: {
        plateNumber,
        model,
        type,
        mileage: mileage || 0,
        fuelConsumption: fuelConsumption || 0,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_VEHICLE',
        entityType: 'FleetVehicle',
        entityId: vehicle.id,
        metadata: { plateNumber, model },
      },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    next(error);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const { plateNumber, model, type, status, mileage, fuelConsumption } = req.body;

    const vehicle = await prisma.fleetVehicle.update({
      where: { id: req.params.id },
      data: {
        ...(plateNumber && { plateNumber }),
        ...(model && { model }),
        ...(type && { type }),
        ...(status && { status }),
        ...(mileage !== undefined && { mileage }),
        ...(fuelConsumption !== undefined && { fuelConsumption }),
      },
    });

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    await prisma.fleetVehicle.update({
      where: { id: req.params.id },
      data: { status: 'INACTIVE' },
    });

    res.json({ message: 'Vehicle deactivated' });
  } catch (error) {
    next(error);
  }
}

async function logMaintenance(req, res, next) {
  try {
    const { type, description, cost, date, nextDueDate } = req.body;

    const maintenance = await prisma.fleetMaintenance.create({
      data: {
        vehicleId: req.params.id,
        type,
        description,
        cost,
        date: new Date(date),
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      },
    });

    // Update vehicle maintenance dates
    await prisma.fleetVehicle.update({
      where: { id: req.params.id },
      data: {
        lastMaintenanceDate: new Date(date),
        nextMaintenanceDate: nextDueDate ? new Date(nextDueDate) : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'LOG_MAINTENANCE',
        entityType: 'FleetMaintenance',
        entityId: maintenance.id,
        metadata: { vehicleId: req.params.id, type, cost },
      },
    });

    res.status(201).json(maintenance);
  } catch (error) {
    next(error);
  }
}

async function getFleetStats(req, res, next) {
  try {
    const [vehicles, maintenanceCosts, recentDispatches] = await Promise.all([
      prisma.fleetVehicle.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.fleetMaintenance.aggregate({
        _sum: { cost: true },
        _avg: { cost: true },
        _count: { id: true },
      }),
      prisma.dispatch.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      }),
    ]);

    const totalVehicles = await prisma.fleetVehicle.count();
    const avgMileage = await prisma.fleetVehicle.aggregate({
      _avg: { mileage: true, fuelConsumption: true },
    });

    const upcomingMaintenance = await prisma.fleetVehicle.findMany({
      where: {
        nextMaintenanceDate: {
          lte: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
      select: {
        id: true,
        plateNumber: true,
        model: true,
        nextMaintenanceDate: true,
      },
    });

    res.json({
      totalVehicles,
      byStatus: vehicles.reduce((acc, v) => {
        acc[v.status] = v._count.id;
        return acc;
      }, {}),
      maintenanceCosts: {
        total: maintenanceCosts._sum.cost || 0,
        average: Math.round((maintenanceCosts._avg.cost || 0) * 100) / 100,
        count: maintenanceCosts._count.id,
      },
      avgMileage: Math.round((avgMileage._avg.mileage || 0) * 100) / 100,
      avgFuelConsumption: Math.round((avgMileage._avg.fuelConsumption || 0) * 100) / 100,
      dispatchesLast30Days: recentDispatches.length,
      upcomingMaintenance,
    });
  } catch (error) {
    next(error);
  }
}

async function updateFuel(req, res, next) {
  try {
    const { mileage, fuelConsumption } = req.body;

    const vehicle = await prisma.fleetVehicle.update({
      where: { id: req.params.id },
      data: {
        ...(mileage !== undefined && { mileage }),
        ...(fuelConsumption !== undefined && { fuelConsumption }),
      },
    });

    res.json(vehicle);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  logMaintenance,
  getFleetStats,
  updateFuel,
};
