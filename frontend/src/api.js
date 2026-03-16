const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API Error');
  }
  return res.json();
}

export const api = {
  getLabs: () => request('/api/labs/'),
  getTopics: () => request('/api/labs/topics'),
  getLab: (slug) => request(`/api/labs/${slug}`),
  getTopology: (slug) => request(`/api/topology/${slug}`),
  executeCommand: (body) =>
    request('/api/cli/execute', { method: 'POST', body: JSON.stringify(body) }),
  validateStep: (body) =>
    request('/api/cli/validate-step', { method: 'POST', body: JSON.stringify(body) }),
  getProgress: (user = 'student') => request(`/api/progress/${user}`),
  updateProgress: (body) =>
    request('/api/progress/update', { method: 'POST', body: JSON.stringify(body) }),
};
