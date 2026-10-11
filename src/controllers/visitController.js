const prisma = require('../utils/prisma');

/**
 * POST /api/visits/unlock
 * Body: { listingId, paymentMethod?, transactionId? }
 *
 * Simule le paiement de la visite et débloque les images pour cet utilisateur.
 * En production : vérifier le webhook Campay/CamerPay avant de débloquer.
 */
async function unlockListing(req, res) {
  try {
    const { listingId, paymentMethod = 'MTN_MOMO', transactionId } = req.body;
    const userId = req.user.id;

    if (!listingId) {
      return res.status(400).json({ error: 'listingId requis' });
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, status: 'PUBLISHED' },
    });
    if (!listing) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    // Déjà débloqué ?
    const existing = await prisma.unlockedListing.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      return res.json({
        message: 'Ce logement est déjà débloqué pour vous',
        alreadyUnlocked: true,
        listing: { id: listing.id, images: listing.images },
      });
    }

    // Créer le déblocage + l'historique de visite (transaction)
    const [unlock, visit] = await prisma.$transaction([
      prisma.unlockedListing.create({
        data: { userId, listingId },
      }),
      prisma.visit.create({
        data: {
          userId,
          listingId,
          amount: listing.visitPrice,
          paymentMethod,
          transactionId: transactionId || `SIM-${Date.now()}`,
          status: 'SUCCESS',
        },
      }),
    ]);

    res.status(201).json({
      message: 'Visite payée avec succès. Les photos sont maintenant accessibles.',
      unlock,
      visit,
      listing: {
        id: listing.id,
        images: listing.images,
        landlordWhatsapp: undefined, // on le récupère côté détail
      },
    });
  } catch (err) {
    console.error('Unlock error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/visits/my-unlocks
 * Liste des logements débloqués par l'utilisateur
 */
async function myUnlocks(req, res) {
  try {
    const unlocks = await prisma.unlockedListing.findMany({
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
      orderBy: { unlockedAt: 'desc' },
    });
    res.json({ unlocks });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/admin/visits  (Admin – historique)
 */
async function adminGetVisits(req, res) {
  try {
    const visits = await prisma.visit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, whatsapp: true } },
        listing: { select: { id: true, type: true, neighborhood: true } },
      },
    });
    res.json({ visits });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * DELETE /api/admin/visits/:id  (Admin)
 */
async function adminDeleteVisit(req, res) {
  try {
    await prisma.visit.delete({ where: { id: req.params.id } });
    res.json({ message: 'Visite supprimée de l’historique' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * DELETE /api/admin/visits  (Admin – tout supprimer)
 */
async function adminClearVisits(req, res) {
  try {
    await prisma.visit.deleteMany();
    res.json({ message: 'Historique des visites vidé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  unlockListing,
  myUnlocks,
  adminGetVisits,
  adminDeleteVisit,
  adminClearVisits,
};
