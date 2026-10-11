const prisma = require('../utils/prisma');

// Mapping des types pour l'API
const TYPE_LABELS = {
  CHAMBRE_MODERNE: 'Chambre moderne',
  CHAMBRE_SIMPLE: 'Chambre simple',
  STUDIO_MODERNE: 'Studio moderne',
  STUDIO_SIMPLE: 'Studio simple',
  APPARTEMENT_MODERNE: 'Appartement moderne',
  APPARTEMENT_SIMPLE: 'Appartement simple',
  LOCAL_COMMERCE: 'Local pour commerce',
  LOCAL_AUTRE: 'Local pour autre activité',
};

/**
 * POST /api/listings/submit  (Bailleur)
 * Soumet un logement → status PENDING
 */
async function submitListing(req, res) {
  try {
    const {
      type, bedrooms, bathrooms, livingRooms,
      hasWater, hasElectricity, neighborhood, description, images
    } = req.body;

    if (!type || !neighborhood || !description) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    // Vérifier si le type nécessite chambres/douches/salons
    const needsRooms = ['STUDIO_MODERNE', 'STUDIO_SIMPLE', 'APPARTEMENT_MODERNE', 'APPARTEMENT_SIMPLE'].includes(type);

    const listing = await prisma.listing.create({
      data: {
        type,
        bedrooms: needsRooms ? (bedrooms || null) : null,
        bathrooms: needsRooms ? (bathrooms || null) : null,
        livingRooms: needsRooms ? (livingRooms || null) : null,
        hasWater: hasWater !== false,
        hasElectricity: hasElectricity !== false,
        neighborhood,
        description: description.slice(0, 1500), // ~250 mots max
        images: images || [],
        status: 'PENDING',
        submittedById: req.user.id,
        landlordId: req.user.id,
      },
    });

    res.status(201).json({
      message: 'Soumission envoyée. Elle sera examinée par un administrateur.',
      listing,
    });
  } catch (err) {
    console.error('Submit listing error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/listings/my-submissions  (Bailleur)
 */
async function mySubmissions(req, res) {
  try {
    const listings = await prisma.listing.findMany({
      where: { submittedById: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * PUT /api/listings/:id  (Bailleur – modifier sa soumission)
 */
async function updateMyListing(req, res) {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: req.params.id, submittedById: req.user.id },
    });
    if (!listing) {
      return res.status(404).json({ error: 'Soumission introuvable' });
    }

    const data = { ...req.body };
    delete data.status; // le bailleur ne peut pas changer le statut
    delete data.id;

    const updated = await prisma.listing.update({
      where: { id: listing.id },
      data,
    });
    res.json({ message: 'Soumission mise à jour', listing: updated });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * DELETE /api/listings/:id  (Bailleur – supprimer sa soumission)
 */
async function deleteMyListing(req, res) {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: req.params.id, submittedById: req.user.id },
    });
    if (!listing) {
      return res.status(404).json({ error: 'Soumission introuvable' });
    }

    await prisma.listing.delete({ where: { id: listing.id } });
    res.json({ message: 'Soumission supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/listings  (Locataire – annonces publiées)
 * Query: type, neighborhood, page, limit
 */
async function getPublishedListings(req, res) {
  try {
    const { type, neighborhood, page = 1, limit = 20 } = req.query;
    const where = { status: 'PUBLISHED' };
    if (type) where.type = type;
    if (neighborhood) where.neighborhood = { contains: neighborhood, mode: 'insensitive' };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        select: {
          id: true,
          type: true,
          bedrooms: true,
          bathrooms: true,
          livingRooms: true,
          hasWater: true,
          hasElectricity: true,
          neighborhood: true,
          description: true,
          visitPrice: true,
          images: true,
          publishedAt: true,
          landlord: { select: { id: true, name: true, whatsapp: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // Si utilisateur connecté, indiquer lesquels sont débloqués
    let unlockedIds = [];
    if (req.user) {
      const unlocked = await prisma.unlockedListing.findMany({
        where: { userId: req.user.id },
        select: { listingId: true },
      });
      unlockedIds = unlocked.map(u => u.listingId);
    }

    const result = listings.map(l => {
      const isUnlocked = unlockedIds.includes(l.id);
      return {
        ...l,
        typeLabel: TYPE_LABELS[l.type] || l.type,
        isUnlocked,
        // Images réelles uniquement si débloqué
        images: isUnlocked ? (l.images || []) : [],
        imagesCount: (l.images || []).length,
        landlord: isUnlocked ? l.landlord : { id: l.landlord?.id },
      };
    });

    res.json({ listings: result, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/listings/:id  (détail – images selon déblocage)
 */
async function getListingById(req, res) {
  try {
    const listing = await prisma.listing.findFirst({
      where: { id: req.params.id, status: 'PUBLISHED' },
      include: {
        landlord: { select: { id: true, name: true, whatsapp: true } },
      },
    });
    if (!listing) {
      return res.status(404).json({ error: 'Annonce introuvable' });
    }

    let isUnlocked = false;
    if (req.user) {
      const unlock = await prisma.unlockedListing.findUnique({
        where: {
          userId_listingId: { userId: req.user.id, listingId: listing.id },
        },
      });
      isUnlocked = !!unlock;
    }

    res.json({
      listing: {
        ...listing,
        typeLabel: TYPE_LABELS[listing.type] || listing.type,
        isUnlocked,
        images: isUnlocked ? listing.images : [],
        imagesCount: listing.images.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * POST /api/listings  (Admin – publier directement)
 */
async function createPublishedListing(req, res) {
  try {
    const data = req.body;
    const validTypes = Object.keys(TYPE_LABELS);
    if (!data.type || !validTypes.includes(data.type)) {
      return res.status(400).json({ error: 'Type de logement invalide', received: data.type, valid: validTypes });
    }
    if (!data.neighborhood || !data.description) {
      return res.status(400).json({ error: 'Quartier et description obligatoires' });
    }
    const settings = await prisma.setting.findFirst();
    const visitPrice = data.visitPrice || settings?.defaultVisitPrice || 2000;

    const listing = await prisma.listing.create({
      data: {
        type: data.type,
        bedrooms: data.bedrooms || null,
        bathrooms: data.bathrooms || null,
        livingRooms: data.livingRooms || null,
        hasWater: data.hasWater !== false,
        hasElectricity: data.hasElectricity !== false,
        neighborhood: data.neighborhood,
        description: data.description,
        images: data.images || [],
        visitPrice,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        landlordId: data.landlordId || null,
      },
    });

    res.status(201).json({ message: 'Logement publié', listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/admin/submissions  (Admin – soumissions en attente)
 */
async function getPendingSubmissions(req, res) {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: { select: { id: true, name: true, email: true, whatsapp: true } },
      },
    });
    res.json({ submissions: listings });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * PATCH /api/admin/listings/:id/approve  (Admin)
 */
async function approveListing(req, res) {
  try {
    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        visitPrice: req.body.visitPrice || undefined,
      },
    });
    res.json({ message: 'Logement approuvé et publié', listing });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * PATCH /api/admin/listings/:id/reject  (Admin)
 */
async function rejectListing(req, res) {
  try {
    const listing = await prisma.listing.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    res.json({ message: 'Soumission rejetée', listing });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * DELETE /api/admin/listings/:id  (Admin – supprimer une publication)
 */
async function adminDeleteListing(req, res) {
  try {
    await prisma.listing.delete({ where: { id: req.params.id } });
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/admin/listings  (Admin – toutes les annonces publiées)
 */
async function adminGetListings(req, res) {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
    });
    res.json({ listings });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  submitListing,
  mySubmissions,
  updateMyListing,
  deleteMyListing,
  getPublishedListings,
  getListingById,
  createPublishedListing,
  getPendingSubmissions,
  approveListing,
  rejectListing,
  adminDeleteListing,
  adminGetListings,
  TYPE_LABELS,
};
