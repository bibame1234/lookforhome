/* ========================================
   LookForHome – Dashboard Locataire
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

let currentListingId = null;
let currentListingPrice = 2000;
let lightboxImages = [];
let lightboxIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  loadListings();
  setupLightbox();
  setupFavorites();
  setupFilters();
});

function setupFilters() {
  const btn = document.getElementById('filterBtn');
  const typeEl = document.getElementById('filterType');
  const neighEl = document.getElementById('filterNeighborhood');
  if (btn) {
    btn.addEventListener('click', () => {
      const params = {};
      if (typeEl && typeEl.value) params.type = typeEl.value;
      if (neighEl && neighEl.value.trim()) params.neighborhood = neighEl.value.trim();
      loadListings(params);
    });
  }
  if (neighEl) {
    neighEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btn && btn.click();
    });
  }
}

/* ---------- Lightbox ---------- */
function setupLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) {
    // Créer le lightbox s'il n'existe pas dans le HTML
    const div = document.createElement('div');
    div.id = 'lightbox';
    div.className = 'fixed inset-0 z-[60] hidden items-center justify-center bg-black/90 p-4';
    div.innerHTML = `
      <button id="lightboxClose" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white text-2xl hover:bg-white/30 flex items-center justify-center z-10">&times;</button>
      <button id="lightboxPrev" class="absolute left-2 md:left-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 text-white text-2xl hover:bg-white/30 flex items-center justify-center z-10">&#10094;</button>
      <button id="lightboxNext" class="absolute right-2 md:right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 text-white text-2xl hover:bg-white/30 flex items-center justify-center z-10">&#10095;</button>
      <img id="lightboxImg" src="" alt="" class="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none">
      <div id="lightboxCounter" class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-1.5 rounded-full"></div>
    `;
    document.body.appendChild(div);
  }

  document.getElementById('lightboxClose').onclick = closeLightbox;
  document.getElementById('lightboxPrev').onclick = () => navLightbox(-1);
  document.getElementById('lightboxNext').onclick = () => navLightbox(1);

  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navLightbox(-1);
    if (e.key === 'ArrowRight') navLightbox(1);
  });
}

function openLightbox(images, startIndex) {
  if (!images || !images.length) return;
  lightboxImages = images;
  lightboxIndex = startIndex || 0;
  updateLightboxImage();
  const lb = document.getElementById('lightbox');
  lb.classList.remove('hidden');
  lb.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.add('hidden');
  lb.classList.remove('flex');
  document.body.style.overflow = '';
}

function navLightbox(dir) {
  if (!lightboxImages.length) return;
  lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
  updateLightboxImage();
}

function updateLightboxImage() {
  const img = document.getElementById('lightboxImg');
  const counter = document.getElementById('lightboxCounter');
  if (img) {
    img.src = lightboxImages[lightboxIndex];
  }
  if (counter) {
    counter.textContent = (lightboxIndex + 1) + ' / ' + lightboxImages.length;
  }
}

/* ---------- Listings ---------- */
async function loadListings(params) {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  grid.innerHTML = '<p class="text-secondary col-span-full text-center py-8">Chargement des annonces...</p>';

  try {
    const data = await ListingsAPI.published(params || {});
    const listings = data.listings || [];

    if (listings.length === 0) {
      grid.innerHTML = '<p class="text-secondary col-span-full text-center py-8">Aucune annonce publiée pour le moment.<br><span class="text-xs">Les soumissions bailleurs doivent d\'abord être approuvées par l\'admin.</span></p>';
      return;
    }

    grid.innerHTML = listings.map(renderCard).join('');
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<p class="text-red-600 col-span-full text-center py-8">Erreur : ' + (err.message || 'Impossible de charger') + '</p>';
  }
}

function renderCard(l) {
  const unlocked = !!l.isUnlocked;
  const typeLabel = l.typeLabel || TYPE_LABELS[l.type] || l.type;
  const tags = [];
  if (l.bedrooms) tags.push(l.bedrooms + ' chambre' + (l.bedrooms > 1 ? 's' : ''));
  if (l.bathrooms) tags.push(l.bathrooms + ' douche' + (l.bathrooms > 1 ? 's' : ''));
  if (l.livingRooms) tags.push(l.livingRooms + ' salon' + (l.livingRooms > 1 ? 's' : ''));
  if (l.hasWater) tags.push('Eau ✓');
  if (l.hasElectricity) tags.push('Électricité ✓');

  const images = (unlocked && Array.isArray(l.images)) ? l.images.filter(Boolean) : [];
  const hasPhotos = images.length > 0;
  const imgSrc = hasPhotos
    ? images[0]
    : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop';

  const whatsapp = l.landlord && l.landlord.whatsapp
    ? String(l.landlord.whatsapp).replace('+', '')
    : '';

  const imagesData = hasPhotos ? encodeURIComponent(JSON.stringify(images)) : '';

  let thumbs = '';
  if (hasPhotos && images.length > 1) {
    thumbs = '<div class="flex gap-1 mt-3 overflow-x-auto pb-1 photo-thumbs">';
    images.forEach(function (src, i) {
      thumbs += '<img src="' + src + '" data-index="' + i + '" class="thumb-img w-14 h-14 object-cover rounded-lg border border-light flex-shrink-0 cursor-pointer hover:opacity-80 transition">';
    });
    thumbs += '</div>';
  }

  let contactBtn = '';
  if (unlocked && whatsapp) {
    contactBtn = '<a href="https://wa.me/' + whatsapp + '" target="_blank" class="mt-3 w-full py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium text-center hover:bg-green-700 transition block">Contacter le bailleur par WhatsApp</a>';
  }

  let actionRow = '';
  if (unlocked) {
    actionRow = '<span class="text-green-600 font-semibold text-sm">✓ Déjà débloqué</span>';
  } else {
    actionRow = '<span class="text-accent font-semibold text-sm">Visite : ' + (l.visitPrice || 2000) + ' FCFA</span>' +
      '<button type="button" class="unlock-btn px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-secondary transition" data-id="' + l.id + '" data-price="' + (l.visitPrice || 2000) + '">Débloquer</button>';
  }

  return (
    '<article class="listing-card bg-white rounded-2xl overflow-hidden shadow-sm border border-light/60" data-id="' + l.id + '" data-images="' + imagesData + '">' +
      '<div class="relative h-52 overflow-hidden bg-light">' +
        '<img src="' + imgSrc + '" class="main-photo w-full h-full object-cover ' + (unlocked ? 'cursor-pointer' : 'blurred') + '" alt="">' +
        (!unlocked
          ? '<div class="lock-overlay absolute inset-0 bg-primary/50 flex flex-col items-center justify-center gap-2">' +
              '<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>' +
              '<span class="text-white text-sm font-medium">Photos verrouillées</span>' +
            '</div>'
          : '') +
        '<span class="absolute top-3 left-3 bg-accent text-white text-xs font-medium px-2.5 py-1 rounded-lg">' + typeLabel + '</span>' +
        (hasPhotos ? '<span class="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">' + images.length + ' photo' + (images.length > 1 ? 's' : '') + '</span>' : '') +
        '<button type="button" class="fav-toggle absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-secondary hover:text-red-500 transition">' +
          '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="p-5">' +
        '<h3 class="font-semibold text-primary mb-1">' + typeLabel + ' – ' + (l.neighborhood || '') + '</h3>' +
        '<p class="text-sm text-secondary mb-3">Quartier ' + (l.neighborhood || '') + '</p>' +
        '<div class="flex flex-wrap gap-1.5 text-xs mb-4">' +
          tags.map(function (t) { return '<span class="bg-bg px-2 py-1 rounded text-secondary">' + t + '</span>'; }).join('') +
        '</div>' +
        '<p class="text-sm text-secondary mb-4 line-clamp-2">' + (l.description || '') + '</p>' +
        '<div class="flex items-center justify-between gap-2">' + actionRow + '</div>' +
        thumbs +
        contactBtn +
      '</div>' +
    '</article>'
  );
}

/* ---------- Clics (délégation) ---------- */
document.addEventListener('click', function (e) {
  // Photo principale → lightbox
  const mainPhoto = e.target.closest('.main-photo');
  if (mainPhoto && !mainPhoto.classList.contains('blurred')) {
    const card = mainPhoto.closest('.listing-card');
    if (card && card.dataset.images) {
      try {
        const images = JSON.parse(decodeURIComponent(card.dataset.images));
        openLightbox(images, 0);
      } catch (err) {}
    }
    return;
  }

  // Miniature → lightbox
  const thumb = e.target.closest('.thumb-img');
  if (thumb) {
    const card = thumb.closest('.listing-card');
    if (card && card.dataset.images) {
      try {
        const images = JSON.parse(decodeURIComponent(card.dataset.images));
        const idx = Number(thumb.dataset.index) || 0;
        openLightbox(images, idx);
      } catch (err) {}
    }
    return;
  }

  // Bouton débloquer
  const unlockBtn = e.target.closest('.unlock-btn');
  if (unlockBtn) {
    unlockListing(unlockBtn.dataset.id, Number(unlockBtn.dataset.price) || 2000);
    return;
  }
});

function setupFavorites() {
  document.addEventListener('click', async function (e) {
    const favBtn = e.target.closest('.fav-toggle');
    if (!favBtn) return;
    e.stopPropagation();
    const card = favBtn.closest('.listing-card');
    const id = card && card.dataset.id;
    if (!id) return;
    try {
      if (favBtn.classList.contains('text-red-500')) {
        await FavoritesAPI.remove(id);
        favBtn.classList.remove('text-red-500');
        favBtn.querySelector('svg') && favBtn.querySelector('svg').setAttribute('fill', 'none');
      } else {
        await FavoritesAPI.add(id);
        favBtn.classList.add('text-red-500');
        favBtn.querySelector('svg') && favBtn.querySelector('svg').setAttribute('fill', 'currentColor');
      }
    } catch (err) {
      alert('Erreur favoris : ' + err.message);
    }
  });
}

/* ---------- Paiement ---------- */
function unlockListing(id, price) {
  currentListingId = id;
  currentListingPrice = price || 2000;
  const el = document.getElementById('payAmount');
  if (el) el.textContent = currentListingPrice + ' FCFA';
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closePayment() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function confirmPayment() {
  try {
    await VisitsAPI.unlock(currentListingId, 'MTN_MOMO');
    closePayment();
    alert('Paiement réussi ! Les photos sont maintenant débloquées.');
    loadListings();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

/* ---------- Support ---------- */
function openSupport() {
  const modal = document.getElementById('supportModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeSupport() {
  const modal = document.getElementById('supportModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function sendSupport() {
  const textarea = document.querySelector('#supportModal textarea');
  const message = textarea && textarea.value.trim();
  if (!message) {
    alert('Écrivez votre message.');
    return;
  }
  try {
    await SupportAPI.send(message);
    alert('Message envoyé au service client.');
    closeSupport();
    if (textarea) textarea.value = '';
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}
