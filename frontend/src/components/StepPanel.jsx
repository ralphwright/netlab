import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, HelpCircle, CheckCircle, Target, LifeBuoy } from 'lucide-react';

function renderMarkdown(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if (part === '\n') return <br key={i} />;
    return <span key={i}>{part}</span>;
  });
}

export default function StepPanel({ step, stepNumber, totalSteps, isCompleted, isQuiz, onPrev, onNext }) {
  const [showHint, setShowHint] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  if (!step) {
    return (
      <div className="step-panel" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>No steps available for this lab yet.</p>
      </div>
    );
  }

  return (
    <div className="step-panel">
      <div className="step-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <span className={`step-number ${isCompleted ? 'completed' : ''}`}>
            {isCompleted ? <CheckCircle size={14} /> : stepNumber}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{step.title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isQuiz ? 'Question' : 'Step'} {stepNumber} of {totalSteps}
              {step.target_device && (
                <> · <Target size={11} style={{ verticalAlign: -1 }} /> {step.target_device}</>
              )}
              {step.points && (
                <> · {step.points} pts</>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-ghost btn-sm" onClick={onPrev} disabled={stepNumber <= 1}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={onNext} disabled={stepNumber >= totalSteps}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="step-content">
        <div className="step-instruction">
          {renderMarkdown(step.instruction)}
        </div>

        {/* Hint toggle */}
        {step.hint && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowHint(!showHint)}
              style={{ color: 'var(--color-warning)' }}
            >
              <HelpCircle size={14} />
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            {showHint && (
              <div style={{
                marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)',
                background: 'rgba(255,171,0,0.06)', border: '1px solid rgba(255,171,0,0.15)',
                borderRadius: 'var(--radius-sm)', color: 'var(--color-warning)',
                fontSize: '0.875rem', fontFamily: 'var(--font-mono)'
              }}>
                {step.hint}
              </div>
            )}
          </div>
        )}

        {/* Help toggle — expected commands */}
        {step.expected_commands && step.expected_commands.length > 0 && (
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowHelp(!showHelp)}
              style={{ color: 'var(--color-info)' }}
            >
              <LifeBuoy size={14} />
              {showHelp ? 'Hide Help' : 'Show Help'}
            </button>
            {showHelp && (
              <div style={{
                marginTop: 'var(--space-sm)', padding: 'var(--space-sm) var(--space-md)',
                background: 'var(--bg-terminal)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Expected Commands
                </div>
                {step.expected_commands.map((cmd, i) => (
                  <div key={i} style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.8125rem',
                    color: 'var(--accent)', opacity: 0.7, padding: '1px 0'
                  }}>
                    {cmd}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completion badge */}
        {isCompleted && (
          <div style={{
            marginTop: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.2)',
            borderRadius: 'var(--radius-sm)', color: 'var(--color-success)',
            fontSize: '0.875rem', fontWeight: 600
          }}>
            <CheckCircle size={16} /> {isQuiz ? 'Question answered!' : 'Step completed!'}
          </div>
        )}
      </div>
    </div>
  );
}
