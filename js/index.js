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

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop';

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
  const menuBtn =
    document.getElementById('mobileMenuBtn') || document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // ---------- Annonces (carrousel) ----------
  loadHomeListings();
  setupCarouselControls();
});

function setupCarouselControls() {
  const track = document.getElementById('homeListings');
  const prev = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  if (!track) return;

  const step = 320;
  if (prev) {
    prev.addEventListener('click', () => {
      track.style.animation = 'none';
      track.scrollBy ? null : null;
      // décalage manuel via transform temporaire
      const current = getTranslateX(track);
      track.style.transform = 'translateX(' + (current + step) + 'px)';
      setTimeout(() => {
        track.style.animation = '';
        track.style.transform = '';
      }, 8000);
    });
  }
  if (next) {
    next.addEventListener('click', () => {
      track.style.animation = 'none';
      const current = getTranslateX(track);
      track.style.transform = 'translateX(' + (current - step) + 'px)';
      setTimeout(() => {
        track.style.animation = '';
        track.style.transform = '';
      }, 8000);
    });
  }
}

function getTranslateX(el) {
  const style = window.getComputedStyle(el);
  const matrix = style.transform || style.webkitTransform;
  if (!matrix || matrix === 'none') return 0;
  const values = matrix.match(/matrix.*\((.+)\)/);
  if (!values) return 0;
  const parts = values[1].split(', ');
  return parts.length === 6 ? parseFloat(parts[4]) : 0;
}

function buildCard(l) {
  const typeLabel = l.typeLabel || TYPE_LABELS[l.type] || l.type;
  const tags = [];
  if (l.bedrooms) tags.push(l.bedrooms + ' ch.');
  if (l.bathrooms) tags.push(l.bathrooms + ' douche' + (l.bathrooms > 1 ? 's' : ''));
  if (l.hasWater) tags.push('Eau');
  if (l.hasElectricity) tags.push('Élec.');

  const price = (l.visitPrice || 2000).toLocaleString('fr-FR');

  return (
    '<article class="carousel-card">' +
      '<div class="relative h-44 overflow-hidden bg-light">' +
        '<img src="' + PLACEHOLDER_IMG + '" alt="" class="w-full h-full object-cover blurred-img">' +
        '<div class="absolute inset-0 bg-primary/40 flex items-center justify-center">' +
          '<span class="bg-white/95 text-primary text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">🔒 Photos verrouillées</span>' +
        '</div>' +
        '<span class="absolute top-3 left-3 bg-accent text-white text-xs font-medium px-2.5 py-1 rounded-lg">' +
          typeLabel +
        '</span>' +
      '</div>' +
      '<div class="p-4">' +
        '<h3 class="font-semibold text-primary text-sm mb-0.5 line-clamp-2">' +
          typeLabel + ' – ' + (l.neighborhood || '') +
        '</h3>' +
        '<p class="text-xs text-secondary mb-2">Quartier ' + (l.neighborhood || '') + '</p>' +
        '<div class="flex flex-wrap gap-1 text-[11px] text-secondary mb-3">' +
          tags
            .map(function (t) {
              return '<span class="bg-bg px-2 py-0.5 rounded">' + t + '</span>';
            })
            .join('') +
        '</div>' +
        '<div class="flex items-center justify-between">' +
          '<span class="text-accent font-semibold text-sm">' + price + ' FCFA</span>' +
          '<a href="login.html" class="text-xs font-medium text-primary hover:text-accent">Voir →</a>' +
        '</div>' +
      '</div>' +
    '</article>'
  );
}

async function loadHomeListings() {
  const track = document.getElementById('homeListings');
  if (!track) return;

  // Données de secours (si API indisponible) pour garder le carrousel vivant
  const fallback = [
    { type: 'STUDIO_MODERNE', neighborhood: 'Akwa', bedrooms: 1, bathrooms: 1, hasWater: true, hasElectricity: true, visitPrice: 2000 },
    { type: 'APPARTEMENT_MODERNE', neighborhood: 'Bonanjo', bedrooms: 3, bathrooms: 2, hasWater: true, hasElectricity: true, visitPrice: 2500 },
    { type: 'CHAMBRE_MODERNE', neighborhood: 'Deido', bedrooms: 1, bathrooms: 1, hasWater: true, hasElectricity: true, visitPrice: 1500 },
    { type: 'STUDIO_SIMPLE', neighborhood: 'Makepe', bedrooms: 1, bathrooms: 1, hasWater: true, hasElectricity: false, visitPrice: 1500 },
    { type: 'APPARTEMENT_SIMPLE', neighborhood: 'Bonapriso', bedrooms: 2, bathrooms: 1, hasWater: true, hasElectricity: true, visitPrice: 2000 },
    { type: 'LOCAL_COMMERCE', neighborhood: 'New Bell', hasWater: true, hasElectricity: true, visitPrice: 3000 },
  ];

  let listings = [];
  try {
    if (typeof ListingsAPI !== 'undefined') {
      const data = await ListingsAPI.published({ limit: 12 });
      listings = data.listings || [];
    }
  } catch (err) {
    console.warn('API annonces indisponible, affichage démo', err);
  }

  if (!listings.length) {
    listings = fallback;
  }

  // Doubler les cartes pour boucle infinie fluide
  const cards = listings.map(buildCard).join('') + listings.map(buildCard).join('');
  track.innerHTML = cards;
}
