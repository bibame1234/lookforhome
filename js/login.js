/* ========================================
   LookForHome – Connexion (backend)
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  const roleTabs = document.querySelectorAll('.role-tab');
  const roleInput = document.getElementById('role');
  const adminField = document.getElementById('adminCodeField');
  const loginForm = document.getElementById('loginForm');

  roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roleTabs.forEach(t => {
        t.classList.remove('bg-accent', 'text-white');
        t.classList.add('text-secondary');
      });
      tab.classList.add('bg-accent', 'text-white');
      tab.classList.remove('text-secondary');
      roleInput.value = tab.dataset.role;
      adminField.classList.toggle('hidden', tab.dataset.role !== 'admin');
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = loginForm.querySelector('input[type="email"]').value.trim();
      const password = loginForm.querySelector('input[type="password"]')?.value || '';
      const adminCode = adminField.querySelector('input')?.value || '';
      const roleUI = roleInput.value;

      const roleMap = { tenant: 'TENANT', landlord: 'LANDLORD', admin: 'ADMIN' };
      const role = roleMap[roleUI] || 'TENANT';

      const btn = loginForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Connexion...';

      try {
        const payload = { email, role };
        if (role === 'ADMIN') {
          payload.adminCode = adminCode;
          if (password) payload.password = password;
        } else {
          payload.password = password;
        }

        const data = await AuthAPI.login(payload);

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('isLoggedIn', 'true');

        if (data.user.role === 'TENANT') window.location.href = 'tenant-dashboard.html';
        else if (data.user.role === 'LANDLORD') window.location.href = 'landlord-dashboard.html';
        else window.location.href = 'admin-dashboard.html';
      } catch (err) {
        alert('Erreur : ' + (err.message || 'Identifiants incorrects'));
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }
});