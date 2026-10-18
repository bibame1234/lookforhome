/* ========================================
   LookForHome – Client API
   À inclure dans les pages qui appellent le backend
   ======================================== */

const API_BASE = 'http://localhost:4000/api';

/**
 * Récupère le token stocké
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Appel générique à l'API
 */
async function api(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && getToken()) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

// ---------- Auth ----------
const AuthAPI = {
  register: (payload) => api('POST', '/auth/register', payload, false),
  login: (payload) => api('POST', '/auth/login', payload, false),
  me: () => api('GET', '/auth/me'),
};

// ---------- Listings ----------
const ListingsAPI = {
  published: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api('GET', `/listings${q ? '?' + q : ''}`, null, !!getToken());
  },
  get: (id) => api('GET', `/listings/${id}`, null, !!getToken()),
  submit: (payload) => api('POST', '/listings/submit', payload),
  mySubmissions: () => api('GET', '/listings/my/submissions'),
  update: (id, payload) => api('PUT', `/listings/${id}`, payload),
  remove: (id) => api('DELETE', `/listings/${id}`),
};

// ---------- Visites ----------
const VisitsAPI = {
  unlock: (listingId, paymentMethod = 'MTN_MOMO') =>
    api('POST', '/visits/unlock', { listingId, paymentMethod }),
  myUnlocks: () => api('GET', '/visits/my-unlocks'),
};

// ---------- Favoris ----------
const FavoritesAPI = {
  list: () => api('GET', '/favorites'),
  add: (listingId) => api('POST', '/favorites', { listingId }),
  remove: (listingId) => api('DELETE', `/favorites/${listingId}`),
};

// ---------- Support ----------
const SupportAPI = {
  send: (message) => api('POST', '/support', { message }),
};

// ---------- Admin ----------
const AdminAPI = {
  stats: () => api('GET', '/admin/stats'),
  landlords: () => api('GET', '/admin/landlords'),
  tenants: () => api('GET', '/admin/tenants'),
  submissions: () => api('GET', '/admin/submissions'),
  approve: (id, visitPrice) => api('PATCH', `/admin/listings/${id}/approve`, { visitPrice }),
  reject: (id) => api('PATCH', `/admin/listings/${id}/reject`),
  listings: () => api('GET', '/admin/listings'),
  publish: (payload) => api('POST', '/admin/listings', payload),
  deleteListing: (id) => api('DELETE', `/admin/listings/${id}`),
  visits: () => api('GET', '/admin/visits'),
  deleteVisit: (id) => api('DELETE', `/admin/visits/${id}`),
  clearVisits: () => api('DELETE', '/admin/visits'),
  settings: () => api('GET', '/admin/settings'),
  updateSettings: (payload) => api('PUT', '/admin/settings', payload),
  notify: (payload) => api('POST', '/admin/notifications', payload),
};

// ---------- Settings publics ----------
const SettingsAPI = {
  public: () => api('GET', '/settings', null, false),
};


// ---------- Upload images (max 10) ----------
const UploadAPI = {
  /**
   * Upload des fichiers images
   * @param {FileList|File[]} files
   * @returns {Promise<{images: string[]}>}
   */
  async images(files) {
    const formData = new FormData();
    const list = Array.from(files).slice(0, 10);
    list.forEach(f => formData.append('images', f));

    const headers = {};
    if (getToken()) headers['Authorization'] = `Bearer ${getToken()}`;

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
    return data;
  },
};
