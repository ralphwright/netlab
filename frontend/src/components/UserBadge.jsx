import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '../useUser';
import { User, Pencil, Check, X } from 'lucide-react';

export default function UserBadge() {
  const { userId, displayName, setDisplayName } = useUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(displayName);
    setEditing(true);
  };

  const save = () => {
    setDisplayName(draft);
    setEditing(false);
  };

  const cancel = () => {
    setEditing(false);
  };

  const label = displayName || userId?.slice(0, 8) || '...';

  if (editing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'var(--bg-card)', border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)', padding: '3px 6px',
      }}>
        <User size={13} color="var(--accent)" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
          placeholder="Your name..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem', width: 110,
          }}
          maxLength={64}
        />
        <button onClick={save} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-success)', padding: 2, display: 'flex',
        }}>
          <Check size={13} />
        </button>
        <button onClick={cancel} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 2, display: 'flex',
        }}>
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      title={`User ID: ${userId}\nClick to set your name`}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)', padding: '4px 10px',
        cursor: 'pointer', transition: 'border-color 0.15s',
        color: 'var(--text-secondary)', fontSize: '0.8125rem',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      <User size={13} color="var(--accent)" />
      <span style={{
        maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <Pencil size={10} color="var(--text-muted)" />
    </button>
  );
}
