/* LookForHome – Accueil Noël + carrousel annonces publiées */

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
  const modal = document.getElementById('privacyModal');
  const checkbox = document.getElementById('acceptPrivacy');
  const btn = document.getElementById('acceptBtn');

  if (modal && localStorage.getItem('privacyAccepted') === 'true') {
    modal.classList.add('hidden');
  }

  if (checkbox && btn) {
    checkbox.addEventListener('change', () => {
      btn.disabled = !checkbox.checked;
    });
    btn.addEventListener('click', () => {
      if (checkbox.checked) {
        localStorage.setItem('privacyAccepted', 'true');
        modal.classList.add('hidden');
      }
    });
  }

  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  }

  spawnSnowflakes();
  loadHomeListings();
  setupCarouselControls();
});

function spawnSnowflakes() {
  const box = document.getElementById('snowContainer');
  if (!box) return;
  const flakes = ['❄', '✦', '❅'];
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('span');
    s.className = 'snowflake';
    s.textContent = flakes[i % flakes.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDuration = 8 + Math.random() * 12 + 's';
    s.style.animationDelay = Math.random() * 8 + 's';
    s.style.fontSize = 0.6 + Math.random() * 0.9 + 'rem';
    box.appendChild(s);
  }
}

function setupCarouselControls() {
  const track = document.getElementById('homeListings');
  const prev = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  if (!track) return;
  const step = 320;
  function nudge(dir) {
    track.style.animation = 'none';
    const style = window.getComputedStyle(track);
    const matrix = style.transform;
    let x = 0;
    if (matrix && matrix !== 'none') {
      const m = matrix.match(/matrix.*\((.+)\)/);
      if (m) x = parseFloat(m[1].split(', ')[4]) || 0;
    }
    track.style.transform = 'translateX(' + (x + dir * step) + 'px)';
    setTimeout(() => {
      track.style.animation = '';
      track.style.transform = '';
    }, 6000);
  }
  if (prev) prev.addEventListener('click', () => nudge(1));
  if (next) next.addEventListener('click', () => nudge(-1));
}

function imageUrl(l) {
  if (l.images && l.images.length) {
    const img = l.images[0];
    if (typeof img === 'string' && img.startsWith('http')) return img;
    if (typeof API_BASE !== 'undefined') {
      const base = API_BASE.replace(/\/api\/?$/, '');
      return base + (img.startsWith('/') ? img : '/uploads/' + img);
    }
  }
  return PLACEHOLDER_IMG;
}

function buildCard(l) {
  const typeLabel = l.typeLabel || TYPE_LABELS[l.type] || l.type || 'Logement';
  const tags = [];
  if (l.bedrooms) tags.push(l.bedrooms + ' ch.');
  if (l.bathrooms) tags.push(l.bathrooms + ' douche' + (l.bathrooms > 1 ? 's' : ''));
  if (l.hasWater) tags.push('Eau');
  if (l.hasElectricity) tags.push('Élec.');
  const price = (l.visitPrice || 2000).toLocaleString('fr-FR');
  const src = imageUrl(l);

  return (
    '<article class="carousel-card">' +
      '<div class="relative h-44 overflow-hidden bg-light">' +
        '<img src="' + src + '" alt="" class="w-full h-full object-cover blurred-img" onerror="this.src=\'' + PLACEHOLDER_IMG + '\'">' +
        '<div class="absolute inset-0 bg-primary/35 flex items-center justify-center">' +
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
        '<p class="text-xs text-secondary mb-2">Quartier ' + (l.neighborhood || '—') + '</p>' +
        '<div class="flex flex-wrap gap-1 text-[11px] text-secondary mb-3">' +
          tags.map(function (t) {
            return '<span class="bg-bg px-2 py-0.5 rounded">' + t + '</span>';
          }).join('') +
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

  let listings = [];
  try {
    if (typeof ListingsAPI !== 'undefined') {
      const data = await ListingsAPI.published({ limit: 12 });
      listings = data.listings || data || [];
      if (!Array.isArray(listings)) listings = [];
    }
  } catch (err) {
    console.warn('Annonces API:', err);
  }

  if (!listings.length) {
    track.innerHTML =
      '<p class="text-secondary px-8 py-12 text-center max-w-md">' +
      'Aucune annonce publiée pour le moment. Connectez-vous en tant que locataire pour voir les logements disponibles.' +
      '</p>';
    return;
  }

  // Boucle infinie : doubler les cartes
  const html = listings.map(buildCard).join('');
  track.innerHTML = html + html;
}
