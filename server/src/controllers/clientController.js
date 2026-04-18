const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function listClients(req, res, next) {
  try {
    const { isApproved, businessType, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (isApproved !== undefined) where.isApproved = isApproved === 'true';
    if (businessType) where.businessType = businessType;
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { users: true, orders: true } },
        },
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      data: clients,
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

async function getClient(req, res, next) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            phone: true,
          },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function createClient(req, res, next) {
  try {
    const { businessName, businessType, contactPerson, email, phone, address } = req.body;

    const client = await prisma.client.create({
      data: {
        businessName,
        businessType,
        contactPerson,
        email,
        phone,
        address,
        isApproved: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_CLIENT',
        entityType: 'Client',
        entityId: client.id,
        metadata: { businessName },
      },
    });

    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
}

async function updateClient(req, res, next) {
  try {
    const { businessName, businessType, contactPerson, email, phone, address } = req.body;

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: {
        ...(businessName && { businessName }),
        ...(businessType && { businessType }),
        ...(contactPerson && { contactPerson }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address && { address }),
      },
    });

    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    await prisma.client.update({
      where: { id: req.params.id },
      data: { isApproved: false },
    });

    res.json({ message: 'Client deactivated successfully' });
  } catch (error) {
    next(error);
  }
}

async function approveClient(req, res, next) {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: { isApproved: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'APPROVE_CLIENT',
        entityType: 'Client',
        entityId: client.id,
        metadata: { businessName: client.businessName },
      },
    });

    res.json({ message: 'Client approved successfully', client });
  } catch (error) {
    next(error);
  }
}

async function listClientStaff(req, res, next) {
  try {
    const staff = await prisma.user.findMany({
      where: {
        clientId: req.params.id,
        role: { in: ['CLIENT_ADMIN', 'CLIENT_STAFF'] },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(staff);
  } catch (error) {
    next(error);
  }
}

async function addStaffToClient(req, res, next) {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    if (!['CLIENT_ADMIN', 'CLIENT_STAFF'].includes(role)) {
      return res.status(400).json({ error: 'Role must be CLIENT_ADMIN or CLIENT_STAFF' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        phone,
        clientId: req.params.id,
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phone: true,
        clientId: true,
        createdAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'ADD_CLIENT_STAFF',
        entityType: 'User',
        entityId: user.id,
        metadata: { clientId: req.params.id, role },
      },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  approveClient,
  listClientStaff,
  addStaffToClient,
};
