/* ========================================
   LookForHome – Dashboard Admin (backend)
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

const TYPE_MAP = {
  'Chambre moderne': 'CHAMBRE_MODERNE',
  'Chambre simple': 'CHAMBRE_SIMPLE',
  'Studio moderne': 'STUDIO_MODERNE',
  'Studio simple': 'STUDIO_SIMPLE',
  'Appartement moderne': 'APPARTEMENT_MODERNE',
  'Appartement simple': 'APPARTEMENT_SIMPLE',
  'Local pour commerce': 'LOCAL_COMMERCE',
  'Local pour autre activité': 'LOCAL_AUTRE',
};

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
    return;
  }

  // Afficher le nom
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const el = document.querySelector('header .text-sm.text-light');
    if (el && user.name) el.textContent = 'Admin · ' + user.name;
  } catch (e) {}

  // Onglets
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('bg-accent', 'text-white');
        b.classList.add('text-secondary');
      });
      btn.classList.add('bg-accent', 'text-white');
      btn.classList.remove('text-secondary');

      document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
      const target = document.getElementById('tab-' + btn.dataset.tab);
      if (target) target.classList.remove('hidden');

      // Charger les données selon l'onglet
      if (btn.dataset.tab === 'submissions') loadSubmissions();
      if (btn.dataset.tab === 'listings') loadPublished();
      if (btn.dataset.tab === 'landlords') loadLandlords();
      if (btn.dataset.tab === 'tenants') loadTenants();
      if (btn.dataset.tab === 'visits') loadVisits();
      if (btn.dataset.tab === 'settings') loadSettings();
    });
  });



  // ---------- Photos admin (max 10) – même système que bailleur ----------
  let selectedAdminFiles = [];

  const adminPhotosInput = document.getElementById('adminPhotos');
  if (adminPhotosInput) {
    adminPhotosInput.addEventListener('change', () => {
      const news = Array.from(adminPhotosInput.files || []);
      selectedAdminFiles = selectedAdminFiles.concat(news).slice(0, 10);
      renderAdminPreview();
      adminPhotosInput.value = '';
    });
  }

  function renderAdminPreview() {
    const box = document.getElementById('adminPhotoPreview');
    const count = document.getElementById('adminPhotoCount');
    const num = document.getElementById('adminPhotoCountNum');
    if (!box) return;
    box.innerHTML = selectedAdminFiles.map((f, i) => {
      const url = URL.createObjectURL(f);
      return '<div class="relative aspect-square rounded-lg overflow-hidden border border-light">' +
        '<img src="' + url + '" class="w-full h-full object-cover" alt="">' +
        '<button type="button" data-idx="' + i + '" class="admin-remove-photo absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">×</button>' +
        '</div>';
    }).join('');
    if (num) num.textContent = selectedAdminFiles.length;
    if (count) count.classList.toggle('hidden', selectedAdminFiles.length === 0);
    box.querySelectorAll('.admin-remove-photo').forEach(btn => {
      btn.onclick = () => {
        selectedAdminFiles.splice(Number(btn.dataset.idx), 1);
        renderAdminPreview();
      };
    });
  }

  // ---------- Formulaire publier (comme bailleur) ----------
  const publishForm = document.getElementById('adminListingForm') || document.querySelector('#tab-publish form');
  if (publishForm) {
    publishForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const type = (document.getElementById('adminHousingType') || {}).value;
      if (!type) {
        alert('Sélectionnez un type de logement.');
        return;
      }

      const neighborhood = (document.getElementById('adminNeighborhood') || {}).value.trim();
      const description = (document.getElementById('adminDescription') || {}).value.trim();
      if (!neighborhood || !description) {
        alert('Quartier et description obligatoires.');
        return;
      }

      const bed = (document.getElementById('adminBedrooms') || {}).value;
      const bath = (document.getElementById('adminBathrooms') || {}).value;
      const liv = (document.getElementById('adminLivingRooms') || {}).value;
      const water = (document.getElementById('adminWater') || {}).value;
      const elec = (document.getElementById('adminElectricity') || {}).value;
      const visitPrice = Number((document.getElementById('adminVisitPrice') || {}).value) || 2000;

      const btn = publishForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Envoi...';

      try {
        let imageUrls = [];
        if (selectedAdminFiles.length > 0) {
          btn.textContent = 'Upload photos...';
          const up = await UploadAPI.images(selectedAdminFiles);
          imageUrls = up.images || [];
        }

        btn.textContent = 'Publication...';
        await AdminAPI.publish({
          type: type,
          bedrooms: bed ? Number(bed) : null,
          bathrooms: bath ? Number(bath) : null,
          livingRooms: liv ? Number(liv) : null,
          hasWater: water !== 'non',
          hasElectricity: elec !== 'non',
          neighborhood: neighborhood,
          description: description,
          visitPrice: visitPrice,
          images: imageUrls,
        });

        alert('Logement publié avec succès !');
        publishForm.reset();
        selectedAdminFiles = [];
        renderAdminPreview();
        loadStats();
      } catch (err) {
        alert('Erreur : ' + (err.message || 'Publication impossible'));
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  // Stats au démarrage
  loadStats();
});

async function loadStats() {
  try {
    const stats = await AdminAPI.stats();
    const cards = document.querySelectorAll('.grid.grid-cols-2.md\\:grid-cols-4 > div, .grid.grid-cols-2 > div');
    // Les 4 cartes stats
    const values = [stats.landlords, stats.tenants, stats.published, stats.visits];
    const valueEls = document.querySelectorAll('.text-2xl.font-bold');
    if (valueEls.length >= 4) {
      valueEls[0].textContent = stats.landlords;
      valueEls[1].textContent = stats.tenants;
      valueEls[2].textContent = stats.published;
      valueEls[3].textContent = stats.visits;
    }
  } catch (err) {
    console.error('Stats error:', err);
  }
}

async function loadSubmissions() {
  const tab = document.getElementById('tab-submissions');
  if (!tab) return;

  tab.innerHTML = `
    <h2 class="text-lg font-bold text-primary mb-4">Soumissions des bailleurs en attente</h2>
    <div id="subsContainer" class="space-y-3"><p class="text-sm text-secondary">Chargement...</p></div>
  `;

  try {
    const data = await AdminAPI.submissions();
    const list = data.submissions || [];
    const container = document.getElementById('subsContainer');

    if (list.length === 0) {
      container.innerHTML = '<p class="text-sm text-secondary">Aucune soumission en attente.</p>';
      return;
    }

    container.innerHTML = list.map(s => `
      <div class="bg-white rounded-xl border border-light/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p class="font-medium text-primary">${TYPE_LABELS[s.type] || s.type} – ${s.neighborhood}</p>
          <p class="text-sm text-secondary">Par ${s.submittedBy?.name || '—'} · WhatsApp ${s.submittedBy?.whatsapp || '—'} · ${new Date(s.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>
        <div class="flex gap-2">
          <button onclick="approveSub('${s.id}')" class="px-3 py-1.5 text-sm rounded-lg bg-green-100 text-green-700 hover:bg-green-200">Approuver & Publier</button>
          <button onclick="rejectSub('${s.id}')" class="px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Rejeter</button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('subsContainer').innerHTML = `<p class="text-red-600 text-sm">${err.message}</p>`;
  }
}

async function approveSub(id) {
  try {
    await AdminAPI.approve(id);
    alert('Logement approuvé et publié !');
    loadSubmissions();
    loadStats();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

async function rejectSub(id) {
  if (!confirm('Rejeter cette soumission ?')) return;
  try {
    await AdminAPI.reject(id);
    alert('Soumission rejetée.');
    loadSubmissions();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

async function loadPublished() {
  const tab = document.getElementById('tab-listings');
  if (!tab) return;

  tab.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-bold text-primary">Annonces publiées</h2>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm bg-white rounded-xl overflow-hidden border border-light/50">
        <thead class="bg-bg text-secondary">
          <tr>
            <th class="text-left px-4 py-3 font-medium">Type</th>
            <th class="text-left px-4 py-3 font-medium">Quartier</th>
            <th class="text-left px-4 py-3 font-medium">Prix visite</th>
            <th class="text-left px-4 py-3 font-medium">Date</th>
            <th class="text-right px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody id="listingsBody" class="divide-y divide-light">
          <tr><td colspan="5" class="px-4 py-3 text-secondary">Chargement...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const data = await AdminAPI.listings();
    const list = data.listings || [];
    const body = document.getElementById('listingsBody');

    if (list.length === 0) {
      body.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-secondary">Aucune annonce publiée.</td></tr>';
      return;
    }

    body.innerHTML = list.map(l => `
      <tr>
        <td class="px-4 py-3">${TYPE_LABELS[l.type] || l.type}</td>
        <td class="px-4 py-3">${l.neighborhood}</td>
        <td class="px-4 py-3">${l.visitPrice} FCFA</td>
        <td class="px-4 py-3">${l.publishedAt ? new Date(l.publishedAt).toLocaleDateString('fr-FR') : '—'}</td>
        <td class="px-4 py-3 text-right">
          <button onclick="deleteListing('${l.id}')" class="text-red-600 hover:underline text-xs">Supprimer</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('listingsBody').innerHTML = `<tr><td colspan="5" class="px-4 py-3 text-red-600">${err.message}</td></tr>`;
  }
}

async function deleteListing(id) {
  if (!confirm('Supprimer cette annonce ?')) return;
  try {
    await AdminAPI.deleteListing(id);
    alert('Annonce supprimée.');
    loadPublished();
    loadStats();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

async function loadLandlords() {
  const tab = document.getElementById('tab-landlords');
  if (!tab) return;

  tab.innerHTML = `
    <h2 class="text-lg font-bold text-primary mb-4">Liste des bailleurs</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm bg-white rounded-xl overflow-hidden border border-light/50">
        <thead class="bg-bg text-secondary">
          <tr>
            <th class="text-left px-4 py-3 font-medium">Nom</th>
            <th class="text-left px-4 py-3 font-medium">Email</th>
            <th class="text-left px-4 py-3 font-medium">Sexe</th>
            <th class="text-left px-4 py-3 font-medium">WhatsApp</th>
          </tr>
        </thead>
        <tbody id="landlordsBody" class="divide-y divide-light">
          <tr><td colspan="4" class="px-4 py-3 text-secondary">Chargement...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const data = await AdminAPI.landlords();
    const list = data.landlords || [];
    const body = document.getElementById('landlordsBody');
    if (list.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-secondary">Aucun bailleur.</td></tr>';
      return;
    }
    body.innerHTML = list.map(u => `
      <tr>
        <td class="px-4 py-3">${u.name}</td>
        <td class="px-4 py-3">${u.email}</td>
        <td class="px-4 py-3">${u.gender || '—'}</td>
        <td class="px-4 py-3">${u.whatsapp}</td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('landlordsBody').innerHTML = `<tr><td colspan="4" class="px-4 py-3 text-red-600">${err.message}</td></tr>`;
  }
}

async function loadTenants() {
  const tab = document.getElementById('tab-tenants');
  if (!tab) return;

  tab.innerHTML = `
    <h2 class="text-lg font-bold text-primary mb-4">Liste des locataires</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm bg-white rounded-xl overflow-hidden border border-light/50">
        <thead class="bg-bg text-secondary">
          <tr>
            <th class="text-left px-4 py-3 font-medium">Nom</th>
            <th class="text-left px-4 py-3 font-medium">Email</th>
            <th class="text-left px-4 py-3 font-medium">Sexe</th>
            <th class="text-left px-4 py-3 font-medium">WhatsApp</th>
          </tr>
        </thead>
        <tbody id="tenantsBody" class="divide-y divide-light">
          <tr><td colspan="4" class="px-4 py-3 text-secondary">Chargement...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const data = await AdminAPI.tenants();
    const list = data.tenants || [];
    const body = document.getElementById('tenantsBody');
    if (list.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="px-4 py-3 text-secondary">Aucun locataire.</td></tr>';
      return;
    }
    body.innerHTML = list.map(u => `
      <tr>
        <td class="px-4 py-3">${u.name}</td>
        <td class="px-4 py-3">${u.email}</td>
        <td class="px-4 py-3">${u.gender || '—'}</td>
        <td class="px-4 py-3">${u.whatsapp}</td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('tenantsBody').innerHTML = `<tr><td colspan="4" class="px-4 py-3 text-red-600">${err.message}</td></tr>`;
  }
}

async function loadVisits() {
  const tab = document.getElementById('tab-visits');
  if (!tab) return;

  tab.innerHTML = `
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-bold text-primary">Historique des visites</h2>
      <button onclick="clearAllVisits()" class="px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200">Supprimer tout l'historique</button>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm bg-white rounded-xl overflow-hidden border border-light/50">
        <thead class="bg-bg text-secondary">
          <tr>
            <th class="text-left px-4 py-3 font-medium">Locataire</th>
            <th class="text-left px-4 py-3 font-medium">Logement</th>
            <th class="text-left px-4 py-3 font-medium">Montant</th>
            <th class="text-left px-4 py-3 font-medium">Date</th>
            <th class="text-right px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody id="visitsBody" class="divide-y divide-light">
          <tr><td colspan="5" class="px-4 py-3 text-secondary">Chargement...</td></tr>
        </tbody>
      </table>
    </div>
  `;

  try {
    const data = await AdminAPI.visits();
    const list = data.visits || [];
    const body = document.getElementById('visitsBody');
    if (list.length === 0) {
      body.innerHTML = '<tr><td colspan="5" class="px-4 py-3 text-secondary">Aucune visite.</td></tr>';
      return;
    }
    body.innerHTML = list.map(v => `
      <tr>
        <td class="px-4 py-3">${v.user?.name || '—'}</td>
        <td class="px-4 py-3">${TYPE_LABELS[v.listing?.type] || ''} – ${v.listing?.neighborhood || ''}</td>
        <td class="px-4 py-3">${v.amount} FCFA</td>
        <td class="px-4 py-3">${new Date(v.createdAt).toLocaleString('fr-FR')}</td>
        <td class="px-4 py-3 text-right">
          <button onclick="deleteVisit('${v.id}')" class="text-red-600 text-xs hover:underline">Supprimer</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    document.getElementById('visitsBody').innerHTML = `<tr><td colspan="5" class="px-4 py-3 text-red-600">${err.message}</td></tr>`;
  }
}

async function deleteVisit(id) {
  if (!confirm('Supprimer cette visite ?')) return;
  try {
    await AdminAPI.deleteVisit(id);
    loadVisits();
    loadStats();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

async function clearAllVisits() {
  if (!confirm('Supprimer TOUT l\'historique des visites ?')) return;
  try {
    await AdminAPI.clearVisits();
    alert('Historique vidé.');
    loadVisits();
    loadStats();
  } catch (err) {
    alert('Erreur : ' + err.message);
  }
}

async function loadSettings() {
  try {
    const data = await AdminAPI.settings();
    const s = data.settings;
    const tab = document.getElementById('tab-settings');
    if (!tab || !s) return;

    const numberInput = tab.querySelector('input[type="number"]');
    if (numberInput) numberInput.value = s.defaultVisitPrice;

    const telInputs = tab.querySelectorAll('input[type="tel"]');
    if (telInputs[0] && s.supportWhatsapp) {
      telInputs[0].value = s.supportWhatsapp.replace('+237', '');
    }
    if (telInputs[1] && s.supportSms) {
      telInputs[1].value = s.supportSms.replace('+237', '');
    }

    const textInputs = tab.querySelectorAll('input[type="text"]');
    const adminCodeInput = Array.from(textInputs).find(i => i.value?.includes('ADMIN') || i.closest('div')?.textContent?.includes('Code'));
    // Plus simple : dernier input text
    if (textInputs.length) {
      const last = textInputs[textInputs.length - 1];
      if (s.adminCode) last.value = s.adminCode;
    }

    // Bouton sauvegarder
    const saveBtn = tab.querySelector('button');
    if (saveBtn) {
      saveBtn.onclick = async () => {
        try {
          const price = Number(tab.querySelector('input[type="number"]')?.value) || 2000;
          const tels = tab.querySelectorAll('input[type="tel"]');
          const texts = tab.querySelectorAll('input[type="text"]');
          await AdminAPI.updateSettings({
            defaultVisitPrice: price,
            supportWhatsapp: tels[0] ? '+237' + tels[0].value.replace(/\s/g, '') : undefined,
            supportSms: tels[1] ? '+237' + tels[1].value.replace(/\s/g, '') : undefined,
            adminCode: texts[texts.length - 1]?.value,
          });
          alert('Paramètres sauvegardés !');
        } catch (err) {
          alert('Erreur : ' + err.message);
        }
      };
    }
  } catch (err) {
    console.error(err);
  }
}

// Notifications
document.addEventListener('DOMContentLoaded', () => {
  const notifTab = document.getElementById('tab-notifications');
  if (!notifTab) return;
  const sendBtn = notifTab.querySelector('button');
  if (sendBtn && sendBtn.textContent.includes('Envoyer')) {
    sendBtn.onclick = async () => {
      const message = notifTab.querySelector('textarea')?.value?.trim();
      if (!message) {
        alert('Écrivez un message.');
        return;
      }
      const checks = notifTab.querySelectorAll('input[type="checkbox"]');
      const targets = [];
      if (checks[0]?.checked) targets.push('LANDLORD');
      if (checks[1]?.checked) targets.push('TENANT');
      const channels = [];
      // Les checkboxes canal sont plus bas
      const allChecks = Array.from(notifTab.querySelectorAll('input[type="checkbox"]'));
      // Simplification
      try {
        await AdminAPI.notify({
          targets: targets.length ? targets : ['ALL'],
          channels: ['SMS', 'WHATSAPP'],
          message,
        });
        alert('Notifications envoyées (simulation) !');
      } catch (err) {
        alert('Erreur : ' + err.message);
      }
    };
  }
});
