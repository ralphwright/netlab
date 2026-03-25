import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useUser } from '../useUser';
import {
  Layers, GitBranch, Route, Combine, Server, Globe, Network as NetworkIcon,
  Tag, ArrowRightLeft, Building, Hash, Laptop, Terminal, Shield, Repeat,
  List, Wifi, Monitor, Lock, Radar, Flame, Trophy, Clock, Zap, Star,
  RotateCcw, CheckCircle, ChevronDown, ChevronRight,
} from 'lucide-react';

const ICON_MAP = {
  layers: Layers, 'git-branch': GitBranch, route: Route, combine: Combine,
  server: Server, globe: Globe, network: NetworkIcon, tag: Tag,
  'arrow-right-left': ArrowRightLeft, building: Building, hash: Hash,
  laptop: Laptop, terminal: Terminal, shield: Shield, repeat: Repeat,
  list: List, wifi: Wifi, monitor: Monitor, lock: Lock, radar: Radar,
  flame: Flame, tunnel: ArrowRightLeft,
};

const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

// ── Lab groups — mirrors TheoryList.jsx grouping exactly ──────
const LAB_GROUPS = [
  {
    title: '0. Foundations',
    color: '#6366f1',
    slugs: [
      'osi-model-quiz', 'network-types-quiz', 'network-topologies-quiz',
      'network-devices-quiz', 'cables-transmission-quiz', 'routing-fundamentals-lab',
      'how-internet-works-quiz', 'network-layer-arch-quiz',
    ],
  },
  {
    title: '1. IP Addressing',
    color: '#0891b2',
    slugs: ['ipv4-subnetting-lab'],
  },
  {
    title: '2. Layer 2 — Switching & LAN',
    color: '#7c4dff',
    slugs: ['vlan-fundamentals', 'stp-loop-prevention', 'lacp-etherchannel'],
  },
  {
    title: '3. Routing & Network Services',
    color: '#059669',
    slugs: ['ospf-single-area', 'dhcp-server-config', 'dns-resolution'],
  },
  {
    title: '4. Address Translation',
    color: '#2979ff',
    slugs: ['nat-configuration', 'pat-overload'],
  },
  {
    title: '5. Security',
    color: '#ff1744',
    slugs: ['acl-traffic-filtering', 'ssh-secure-mgmt', 'firewall-zones'],
  },
  {
    title: '6. Inter-Domain & WAN',
    color: '#f50057',
    slugs: ['autonomous-systems', 'bgp-peering', 'network-tunneling', 'gre-tunnels', 'mpls-label-switching'],
  },
  {
    title: '7. IPv6',
    color: '#b388ff',
    slugs: ['ipv6-addressing'],
  },
  {
    title: '8. Wireless',
    color: '#039be5',
    slugs: ['wireless-ap-config', 'wireless-controller-mgmt', 'wireless-security-config', 'wireless-topology-design'],
  },
  {
    title: '9. Remote Access',
    color: '#00e676',
    slugs: ['remote-access-vpn'],
  },
];

// ── Lab card (reusable) ────────────────────────────────────────
function LabCard({ lab, prog, idx }) {
  const pctDone   = prog && lab.step_count > 0 ? Math.round((prog.current_step / lab.step_count) * 100) : 0;
  const isComplete = prog?.status === 'completed';
  const isStarted  = prog?.status === 'in_progress';
  const isQuiz     = lab.slug?.includes('quiz');

  return (
    <Link to={`/lab/${lab.slug}`} style={{ textDecoration: 'none' }}>
      <div className={`card fade-in stagger-${(idx % 6) + 1}`} style={{
        height: '100%', display: 'flex', flexDirection: 'column',
        borderColor: isComplete ? 'rgba(0,230,118,0.25)' : undefined,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
          <span className={`badge badge-${lab.difficulty}`}>{lab.difficulty}</span>
          {isComplete && (
            <span style={{
              fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: 600,
              color: 'var(--color-success)', background: 'rgba(0,230,118,0.1)',
              padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(0,230,118,0.3)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <CheckCircle size={10} /> Done
            </span>
          )}
          {isStarted && (
            <span style={{
              fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: 600,
              color: 'var(--color-warning)', background: 'rgba(255,171,0,0.08)',
              padding: '2px 8px', borderRadius: 99, border: '1px solid rgba(255,171,0,0.25)',
            }}>
              {pctDone}%
            </span>
          )}
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={13} /> {lab.estimated_minutes} min
          </span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {lab.step_count} {isQuiz ? 'questions' : 'steps'}
          </span>
        </div>

        <h3 style={{ marginBottom: 'var(--space-sm)' }}>{lab.title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1 }}>{lab.subtitle}</p>

        {prog && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {isQuiz ? 'Question' : 'Step'} {prog.current_step}/{lab.step_count || '?'}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                {prog.total_points} pts
              </span>
            </div>
            <div className="progress-bar" style={{ height: 4 }}>
              <div className="progress-fill" style={{ width: `${pctDone}%` }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'var(--space-md)' }}>
          {(lab.topic_names || []).map((name, i) => (
            <span key={i} className="topic-tag" style={{ borderColor: (lab.topic_colors || [])[i] + '40' }}>{name}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}

// ── Lab section (collapsible) ─────────────────────────────────
function LabSection({ group, labs, progress, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (labs.length === 0) return null;

  const completedInGroup = labs.filter((l) => progress[l.slug]?.status === 'completed').length;

  return (
    <section style={{ marginBottom: 'var(--space-2xl)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          paddingBottom: 'var(--space-sm)', marginBottom: open ? 'var(--space-md)' : 0,
          borderBottom: '1px solid var(--border-subtle)',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-secondary)',
          fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', flex: 1,
        }}>
          {group.title}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
          color: completedInGroup === labs.length ? 'var(--color-success)' : 'var(--text-muted)',
        }}>
          {completedInGroup}/{labs.length} done
        </span>
        {open
          ? <ChevronDown size={16} color="var(--text-muted)" />
          : <ChevronRight size={16} color="var(--text-muted)" />
        }
      </button>

      {open && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-md)',
        }}>
          {labs.map((lab, idx) => (
            <LabCard key={lab.slug} lab={lab} prog={progress[lab.slug]} idx={idx} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Main component ────────────────────────────────────────────
export default function Dashboard() {
  const { userId, isReady } = useUser();
  const [labs, setLabs]         = useState([]);
  const [progress, setProgress] = useState({});
  const [diffFilter, setDiffFilter] = useState('all');
  const [loading, setLoading]   = useState(true);
  const [showResetAll, setShowResetAll] = useState(false);
  const [resetting, setResetting]       = useState(false);

  const loadData = () => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      api.getLabs(),
      api.getProgress(userId).catch(() => []),
    ])
      .then(([labData, progressData]) => {
        setLabs(labData);
        const map = {};
        (progressData || []).forEach((p) => { map[p.lab_slug] = p; });
        setProgress(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (isReady) loadData(); }, [isReady, userId]);

  const handleResetAll = async () => {
    setResetting(true);
    try {
      await api.resetAllProgress(userId);
      setProgress({});
      setShowResetAll(false);
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setResetting(false);
    }
  };

  const completedCount  = Object.values(progress).filter((p) => p.status === 'completed').length;
  const inProgressCount = Object.values(progress).filter((p) => p.status === 'in_progress').length;
  const hasAnyProgress  = Object.keys(progress).length > 0;

  // Apply difficulty filter
  const visibleLabs = diffFilter === 'all'
    ? labs
    : labs.filter((l) => l.difficulty === diffFilter);

  // Integration / capstone labs
  const integrationLabs = visibleLabs.filter((l) => l.is_integration);

  // Build a slug→lab lookup for group membership
  const labBySlug = {};
  visibleLabs.forEach((l) => { labBySlug[l.slug] = l; });

  // Any regular lab not matched by any group slug list
  const groupedSlugs = new Set(LAB_GROUPS.flatMap((g) => g.slugs));
  const ungrouped = visibleLabs.filter((l) => !l.is_integration && !groupedSlugs.has(l.slug));

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '1.5rem', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
          Loading labs...
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Hero */}
      <section className="dashboard-hero">
        <h1 className="dashboard-title">
          Interactive Network Engineering <span style={{ color: 'var(--accent)' }}>Labs</span>
        </h1>
        <p className="dashboard-subtitle">
          30+ hands-on labs and quizzes covering OSI fundamentals, subnetting, VLANs, OSPF, BGP, security, wireless, and more.
          Configure real Cisco IOS commands on interactive topologies.
        </p>
      </section>

      {/* Stats */}
      <section className="stats-grid">
        {[
          { icon: Terminal,     label: 'Labs',        value: labs.length,      color: 'var(--accent)' },
          { icon: CheckCircle,  label: 'Completed',   value: completedCount,   color: 'var(--color-success)' },
          { icon: Zap,          label: 'In Progress', value: inProgressCount,  color: 'var(--color-warning)' },
          { icon: Star,         label: 'CLI Steps',   value: labs.reduce((s, l) => s + (l.step_count || 0), 0), color: 'var(--color-info)' },
        ].map((stat, i) => (
          <div key={i} className="card stat-card">
            <div className="stat-icon" style={{ background: `color-mix(in srgb, ${stat.color} 12%, transparent)` }}>
              <stat.icon size={22} color={stat.color} />
            </div>
            <div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Reset All + Difficulty filter row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
          Level:
        </span>
        {['all', ...DIFFICULTY_ORDER].map((d) => (
          <button
            key={d}
            className={`btn btn-sm ${diffFilter === d ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setDiffFilter(d)}
            style={{ flexShrink: 0 }}
          >
            {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
          </button>
        ))}

        {hasAnyProgress && (
          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowResetAll(!showResetAll)}
              style={{ color: 'var(--color-error)', gap: 6 }}
            >
              <RotateCcw size={14} /> Reset All Progress
            </button>
            {showResetAll && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
                boxShadow: 'var(--shadow-elevated)', zIndex: 50, width: 280,
              }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  This will erase all progress, points, and command history across every lab. This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--color-error)', color: '#fff', flex: 1 }}
                    onClick={handleResetAll}
                    disabled={resetting}
                  >
                    {resetting ? 'Resetting...' : 'Confirm Reset'}
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowResetAll(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Capstone / Integration Labs */}
      {integrationLabs.length > 0 && (
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <h2 style={{
              fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', margin: 0,
            }}>
              ★ Capstone
            </h2>
          </div>

          {integrationLabs.map((lab) => {
            const prog = progress[lab.slug];
            const pctDone   = prog && lab.step_count > 0 ? Math.round((prog.current_step / lab.step_count) * 100) : 0;
            const isComplete = prog?.status === 'completed';

            return (
              <Link key={lab.slug} to={`/lab/${lab.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--space-md)' }}>
                <div className="card" style={{
                  background: 'linear-gradient(135deg, rgba(255,171,0,0.06) 0%, rgba(0,229,255,0.04) 100%)',
                  border: `1px solid ${isComplete ? 'rgba(0,230,118,0.3)' : 'rgba(255,171,0,0.2)'}`,
                  padding: 'var(--space-xl)', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 12, right: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isComplete && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-success)', fontWeight: 600,
                        background: 'rgba(0,230,118,0.1)', padding: '4px 12px', borderRadius: '99px', border: '1px solid rgba(0,230,118,0.3)',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <CheckCircle size={12} /> COMPLETED
                      </span>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-warning)', fontWeight: 600,
                      background: 'rgba(255,171,0,0.1)', padding: '4px 12px', borderRadius: '99px', border: '1px solid rgba(255,171,0,0.3)',
                    }}>
                      ★ CAPSTONE
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                    <Trophy size={20} color="var(--color-warning)" />
                    <span className={`badge badge-${lab.difficulty}`}>{lab.difficulty}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      <Clock size={13} style={{ verticalAlign: -2 }} /> {lab.estimated_minutes} min
                    </span>
                  </div>
                  <h2 style={{ marginBottom: 'var(--space-sm)', color: 'var(--color-warning)' }}>{lab.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', maxWidth: 700 }}>{lab.subtitle}</p>
                  {prog && (
                    <div style={{ marginTop: 'var(--space-md)', maxWidth: 400 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Step {prog.current_step} / {lab.step_count || '?'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                          {prog.total_points} pts
                        </span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pctDone}%` }} /></div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'var(--space-md)' }}>
                    {(lab.topic_names || []).slice(0, 12).map((name, i) => (
                      <span key={i} className="topic-tag" style={{ borderColor: (lab.topic_colors || [])[i] + '40' }}>{name}</span>
                    ))}
                    {(lab.topic_names || []).length > 12 && (
                      <span className="topic-tag">+{lab.topic_names.length - 12} more</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}

      {/* Grouped lab sections */}
      {LAB_GROUPS.map((group, gi) => {
        const groupLabs = group.slugs
          .map((s) => labBySlug[s])
          .filter(Boolean);
        return (
          <LabSection
            key={gi}
            group={group}
            labs={groupLabs}
            progress={progress}
            defaultOpen={true}
          />
        );
      })}

      {/* Ungrouped fallback (future labs not yet in a group) */}
      {ungrouped.length > 0 && (
        <LabSection
          group={{ title: 'Other Labs', color: 'var(--text-muted)' }}
          labs={ungrouped}
          progress={progress}
          defaultOpen={true}
        />
      )}

      {visibleLabs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          No labs match the current filter.
        </div>
      )}
    </div>
  );
}
