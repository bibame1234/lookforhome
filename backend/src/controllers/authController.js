const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { signToken } = require('../utils/jwt');

/**
 * POST /api/auth/register
 * Body: { name, firstName?, email, password?, gender, whatsapp, role, adminCode? }
 */
async function register(req, res) {
  try {
    const { name, firstName, email, password, gender, whatsapp, role, adminCode } = req.body;

    // Validation basique
    if (!name || !email || !whatsapp || !role) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const allowedRoles = ['LANDLORD', 'TENANT', 'ADMIN'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide' });
    }

    // Vérifier le code admin
    if (role === 'ADMIN') {
      const settings = await prisma.setting.findFirst();
      const expectedCode = settings?.adminCode || process.env.ADMIN_CODE || 'LFH-ADMIN-2026';
      if (adminCode !== expectedCode) {
        return res.status(403).json({ error: 'Code administrateur incorrect' });
      }
    } else {
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Mot de passe minimum 6 caractères' });
      }
    }

    // Email déjà utilisé ?
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = role === 'ADMIN'
      ? await bcrypt.hash(adminCode || 'admin-temp', 10)
      : await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        firstName: firstName || null,
        email,
        password: hashedPassword,
        gender: gender || null,
        whatsapp,
        role,
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        email: true,
        gender: true,
        whatsapp: true,
        role: true,
        createdAt: true,
      },
    });

    const token = signToken({ userId: user.id, role: user.role });

    res.status(201).json({
      message: 'Compte créé avec succès',
      user,
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password, role?, adminCode? }
 */
async function login(req, res) {
  try {
    const { email, password, role, adminCode } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Vérification du mot de passe / code admin
    let valid = false;
    if (user.role === 'ADMIN') {
      const settings = await prisma.setting.findFirst();
      const expectedCode = settings?.adminCode || process.env.ADMIN_CODE || 'LFH-ADMIN-2026';
      // L'admin peut se connecter avec le code admin ou son mot de passe
      valid = adminCode === expectedCode || (password && await bcrypt.compare(password, user.password));
    } else {
      if (!password) {
        return res.status(400).json({ error: 'Mot de passe requis' });
      }
      valid = await bcrypt.compare(password, user.password);
    }

    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Optionnel : vérifier que le rôle demandé correspond
    if (role && role !== user.role) {
      return res.status(403).json({ error: 'Rôle incorrect pour ce compte' });
    }

    const token = signToken({ userId: user.id, role: user.role });

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        email: user.email,
        gender: user.gender,
        whatsapp: user.whatsapp,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * GET /api/auth/me
 * Retourne le profil de l'utilisateur connecté
 */
async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };
