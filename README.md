# LookForHome – Frontend Prototype

Site web immobilier pour bailleurs, locataires et administrateurs.

## Structure des fichiers (après extraction CSS/JS)

```
lookforhome/
├── assets/
│   └── logo-lookforhome.jpg          ← Logo du site
├── css/
│   └── styles.css                    ← Styles communs (flou, police, etc.)
├── js/
│   ├── common.js                     ← Fonctions partagées (logout, auth)
│   ├── index.js                      ← Page d'accueil + modal confidentialité
│   ├── login.js                      ← Connexion
│   ├── register.js                   ← Inscription
│   ├── landlord.js                   ← Dashboard Bailleur
│   ├── tenant.js                     ← Dashboard Locataire (paiement + flou)
│   └── admin.js                      ← Dashboard Admin
├── pages/
│   ├── index.html                    ← Accueil
│   ├── login.html
│   ├── register.html
│   ├── landlord-dashboard.html
│   ├── tenant-dashboard.html
│   ├── admin-dashboard.html
│   └── privacy.html
└── README.md
```

## Comment ouvrir dans VS Code

1. Télécharge le dossier `lookforhome` (ou le ZIP).
2. Ouvre VS Code → **Fichier → Ouvrir un dossier…** → sélectionne `lookforhome`.
3. Installe l’extension **Live Server**.
4. Clic droit sur `pages/index.html` → **Open with Live Server**.

## Où modifier quoi

| Besoin | Fichier |
|--------|---------|
| Couleurs / design global | Tailwind config dans chaque HTML (ou `css/styles.css`) |
| Styles personnalisés (flou, etc.) | `css/styles.css` |
| Logique page d’accueil | `js/index.js` |
| Connexion | `js/login.js` |
| Inscription | `js/register.js` |
| Formulaire bailleur | `js/landlord.js` |
| Déblocage + paiement + favoris | `js/tenant.js` |
| Onglets admin | `js/admin.js` |
| Déconnexion / auth | `js/common.js` |
| Contenu HTML | fichiers dans `pages/` |

## Notes

- Tailwind CSS est toujours chargé via CDN (pas de build nécessaire pour l’instant).
- Les données sont simulées avec `localStorage`.
- Les logements débloqués restent accessibles grâce à `localStorage` (`unlocked_1`, `unlocked_2`…).
- Une fois le backend prêt, on remplacera les `alert()` et le localStorage par de vrais appels API.
