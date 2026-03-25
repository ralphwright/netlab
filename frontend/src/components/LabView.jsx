import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useUser, getUserId } from '../useUser';
import TopologyGraph from './TopologyGraph';
import TerminalEmulator from './TerminalEmulator';
import StepPanel from './StepPanel';
import DeviceInspector from './DeviceInspector';
import { ArrowLeft, CheckCircle, Circle, BookOpen, Lightbulb, RotateCcw, Zap } from 'lucide-react';

// ── Protocol map for packet animations ────────────────────────────
const PROTOCOL_MAP = {
  vlan:      { color: '#7c4dff', label: '802.1Q',     protocol: 'VLAN' },
  stp:       { color: '#ff6d00', label: 'BPDU',        protocol: 'STP'  },
  lacp:      { color: '#f50057', label: 'LACP PDU',    protocol: 'LACP' },
  ospf:      { color: '#00e5ff', label: 'OSPF Hello',  protocol: 'OSPF' },
  bgp:       { color: '#00b0ff', label: 'BGP Update',  protocol: 'BGP'  },
  dhcp:      { color: '#00e676', label: 'DHCP DORA',   protocol: 'DHCP' },
  dns:       { color: '#ffab00', label: 'DNS Query',   protocol: 'DNS'  },
  nat:       { color: '#40c4ff', label: 'NAT/PAT',     protocol: 'NAT'  },
  acl:       { color: '#ff1744', label: 'ACL Check',   protocol: 'ACL'  },
  ssh:       { color: '#69f0ae', label: 'SSH',         protocol: 'SSH'  },
  tunnel:    { color: '#76ff03', label: 'GRE',         protocol: 'GRE'  },
  gre:       { color: '#76ff03', label: 'GRE Tunnel',  protocol: 'GRE'  },
  mpls:      { color: '#e040fb', label: 'MPLS Label',  protocol: 'MPLS' },
  wireless:  { color: '#039be5', label: '802.11',      protocol: 'WiFi' },
  ipv6:      { color: '#b388ff', label: 'ICMPv6',      protocol: 'IPv6' },
  firewall:  { color: '#ff5252', label: 'FW Policy',   protocol: 'FW'   },
};

function deriveProtocol(labSlug = '') {
  const slug = labSlug.toLowerCase();
  for (const [key, val] of Object.entries(PROTOCOL_MAP)) {
    if (slug.includes(key)) return val;
  }
  return { color: '#00e5ff', label: 'DATA', protocol: 'IP' };
}

// ── Packet header info for the breakdown panel ─────────────────
const HEADER_INFO = {
  'VLAN':  { name: '802.1Q Frame', fields: [['EtherType', '0x8100'], ['VLAN ID', 'per config'], ['Priority', '0'], ['Payload', 'Ethernet II']] },
  'STP':   { name: 'BPDU', fields: [['Protocol', 'IEEE 802.1D'], ['Type', 'Config BPDU'], ['Bridge ID', 'priority + MAC'], ['Port ID', 'per port']] },
  'OSPF':  { name: 'OSPF Hello', fields: [['IP Protocol', '89'], ['Src', 'router interface'], ['Dst', '224.0.0.5'], ['Area ID', 'per config']] },
  'BGP':   { name: 'BGP Update', fields: [['TCP Port', '179'], ['AS Path', 'per config'], ['Next Hop', 'peer IP'], ['NLRI', 'prefixes']] },
  'DHCP':  { name: 'DHCP Discover', fields: [['UDP Src', '0.0.0.0:68'], ['UDP Dst', '255.255.255.255:67'], ['Op', 'BOOTREQUEST'], ['Magic Cookie', '99.130.83.99']] },
  'DNS':   { name: 'DNS Query', fields: [['UDP Dst', '53'], ['QType', 'A / AAAA'], ['QName', 'hostname'], ['Flags', 'RD=1']] },
  'NAT':   { name: 'NAT Translation', fields: [['Inside Local', '10.x.x.x:src'], ['Inside Global', 'public:src'], ['Outside', 'dst IP:port'], ['Proto', 'TCP/UDP']] },
  'ACL':   { name: 'ACL Evaluation', fields: [['Src IP', 'per packet'], ['Dst IP', 'per packet'], ['Protocol', 'TCP/UDP/ICMP'], ['Action', 'permit / deny']] },
  'GRE':   { name: 'GRE Header', fields: [['IP Protocol', '47'], ['Outer Src', 'tunnel source'], ['Outer Dst', 'tunnel destination'], ['Inner', 'original packet']] },
  'MPLS':  { name: 'MPLS Label Stack', fields: [['Label', '20 bits'], ['TC', '3 bits (QoS)'], ['S', 'bottom-of-stack bit'], ['TTL', '8 bits']] },
  'LACP':  { name: 'LACP PDU', fields: [['EtherType', '0x8809'], ['Subtype', '0x01 (LACP)'], ['Actor', 'priority + MAC'], ['Partner', 'peer info']] },
  'SSH':   { name: 'SSH Handshake', fields: [['TCP Port', '22'], ['Version', 'SSH-2.0'], ['KEX', 'diffie-hellman'], ['Cipher', 'aes256-ctr']] },
};

export default function LabView() {
  const { slug }   = useParams();
  const { userId } = useUser();

  const [lab, setLab]                       = useState(null);
  const [topology, setTopology]             = useState(null);
  const [currentStep, setCurrentStep]       = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [totalPoints, setTotalPoints]       = useState(0);
  const [loading, setLoading]               = useState(true);
  const [showExplanation, setShowExplanation] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveStatus, setSaveStatus]         = useState(null);
  const [terminalKey, setTerminalKey]       = useState(0);
  const [animSpeed, setAnimSpeed]           = useState(2);     // 1=slow 2=normal 3=fast
  const [packetFlows, setPacketFlows]       = useState([]);
  const [showInspector, setShowInspector]   = useState(false);
  const [stepTransKey, setStepTransKey]     = useState(0);    // forces step transition
  const [mobileTab, setMobileTab]           = useState('instructions'); // 'topology'|'instructions'|'terminal'
  const workspaceRef                        = useRef(null);

  const progressRef = useRef({ currentStep: 1, completedSteps: new Set(), totalPoints: 0 });

  useEffect(() => {
    progressRef.current = { currentStep, completedSteps, totalPoints };
  }, [currentStep, completedSteps, totalPoints]);

  // ── Save to backend ────────────────────────────────────────
  const saveToBackend = useCallback(async (overrides = {}) => {
    const state = { ...progressRef.current, ...overrides };
    const steps = Array.from(state.completedSteps || []);
    if (steps.length === 0) return;
    setSaveStatus('saving');
    try {
      const res = await api.saveProgress({
        user_id: userId, lab_slug: slug,
        current_step: state.currentStep || 1,
        completed_steps: steps, total_points: state.totalPoints || 0,
      });
      if (res.error) { setSaveStatus(`error: ${res.error}`); }
      else { setSaveStatus('saved'); setTimeout(() => setSaveStatus((s) => s === 'saved' ? null : s), 2000); }
    } catch (err) { setSaveStatus(`error: ${err.message}`); }
  }, [slug, userId]);

  // ── Load lab ───────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setCompletedSteps(new Set()); setTotalPoints(0); setCurrentStep(1);
    setShowExplanation(null); setShowResetConfirm(false); setSaveStatus(null); setPacketFlows([]);

    Promise.all([
      api.getLab(slug),
      api.getTopology(slug).catch(() => ({ devices: [], interfaces: [], links: [] })),
      api.getLabProgress(slug, userId).catch(() => null),
    ]).then(([labData, topoData, progressData]) => {
      setLab(labData);
      setTopology(topoData);

      const hasProgress = progressData && (
        (progressData.completed_steps && progressData.completed_steps.length > 0) ||
        (progressData.current_step && progressData.current_step > 1) ||
        progressData.status === 'in_progress' || progressData.status === 'completed'
      );

      if (hasProgress) {
        const restoredSteps = new Set(progressData.completed_steps || []);
        setCompletedSteps(restoredSteps);
        setTotalPoints(progressData.total_points || 0);
        const allStepNums = (labData.steps || []).map((s) => s.step_number).sort((a, b) => a - b);
        const nextUndone  = allStepNums.find((n) => !restoredSteps.has(n));
        const resumeStep  = nextUndone || progressData.current_step || 1;
        setCurrentStep(resumeStep);
        const resumeData = labData.steps?.find((s) => s.step_number === resumeStep);
        if (resumeData?.target_device) setSelectedDevice(resumeData.target_device);
        else if (topoData.devices?.length > 0) setSelectedDevice(topoData.devices[0].name);
      } else {
        if (labData.steps?.length > 0 && labData.steps[0].target_device) setSelectedDevice(labData.steps[0].target_device);
        else if (topoData.devices?.length > 0) setSelectedDevice(topoData.devices[0].name);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [slug, userId]);

  // ── Save on page leave ─────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = progressRef.current;
      const steps = Array.from(state.completedSteps || []);
      if (steps.length === 0) return;
      const VITE_VAL = import.meta.env.VITE_API_URL;
      const base     = typeof VITE_VAL === 'string' ? VITE_VAL : '';
      navigator.sendBeacon(`${base}/api/progress/save`,
        new Blob([JSON.stringify({
          user_id: getUserId(), lab_slug: slug,
          current_step: state.currentStep,
          completed_steps: steps, total_points: state.totalPoints,
        })], { type: 'application/json' })
      );
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { handleBeforeUnload(); window.removeEventListener('beforeunload', handleBeforeUnload); };
  }, [slug]);

  // ── Packet animation on step change ───────────────────────
  useEffect(() => {
    if (!lab || !topology?.devices || !topology.devices.length) return;
    const steps        = lab.steps || [];
    const currentStepData = steps.find((s) => s.step_number === currentStep);
    if (!currentStepData) return;

    const target = currentStepData.target_device;
    if (!target) return;

    const proto  = deriveProtocol(slug);
    const source = topology.devices.find((d) =>
      d.name !== target && ['router', 'firewall', 'l3_switch', 'cloud', 'internet'].includes(d.device_type)
    ) || topology.devices.find((d) => d.name !== target);

    if (!source) return;

    const flows = [{ id: `flow-${currentStep}`, source: source.name, target, ...proto }];
    setPacketFlows(flows);

    const clearMs = (animSpeed === 1 ? 2200 : animSpeed === 2 ? 1200 : 650);
    const timer = setTimeout(() => setPacketFlows([]), clearMs);
    return () => clearTimeout(timer);
  }, [currentStep, lab, topology, slug, animSpeed]);

  // ── Step completion ────────────────────────────────────────
  const handleStepComplete = useCallback(async (stepNum, points) => {
    setCompletedSteps((prev) => {
      if (prev.has(stepNum)) return prev;
      return new Set([...prev, stepNum]);
    });
    setTotalPoints((prev) => prev + (points || 0));
    setShowExplanation(stepNum);
    const updatedSteps  = new Set([...progressRef.current.completedSteps, stepNum]);
    const updatedPoints = progressRef.current.totalPoints + (points || 0);
    await saveToBackend({ completedSteps: updatedSteps, totalPoints: updatedPoints, currentStep: stepNum });
    setTimeout(() => {
      const nextStep = stepNum + 1;
      if (lab && nextStep <= (lab.steps?.length || 0)) {
        goToStep(nextStep);
      }
    }, 500);
  }, [lab, saveToBackend]);

  const goToStep = useCallback((stepNum) => {
    setCurrentStep(stepNum);
    setStepTransKey((k) => k + 1);
    setMobileTab('instructions');
    const stepData = lab?.steps?.find((s) => s.step_number === stepNum);
    if (stepData?.target_device) setSelectedDevice(stepData.target_device);
    // Smooth scroll workspace into view on mobile
    setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, [lab]);

  const handleResetLab = useCallback(async () => {
    try {
      await api.resetLabProgress(slug, userId);
      setCompletedSteps(new Set()); setTotalPoints(0); setCurrentStep(1);
      setShowExplanation(null); setShowResetConfirm(false); setSaveStatus(null);
      setTerminalKey((k) => k + 1); setPacketFlows([]);
      if (lab?.steps?.length > 0 && lab.steps[0].target_device) setSelectedDevice(lab.steps[0].target_device);
    } catch (err) { console.error('Failed to reset lab:', err); }
  }, [slug, lab, userId]);

  const handleDeviceSelect = useCallback((deviceName) => {
    setSelectedDevice(deviceName);
    setShowInspector(true);
    setMobileTab('topology');
  }, []);

  // ── Loading skeleton ───────────────────────────────────────
  if (loading) {
    return (
      <div className="lab-skeleton">
        <div className="lab-skeleton-header">
          <div className="skeleton-block" style={{ width: 60, height: 28, borderRadius: 6 }} />
          <div className="skeleton-block" style={{ width: 220, height: 28, borderRadius: 6 }} />
          <div className="skeleton-block" style={{ width: 120, height: 28, borderRadius: 6, marginLeft: 'auto' }} />
        </div>
        <div className="skeleton-block" style={{ width: '100%', height: 10, borderRadius: 4, margin: '8px 0 16px' }} />
        <div className="skeleton-block" style={{ width: '100%', height: 300, borderRadius: 8, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="skeleton-block" style={{ height: 300, borderRadius: 8 }} />
          <div className="skeleton-block" style={{ height: 300, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>Lab not found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
          This lab may have been removed or the URL is incorrect.
        </p>
        <Link to="/" className="btn btn-ghost">← Back to Labs</Link>
      </div>
    );
  }

  const steps          = lab.steps || [];
  const isQuiz         = lab.slug?.includes('quiz') || lab.title?.toLowerCase().includes('quiz');
  const stepLabel      = isQuiz ? 'questions' : 'steps';
  const stepLabelCap   = isQuiz ? 'Questions' : 'Steps';
  const maxPoints      = steps.reduce((sum, s) => sum + (s.points || 0), 0);
  const progress       = steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0;
  const currentStepData = steps.find((s) => s.step_number === currentStep);
  const isLabComplete  = completedSteps.size === steps.length && steps.length > 0;

  // Derive current packet header info for breakdown panel
  const currentProtocol   = deriveProtocol(slug);
  const currentHeaderInfo = HEADER_INFO[currentProtocol.protocol] || null;

  return (
    <div className="fade-in">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="lab-header">
        <div className="lab-header-left">
          <Link to="/" className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} /> Labs
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              <h2 className="lab-title">{lab.title}</h2>
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
                <Link to={`/theory/${lab.topic_slugs[0]}`} style={{
                  marginLeft: 'var(--space-sm)', fontSize: '0.75rem',
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  color: 'var(--accent)', textDecoration: 'none',
                }}>
                  <BookOpen size={12} /> Read Theory
                </Link>
              )}
            </p>
          </div>
        </div>

        <div className="lab-header-right">
          {saveStatus && (
            <span style={{
              fontSize: '0.6875rem', fontFamily: 'var(--font-mono)',
              color: saveStatus === 'saved' ? 'var(--color-success)'
                : saveStatus === 'saving' ? 'var(--accent)'
                : 'var(--color-error)',
            }}>
              {saveStatus === 'saving' ? '● saving...' : saveStatus === 'saved' ? '✓ saved' : `⚠ ${saveStatus}`}
            </span>
          )}

          {/* Animation speed controls */}
          <div className="anim-speed-controls" title="Packet animation speed">
            <Zap size={12} style={{ color: 'var(--text-muted)' }} />
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                className={`anim-speed-btn ${animSpeed === s ? 'active' : ''}`}
                onClick={() => setAnimSpeed(s)}
                title={s === 1 ? 'Slow' : s === 2 ? 'Normal' : 'Fast'}
              >
                {s === 1 ? '1×' : s === 2 ? '2×' : '3×'}
              </button>
            ))}
          </div>

          <div className="lab-score-desktop">
            <div className="score-pts">{totalPoints} / {maxPoints} pts</div>
            <div className="score-steps">{completedSteps.size} / {steps.length} {stepLabel}</div>
          </div>
          <div className="lab-progress-desktop">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowResetConfirm(!showResetConfirm)}
              title="Reset lab progress" style={{ color: completedSteps.size > 0 ? 'var(--color-error)' : 'var(--text-muted)' }}>
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
                  Reset all progress for this lab?
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: '#fff', flex: 1 }} onClick={handleResetLab}>Reset</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowResetConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile reset confirm */}
      {showResetConfirm && (
        <div className="mobile-reset-confirm card" style={{ marginBottom: 'var(--space-sm)' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            Reset all progress for this lab?
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button className="btn btn-sm" style={{ background: 'var(--color-error)', color: '#fff', flex: 1 }} onClick={handleResetLab}>Reset</button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setShowResetConfirm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Mobile score row */}
      <div className="lab-score-row">
        <span className="score-text">{completedSteps.size}/{steps.length} {stepLabel} · {totalPoints}/{maxPoints} pts</span>
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
        <button className="btn btn-ghost btn-sm"
          onClick={() => setShowResetConfirm(!showResetConfirm)}
          style={{ color: completedSteps.size > 0 ? 'var(--color-error)' : 'var(--text-muted)', padding: '4px 6px' }}>
          <RotateCcw size={13} />
        </button>
      </div>

      {/* Step dots */}
      <div className="step-dots-bar">
        {steps.map((step) => {
          const isCompleted = completedSteps.has(step.step_number);
          const isCurrent   = step.step_number === currentStep;
          return (
            <button key={step.step_number} onClick={() => goToStep(step.step_number)} title={step.title}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', border: 'none', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)', flexShrink: 0,
                background: isCurrent ? 'var(--accent-glow-strong)' : 'transparent',
                color: isCompleted ? 'var(--color-success)' : isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                border: isCurrent ? '1px solid var(--accent)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}>
              {isCompleted ? <CheckCircle size={12} /> : <Circle size={12} />}
              {step.step_number}
            </button>
          );
        })}
      </div>

      {/* Mobile tab bar */}
      <div className="mobile-lab-tabs">
        {[
          { id: 'topology',     label: 'Topology' },
          { id: 'instructions', label: isQuiz ? 'Questions' : 'Instructions' },
          { id: 'terminal',     label: 'Terminal' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`mobile-lab-tab ${mobileTab === tab.id ? 'active' : ''}`}
            onClick={() => setMobileTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'instructions' && completedSteps.size > 0 && (
              <span className="mobile-tab-badge">{completedSteps.size}</span>
            )}
          </button>
        ))}
      </div>

      {/* Main workspace */}
      <div className="lab-workspace" ref={workspaceRef}>
        {/* Topology + inspector */}
        <div className={`lab-workspace-topo mobile-tab-panel ${mobileTab === 'topology' ? 'mobile-tab-active' : ''}`}>
          <TopologyGraph
            topology={topology}
            selectedDevice={selectedDevice}
            onDeviceSelect={handleDeviceSelect}
            currentStep={currentStepData}
            packetFlows={packetFlows}
            animationSpeed={animSpeed}
          />

          {showInspector && selectedDevice && (
            <DeviceInspector
              deviceName={selectedDevice}
              topology={topology}
              onClose={() => setShowInspector(false)}
            />
          )}

          {packetFlows.length > 0 && currentHeaderInfo && (
            <div className="packet-header-panel">
              <div className="packet-header-panel-title" style={{ color: currentProtocol.color }}>
                <span className="packet-header-dot" style={{ background: currentProtocol.color }} />
                {currentHeaderInfo.name}
              </div>
              <div className="packet-header-fields">
                {currentHeaderInfo.fields.map(([key, val]) => (
                  <div key={key} className="packet-header-field">
                    <span className="packet-header-key">{key}</span>
                    <span className="packet-header-val">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step panel */}
        <div className={`mobile-tab-panel ${mobileTab === 'instructions' ? 'mobile-tab-active' : ''}`}>
          <div key={stepTransKey} className="step-transition-wrapper">
            <StepPanel
              step={currentStepData} stepNumber={currentStep} totalSteps={steps.length}
              isCompleted={completedSteps.has(currentStep)}
              isQuiz={isQuiz}
              onPrev={() => currentStep > 1 && goToStep(currentStep - 1)}
              onNext={() => currentStep < steps.length && goToStep(currentStep + 1)}
            />
          </div>
          {showExplanation && (() => {
            const expStep = steps.find((s) => s.step_number === showExplanation);
            if (!expStep?.explanation) return null;
            return (
              <div className="card explanation-card" style={{ marginTop: 'var(--space-md)' }}>
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

        {/* Terminal */}
        <div className={`mobile-tab-panel ${mobileTab === 'terminal' ? 'mobile-tab-active' : ''}`}>
          <TerminalEmulator
            key={terminalKey}
            labSlug={slug}
            deviceName={selectedDevice}
            step={currentStepData}
            onStepComplete={handleStepComplete}
            completedSteps={completedSteps}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}
