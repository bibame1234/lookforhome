function validPassword(p) {
  if (!p || p.length !== 6) return false;
  const digits = (p.match(/\d/g) || []).length;
  const letters = (p.match(/[a-zA-Z]/g) || []).length;
  return digits === 4 && letters === 2;
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const preRole = urlParams.get('role');
  const roleTabs = document.querySelectorAll('.role-tab');
  const roleInput = document.getElementById('role');
  const form = document.getElementById('registerForm');
  const errEl = document.getElementById('formError');
  const whatsapp = document.getElementById('whatsapp');

  function setRole(role) {
    roleTabs.forEach((t) => {
      t.classList.remove('bg-accent', 'text-white');
      t.classList.add('text-secondary');
      if (t.dataset.role === role) {
        t.classList.add('bg-accent', 'text-white');
        t.classList.remove('text-secondary');
      }
    });
    roleInput.value = role;
  }

  if (preRole === 'landlord' || preRole === 'driver' || preRole === 'tenant') setRole(preRole);
  roleTabs.forEach((tab) => tab.addEventListener('click', () => setRole(tab.dataset.role)));

  if (whatsapp) {
    whatsapp.addEventListener('input', () => {
      whatsapp.value = whatsapp.value.replace(/\D/g, '').slice(0, 9);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.classList.add('hidden');
    const name = form.querySelector('input[type="text"]').value.trim();
    const email = form.querySelector('input[type="email"]').value.trim();
    const genderRaw = document.getElementById('gender').value;
    const tel = whatsapp.value.replace(/\D/g, '');
    const password = document.getElementById('password').value;

    if (tel.length !== 9) {
      errEl.textContent = 'Le numéro WhatsApp doit contenir exactement 9 chiffres.';
      errEl.classList.remove('hidden');
      return;
    }
    if (!validPassword(password)) {
      errEl.textContent = 'Mot de passe : exactement 4 chiffres et 2 lettres (6 caractères).';
      errEl.classList.remove('hidden');
      return;
    }

    const roleMap = { tenant: 'TENANT', landlord: 'LANDLORD', driver: 'DRIVER' };
    const role = roleMap[roleInput.value] || 'TENANT';
    const gender = genderRaw === 'femme' ? 'FEMME' : 'HOMME';

    try {
      const data = await AuthAPI.register({
        name,
        email,
        gender,
        whatsapp: '+237' + tel,
        password,
        role,
      });
      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      const dest = role === 'LANDLORD' ? 'landlord-dashboard.html'
        : role === 'DRIVER' ? 'driver-dashboard.html'
        : 'tenant-dashboard.html';
      window.location.href = dest;
    } catch (err) {
      errEl.textContent = err.message || 'Erreur inscription';
      errEl.classList.remove('hidden');
    }
  });
});
