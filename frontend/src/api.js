async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const details = Object.values(data.errors ?? {}).flat().join('\n');
    throw new Error(details || data.message || `HTTP ${response.status}`);
  }
  return data;
}

export const api = {
  health: () => request('/health'),
  list: (page) => request(`/users?page=${encodeURIComponent(page)}`),
  get: (id) => request(`/users/${encodeURIComponent(id)}`),
  create: (user) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
  update: (id, user) => request(`/users/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(user) }),
  delete: (id) => request(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
