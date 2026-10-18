/* ========================================
   LookForHome – Page d'accueil
   ======================================== */

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

document.addEventListener('DOMContentLoaded', () => {
  // ---------- Politique de confidentialité ----------
  const modal = document.getElementById('privacyModal');
  const checkbox = document.getElementById('acceptPrivacy');
  const btn = document.getElementById('acceptBtn');

  if (modal && localStorage.getItem('privacyAccepted') === 'true') {
    modal.classList.add('hidden');
  }

  if (checkbox && btn) {
    checkbox.addEventListener('change', () => {
      btn.disabled = !checkbox.checked;
      if (checkbox.checked) {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
      }
    });

    btn.addEventListener('click', () => {
      if (checkbox.checked) {
        localStorage.setItem('privacyAccepted', 'true');
        modal.classList.add('hidden');
      }
    });
  }

  // ---------- Menu mobile ----------
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // ---------- Annonces publiées ----------
  loadHomeListings();
});

async function loadHomeListings() {
  const grid = document.getElementById('homeListings');
  if (!grid) return;

  try {
    const data = await ListingsAPI.published({ limit: 6 });
    const listings = data.listings || [];

    if (listings.length === 0) {
      grid.innerHTML = '<p class="text-secondary col-span-full text-center py-8">Aucune annonce publiée pour le moment.</p>';
      return;
    }

    grid.innerHTML = listings.map(function (l) {
      const typeLabel = l.typeLabel || TYPE_LABELS[l.type] || l.type;
      const tags = [];
      if (l.bedrooms) tags.push(l.bedrooms + ' chambre' + (l.bedrooms > 1 ? 's' : ''));
      if (l.bathrooms) tags.push(l.bathrooms + ' douche' + (l.bathrooms > 1 ? 's' : ''));
      if (l.hasWater) tags.push('Eau ✓');
      if (l.hasElectricity) tags.push('Électricité ✓');

      return (
        '<article class="bg-white rounded-2xl overflow-hidden shadow-sm border border-light/60 hover:shadow-md transition group">' +
          '<div class="relative h-48 overflow-hidden bg-light">' +
            '<img src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop" alt="" class="w-full h-full object-cover blurred-img group-hover:scale-105 transition duration-500">' +
            '<div class="absolute inset-0 bg-primary/40 flex items-center justify-center">' +
              '<span class="bg-white/90 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">🔒 Photos verrouillées</span>' +
            '</div>' +
            '<span class="absolute top-3 left-3 bg-accent text-white text-xs font-medium px-2.5 py-1 rounded-lg">' + typeLabel + '</span>' +
          '</div>' +
          '<div class="p-5">' +
            '<h3 class="font-semibold text-primary mb-1">' + typeLabel + ' – ' + (l.neighborhood || '') + '</h3>' +
            '<p class="text-sm text-secondary mb-3">Quartier ' + (l.neighborhood || '') + '</p>' +
            '<div class="flex flex-wrap gap-2 text-xs text-secondary mb-4">' +
              tags.map(function (t) { return '<span class="bg-bg px-2 py-1 rounded">' + t + '</span>'; }).join('') +
            '</div>' +
            '<div class="flex items-center justify-between">' +
              '<span class="text-accent font-semibold text-sm">Visite : ' + (l.visitPrice || 2000).toLocaleString('fr-FR') + ' FCFA</span>' +
              '<a href="login.html" class="text-sm font-medium text-primary hover:text-accent">Voir →</a>' +
            '</div>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="text-secondary col-span-full text-center py-8">Impossible de charger les annonces. Vérifiez que le backend est démarré.</p>';
  }
}
