const prisma = require('../utils/prisma');

/**
 * POST /api/favorites
 * Body: { listingId }
 */
async function addFavorite(req, res) {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: 'listingId requis' });

    const fav = await prisma.favorite.upsert({
      where: {
        userId_listingId: { userId: req.user.id, listingId },
      },
      create: { userId: req.user.id, listingId },
      update: {},
    });
    res.status(201).json({ message: 'Ajouté aux favoris', favorite: fav });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * DELETE /api/favorites/:listingId
 */
async function removeFavorite(req, res) {
  try {
    await prisma.favorite.deleteMany({
      where: { userId: req.user.id, listingId: req.params.listingId },
    });
    res.json({ message: 'Retiré des favoris' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/favorites
 */
async function getFavorites(req, res) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          select: {
            id: true,
            type: true,
            neighborhood: true,
            visitPrice: true,
            images: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { addFavorite, removeFavorite, getFavorites };
