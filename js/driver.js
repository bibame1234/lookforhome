document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user || user.role !== 'DRIVER') {
    location.href = 'login.html';
    return;
  }
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    location.href = 'index.html';
  });

  async function loadMine() {
    const box = document.getElementById('myVehicles');
    try {
      const res = await api('GET', '/vehicles/my/submissions');
      const list = res.vehicles || [];
      if (!list.length) { box.textContent = 'Aucune soumission.'; return; }
      box.innerHTML = list.map((v) =>
        `<div class="bg-white border rounded-xl p-4 flex justify-between">
          <div><strong>${v.type}</strong> – ${v.city}<br><span class="text-xs">${v.status}</span></div>
          <span class="text-xs">${new Date(v.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>`
      ).join('');
    } catch (e) {
      box.textContent = e.message || 'Erreur';
    }
  }

  document.getElementById('vehicleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const msg = document.getElementById('vehMsg');
    let images = [];
    const files = document.getElementById('vehicleImages').files;
    if (files?.length && typeof UploadAPI !== 'undefined') {
      try {
        const up = await UploadAPI.upload(files);
        images = up.urls || up.files || [];
      } catch (err) {
        console.warn(err);
      }
    }
    try {
      await api('POST', '/vehicles/submit', {
        type: fd.get('type'),
        brand: fd.get('brand'),
        model: fd.get('model'),
        plate: fd.get('plate'),
        city: fd.get('city'),
        description: fd.get('description'),
        images,
      });
      msg.textContent = 'Soumis pour validation admin.';
      msg.className = 'text-sm text-green-600';
      e.target.reset();
      loadMine();
    } catch (err) {
      msg.textContent = err.message || 'Erreur';
      msg.className = 'text-sm text-red-600';
    }
  });

  loadMine();
});
