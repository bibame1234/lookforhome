const TYPE_LABELS = {
  CHAMBRE_MODERNE:'Chambre moderne',CHAMBRE_SIMPLE:'Chambre simple',
  STUDIO_MODERNE:'Studio moderne',STUDIO_SIMPLE:'Studio simple',
  APPARTEMENT_MODERNE:'Appartement moderne',APPARTEMENT_SIMPLE:'Appartement simple',
  LOCAL_COMMERCE:'Local commerce',LOCAL_AUTRE:'Local autre',
};
const PLACEHOLDER = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop';

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('privacyModal');
  const checkbox = document.getElementById('acceptPrivacy');
  const btn = document.getElementById('acceptBtn');
  if (modal && localStorage.getItem('privacyAccepted') === 'true') modal.classList.add('hidden');
  if (checkbox && btn) {
    checkbox.addEventListener('change', () => { btn.disabled = !checkbox.checked; });
    btn.addEventListener('click', () => {
      if (checkbox.checked) { localStorage.setItem('privacyAccepted','true'); modal.classList.add('hidden'); }
    });
  }
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

  const track = document.getElementById('homeListings');
  const prev = document.getElementById('carouselPrev');
  const next = document.getElementById('carouselNext');
  if (prev && track) prev.addEventListener('click', () => track.scrollBy({ left: -320, behavior: 'smooth' }));
  if (next && track) next.addEventListener('click', () => track.scrollBy({ left: 320, behavior: 'smooth' }));

  loadHomeListings();
});

function buildCard(l) {
  const typeLabel = l.typeLabel || TYPE_LABELS[l.type] || l.type || 'Logement';
  const price = (l.visitPrice || 2000).toLocaleString('fr-FR');
  return `<article class="carousel-card">
    <div class="relative h-44 overflow-hidden bg-light">
      <img src="${PLACEHOLDER}" alt="" class="w-full h-full object-cover blurred-img">
      <div class="absolute inset-0 bg-primary/35 flex items-center justify-center">
        <span class="bg-white/95 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">🔒 Verrouillé</span>
      </div>
      <span class="absolute top-3 left-3 bg-accent text-white text-xs font-medium px-2.5 py-1 rounded-lg">${typeLabel}</span>
    </div>
    <div class="p-4">
      <h3 class="font-semibold text-primary text-sm line-clamp-2">${typeLabel} – ${l.neighborhood||''}</h3>
      <p class="text-xs text-secondary mb-2">Quartier ${l.neighborhood||'—'}</p>
      <div class="flex justify-between items-center">
        <span class="text-accent font-semibold text-sm">${price} FCFA</span>
        <a href="login.html" class="text-xs font-medium text-primary">Voir →</a>
      </div>
    </div>
  </article>`;
}

async function loadHomeListings() {
  const track = document.getElementById('homeListings');
  if (!track) return;
  let listings = [];
  try {
    if (typeof ListingsAPI !== 'undefined') {
      const data = await ListingsAPI.published({ limit: 20 });
      listings = data.listings || [];
    }
  } catch (e) { console.warn(e); }
  if (!listings.length) {
    track.innerHTML = '<p class="text-secondary px-8 py-12">Aucune annonce publiée pour le moment.</p>';
    return;
  }
  track.innerHTML = listings.map(buildCard).join('');
}
