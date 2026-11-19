const prisma = require('../utils/prisma');
const notifications = require('../services/notifications');

async function submit(req, res) {
  try {
    const { type, brand, model, plate, city, description, images } = req.body;
    if (!type || !city || !description) {
      return res.status(400).json({ error: 'Type, ville et description requis' });
    }
    const settings = await prisma.setting.findFirst();
    const contactPrice = settings?.contactFree ? 0 : (settings?.defaultContactPrice ?? 1000);

    const vehicle = await prisma.vehicle.create({
      data: {
        type,
        brand: brand || null,
        model: model || null,
        plate: plate || null,
        city,
        description: String(description).slice(0, 2000),
        images: Array.isArray(images) ? images.slice(0, 10) : [],
        contactPrice,
        status: 'PENDING',
        submittedById: req.user.id,
        driverId: req.user.id,
      },
    });
    res.status(201).json({ message: 'Véhicule soumis pour validation', vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function mySubmissions(req, res) {
  try {
    const list = await prisma.vehicle.findMany({
      where: { submittedById: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ vehicles: list });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function published(req, res) {
  try {
    const list = await prisma.vehicle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: {
        driver: { select: { id: true, name: true, whatsapp: true } },
      },
    });
    let unlockedIds = [];
    if (req.user) {
      const u = await prisma.unlockedVehicle.findMany({
        where: { userId: req.user.id },
        select: { vehicleId: true },
      });
      unlockedIds = u.map((x) => x.vehicleId);
    }
    const vehicles = list.map((v) => ({
      ...v,
      unlocked: unlockedIds.includes(v.id),
      driver: unlockedIds.includes(v.id) ? v.driver : undefined,
      images: unlockedIds.includes(v.id) ? v.images : (v.images?.length ? ['locked'] : []),
    }));
    res.json({ vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function adminList(req, res) {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: { select: { id: true, name: true, whatsapp: true, email: true } },
      },
    });
    res.json({ vehicles });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function approve(req, res) {
  try {
    const contactPrice = req.body.contactPrice;
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        contactPrice: contactPrice !== undefined ? Number(contactPrice) : undefined,
      },
      include: { submittedBy: { select: { whatsapp: true, name: true } } },
    });
    try {
      const phone = vehicle.submittedBy?.whatsapp;
      if (phone) {
        const msg = `LookForHome: votre véhicule (${vehicle.city}) a été approuvé et publié.`;
        if (notifications.isConfigured()) await notifications.send(phone, msg, 'WHATSAPP');
        else console.log('[Notif]', phone, msg);
      }
    } catch (e) {
      console.error(e.message);
    }
    res.json({ message: 'Véhicule publié', vehicle });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function reject(req, res) {
  try {
    const reason = req.body.reason || 'Non conforme';
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectReason: reason },
      include: { submittedBy: { select: { whatsapp: true, name: true } } },
    });
    try {
      const phone = vehicle.submittedBy?.whatsapp;
      if (phone) {
        const msg = `LookForHome: votre véhicule a été refusé. Motif: ${reason}`;
        if (notifications.isConfigured()) await notifications.send(phone, msg, 'WHATSAPP');
        else console.log('[Notif]', phone, msg);
      }
    } catch (e) {
      console.error(e.message);
    }
    res.json({ message: 'Véhicule refusé', vehicle });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { submit, mySubmissions, published, adminList, approve, reject };
