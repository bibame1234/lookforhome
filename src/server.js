require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const prisma = require('./utils/prisma');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir les images uploadées
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({
    name: 'LookForHome API',
    version: '1.0.0',
    status: 'running',
    docs: '/api',
  });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Maximum 10 images autorisées' });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Chaque image doit faire moins de 5 Mo' });
    }
  }
  res.status(500).json({ error: err.message || 'Erreur interne du serveur' });
});

async function start() {
  try {
    await prisma.$connect();
    console.log('✅ Connexion à la base de données OK');

    const settings = await prisma.setting.findFirst();
    if (!settings) {
      await prisma.setting.create({
        data: {
          defaultVisitPrice: Number(process.env.DEFAULT_VISIT_PRICE) || 2000,
          supportWhatsapp: process.env.SUPPORT_WHATSAPP || '+2376XXXXXXXX',
          supportSms: process.env.SUPPORT_SMS || '+2376XXXXXXXX',
          adminCode: process.env.ADMIN_CODE || 'LFH-ADMIN-2026',
        },
      });
      console.log('✅ Paramètres par défaut créés');
    }

    app.listen(PORT, () => {
      console.log(`🚀 LookForHome API démarrée sur http://localhost:${PORT}`);
      console.log(`   Environnement : ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Impossible de démarrer le serveur:', err.message);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
