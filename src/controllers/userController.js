const prisma = require('../utils/prisma');

/**
 * GET /api/admin/landlords
 */
async function getLandlords(req, res) {
  try {
    const landlords = await prisma.user.findMany({
      where: { role: 'LANDLORD' },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        whatsapp: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ landlords });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/admin/tenants
 */
async function getTenants(req, res) {
  try {
    const tenants = await prisma.user.findMany({
      where: { role: 'TENANT' },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        whatsapp: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tenants });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/admin/stats
 */
async function getStats(req, res) {
  try {
    const [landlords, tenants, published, pending, visits] = await Promise.all([
      prisma.user.count({ where: { role: 'LANDLORD' } }),
      prisma.user.count({ where: { role: 'TENANT' } }),
      prisma.listing.count({ where: { status: 'PUBLISHED' } }),
      prisma.listing.count({ where: { status: 'PENDING' } }),
      prisma.visit.count({ where: { status: 'SUCCESS' } }),
    ]);
    res.json({ landlords, tenants, published, pending, visits });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getLandlords, getTenants, getStats };
