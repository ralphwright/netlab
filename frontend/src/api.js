// VITE_API_URL is baked at build time:
//   - Production (single-container): "" → same-origin fetch (just /api/...)
//   - Production (multi-service): "https://backend.up.railway.app"
//   - Dev: undefined → falls back to localhost:8000
//
// typeof check distinguishes "" (set but empty) from undefined (not set at all)
const VITE_VAL = import.meta.env.VITE_API_URL;
const API_BASE = typeof VITE_VAL === 'string' ? VITE_VAL : 'http://localhost:8000';

async function request(path, options = {}) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
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

  // Progress
  getProgress: (user = 'student') => request(`/api/progress/${user}`),
  getLabProgress: (slug, user = 'student') => request(`/api/progress/${user}/${slug}`),
  saveProgress: (body) =>
    request('/api/progress/save', { method: 'POST', body: JSON.stringify(body) }),
  completeStep: (body) =>
    request('/api/progress/complete-step', { method: 'POST', body: JSON.stringify(body) }),
  updateProgress: (body) =>
    request('/api/progress/update', { method: 'POST', body: JSON.stringify(body) }),
  resetLabProgress: (slug, user = 'student') =>
    request(`/api/progress/${user}/${slug}`, { method: 'DELETE' }),
  resetAllProgress: (user = 'student') =>
    request(`/api/progress/${user}`, { method: 'DELETE' }),

  // Theory
  getTheoryList: () => request('/api/theory/'),
  getTheory: (slug) => request(`/api/theory/${slug}`),
};
