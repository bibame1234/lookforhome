const prisma = require('../utils/prisma');

/**
 * GET /api/settings  (public – prix visite + support)
 */
async function getPublicSettings(req, res) {
  try {
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }
    res.json({
      defaultVisitPrice: settings.defaultVisitPrice,
      supportWhatsapp: settings.supportWhatsapp,
      supportSms: settings.supportSms,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/admin/settings
 */
async function getAdminSettings(req, res) {
  try {
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * PUT /api/admin/settings
 */
async function updateSettings(req, res) {
  try {
    const { defaultVisitPrice, supportWhatsapp, supportSms, adminCode } = req.body;

    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }

    const updated = await prisma.setting.update({
      where: { id: settings.id },
      data: {
        defaultVisitPrice: defaultVisitPrice ?? settings.defaultVisitPrice,
        supportWhatsapp: supportWhatsapp ?? settings.supportWhatsapp,
        supportSms: supportSms ?? settings.supportSms,
        adminCode: adminCode ?? settings.adminCode,
      },
    });

    res.json({ message: 'Paramètres mis à jour', settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * POST /api/admin/notifications
 * Body: { targets: ['LANDLORD'|'TENANT'|'ALL'], channels: ['SMS'|'WHATSAPP'], message, userIds? }
 *
 * Pour l'instant : simulation (log en base).
 * Plus tard : brancher Twilio.
 */
async function sendNotifications(req, res) {
  try {
    const { targets = [], channels = ['SMS', 'WHATSAPP'], message, userIds } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    let users = [];
    if (userIds && userIds.length) {
      users = await prisma.user.findMany({
        where: { id: { in: userIds }, isActive: true },
        select: { id: true, name: true, whatsapp: true, role: true },
      });
    } else {
      const roleFilter = [];
      if (targets.includes('LANDLORD') || targets.includes('ALL')) roleFilter.push('LANDLORD');
      if (targets.includes('TENANT') || targets.includes('ALL')) roleFilter.push('TENANT');

      if (!roleFilter.length) {
        return res.status(400).json({ error: 'Aucun destinataire' });
      }

      users = await prisma.user.findMany({
        where: { role: { in: roleFilter }, isActive: true },
        select: { id: true, name: true, whatsapp: true, role: true },
      });
    }

    // Simulation d'envoi + log
    const logs = [];
    for (const user of users) {
      for (const channel of channels) {
        // TODO: appeler Twilio ici
        // await sendTwilioMessage(user.whatsapp, message, channel);
        const log = await prisma.notificationLog.create({
          data: {
            userId: user.id,
            channel,
            message,
            status: 'SENT', // simulé
          },
        });
        logs.push(log);
      }
    }

    res.json({
      message: `Notifications envoyées à ${users.length} utilisateur(s)`,
      sent: logs.length,
      usersCount: users.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * POST /api/support
 * Body: { message }
 * Message du locataire/bailleur vers le service client
 */
async function contactSupport(req, res) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message requis' });

    const settings = await prisma.setting.findFirst();

    // Log + simulation d'envoi vers le numéro support
    await prisma.notificationLog.create({
      data: {
        userId: req.user?.id || null,
        channel: 'WHATSAPP',
        message: `[Support] De ${req.user?.name || 'Anonyme'} (${req.user?.whatsapp || 'N/A'}): ${message}`,
        status: 'SENT',
      },
    });

    // TODO: envoyer vraiment sur settings.supportWhatsapp via Twilio

    res.json({
      message: 'Message envoyé au service client. Nous vous répondrons rapidement.',
      supportWhatsapp: settings?.supportWhatsapp,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
  sendNotifications,
  contactSupport,
};
