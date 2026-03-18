import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useUser, getUserId } from '../useUser';
import TopologyGraph from './TopologyGraph';
import TerminalEmulator from './TerminalEmulator';
import StepPanel from './StepPanel';
import { ArrowLeft, CheckCircle, Circle, ChevronRight, BookOpen, Lightbulb, Info, RotateCcw } from 'lucide-react';

export default function LabView() {
  const { slug } = useParams();
  const { userId } = useUser();
  const [lab, setLab] = useState(null);
  const [topology, setTopology] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error: ...'
  const [terminalKey, setTerminalKey] = useState(0);

  // Refs to hold latest state for save function (avoids stale closures)
  const progressRef = useRef({ currentStep: 1, completedSteps: new Set(), totalPoints: 0 });

  // Keep ref in sync
  useEffect(() => {
    progressRef.current = { currentStep, completedSteps, totalPoints };
  }, [currentStep, completedSteps, totalPoints]);

  // ── Core save function ──────────────────────────────────
  const saveToBackend = useCallback(async (overrides = {}) => {
    const state = { ...progressRef.current, ...overrides };
    const steps = Array.from(state.completedSteps || []);

    // Only save if at least one step has been completed
    if (steps.length === 0) {
      return;
    }

    setSaveStatus('saving');
    try {
      const res = await api.saveProgress({
        user_id: userId,
        lab_slug: slug,
        current_step: state.currentStep || 1,
        completed_steps: steps,
        total_points: state.totalPoints || 0,
      });
      // Check if server returned an error in the body (200 + {error: ...})
      if (res.error) {
        console.error('Save returned error:', res.error);
        setSaveStatus(`error: ${res.error}`);
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus((s) => s === 'saved' ? null : s), 2000);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus(`error: ${err.message}`);
    }
  }, [slug, userId]);

  // ── Load lab + saved progress ───────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setCompletedSteps(new Set());
    setTotalPoints(0);
    setCurrentStep(1);
    setShowExplanation(null);
    setShowResetConfirm(false);
    setSaveStatus(null);

    Promise.all([
      api.getLab(slug),
      api.getTopology(slug).catch(() => ({ devices: [], interfaces: [], links: [] })),
      api.getLabProgress(slug, userId).catch(() => null),
    ])
      .then(([labData, topoData, progressData]) => {
        setLab(labData);
        setTopology(topoData);

        // Restore saved progress — check for ANY saved state, not just completed steps
        const hasProgress = progressData && (
          (progressData.completed_steps && progressData.completed_steps.length > 0) ||
          (progressData.current_step && progressData.current_step > 1) ||
          progressData.status === 'in_progress' ||
          progressData.status === 'completed'
        );

        if (hasProgress) {
          const restoredSteps = new Set(progressData.completed_steps || []);
          setCompletedSteps(restoredSteps);
          setTotalPoints(progressData.total_points || 0);

          const allStepNums = (labData.steps || []).map((s) => s.step_number).sort((a, b) => a - b);
          const nextUndone = allStepNums.find((n) => !restoredSteps.has(n));
          const resumeStep = nextUndone || progressData.current_step || 1;
          setCurrentStep(resumeStep);

          const resumeStepData = labData.steps?.find((s) => s.step_number === resumeStep);
          if (resumeStepData?.target_device) {
            setSelectedDevice(resumeStepData.target_device);
          } else if (topoData.devices?.length > 0) {
            setSelectedDevice(topoData.devices[0].name);
          }
        } else {
          if (labData.steps?.length > 0 && labData.steps[0].target_device) {
            setSelectedDevice(labData.steps[0].target_device);
          } else if (topoData.devices?.length > 0) {
            setSelectedDevice(topoData.devices[0].name);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, userId]);

  // ── Save on page leave / tab close ──────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = progressRef.current;
      const steps = Array.from(state.completedSteps || []);
      const uid = getUserId();

      // Only save if at least one step has been completed
      if (steps.length === 0) {
        return;
      }

      // Use sendBeacon for reliable fire-on-close
      const VITE_VAL = import.meta.env.VITE_API_URL;
      const base = typeof VITE_VAL === 'string' ? VITE_VAL : '';
      navigator.sendBeacon(
        `${base}/api/progress/save`,
        new Blob([JSON.stringify({
          user_id: uid,
          lab_slug: slug,
          current_step: state.currentStep,
          completed_steps: steps,
          total_points: state.totalPoints,
        })], { type: 'application/json' })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [slug]);

  // ── Step completion handler ─────────────────────────────
  const handleStepComplete = useCallback(async (stepNum, points) => {
    setCompletedSteps((prev) => {
      if (prev.has(stepNum)) return prev;
      return new Set([...prev, stepNum]);
    });
    setTotalPoints((prev) => prev + (points || 0));
    setShowExplanation(stepNum);

    // Save immediately with the NEW completed step included
    const updatedSteps = new Set([...progressRef.current.completedSteps, stepNum]);
    const updatedPoints = progressRef.current.totalPoints + (points || 0);
    await saveToBackend({
      completedSteps: updatedSteps,
      totalPoints: updatedPoints,
      currentStep: stepNum,
    });

    // Auto-advance
    setTimeout(() => {
      const nextStep = stepNum + 1;
      if (lab && nextStep <= (lab.steps?.length || 0)) {
        setCurrentStep(nextStep);
        const nextStepData = lab.steps.find((s) => s.step_number === nextStep);
        if (nextStepData?.target_device) {
          setSelectedDevice(nextStepData.target_device);
        }
      }
    }, 500);
  }, [lab, saveToBackend]);

  // ── Step navigation (no save — just UI) ─────────────────
  const goToStep = useCallback((stepNum) => {
    setCurrentStep(stepNum);
    const stepData = lab?.steps?.find((s) => s.step_number === stepNum);
    if (stepData?.target_device) setSelectedDevice(stepData.target_device);
  }, [lab]);

  // ── Reset handler ───────────────────────────────────────
  const handleResetLab = useCallback(async () => {
    try {
      await api.resetLabProgress(slug, userId);
      setCompletedSteps(new Set());
      setTotalPoints(0);
      setCurrentStep(1);
      setShowExplanation(null);
      setShowResetConfirm(false);
      setSaveStatus(null);
      setTerminalKey((k) => k + 1);
      if (lab?.steps?.length > 0 && lab.steps[0].target_device) {
        setSelectedDevice(lab.steps[0].target_device);
      }
    } catch (err) {
      console.error('Failed to reset lab:', err);
    }
  }, [slug, lab, userId]);

  const handleDeviceSelect = useCallback((deviceName) => {
    setSelectedDevice(deviceName);
  }, []);

  // ── Render ──────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '1.25rem', color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>
          Loading lab...
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Lab not found</h2>
        <Link to="/" className="btn btn-ghost" style={{ marginTop: 'var(--space-lg)' }}>Back to Labs</Link>
      </div>
    );
  }

  const steps = lab.steps || [];
  const maxPoints = steps.reduce((sum, s) => sum + (s.points || 0), 0);
  const progress = steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0;
  const currentStepData = steps.find((s) => s.step_number === currentStep);
  const isLabComplete = completedSteps.size === steps.length && steps.length > 0;

  return (
    <div className="fade-in">
      {/* Header Bar */}
      <div className="lab-header">
        <div className="lab-header-left">
          <Link to="/" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Labs
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', wordBreak: 'break-word' }}>{lab.title}</h2>
              {isLabComplete && (
                <span style={{
                  fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: 600,
                  color: 'var(--color-success)', background: 'rgba(0,230,118,0.1)',
                  padding: '2px 10px', borderRadius: 99, border: '1px solid rgba(0,230,118,0.3)',
                }}>
                  ✓ COMPLETED
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              {lab.subtitle}
              {lab.topic_slugs && lab.topic_slugs.length > 0 && !lab.is_integration && (
                <Link
                  to={`/theory/${lab.topic_slugs[0]}`}
                  style={{
                    marginLeft: 'var(--space-sm)', fontSize: '0.75rem',
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    color: 'var(--accent)', textDecoration: 'none',
                  }}
                >
                  <BookOpen size={12} /> Read Theory
                </Link>
              )}
            </p>
          </div>
        </div>
        <div className="lab-header-right">
          {/* Save status indicator */}
          {saveStatus && (
            <span style={{
              fontSize: '0.6875rem', fontFamily: 'var(--font-mono)',
              color: saveStatus === 'saved' ? 'var(--color-success)'
                : saveStatus === 'saving' ? 'var(--accent)'
                : 'var(--color-error)',
            }}>
              {saveStatus === 'saving' ? '● saving...'
                : saveStatus === 'saved' ? '✓ saved'
                : `⚠ ${saveStatus}`}
            </span>
          )}

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: 'var(--accent)' }}>
              {totalPoints} / {maxPoints} pts
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {completedSteps.size} / {steps.length} steps
            </div>
          </div>
          <div style={{ width: 120, minWidth: 80, flexShrink: 1 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Reset button */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              title="Reset lab progress"
              style={{ color: completedSteps.size > 0 ? 'var(--color-error)' : 'var(--text-muted)' }}
            >
              <RotateCcw size={15} />
            </button>
            {showResetConfirm && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
                boxShadow: 'var(--shadow-elevated)', zIndex: 50, width: 240,
              }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  Reset all progress for this lab? This clears completed steps, points, and command history.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: '#fff', flex: 1 }} onClick={handleResetLab}>Reset Lab</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowResetConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset confirmation — also accessible from mobile score row */}
      {showResetConfirm && (
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
          boxShadow: 'var(--shadow-elevated)', marginBottom: 'var(--space-sm)',
        }}
        className="mobile-reset-confirm"
        >
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            Reset all progress for this lab?
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: '#fff', flex: 1 }} onClick={handleResetLab}>Reset Lab</button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowResetConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Mobile compact score row (hidden on desktop via CSS) */}
      <div className="lab-score-row">
        <span className="score-text">
          {completedSteps.size}/{steps.length} steps · {totalPoints}/{maxPoints} pts
        </span>
        {saveStatus && (
          <span style={{
            fontSize: '0.625rem', fontFamily: 'var(--font-mono)',
            color: saveStatus === 'saved' ? 'var(--color-success)' : saveStatus === 'saving' ? 'var(--accent)' : 'var(--color-error)',
          }}>
            {saveStatus === 'saving' ? '●' : saveStatus === 'saved' ? '✓' : '⚠'}
          </span>
        )}
        <div className="progress-bar" style={{ flex: 1, maxWidth: 120 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowResetConfirm(!showResetConfirm)}
          style={{ color: completedSteps.size > 0 ? 'var(--color-error)' : 'var(--text-muted)', padding: '4px 6px' }}
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Step Progress Dots */}
      <div className="step-dots-bar">
        {steps.map((step) => {
          const isCompleted = completedSteps.has(step.step_number);
          const isCurrent = step.step_number === currentStep;
          return (
            <button
              key={step.step_number}
              onClick={() => goToStep(step.step_number)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)', flexShrink: 0,
                background: isCurrent ? 'var(--accent-glow-strong)' : 'transparent',
                color: isCompleted ? 'var(--color-success)' : isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                border: isCurrent ? '1px solid var(--accent)' : '1px solid transparent',
              }}
              title={step.title}
            >
              {isCompleted ? <CheckCircle size={12} /> : <Circle size={12} />}
              {step.step_number}
            </button>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="lab-workspace">
        <div className="lab-workspace-topo">
          <TopologyGraph topology={topology} selectedDevice={selectedDevice} onDeviceSelect={handleDeviceSelect} currentStep={currentStepData} />
        </div>

        <div>
          <StepPanel
            step={currentStepData} stepNumber={currentStep} totalSteps={steps.length}
            isCompleted={completedSteps.has(currentStep)}
            onPrev={() => currentStep > 1 && goToStep(currentStep - 1)}
            onNext={() => currentStep < steps.length && goToStep(currentStep + 1)}
          />
          {showExplanation && (() => {
            const expStep = steps.find((s) => s.step_number === showExplanation);
            if (!expStep?.explanation) return null;
            return (
              <div className="card" style={{ marginTop: 'var(--space-md)', background: 'rgba(0,230,118,0.05)', border: '1px solid rgba(0,230,118,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  <Lightbulb size={16} color="var(--color-success)" />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-success)' }}>Why this works</span>
                  <button onClick={() => setShowExplanation(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Dismiss</button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{expStep.explanation}</p>
              </div>
            );
          })()}
        </div>

        <div>
          <TerminalEmulator key={terminalKey} labSlug={slug} deviceName={selectedDevice} step={currentStepData} onStepComplete={handleStepComplete} completedSteps={completedSteps} userId={userId} />
        </div>
      </div>
    </div>
  );
}
