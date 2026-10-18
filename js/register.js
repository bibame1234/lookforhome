/* ========================================
   LookForHome – Inscription (backend)
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const preRole = urlParams.get('role');

  const roleTabs = document.querySelectorAll('.role-tab');
  const roleInput = document.getElementById('role');
  const prenomField = document.getElementById('prenomField');
  const passwordField = document.getElementById('passwordField');
  const adminCodeField = document.getElementById('adminCodeField');
  const registerForm = document.getElementById('registerForm');

  function setRole(role) {
    roleTabs.forEach(t => {
      t.classList.remove('bg-accent', 'text-white');
      t.classList.add('text-secondary');
      if (t.dataset.role === role) {
        t.classList.add('bg-accent', 'text-white');
        t.classList.remove('text-secondary');
      }
    });
    roleInput.value = role;
    prenomField.classList.toggle('hidden', role !== 'admin');
    passwordField.classList.toggle('hidden', role === 'admin');
    adminCodeField.classList.toggle('hidden', role !== 'admin');
  }

  if (preRole) setRole(preRole);
  roleTabs.forEach(tab => tab.addEventListener('click', () => setRole(tab.dataset.role)));

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const textInputs = registerForm.querySelectorAll('input[type="text"]');
      const name = textInputs[0]?.value?.trim() || '';
      const firstName = prenomField.classList.contains('hidden') ? null : (prenomField.querySelector('input')?.value?.trim() || null);
      const email = registerForm.querySelector('input[type="email"]')?.value?.trim();
      const genderRaw = registerForm.querySelector('select')?.value || '';
      const tel = registerForm.querySelector('input[type="tel"]')?.value?.replace(/\s/g, '') || '';
      const whatsapp = tel.startsWith('+') ? tel : '+237' + tel;
      const password = passwordField.querySelector('input')?.value || '';
      const adminCode = adminCodeField.querySelector('input')?.value || '';

      const roleMap = { tenant: 'TENANT', landlord: 'LANDLORD', admin: 'ADMIN' };
      const role = roleMap[roleInput.value] || 'TENANT';
      const genderMap = { homme: 'HOMME', femme: 'FEMME', autre: 'AUTRE' };
      const gender = genderMap[genderRaw] || null;

      if (!name || !email || !tel) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
      }

      const btn = registerForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Création...';

      try {
        const payload = { name, firstName, email, gender, whatsapp, role };
        if (role === 'ADMIN') payload.adminCode = adminCode;
        else payload.password = password;

        const data = await AuthAPI.register(payload);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('isLoggedIn', 'true');

        if (data.user.role === 'TENANT') window.location.href = 'tenant-dashboard.html';
        else if (data.user.role === 'LANDLORD') window.location.href = 'landlord-dashboard.html';
        else window.location.href = 'admin-dashboard.html';
      } catch (err) {
        alert('Erreur : ' + (err.message || 'Impossible de créer le compte'));
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }
});