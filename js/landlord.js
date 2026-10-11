/* ========================================
   LookForHome – Dashboard Bailleur (backend)
   ======================================== */

const TYPE_MAP = {
  chambre_moderne: 'CHAMBRE_MODERNE',
  chambre_simple: 'CHAMBRE_SIMPLE',
  studio_moderne: 'STUDIO_MODERNE',
  studio_simple: 'STUDIO_SIMPLE',
  appartement_moderne: 'APPARTEMENT_MODERNE',
  appartement_simple: 'APPARTEMENT_SIMPLE',
  local_commerce: 'LOCAL_COMMERCE',
  local_autre: 'LOCAL_AUTRE',
};

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

const STATUS_LABELS = {
  PENDING: { text: 'En attente', class: 'bg-yellow-100 text-yellow-800' },
  PUBLISHED: { text: 'Publié', class: 'bg-green-100 text-green-800' },
  REJECTED: { text: 'Rejeté', class: 'bg-red-100 text-red-800' },
  ARCHIVED: { text: 'Archivé', class: 'bg-gray-100 text-gray-800' },
};

document.addEventListener('DOMContentLoaded', () => {
  // Vérifier la connexion
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  displayUserName();

  // ---------- Onglets ----------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-accent', 'text-white');
        b.classList.add('text-secondary');
      });
      btn.classList.add('bg-accent', 'text-white');
      btn.classList.remove('text-secondary');

      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');

      if (btn.dataset.tab === 'mysubs') loadMySubmissions();
      if (btn.dataset.tab === 'profile') loadProfile();
    });
  });

  // ---------- Champs conditionnels ----------
  const housingType = document.getElementById('housingType');
  const roomsFields = document.getElementById('roomsFields');

  if (housingType && roomsFields) {
    housingType.addEventListener('change', () => {
      const val = housingType.value;
      const show = ['studio_moderne', 'studio_simple', 'appartement_moderne', 'appartement_simple'].includes(val);
      roomsFields.classList.toggle('hidden', !show);
    });
  }


  // ---------- Prévisualisation photos (max 10) ----------
  let selectedFiles = [];
  const photosInput = document.getElementById('photos');
  const photoPreview = document.getElementById('photoPreview');
  const photoCount = document.getElementById('photoCount');
  const photoCountNum = document.getElementById('photoCountNum');

  if (photosInput) {
    photosInput.addEventListener('change', () => {
      const newFiles = Array.from(photosInput.files || []);
      selectedFiles = [...selectedFiles, ...newFiles].slice(0, 10);
      renderPhotoPreview();
      // Reset input pour pouvoir re-sélectionner les mêmes fichiers
      photosInput.value = '';
    });
  }

  function renderPhotoPreview() {
    if (!photoPreview) return;
    photoPreview.innerHTML = selectedFiles.map((file, i) => {
      const url = URL.createObjectURL(file);
      return `
        <div class="relative aspect-square rounded-lg overflow-hidden border border-light group">
          <img src="${url}" class="w-full h-full object-cover" alt="">
          <button type="button" data-idx="${i}" class="remove-photo absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-90 hover:opacity-100">×</button>
        </div>
      `;
    }).join('');

    if (photoCount && photoCountNum) {
      photoCountNum.textContent = selectedFiles.length;
      photoCount.classList.toggle('hidden', selectedFiles.length === 0);
    }

    photoPreview.querySelectorAll('.remove-photo').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedFiles.splice(Number(btn.dataset.idx), 1);
        renderPhotoPreview();
      });
    });
  }

  // ---------- Compteur de mots ----------
  const desc = document.getElementById('description');
  const wordCount = document.getElementById('wordCount');
  if (desc && wordCount) {
    desc.addEventListener('input', () => {
      const words = desc.value.trim().split(/\s+/).filter(w => w).length;
      wordCount.textContent = words;
      wordCount.classList.toggle('text-red-600', words > 250);
    });
  }

  // ---------- Soumission ----------
  const listingForm = document.getElementById('listingForm');
  if (listingForm) {
    listingForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const typeUI = housingType.value;
      const type = TYPE_MAP[typeUI];
      if (!type) {
        alert('Veuillez sélectionner un type de logement.');
        return;
      }

      const selects = roomsFields.querySelectorAll('select');
      const bedrooms = selects[0]?.value ? Number(selects[0].value) : null;
      const bathrooms = selects[1]?.value ? Number(selects[1].value) : null;
      const livingRooms = selects[2]?.value ? Number(selects[2].value) : null;

      const waterSelect = listingForm.querySelectorAll('.grid.sm\\:grid-cols-2 select')[0]
        || listingForm.querySelectorAll('select')[1];
      // Plus fiable : trouver par label parent
      const allSelects = listingForm.querySelectorAll('select');
      // housingType = 0, then rooms 1-3 if visible, then water, electricity
      let waterVal = 'oui';
      let elecVal = 'oui';
      const formSelects = Array.from(listingForm.querySelectorAll('select'));
      // Derniers selects avant description : eau et électricité
      const eauElec = formSelects.filter(s => s.id !== 'housingType' && !roomsFields.contains(s));
      if (eauElec.length >= 2) {
        waterVal = eauElec[0].value;
        elecVal = eauElec[1].value;
      }

      const neighborhood = listingForm.querySelector('input[placeholder*="Akwa"]')?.value?.trim()
        || listingForm.querySelector('input[type="text"]')?.value?.trim();
      const description = desc?.value?.trim() || '';

      if (!neighborhood || !description) {
        alert('Quartier et description sont obligatoires.');
        return;
      }

      const btn = listingForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Envoi...';

      try {
        // Upload des photos d'abord (max 10)
        let imageUrls = [];
        if (selectedFiles.length > 0) {
          btn.textContent = 'Upload photos...';
          const uploadResult = await UploadAPI.images(selectedFiles);
          imageUrls = uploadResult.images || [];
        }

        btn.textContent = 'Envoi...';
        await ListingsAPI.submit({
          type,
          bedrooms,
          bathrooms,
          livingRooms,
          hasWater: waterVal === 'oui',
          hasElectricity: elecVal === 'oui',
          neighborhood,
          description,
          images: imageUrls,
        });

        alert('Soumission envoyée avec succès ! Elle sera examinée par l’équipe admin.');
        listingForm.reset();
        roomsFields.classList.add('hidden');
        selectedFiles = [];
        renderPhotoPreview();
        if (wordCount) wordCount.textContent = '0';
      } catch (err) {
        alert('Erreur : ' + (err.message || 'Impossible d’envoyer la soumission'));
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }
});

/**
 * Charge les soumissions du bailleur connecté
 */
async function loadMySubmissions() {
  const container = document.querySelector('#tab-mysubs .space-y-4')
    || document.querySelector('#tab-mysubs');

  if (!container) return;

  // Garder le titre h2
  const title = container.querySelector('h2');
  container.innerHTML = '';
  if (title) container.appendChild(title);
  else {
    const h2 = document.createElement('h2');
    h2.className = 'text-xl font-bold text-primary mb-6';
    h2.textContent = 'Mes soumissions';
    container.appendChild(h2);
  }

  const listDiv = document.createElement('div');
  listDiv.className = 'space-y-4';
  listDiv.innerHTML = '<p class="text-secondary text-sm">Chargement...</p>';
  container.appendChild(listDiv);

  try {
    const data = await ListingsAPI.mySubmissions();
    const listings = data.listings || [];

    if (listings.length === 0) {
      listDiv.innerHTML = '<p class="text-secondary text-sm">Aucune soumission pour le moment.</p>';
      return;
    }

    listDiv.innerHTML = listings.map(l => {
      const status = STATUS_LABELS[l.status] || { text: l.status, class: 'bg-gray-100 text-gray-800' };
      const date = new Date(l.createdAt).toLocaleDateString('fr-FR');
      return `
        <div class="bg-white rounded-2xl border border-light/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-medium ${status.class} px-2 py-0.5 rounded-full">${status.text}</span>
              <span class="text-sm text-secondary">${TYPE_LABELS[l.type] || l.type} · ${l.neighborhood}</span>
            </div>
            <p class="text-sm text-secondary">Soumis le ${date}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="deleteSubmission('${l.id}')" class="px-4 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition">
              Supprimer
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    listDiv.innerHTML = `<p class="text-red-600 text-sm">Erreur : ${err.message}</p>`;
  }
}

/**
 * Supprime une soumission
 */
async function deleteSubmission(id) {
  if (!confirm('Supprimer cette soumission ?')) return;
  try {
    await ListingsAPI.remove(id);
    alert('Soumission supprimée.');
    loadMySubmissions();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

/**
 * Affiche le profil
 */
function loadProfile() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tab = document.getElementById('tab-profile');
    if (!tab) return;

    const rows = tab.querySelectorAll('.flex.justify-between');
    // On remplit dynamiquement si possible
    const container = tab.querySelector('.space-y-4');
    if (container) {
      container.innerHTML = `
        <div class="flex justify-between py-2 border-b border-light"><span class="text-secondary">Nom</span><span class="font-medium">${user.name || '—'}</span></div>
        <div class="flex justify-between py-2 border-b border-light"><span class="text-secondary">Email</span><span class="font-medium">${user.email || '—'}</span></div>
        <div class="flex justify-between py-2 border-b border-light"><span class="text-secondary">Sexe</span><span class="font-medium">${user.gender || '—'}</span></div>
        <div class="flex justify-between py-2 border-b border-light"><span class="text-secondary">WhatsApp</span><span class="font-medium">${user.whatsapp || '—'}</span></div>
      `;
    }
  } catch (e) {}
}
