import { useState, useEffect, useCallback, createContext, useContext } from 'react';

/**
 * User identity for NetLab.
 *
 * On first visit, generates a random UUID stored in localStorage.
 * This UUID becomes the user_id for all API calls, giving each browser
 * its own isolated progress. An optional display name can be set.
 *
 * Shape: { userId, displayName, setDisplayName, isReady }
 */

const STORAGE_KEY = 'netlab_user_id';
const NAME_KEY = 'netlab_display_name';

function generateId() {
  // crypto.randomUUID is available in all modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateUserId() {
  let id = null;
  try {
    id = localStorage.getItem(STORAGE_KEY);
  } catch {}
  if (!id) {
    id = generateId();
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
  }
  return id;
}

function getSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

// ── React Context ───────────────────────────────────────

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [userId, setUserId] = useState(null);
  const [displayName, setDisplayNameState] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Initialize on mount
  useEffect(() => {
    const id = getOrCreateUserId();
    setUserId(id);
    setDisplayNameState(getSavedName());
    setIsReady(true);
  }, []);

  const setDisplayName = useCallback((name) => {
    const trimmed = (name || '').trim().slice(0, 64);
    setDisplayNameState(trimmed);
    try {
      if (trimmed) {
        localStorage.setItem(NAME_KEY, trimmed);
      } else {
        localStorage.removeItem(NAME_KEY);
      }
    } catch {}

    // Update on backend (fire-and-forget)
    if (userId) {
      const VITE_VAL = import.meta.env.VITE_API_URL;
      const base = typeof VITE_VAL === 'string' ? VITE_VAL : 'http://localhost:8000';
      fetch(`${base}/api/progress/set-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, display_name: trimmed }),
      }).catch(() => {});
    }
  }, [userId]);

  return (
    <UserContext.Provider value={{ userId, displayName, setDisplayName, isReady }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be inside UserProvider');
  return ctx;
}

// Export the raw getter for non-React contexts (sendBeacon, etc.)
export function getUserId() {
  return getOrCreateUserId();
}
