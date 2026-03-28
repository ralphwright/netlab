import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import {
  ArrowLeft, BookOpen, Terminal, AlertTriangle, ExternalLink,
  Clock, ChevronRight, Layers, Code, Lightbulb
} from 'lucide-react';
import TheoryDiagram, { INLINE_DIAGRAMS } from './TheoryDiagram';

// ── Inline diagram injector ────────────────────────────────────
// Splits markdown on ## headings, renders Markdown sections with
// inline diagram components injected after matching headings.
function TheoryPageContent({ slug, theoryMd }) {
  const inlines = INLINE_DIAGRAMS[slug] || [];

  if (inlines.length === 0) {
    return (
      <>
        <TheoryDiagram slug={slug} />
        <Markdown text={theoryMd} />
      </>
    );
  }

  // Split markdown into sections on ## and ### headings
  const sections = [];
  const lines = (theoryMd || '').split('\n');
  let current = { heading: null, lines: [] };
  for (const line of lines) {
    if (line.startsWith('### ') || line.startsWith('## ') || line.startsWith('# ')) {
      if (current.lines.length > 0 || current.heading) {
        sections.push({ ...current });
      }
      current = { heading: line.replace(/^#+\s*/, ''), lines: [line] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length > 0 || current.heading) sections.push(current);

  // For each section, check if any inline diagram should follow it
  const elements = [];
  // Always render the top-level diagram first
  elements.push(<TheoryDiagram key="top-diagram" slug={slug} />);

  sections.forEach((section, i) => {
    elements.push(<Markdown key={`section-${i}`} text={section.lines.join('\n')} />);
    // Inject diagrams whose afterSection exactly matches this section heading
    inlines.forEach((inline, j) => {
      const target = inline.afterSection.toLowerCase().trim();
      const heading = (section.heading || '').toLowerCase().trim();
      if (heading === target) {
        const Component = inline.component;
        elements.push(<Component key={`inline-${i}-${j}`} />);
      }
    });
  });

  return <>{elements}</>;
}

// Simple markdown-to-JSX renderer
function Markdown({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeLines = [];
  let codeKey = 0;
  let inTable = false;
  let tableRows = [];
  let tableKey = 0;

  const renderInline = (line, key) => {
    // Bold, code, links
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    return (
      <span key={key}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.8125rem',
                background: 'rgba(0,229,255,0.08)', color: 'var(--accent)',
                padding: '1px 5px', borderRadius: 3,
              }}>{part.slice(1, -1)}</code>
            );
          }
          const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer">{linkMatch[1]}</a>;
          }
          return <span key={i}>{part}</span>;
        })}
      </span>
    );
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      const headerRow = tableRows[0];
      const bodyRows = tableRows.slice(2); // skip separator row
      elements.push(
        <div key={`table-${tableKey++}`} style={{ overflowX: 'auto', marginBottom: 'var(--space-md)' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
          }}>
            <thead>
              <tr>
                {headerRow.split('|').filter(Boolean).map((cell, i) => (
                  <th key={i} style={{
                    padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                    borderBottom: '2px solid var(--border-default)', color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                  }}>{cell.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri}>
                  {row.split('|').filter(Boolean).map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '6px 12px', borderBottom: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}>{renderInline(cell.trim(), `tc-${ri}-${ci}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${codeKey++}`} style={{
            background: 'var(--bg-terminal)', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)', padding: 'var(--space-md)',
            fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--accent)',
            overflowX: 'auto', marginBottom: 'var(--space-md)', lineHeight: 1.7,
          }}>
            {codeLines.join('\n')}
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushTable();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|')) {
      inTable = true;
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headers
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} style={{
          fontSize: '1.375rem', fontWeight: 700, marginTop: 'var(--space-xl)',
          marginBottom: 'var(--space-md)', color: 'var(--text-primary)',
          fontFamily: 'var(--font-display)',
        }}>{line.slice(3)}</h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} style={{
          fontSize: '1.0625rem', fontWeight: 600, marginTop: 'var(--space-lg)',
          marginBottom: 'var(--space-sm)', color: 'var(--text-primary)',
        }}>{line.slice(4)}</h3>
      );
      continue;
    }

    // List items
    if (line.trim().startsWith('- ')) {
      elements.push(
        <div key={i} style={{
          paddingLeft: 'var(--space-md)', marginBottom: 4,
          color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7,
          display: 'flex', gap: 8,
        }}>
          <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
          <span>{renderInline(line.trim().slice(2), `li-${i}`)}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      elements.push(
        <div key={i} style={{
          paddingLeft: 'var(--space-md)', marginBottom: 4,
          color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7,
          display: 'flex', gap: 8,
        }}>
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', flexShrink: 0, minWidth: 18 }}>{numMatch[1]}.</span>
          <span>{renderInline(numMatch[2], `ol-${i}`)}</span>
        </div>
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 8 }} />);
      continue;
    }

    // Paragraph
    elements.push(
      <p key={i} style={{
        color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7,
        marginBottom: 'var(--space-sm)',
      }}>{renderInline(line, `p-${i}`)}</p>
    );
  }

  flushTable();
  return <>{elements}</>;
}

export default function TheoryPage() {
  const { slug } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('theory');

  useEffect(() => {
    setLoading(true);
    setActiveTab('theory');
    api.getTheory(slug)
      .then(setContent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '1.25rem', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>Loading theory...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Theory not found</h2>
        <Link to="/theory" className="btn btn-ghost" style={{ marginTop: 'var(--space-lg)' }}>Back to Theory</Link>
      </div>
    );
  }

  const commands = (() => { try { return JSON.parse(content.key_commands || '[]'); } catch { return []; } })();
  const mistakes = (() => { try { return JSON.parse(content.common_mistakes || '[]'); } catch { return []; } })();
  const rfcs = content.rfc_references || [];
  const relatedLabs = content.related_labs || [];

  const tabs = [
    { id: 'theory', label: 'Theory', icon: BookOpen },
    { id: 'practical', label: 'Practical', icon: Terminal },
    { id: 'reference', label: 'Quick Reference', icon: Code },
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
        marginBottom: 'var(--space-xl)',
      }}>
        <Link to="/theory" className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Theory
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <h1 className="lab-title">{content.name}</h1>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 4, alignItems: 'center' }}>
            {content.osi_layer && (
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                color: content.color || 'var(--accent)',
                background: `${content.color || 'var(--accent)'}15`,
                padding: '2px 10px', borderRadius: 99,
                border: `1px solid ${content.color || 'var(--accent)'}30`,
              }}>
                {content.osi_layer}
              </span>
            )}
            {rfcs.length > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {rfcs.join(' · ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="theory-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? 'var(--accent-glow-strong)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'theory' && (
        <div className="fade-in">
          <TheoryPageContent slug={content.slug} theoryMd={content.theory_md} />
        </div>
      )}

      {activeTab === 'practical' && (
        <div className="fade-in">
          <Markdown text={content.practical_md} />
        </div>
      )}

      {activeTab === 'reference' && (
        <div className="fade-in">
          {/* Key Commands */}
          {commands.length > 0 && (
            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{
                fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-md)',
                fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Terminal size={20} color="var(--accent)" /> Key Commands
              </h2>
              <div style={{
                background: 'var(--bg-terminal)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
              }}>
                {commands.map((cmd, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.8125rem',
                    color: 'var(--accent)', padding: '4px 0',
                    borderBottom: i < commands.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    {cmd}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Common Mistakes */}
          {mistakes.length > 0 && (
            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{
                fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-md)',
                fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <AlertTriangle size={20} color="var(--color-error)" /> Common Mistakes
              </h2>
              {mistakes.map((mistake, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)',
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'rgba(255,23,68,0.04)', border: '1px solid rgba(255,23,68,0.12)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ color: 'var(--color-error)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', flexShrink: 0 }}>
                    {i + 1}.
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {mistake}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* RFC References */}
          {rfcs.length > 0 && (
            <section style={{ marginBottom: 'var(--space-xl)' }}>
              <h2 style={{
                fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-md)',
                fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Layers size={20} color="var(--color-info)" /> Standards & References
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                {rfcs.map((rfc, i) => (
                  <span key={i} className="topic-tag" style={{ fontSize: '0.8125rem' }}>
                    {rfc}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Related Labs — always visible at bottom */}
      {relatedLabs.length > 0 && (
        <section style={{
          marginTop: 'var(--space-2xl)', paddingTop: 'var(--space-xl)',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <h2 style={{
            fontSize: '1.125rem', fontWeight: 700, marginBottom: 'var(--space-md)',
            fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Lightbulb size={20} color="var(--color-warning)" /> Practice This Topic
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
            {relatedLabs.map((lab) => (
              <Link key={lab.slug} to={`/lab/${lab.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-md) var(--space-lg)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 2 }}>{lab.title}</div>
                    <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
                      <span className={`badge badge-${lab.difficulty}`}>{lab.difficulty}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock size={11} style={{ verticalAlign: -1 }} /> {lab.estimated_minutes} min · {lab.step_count} steps
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
