import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import TopologyGraph from './TopologyGraph';
import TerminalEmulator from './TerminalEmulator';
import StepPanel from './StepPanel';
import { ArrowLeft, CheckCircle, Circle, ChevronRight, BookOpen, Lightbulb, Info } from 'lucide-react';

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

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getLab(slug),
      api.getTopology(slug).catch(() => ({ devices: [], interfaces: [], links: [] })),
    ])
      .then(([labData, topoData]) => {
        setLab(labData);
        setTopology(topoData);
        // Auto-select first device target
        if (labData.steps?.length > 0 && labData.steps[0].target_device) {
          setSelectedDevice(labData.steps[0].target_device);
        } else if (topoData.devices?.length > 0) {
          setSelectedDevice(topoData.devices[0].name);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleStepComplete = useCallback((stepNum, points) => {
    setCompletedSteps((prev) => new Set([...prev, stepNum]));
    setTotalPoints((prev) => prev + (points || 0));
    setShowExplanation(stepNum);

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
  }, [lab]);

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
            <h2 style={{ fontSize: '1.5rem' }}>{lab.title}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              {lab.subtitle}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
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
            labSlug={slug}
            deviceName={selectedDevice}
            step={currentStepData}
            onStepComplete={handleStepComplete}
          />
        </div>
      </div>
    </div>
  );
}
