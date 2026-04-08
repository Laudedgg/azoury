const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'azoury-super-secret-jwt-key-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'azoury-refresh-secret-key-2024';

function generateTokens(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    clientId: user.clientId || null,
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
