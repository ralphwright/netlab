import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { BookOpen, ArrowRight, Layers, ChevronDown, ChevronRight } from 'lucide-react';

export default function TheoryList() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    api.getTheoryList()
      .then((data) => {
        setTopics(data);
        // Default all groups open — keyed by index
        setOpenGroups(Object.fromEntries(data.map((_, i) => [i, true])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '1.25rem', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
          Loading theory...
        </div>
      </div>
    );
  }

  // Group by logical learning progression
  const groups = [
    { title: '0. Foundations', filter: (t) => ['osi-model', 'network-types', 'network-topologies', 'network-devices', 'cables-transmission', 'routing-fundamentals', 'how-internet-works', 'network-layer-arch'].includes(t.slug) },
    { title: '1. IP Addressing', filter: (t) => ['ipv4-subnetting'].includes(t.slug) },
    { title: '2. Layer 2 — Switching & LAN', filter: (t) => ['vlans', 'stp', 'lacp'].includes(t.slug) },
    { title: '3. Routing & Network Services', filter: (t) => ['ospf', 'dhcp', 'dns'].includes(t.slug) },
    { title: '4. Address Translation', filter: (t) => ['nat', 'pat'].includes(t.slug) },
    { title: '5. Security', filter: (t) => ['acls', 'ssh', 'firewalls'].includes(t.slug) },
    { title: '6. Inter-Domain & WAN', filter: (t) => ['autonomous-systems', 'bgp', 'tunneling', 'gre', 'mpls'].includes(t.slug) },
    { title: '7. IPv6', filter: (t) => ['ipv6'].includes(t.slug) },
    { title: '8. Wireless', filter: (t) => ['wireless-ap', 'wireless-controller', 'wireless-security', 'wireless-topology'].includes(t.slug) },
    { title: '9. Remote Access', filter: (t) => ['remote-access'].includes(t.slug) },
  ];

  // Track open/closed state per group index, default all open
  const toggleGroup = (i) => setOpenGroups((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="dashboard-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
          <BookOpen size={36} color="var(--accent)" />
        </div>
        <h1 className="dashboard-title">
          Network Engineering <span style={{ color: 'var(--accent)' }}>Theory</span>
        </h1>
        <p className="dashboard-subtitle">
          Comprehensive theory and practical reference for all 30 networking topics.
          Each page covers the concepts, IOS commands, design patterns, and common pitfalls.
        </p>
      </section>

      {/* Topic Groups */}
      {groups.map((group, gi) => {
        const groupTopics = topics.filter(group.filter);
        if (groupTopics.length === 0) return null;
        const isOpen = openGroups[gi] !== false;

        return (
          <section key={gi} style={{ marginBottom: 'var(--space-2xl)' }}>
            <button
              onClick={() => toggleGroup(gi)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                paddingBottom: 'var(--space-sm)', marginBottom: isOpen ? 'var(--space-md)' : 0,
                borderBottom: '1px solid var(--border-subtle)',
                textAlign: 'left',
              }}
            >
              <h2 style={{
                fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
                margin: 0, flex: 1,
              }}>
                {group.title}
              </h2>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {groupTopics.length} {groupTopics.length === 1 ? 'topic' : 'topics'}
              </span>
              {isOpen
                ? <ChevronDown size={16} color="var(--text-muted)" />
                : <ChevronRight size={16} color="var(--text-muted)" />
              }
            </button>

            {isOpen && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 'var(--space-md)',
              }}>
                {groupTopics.map((topic, i) => (
                  <Link
                    key={topic.slug}
                    to={`/theory/${topic.slug}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      className={`card fade-in stagger-${(i % 6) + 1}`}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)',
                        padding: 'var(--space-lg)',
                        borderLeft: `3px solid ${topic.color || 'var(--accent)'}`,
                        height: '100%',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 6 }}>
                          <h3 style={{ fontSize: '1.0625rem', margin: 0 }}>{topic.name}</h3>
                        </div>
                        <p style={{
                          color: 'var(--text-secondary)', fontSize: '0.8125rem',
                          lineHeight: 1.5, margin: 0,
                        }}>
                          {topic.description}
                        </p>
                        {topic.osi_layer && (
                          <div style={{
                            marginTop: 'var(--space-sm)',
                            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                            color: topic.color || 'var(--text-muted)',
                          }}>
                            {topic.osi_layer}
                          </div>
                        )}
                      </div>
                      <ArrowRight size={16} color="var(--text-muted)" style={{ marginTop: 4, flexShrink: 0 }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
