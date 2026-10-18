const { verifyToken } = require('../utils/jwt');
const prisma = require('../utils/prisma');

/**
 * Middleware : vérifie le JWT et attache req.user
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = header.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        firstName: true,
        email: true,
        gender: true,
        whatsapp: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Utilisateur invalide ou désactivé' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}

/**
 * Middleware : autorise uniquement certains rôles
 * Ex: requireRole('ADMIN', 'LANDLORD')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  };
}




/**
 * Auth optionnelle : attache req.user si token présent, sinon continue
 */
async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next();
    }
    const token = header.split(' ')[1];
    const { verifyToken } = require('../utils/jwt');
    const prisma = require('../utils/prisma');
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true, name: true, firstName: true, email: true,
        gender: true, whatsapp: true, role: true, isActive: true,
      },
    });
    if (user && user.isActive) req.user = user;
  } catch (e) {
    // ignore invalid token
  }
  next();
}

module.exports = { authenticate, requireRole, optionalAuth };
