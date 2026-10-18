/* ========================================
   LookForHome – Fonctions communes
   ======================================== */

function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function requireAuth(expectedRole) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const role = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');

  if (!isLoggedIn || !token) {
    window.location.href = 'login.html';
    return false;
  }

  if (expectedRole && role !== expectedRole) {
    if (role === 'TENANT') window.location.href = 'tenant-dashboard.html';
    else if (role === 'LANDLORD') window.location.href = 'landlord-dashboard.html';
    else if (role === 'ADMIN') window.location.href = 'admin-dashboard.html';
    else window.location.href = 'login.html';
    return false;
  }
  return true;
}

function displayUserName() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const el = document.getElementById('userName');
    if (el && user.name) el.textContent = user.name;
  } catch (e) {}
}