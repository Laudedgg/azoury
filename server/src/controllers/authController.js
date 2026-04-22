const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { generateTokens, verifyRefreshToken } = require('../utils/jwt');
const { loginSchema, registerSchema } = require('../utils/validators');

const prisma = new PrismaClient();

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        client: {
          select: { id: true, businessName: true, isApproved: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.client && !user.client.isApproved) {
      return res.status(403).json({ error: 'Your business account is pending approval' });
    }

    const tokens = generateTokens(user);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: { ...userWithoutPassword, mustChangePassword: user.mustChangePassword },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
}

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          businessName: data.businessName,
          businessType: data.businessType,
          businessTypeOther: data.businessType === 'OTHER' ? (data.businessTypeOther || null) : null,
          contactPerson: data.contactPerson,
          email: data.businessEmail,
          phone: data.businessPhone,
          address: data.address,
          isApproved: false,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'CLIENT_ADMIN',
          phone: data.phone,
          clientId: client.id,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'REGISTER',
          entityType: 'Client',
          entityId: client.id,
          metadata: { businessName: client.businessName },
        },
      });

      return { user, client };
    });

    const { password: _, ...userWithoutPassword } = result.user;

    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      user: userWithoutPassword,
      client: result.client,
    });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokens = generateTokens(user);

    res.json(tokens);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired' });
    }
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user.id,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: req.user.id,
      },
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        isActive: true,
        mustChangePassword: true,
        clientId: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            isApproved: true,
          },
        },
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mustChangePassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, mustChangePassword: false },
    });

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'CHANGE_PASSWORD',
        entityType: 'User',
        entityId: user.id,
      },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  me,
  changePassword,
};
