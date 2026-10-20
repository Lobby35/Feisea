let csrf = null;

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
  if (csrf) headers['X-CSRF-Token'] = csrf;
  if (body && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }
  const response = await fetch(`/api${path}`, { method, body, headers, credentials: 'same-origin' });
  const data = await response.json().catch(() => ({ message: `Server unavailable (${response.status}).` }));
  if (!response.ok) {
    const error = new Error(Object.values(data.errors ?? {}).flat().join('\n') || data.message);
    error.status = response.status;
    throw error;
  }
  if (data.csrf_token) csrf = data.csrf_token;
  return data;
}

export const api = {
  register: (role, body) => request(`/${role}/register`, { method: 'POST', body }),
  login: (role, body) => request(`/${role}/login`, { method: 'POST', body }),
  resend: (role, email) => request(`/${role}/verification/resend`, { method: 'POST', body: { email } }),
  verify: (token) => request('/verification/verify', { method: 'POST', body: { token } }),
  session: () => request('/me'),
  completeSetup: (role) => request(`/${role}/setup/complete`, { method: 'POST' }),
  me: (role) => request(`/${role}/me`),
  save: (role, body) => request(`/${role}/profile`, { method: 'PATCH', body }),
  upload: (role, kind, body) => request(`/${role}/${kind}`, { method: 'POST', body }),
  remove: (role, kind) => request(`/${role}/${kind}`, { method: 'DELETE' }),
  extract: () => request('/candidate/cv/extract', { method: 'POST' }),
  logout: async () => { await request('/logout', { method: 'POST' }); csrf = null; },
};
