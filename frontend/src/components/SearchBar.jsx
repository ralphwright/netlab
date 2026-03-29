import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, Terminal } from 'lucide-react';
import { api } from '../api';

export default function SearchBar() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [topics,  setTopics]  = useState([]);
  const [labs,    setLabs]    = useState([]);
  const [cursor,  setCursor]  = useState(-1);
  const inputRef  = useRef(null);
  const wrapRef   = useRef(null);
  const navigate  = useNavigate();

  // Fetch lists once on mount
  useEffect(() => {
    api.getTheoryList().then(t => setTopics(t.filter(x => x.has_content))).catch(() => {});
    api.getLabs().catch(() => {});
    api.getLabs().then(setLabs).catch(() => {});
  }, []);

  // Filter results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { theory: [], labs: [] };
    const matchT = topics.filter(t =>
      t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    ).slice(0, 5);
    const matchL = labs.filter(l =>
      l.title.toLowerCase().includes(q) ||
      (l.subtitle || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q)
    ).slice(0, 5);
    return { theory: matchT, labs: matchL };
  }, [query, topics, labs]);

  const allResults = useMemo(() =>
    [
      ...results.theory.map(t => ({ type: 'theory', item: t, path: `/theory/${t.slug}` })),
      ...results.labs.map(l =>  ({ type: 'lab',    item: l, path: `/lab/${l.slug}` })),
    ], [results]);

  const hasResults = allResults.length > 0;
  const showDropdown = open && query.trim().length > 0;

  // Open and focus
  function openSearch() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // Close and reset
  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery('');
    setCursor(-1);
  }, []);

  // Navigate to a result
  function go(path) {
    navigate(path);
    closeSearch();
  }

  // Keyboard navigation
  function handleKey(e) {
    if (e.key === 'Escape') { closeSearch(); return; }
    if (!showDropdown) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor(c => Math.min(c + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor(c => Math.max(c - 1, -1));
    } else if (e.key === 'Enter' && cursor >= 0) {
      e.preventDefault();
      go(allResults[cursor].path);
    }
  }

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) closeSearch();
    }
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, closeSearch]);

  // Global / shortcut — suppressed when focus is in any text input
  // (CLI terminal, textarea, contenteditable) so / works normally in labs
  useEffect(() => {
    function handle(e) {
      if (open) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isEditable = (
        tag === 'input' ||
        tag === 'textarea' ||
        document.activeElement?.isContentEditable
      );
      if (isEditable) return;
      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        openSearch();
      }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  // Reset cursor when results change
  useEffect(() => setCursor(-1), [query]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Trigger button (collapsed) */}
      {!open && (
        <button
          onClick={openSearch}
          aria-label="Search"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '0.8125rem',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Search size={15} />
          <span className="search-hint-text">Search…</span>
          <kbd style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
            padding: '1px 5px', borderRadius: 3,
            background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)', lineHeight: '1.4',
          }}>/</kbd>
        </button>
      )}

      {/* Expanded search input */}
      {open && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)', border: '1px solid var(--accent)',
            boxShadow: '0 0 0 3px var(--accent-glow)',
            minWidth: 260,
          }}>
            <Search size={15} color="var(--accent)" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Search lessons and labs…"
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                fontSize: '0.875rem', width: '100%',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 0, display: 'flex',
              }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={closeSearch} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem', padding: '4px 6px',
          }}>esc</button>
        </div>
      )}

      {/* Dropdown results */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          minWidth: 320, maxWidth: 420, zIndex: 200,
          background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}>
          {!hasResults ? (
            <div style={{
              padding: '16px 20px', color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)', fontSize: '0.875rem', textAlign: 'center',
            }}>
              No results for <strong style={{ color: 'var(--text-primary)' }}>"{query}"</strong>
            </div>
          ) : (
            <>
              {results.theory.length > 0 && (
                <div>
                  <div style={{
                    padding: '8px 16px 4px', fontFamily: 'var(--font-mono)',
                    fontSize: '0.5875rem', letterSpacing: '0.1em',
                    color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)',
                  }}>THEORY</div>
                  {results.theory.map((t, i) => {
                    const idx = allResults.findIndex(r => r.type === 'theory' && r.item.slug === t.slug);
                    return (
                      <ResultRow
                        key={t.slug}
                        icon={<BookOpen size={14} color="var(--accent)" />}
                        title={t.name}
                        sub={t.description}
                        active={cursor === idx}
                        onClick={() => go(`/theory/${t.slug}`)}
                        onMouseEnter={() => setCursor(idx)}
                      />
                    );
                  })}
                </div>
              )}
              {results.labs.length > 0 && (
                <div>
                  <div style={{
                    padding: '8px 16px 4px', fontFamily: 'var(--font-mono)',
                    fontSize: '0.5875rem', letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    borderTop: results.theory.length > 0 ? '1px solid var(--border-subtle)' : 'none',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}>LABS</div>
                  {results.labs.map((l, i) => {
                    const idx = allResults.findIndex(r => r.type === 'lab' && r.item.slug === l.slug);
                    return (
                      <ResultRow
                        key={l.slug}
                        icon={<Terminal size={14} color="#00e676" />}
                        title={l.title}
                        sub={l.subtitle}
                        badge={l.difficulty}
                        active={cursor === idx}
                        onClick={() => go(`/lab/${l.slug}`)}
                        onMouseEnter={() => setCursor(idx)}
                      />
                    );
                  })}
                </div>
              )}
              <div style={{
                padding: '6px 16px', borderTop: '1px solid var(--border-subtle)',
                fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                color: 'var(--text-muted)', display: 'flex', gap: 12,
              }}>
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ResultRow({ icon, title, sub, badge, active, onClick, onMouseEnter }) {
  const diffColor = { beginner: '#00e676', intermediate: '#ffab00', advanced: '#f43f5e' };
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 16px', cursor: 'pointer',
        background: active ? 'var(--accent-glow-strong)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-body)', fontSize: '0.875rem',
          fontWeight: 500, color: active ? 'var(--accent)' : 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 0.1s',
        }}>{title}</div>
        {sub && (
          <div style={{
            fontSize: '0.75rem', color: 'var(--text-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{sub}</div>
        )}
      </div>
      {badge && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
          color: diffColor[badge] || 'var(--text-muted)',
          background: `${diffColor[badge] || '#78909c'}18`,
          padding: '1px 6px', borderRadius: 3, flexShrink: 0,
        }}>{badge}</span>
      )}
    </div>
  );
}
