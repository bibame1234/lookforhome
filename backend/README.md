# LookForHome – Backend API

API REST Node.js + Express + Prisma + PostgreSQL.

## Prérequis

- Node.js 18+
- Compte PostgreSQL (local, Neon, Supabase, Railway…)

## Installation

```bash
cd backend
cp .env.example .env
# Éditer .env → coller votre DATABASE_URL
npm install
npx prisma generate
npx prisma db push
npm run db:seed          # crée un admin de test
npm run dev              # démarre sur http://localhost:4000
```

## Variables d'environnement importantes

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `JWT_SECRET` | Clé secrète pour les tokens |
| `ADMIN_CODE` | Code pour créer un compte admin (`LFH-ADMIN-2026`) |
| `DEFAULT_VISIT_PRICE` | Prix par défaut de la visite (FCFA) |

## Endpoints principaux

### Auth
- `POST /api/auth/register` – Inscription (LANDLORD | TENANT | ADMIN)
- `POST /api/auth/login` – Connexion
- `GET  /api/auth/me` – Profil (Bearer token)

### Locataire
- `GET  /api/listings` – Annonces publiées
- `POST /api/visits/unlock` – Payer / débloquer une visite
- `GET  /api/favorites` – Favoris
- `POST /api/support` – Écrire au service client

### Bailleur
- `POST /api/listings/submit` – Soumettre un logement
- `GET  /api/listings/my/submissions` – Mes soumissions
- `PUT  /api/listings/:id` – Modifier
- `DELETE /api/listings/:id` – Supprimer

### Admin
- `GET  /api/admin/stats`
- `GET  /api/admin/submissions` – Soumissions en attente
- `PATCH /api/admin/listings/:id/approve`
- `PATCH /api/admin/listings/:id/reject`
- `POST /api/admin/listings` – Publier directement
- `GET  /api/admin/landlords` / `tenants` / `visits`
- `PUT  /api/admin/settings`
- `POST /api/admin/notifications` – SMS + WhatsApp (simulation)

## Authentification

Toutes les routes protégées attendent :
```
Authorization: Bearer <token>
```

## Prochaines étapes

1. Brancher **Campay** ou **CamerPay** (webhook de confirmation de paiement)
2. Brancher **Twilio** pour les vrais SMS / WhatsApp
3. Upload d'images (Cloudinary ou S3)
4. Connecter le frontend HTML aux endpoints via `fetch`
