import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
  Layers, GitBranch, Route, Combine, Server, Globe, Network as NetworkIcon,
  Tag, ArrowRightLeft, Building, Hash, Laptop, Terminal, Shield, Repeat,
  List, Wifi, Monitor, Lock, Radar, Flame, Trophy, Clock, Zap, Star,
  RotateCcw, CheckCircle
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

export default function Dashboard() {
  const [labs, setLabs] = useState([]);
  const [topics, setTopics] = useState([]);
  const [progress, setProgress] = useState({}); // slug -> { status, current_step, total_points, total_steps }
  const [filter, setFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showResetAll, setShowResetAll] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getLabs(),
      api.getTopics(),
      api.getProgress('student').catch(() => []),
    ])
      .then(([labData, topicData, progressData]) => {
        setLabs(labData);
        setTopics(topicData);
        // Build lookup map: lab_slug -> progress row
        const map = {};
        (progressData || []).forEach((p) => {
          map[p.lab_slug] = p;
        });
        setProgress(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleResetAll = async () => {
    setResetting(true);
    try {
      await api.resetAllProgress('student');
      setProgress({});
      setShowResetAll(false);
    } catch (err) {
      console.error('Failed to reset:', err);
    } finally {
      setResetting(false);
    }
  };

  const filtered = labs.filter((lab) => {
    if (filter !== 'all' && !(lab.topic_slugs || []).includes(filter)) return false;
    if (diffFilter !== 'all' && lab.difficulty !== diffFilter) return false;
    return true;
  });

  const integrationLabs = filtered.filter((l) => l.is_integration);
  const regularLabs = filtered.filter((l) => !l.is_integration);

  const completedCount = Object.values(progress).filter((p) => p.status === 'completed').length;
  const inProgressCount = Object.values(progress).filter((p) => p.status === 'in_progress').length;
  const hasAnyProgress = Object.keys(progress).length > 0;

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
      <section style={{ marginBottom: 'var(--space-3xl)', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.75rem', marginBottom: 'var(--space-md)', fontWeight: 800 }}>
          Interactive Network Engineering <span style={{ color: 'var(--accent)' }}>Labs</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: 660, margin: '0 auto' }}>
          22 hands-on labs covering VLANs, OSPF, BGP, MPLS, firewalls, wireless, and more.
          Configure real Cisco IOS commands on interactive topologies.
        </p>
      </section>

      {/* Stats */}
      <section style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)',
        marginBottom: 'var(--space-2xl)'
      }}>
        {[
          { icon: Terminal, label: 'Labs', value: labs.length, color: 'var(--accent)' },
          { icon: CheckCircle, label: 'Completed', value: completedCount, color: 'var(--color-success)' },
          { icon: Zap, label: 'In Progress', value: inProgressCount, color: 'var(--color-warning)' },
          { icon: Star, label: 'CLI Steps', value: labs.reduce((s, l) => s + (l.step_count || 0), 0), color: 'var(--color-info)' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md) var(--space-lg)'
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--radius-sm)',
              background: `color-mix(in srgb, ${stat.color} 12%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <stat.icon size={22} color={stat.color} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Reset All Progress */}
      {hasAnyProgress && (
        <div style={{
          display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-md)',
          position: 'relative',
        }}>
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
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setShowResetAll(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <section style={{
        display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)',
        flexWrap: 'wrap', alignItems: 'center'
      }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Filter:
        </div>
        <button
          className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setFilter('all')}
        >
          All Topics
        </button>
        {topics.map((t) => (
          <button
            key={t.slug}
            className={`btn btn-sm ${filter === t.slug ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(t.slug)}
            style={filter === t.slug ? {} : { borderColor: t.color + '40', color: t.color }}
          >
            {t.name}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)' }}>
          {['all', ...DIFFICULTY_ORDER].map((d) => (
            <button
              key={d}
              className={`btn btn-sm ${diffFilter === d ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDiffFilter(d)}
            >
              {d === 'all' ? 'All Levels' : d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Integration Lab (featured) */}
      {integrationLabs.map((lab) => {
        const prog = progress[lab.slug];
        const pctDone = prog && lab.step_count > 0
          ? Math.round((prog.current_step / lab.step_count) * 100)
          : 0;
        const isComplete = prog?.status === 'completed';

        return (
        <Link key={lab.slug} to={`/lab/${lab.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 'var(--space-xl)' }}>
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(255,171,0,0.06) 0%, rgba(0,229,255,0.04) 100%)',
            border: `1px solid ${isComplete ? 'rgba(0,230,118,0.3)' : 'rgba(255,171,0,0.2)'}`,
            padding: 'var(--space-xl)',
            position: 'relative', overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 12, right: 16,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              {isComplete && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                  color: 'var(--color-success)', fontWeight: 600,
                  background: 'rgba(0,230,118,0.1)', padding: '4px 12px',
                  borderRadius: '99px', border: '1px solid rgba(0,230,118,0.3)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <CheckCircle size={12} /> COMPLETED
                </span>
              )}
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                color: 'var(--color-warning)', fontWeight: 600,
                background: 'rgba(255,171,0,0.1)', padding: '4px 12px',
                borderRadius: '99px', border: '1px solid rgba(255,171,0,0.3)'
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
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pctDone}%` }} />
                </div>
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

      {/* Regular Lab Grid */}
      <div className="lab-grid">
        {regularLabs.map((lab, idx) => {
          const prog = progress[lab.slug];
          const pctDone = prog && lab.step_count > 0
            ? Math.round((prog.current_step / lab.step_count) * 100)
            : 0;
          const isComplete = prog?.status === 'completed';
          const isStarted = prog?.status === 'in_progress';

          return (
          <Link key={lab.slug} to={`/lab/${lab.slug}`} style={{ textDecoration: 'none' }}>
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
                  {lab.step_count} steps
                </span>
              </div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>{lab.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1 }}>{lab.subtitle}</p>

              {/* Progress bar */}
              {prog && (
                <div style={{ marginTop: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Step {prog.current_step}/{lab.step_count || '?'}
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
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          No labs match the current filters.
        </div>
      )}
    </div>
  );
}
