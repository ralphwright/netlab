import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import TopologyGraph from './TopologyGraph';
import TerminalEmulator from './TerminalEmulator';
import StepPanel from './StepPanel';
import { ArrowLeft, CheckCircle, Circle, ChevronRight, BookOpen, Lightbulb, Info, RotateCcw } from 'lucide-react';

export default function LabView() {
  const { slug } = useParams();
  const [lab, setLab] = useState(null);
  const [topology, setTopology] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savingStep, setSavingStep] = useState(false);

  // Key to force-remount terminal on reset
  const [terminalKey, setTerminalKey] = useState(0);

  // Load lab data AND saved progress on mount / slug change
  useEffect(() => {
    setLoading(true);
    setCompletedSteps(new Set());
    setTotalPoints(0);
    setCurrentStep(1);
    setShowExplanation(null);
    setShowResetConfirm(false);

    Promise.all([
      api.getLab(slug),
      api.getTopology(slug).catch(() => ({ devices: [], interfaces: [], links: [] })),
      api.getLabProgress(slug).catch(() => null),
    ])
      .then(([labData, topoData, progressData]) => {
        setLab(labData);
        setTopology(topoData);

        // Restore saved progress
        if (progressData && progressData.completed_steps?.length > 0) {
          setCompletedSteps(new Set(progressData.completed_steps));
          setTotalPoints(progressData.total_points || 0);

          // Resume at next uncompleted step
          const allStepNums = (labData.steps || []).map((s) => s.step_number).sort((a, b) => a - b);
          const doneSet = new Set(progressData.completed_steps);
          const nextUndone = allStepNums.find((n) => !doneSet.has(n));
          const resumeStep = nextUndone || progressData.current_step || 1;
          setCurrentStep(resumeStep);

          // Select the target device for the resumed step
          const resumeStepData = labData.steps?.find((s) => s.step_number === resumeStep);
          if (resumeStepData?.target_device) {
            setSelectedDevice(resumeStepData.target_device);
          } else if (topoData.devices?.length > 0) {
            setSelectedDevice(topoData.devices[0].name);
          }
        } else {
          // Fresh start — select first step's device
          if (labData.steps?.length > 0 && labData.steps[0].target_device) {
            setSelectedDevice(labData.steps[0].target_device);
          } else if (topoData.devices?.length > 0) {
            setSelectedDevice(topoData.devices[0].name);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const [saveError, setSaveError] = useState(null);

  const handleStepComplete = useCallback(async (stepNum, points) => {
    // Update local state immediately
    setCompletedSteps((prev) => {
      if (prev.has(stepNum)) return prev; // already done, don't double-count
      return new Set([...prev, stepNum]);
    });
    setTotalPoints((prev) => prev + (points || 0));
    setShowExplanation(stepNum);
    setSaveError(null);

    // Persist to backend — await so we catch failures
    setSavingStep(true);
    try {
      const res = await api.completeStep({
        user_id: 'student',
        lab_slug: slug,
        step_number: stepNum,
        points: points || 0,
      });
      // Check for error in response body (shouldn't happen with new backend, but just in case)
      if (res.error) {
        console.error('Save returned error:', res.error);
        setSaveError(`Save failed: ${res.error}`);
      }
    } catch (err) {
      console.error('Failed to save step progress:', err);
      setSaveError(`Save failed: ${err.message}`);
    } finally {
      setSavingStep(false);
    }

    // Auto-advance after brief delay
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
  }, [lab, slug]);

  const handleResetLab = useCallback(async () => {
    try {
      await api.resetLabProgress(slug);
      setCompletedSteps(new Set());
      setTotalPoints(0);
      setCurrentStep(1);
      setShowExplanation(null);
      setShowResetConfirm(false);
      setTerminalKey((k) => k + 1); // force terminal remount

      // Re-select first device
      if (lab?.steps?.length > 0 && lab.steps[0].target_device) {
        setSelectedDevice(lab.steps[0].target_device);
      }
    } catch (err) {
      console.error('Failed to reset lab:', err);
    }
  }, [slug, lab]);

  const handleDeviceSelect = useCallback((deviceName) => {
    setSelectedDevice(deviceName);
  }, []);

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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-lg)', gap: 'var(--space-md)', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Link to="/" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Labs
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <h2 style={{ fontSize: '1.5rem' }}>{lab.title}</h2>
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
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Saving indicator */}
          {savingStep && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
              saving...
            </span>
          )}
          {saveError && (
            <span
              style={{
                fontSize: '0.6875rem', color: 'var(--color-error)', fontFamily: 'var(--font-mono)',
                cursor: 'pointer', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              title={saveError}
              onClick={() => setSaveError(null)}
            >
              ⚠ {saveError}
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
          <div style={{ width: 160 }}>
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

            {/* Reset confirmation dropdown */}
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
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--color-error)', color: '#fff', flex: 1 }}
                    onClick={handleResetLab}
                  >
                    Reset Lab
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step Progress Dots */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 'var(--space-lg)',
        padding: 'var(--space-sm) var(--space-md)',
        background: 'var(--bg-panel)', borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)', overflowX: 'auto'
      }}>
        {steps.map((step) => {
          const isCompleted = completedSteps.has(step.step_number);
          const isCurrent = step.step_number === currentStep;
          return (
            <button
              key={step.step_number}
              onClick={() => {
                setCurrentStep(step.step_number);
                if (step.target_device) setSelectedDevice(step.target_device);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
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

      {/* Main Grid: Topology + Steps left, Terminal right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto 1fr',
        gap: 'var(--space-md)',
        minHeight: 600,
      }}>
        {/* Topology (top left) */}
        <div style={{ gridColumn: '1 / -1' }}>
          <TopologyGraph
            topology={topology}
            selectedDevice={selectedDevice}
            onDeviceSelect={handleDeviceSelect}
            currentStep={currentStepData}
          />
        </div>

        {/* Step Panel (bottom left) */}
        <div>
          <StepPanel
            step={currentStepData}
            stepNumber={currentStep}
            totalSteps={steps.length}
            isCompleted={completedSteps.has(currentStep)}
            onPrev={() => {
              if (currentStep > 1) {
                const prev = currentStep - 1;
                setCurrentStep(prev);
                const s = steps.find((s) => s.step_number === prev);
                if (s?.target_device) setSelectedDevice(s.target_device);
              }
            }}
            onNext={() => {
              if (currentStep < steps.length) {
                const next = currentStep + 1;
                setCurrentStep(next);
                const s = steps.find((s) => s.step_number === next);
                if (s?.target_device) setSelectedDevice(s.target_device);
              }
            }}
          />

          {/* Explanation popup */}
          {showExplanation && (() => {
            const expStep = steps.find((s) => s.step_number === showExplanation);
            if (!expStep?.explanation) return null;
            return (
              <div className="card" style={{
                marginTop: 'var(--space-md)',
                background: 'rgba(0,230,118,0.05)',
                border: '1px solid rgba(0,230,118,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
                  <Lightbulb size={16} color="var(--color-success)" />
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-success)' }}>Why this works</span>
                  <button
                    onClick={() => setShowExplanation(null)}
                    style={{
                      marginLeft: 'auto', background: 'none', border: 'none',
                      color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem'
                    }}
                  >
                    Dismiss
                  </button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {expStep.explanation}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Terminal (bottom right) */}
        <div>
          <TerminalEmulator
            key={terminalKey}
            labSlug={slug}
            deviceName={selectedDevice}
            step={currentStepData}
            onStepComplete={handleStepComplete}
            completedSteps={completedSteps}
          />
        </div>
      </div>
    </div>
  );
}
