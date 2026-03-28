import React, { useState, useEffect, useRef } from 'react';

/* ══════════════════════════════════════════════════════════════
   TheoryDiagram — animated SVG diagrams for theory pages
   Each diagram is self-contained. TheoryDiagram dispatches on slug.
   ══════════════════════════════════════════════════════════════ */

// ── Shared styles ──────────────────────────────────────────────
const BASE = {
  wrap: {
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid var(--border-default)',
    marginBottom: 32,
    background: 'var(--bg-panel)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 14px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-elevated)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.6875rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.06em',
  },
  btn: {
    background: 'var(--accent-glow)',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    borderRadius: 4,
    padding: '2px 10px',
    fontSize: '0.6875rem',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
};

function DiagramShell({ title, onReplay, onPause, isPaused, children }) {
  return (
    <div style={BASE.wrap}>
      <div style={BASE.header}>
        <span>{title}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {onPause && (
            <button style={BASE.btn} onClick={onPause} title={isPaused ? 'Play' : 'Pause'}>
              {isPaused ? '▶ Play' : '⏸ Pause'}
            </button>
          )}
          {onReplay && (
            <button style={BASE.btn} onClick={() => { onReplay(); }} title="Replay">
              ↺ Replay
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// OSI Model — encapsulation animation
// ────────────────────────────────────────────────────────────────
const OSI_LAYERS = [
  { n: 7, name: 'Application',  abbr: 'DATA',    color: '#6366f1', pdus: 'HTTP, DNS, FTP' },
  { n: 6, name: 'Presentation', abbr: 'DATA',    color: '#8b5cf6', pdus: 'TLS, SSL, JPEG' },
  { n: 5, name: 'Session',      abbr: 'DATA',    color: '#a855f7', pdus: 'NetBIOS, RPC'   },
  { n: 4, name: 'Transport',    abbr: 'SEGMENT', color: '#ec4899', pdus: 'TCP, UDP'        },
  { n: 3, name: 'Network',      abbr: 'PACKET',  color: '#f43f5e', pdus: 'IP, ICMP, ARP'  },
  { n: 2, name: 'Data Link',    abbr: 'FRAME',   color: '#f97316', pdus: '802.3, 802.11'  },
  { n: 1, name: 'Physical',     abbr: 'BITS',    color: '#eab308', pdus: 'Copper, Fiber'  },
];

function OsiDiagram() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('idle');
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (phase === 'idle' || isPaused) return;
    if (step < OSI_LAYERS.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 450);
      return () => clearTimeout(t);
    }
  }, [step, phase, isPaused]);

  function replay() { setStep(0); setPhase('idle'); setIsPaused(false); setTimeout(() => setPhase('down'), 50); }
  useEffect(() => { setTimeout(() => setPhase('down'), 600); }, []);

  const activeDown = phase === 'down' ? step : 7;

  return (
    <DiagramShell title="OSI MODEL — ENCAPSULATION / DECAPSULATION" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Sender side */}
        <div>
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>SENDER</div>
          {OSI_LAYERS.map((layer, i) => {
            const active = activeDown > i;
            return (
              <div key={layer.n} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 3, transition: 'all 0.3s',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 3,
                  background: active ? layer.color : 'transparent',
                  border: `1px solid ${layer.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.625rem', fontWeight: 700, color: active ? '#000' : layer.color,
                  transition: 'all 0.35s',
                  flexShrink: 0,
                }}>
                  {layer.n}
                </div>
                <div style={{
                  width: 160, padding: '5px 10px', borderRadius: 4,
                  background: active ? `${layer.color}22` : 'var(--bg-elevated)',
                  border: `1px solid ${active ? layer.color : 'var(--border-subtle)'}`,
                  transition: 'all 0.35s',
                }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: active ? layer.color : 'var(--text-muted)' }}>
                    {layer.name}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {layer.pdus}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.5875rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: active ? layer.color : 'transparent',
                  width: 52, textAlign: 'center',
                  padding: '2px 4px', borderRadius: 3,
                  background: active ? `${layer.color}18` : 'transparent',
                  transition: 'all 0.35s',
                  whiteSpace: 'nowrap',
                }}>
                  {layer.abbr}
                </div>
              </div>
            );
          })}
        </div>

        {/* Medium arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 60, height: 2, background: 'var(--border-default)' }} />
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>MEDIUM<br />(bits)</div>
          <div style={{ width: 60, height: 2, background: 'var(--border-default)' }} />
        </div>

        {/* Receiver side — mirrors sender */}
        <div>
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>RECEIVER</div>
          {OSI_LAYERS.map((layer, i) => {
            const ri  = OSI_LAYERS.length - 1 - i;
            const rl  = OSI_LAYERS[ri];
            const active = activeDown > (OSI_LAYERS.length - 1 - i);
            return (
              <div key={rl.n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{
                  fontSize: '0.5875rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: active ? rl.color : 'transparent',
                  width: 52, textAlign: 'center',
                  padding: '2px 4px', borderRadius: 3,
                  background: active ? `${rl.color}18` : 'transparent',
                  transition: 'all 0.35s',
                  whiteSpace: 'nowrap',
                }}>
                  {rl.abbr}
                </div>
                <div style={{
                  width: 160, padding: '5px 10px', borderRadius: 4,
                  background: active ? `${rl.color}22` : 'var(--bg-elevated)',
                  border: `1px solid ${active ? rl.color : 'var(--border-subtle)'}`,
                  transition: 'all 0.35s',
                }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: active ? rl.color : 'var(--text-muted)' }}>
                    {rl.name}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {rl.pdus}
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 3,
                  background: active ? rl.color : 'transparent',
                  border: `1px solid ${rl.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.625rem', fontWeight: 700, color: active ? '#000' : rl.color,
                  transition: 'all 0.35s', flexShrink: 0,
                }}>
                  {rl.n}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// VLAN — 802.1Q frame tagging animation
// ────────────────────────────────────────────────────────────────
function VlanDiagram() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    if (step === 0) { const t = setTimeout(() => setStep(1), 700); return () => clearTimeout(t); }
    if (step < 5)   { const t = setTimeout(() => setStep((s) => s + 1), 900); return () => clearTimeout(t); }
  }, [step, isPaused]);

  function replay() { setStep(0); setIsPaused(false); }

  const frameColors = { bg: '#7c4dff', border: '#b39ddb' };

  return (
    <DiagramShell title="VLAN — 802.1Q FRAME TAGGING ON TRUNK LINK" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: 20 }}>
        {/* Topology row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 20 }}>
          {/* PC */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 44, background: 'var(--bg-elevated)', border: '1.5px solid #78909c', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🖥</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>PC-A<br />VLAN 10</div>
          </div>

          {/* Link PC → SW1 */}
          <div style={{ flex: 1, maxWidth: 60, height: 2, background: step >= 1 ? '#7c4dff' : 'var(--border-subtle)', transition: 'background 0.4s', position: 'relative' }}>
            {step === 1 && <div style={{ position: 'absolute', top: -5, left: '50%', width: 12, height: 12, borderRadius: '50%', background: '#7c4dff', transform: 'translateX(-50%)', boxShadow: '0 0 8px #7c4dff' }} />}
          </div>

          {/* SW1 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 44, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= 2 ? 'rgba(124,77,255,0.15)' : 'var(--bg-elevated)',
              border: `1.5px solid ${step >= 2 ? '#7c4dff' : 'var(--border-default)'}`,
              fontSize: '0.75rem', fontWeight: 700, color: step >= 2 ? '#7c4dff' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', transition: 'all 0.4s',
            }}>SW1</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>Access Port<br />Gi0/1</div>
          </div>

          {/* Trunk link */}
          <div style={{ flex: 1, maxWidth: 80, height: 4, background: step >= 3 ? '#ffab00' : 'var(--border-subtle)', borderRadius: 2, transition: 'background 0.4s', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -6, left: 0, right: 0, textAlign: 'center', fontSize: '0.5875rem', color: '#ffab00', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              TRUNK
            </div>
            {step === 3 && <div style={{ position: 'absolute', top: -4, left: '45%', width: 12, height: 12, borderRadius: '50%', background: '#ffab00', boxShadow: '0 0 8px #ffab00' }} />}
          </div>

          {/* SW2 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60, height: 44, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step >= 4 ? 'rgba(124,77,255,0.15)' : 'var(--bg-elevated)',
              border: `1.5px solid ${step >= 4 ? '#7c4dff' : 'var(--border-default)'}`,
              fontSize: '0.75rem', fontWeight: 700, color: step >= 4 ? '#7c4dff' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', transition: 'all 0.4s',
            }}>SW2</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>Access Port<br />Gi0/1</div>
          </div>

          {/* Link SW2 → PC-B */}
          <div style={{ flex: 1, maxWidth: 60, height: 2, background: step >= 5 ? '#7c4dff' : 'var(--border-subtle)', transition: 'background 0.4s' }} />

          {/* PC-B */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 44, background: step >= 5 ? 'rgba(124,77,255,0.1)' : 'var(--bg-elevated)', border: `1.5px solid ${step >= 5 ? '#7c4dff' : '#78909c'}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, transition: 'all 0.4s' }}>🖥</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>PC-B<br />VLAN 10</div>
          </div>
        </div>

        {/* Frame structure */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, textAlign: 'center' }}>
            {step < 2 ? 'UNTAGGED ETHERNET FRAME' : step < 4 ? '802.1Q TAGGED FRAME (on trunk)' : 'UNTAGGED FRAME (tag stripped)'}
          </div>
          <div style={{ display: 'flex', gap: 2, justifyContent: 'center', alignItems: 'stretch' }}>
            {[
              { label: 'DST MAC', size: 56, color: '#546e7a' },
              { label: 'SRC MAC', size: 56, color: '#546e7a' },
              ...(step >= 2 && step < 4 ? [{ label: '802.1Q TAG\n0x8100 | VID=10', size: 72, color: '#ffab00', highlight: true }] : []),
              { label: 'EtherType', size: 50, color: '#546e7a' },
              { label: 'PAYLOAD', size: 80, color: '#7c4dff' },
              { label: 'FCS', size: 32, color: '#546e7a' },
            ].map((field, i) => (
              <div key={i} style={{
                width: field.size,
                padding: '6px 4px',
                background: field.highlight ? 'rgba(255,171,0,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${field.highlight ? '#ffab00' : 'var(--border-default)'}`,
                borderRadius: 3,
                textAlign: 'center',
                fontSize: '0.5875rem',
                color: field.highlight ? '#ffab00' : field.color,
                fontFamily: 'var(--font-mono)',
                fontWeight: field.highlight ? 700 : 400,
                whiteSpace: 'pre-line',
                lineHeight: 1.3,
                transition: 'all 0.4s',
                flexShrink: 0,
              }}>
                {field.label}
              </div>
            ))}
          </div>
        </div>

        {/* Step legend */}
        <div style={{ marginTop: 14, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', minHeight: 20 }}>
          {step === 0 && 'Waiting...'}
          {step === 1 && 'PC-A sends untagged Ethernet frame to SW1 access port'}
          {step === 2 && 'SW1 inserts 802.1Q tag (VID=10) before forwarding on trunk'}
          {step === 3 && 'Tagged frame travels across trunk link to SW2'}
          {step === 4 && 'SW2 strips the 802.1Q tag before delivering to access port'}
          {step === 5 && '✓ PC-B receives clean untagged frame — same VLAN, different switch'}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// DHCP — DORA sequence
// ────────────────────────────────────────────────────────────────
const DORA_STEPS = [
  { label: 'DISCOVER', dir: 'right', color: '#00e676', desc: 'Client broadcasts: "Who can give me an IP?" (src: 0.0.0.0, dst: 255.255.255.255)', detail: 'UDP src:68 → dst:67' },
  { label: 'OFFER',    dir: 'left',  color: '#00b0ff', desc: 'Server offers: "Use 10.0.1.50/24, GW: 10.0.1.1" (unicast to client MAC)', detail: 'Offered IP: 10.0.1.50' },
  { label: 'REQUEST',  dir: 'right', color: '#ffab00', desc: 'Client broadcasts: "I accept the offer from 10.0.1.1"', detail: 'UDP src:68 → dst:67' },
  { label: 'ACK',      dir: 'left',  color: '#e040fb', desc: 'Server confirms: "10.0.1.50 is yours for 86400s"', detail: 'Lease: 24 hours' },
];

function DhcpDiagram() {
  const [step, setStep] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStep(0), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    if (step >= 0 && step < DORA_STEPS.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 1200);
      return () => clearTimeout(t);
    }
  }, [step, isPaused]);

  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 300); }

  return (
    <DiagramShell title="DHCP — DORA SEQUENCE (Discover → Offer → Request → Acknowledge)" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          {/* Client column */}
          <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>💻</div>
            <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CLIENT<br />0.0.0.0</div>
            {step >= 3 && <div style={{ marginTop: 8, fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#00e676', fontWeight: 700 }}>10.0.1.50<br />/24</div>}
          </div>

          {/* Sequence */}
          <div style={{ flex: 1, paddingTop: 8 }}>
            {DORA_STEPS.map((s, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: s.dir === 'right' ? 'row' : 'row-reverse',
                alignItems: 'center',
                gap: 8,
                marginBottom: 12,
                opacity: step >= i ? 1 : 0.2,
                transition: 'opacity 0.4s',
              }}>
                <div style={{
                  flex: 1, height: 2,
                  background: step >= i ? s.color : 'var(--border-subtle)',
                  transition: 'background 0.4s',
                  position: 'relative',
                }}>
                  {/* Arrowhead */}
                  <div style={{
                    position: 'absolute',
                    [s.dir === 'right' ? 'right' : 'left']: -6,
                    top: -4,
                    width: 0, height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    [s.dir === 'right' ? 'borderLeft' : 'borderRight']: `8px solid ${step >= i ? s.color : 'var(--border-subtle)'}`,
                  }} />
                </div>
                <div style={{ minWidth: 160, textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '3px 12px',
                    background: step >= i ? `${s.color}1a` : 'var(--bg-elevated)',
                    border: `1px solid ${step >= i ? s.color : 'var(--border-subtle)'}`,
                    borderRadius: 4,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: step >= i ? s.color : 'var(--text-muted)',
                    transition: 'all 0.4s',
                    marginBottom: 2,
                  }}>{s.label}</div>
                  <div style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Server column */}
          <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>🖥</div>
            <div style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>DHCP<br />SERVER<br />10.0.1.1</div>
          </div>
        </div>

        {/* Current step description */}
        {step >= 0 && (
          <div style={{
            marginTop: 8, padding: '8px 14px',
            background: `${DORA_STEPS[Math.min(step, 3)].color}10`,
            border: `1px solid ${DORA_STEPS[Math.min(step, 3)].color}40`,
            borderRadius: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)',
          }}>
            {DORA_STEPS[Math.min(step, 3)].desc}
          </div>
        )}
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// OSPF — neighbor adjacency formation
// ────────────────────────────────────────────────────────────────
const OSPF_STATES = ['DOWN', 'INIT', '2-WAY', 'EXSTART', 'EXCHANGE', 'LOADING', 'FULL'];

function OspfDiagram() {
  const [stateIdx, setStateIdx] = useState(0);
  const [packets, setPackets] = useState([]);
  const [pkId, setPkId] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const PACKET_TYPES = [
    { type: 'Hello', color: '#00e5ff',   at: 0 },
    { type: 'Hello', color: '#00e5ff',   at: 1 },
    { type: 'DBD',   color: '#ffab00',   at: 2 },
    { type: 'DBD',   color: '#ffab00',   at: 3 },
    { type: 'LSR',   color: '#7c4dff',   at: 4 },
    { type: 'LSU',   color: '#e040fb',   at: 5 },
    { type: 'LSAck', color: '#00e676',   at: 6 },
  ];

  useEffect(() => {
    if (isPaused || stateIdx >= OSPF_STATES.length - 1) return;
    const t = setTimeout(() => {
      setStateIdx((s) => s + 1);
      const pk = PACKET_TYPES.find((p) => p.at === stateIdx);
      if (pk) {
        const id = pkId + 1;
        setPkId(id);
        setPackets((prev) => [...prev, { ...pk, id, dir: stateIdx % 2 === 0 ? 'right' : 'left' }]);
        setTimeout(() => setPackets((prev) => prev.filter((p) => p.id !== id)), 900);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [stateIdx, isPaused]);

  function replay() { setStateIdx(0); setPackets([]); setIsPaused(false); }

  const color = (i) => i <= stateIdx ? '#00e5ff' : 'var(--border-default)';

  return (
    <DiagramShell title="OSPF — NEIGHBOR ADJACENCY STATE MACHINE" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: 20 }}>
        {/* State machine bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 20, overflowX: 'auto' }}>
          {OSPF_STATES.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{
                padding: '4px 10px', borderRadius: 4,
                background: i === stateIdx ? '#00e5ff22' : i < stateIdx ? 'rgba(0,229,255,0.06)' : 'var(--bg-elevated)',
                border: `1px solid ${color(i)}`,
                fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: i === stateIdx ? 700 : 400,
                color: i <= stateIdx ? '#00e5ff' : 'var(--text-muted)',
                transition: 'all 0.35s',
                whiteSpace: 'nowrap',
              }}>
                {s}
              </div>
              {i < OSPF_STATES.length - 1 && (
                <div style={{ width: 14, height: 1, background: i < stateIdx ? '#00e5ff' : 'var(--border-subtle)', flexShrink: 0, transition: 'background 0.35s' }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Routers + packet animation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 44, borderRadius: 28, background: 'var(--bg-elevated)', border: '2px solid #2979ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: '#2979ff' }}>R1</div>
            <div style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>1.1.1.1</div>
          </div>

          <div style={{ flex: 1, maxWidth: 200, position: 'relative', height: 40 }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: stateIdx >= 2 ? '#00e5ff44' : 'var(--border-subtle)', transition: 'all 0.4s' }} />
            {packets.map((pk) => (
              <div key={pk.id} style={{
                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                left: pk.dir === 'right' ? '20%' : '70%',
                padding: '2px 8px', borderRadius: 10,
                background: `${pk.color}22`, border: `1px solid ${pk.color}`,
                fontSize: '0.5875rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: pk.color, whiteSpace: 'nowrap',
                animation: `ospf-fly-${pk.dir} 0.9s ease forwards`,
              }}>
                {pk.type}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 44, borderRadius: 28, background: 'var(--bg-elevated)', border: '2px solid #2979ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: '#2979ff' }}>R2</div>
            <div style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>2.2.2.2</div>
          </div>
        </div>

        <style>{`
          @keyframes ospf-fly-right { from { left: 15%; opacity: 0; } to { left: 72%; opacity: 1; } }
          @keyframes ospf-fly-left  { from { left: 72%; opacity: 0; } to { left: 15%; opacity: 1; } }
        `}</style>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {stateIdx === 0 && 'Routers start in DOWN state — no hellos received yet'}
          {stateIdx === 1 && 'R1 sends Hello → R2 enters INIT (sees R1 but not acknowledged)'}
          {stateIdx === 2 && 'Bidirectional hellos confirmed — 2-WAY state reached'}
          {stateIdx === 3 && 'DR/BDR election occurs, master/slave established — EXSTART'}
          {stateIdx === 4 && 'Database Description (DBD) packets exchanged — EXCHANGE'}
          {stateIdx === 5 && 'LSR/LSU: missing LSAs requested and sent — LOADING'}
          {stateIdx === 6 && '✓ FULL — complete LSDB sync, adjacency established, routes computed'}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// STP — convergence animation
// ────────────────────────────────────────────────────────────────
const STP_PHASES = [
  { label: 'Loop detected', desc: 'Three switches form a loop — broadcast storm risk' },
  { label: 'Root election',  desc: 'SW1 wins (lowest bridge ID) — becomes Root Bridge' },
  { label: 'Port roles',    desc: 'Root ports and designated ports determined per segment' },
  { label: 'Port blocking', desc: 'SW3→SW2 link blocked (non-designated port) to break loop' },
  { label: 'Converged',     desc: '✓ Loop-free topology — SW3 reaches SW2 via SW1' },
];

function StpDiagram() {
  const [phase, setPhase] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || phase >= STP_PHASES.length - 1) return;
    const t = setTimeout(() => setPhase((p) => p + 1), 1100);
    return () => clearTimeout(t);
  }, [phase, isPaused]);

  function replay() { setPhase(0); setIsPaused(false); }

  const sw1color = phase >= 1 ? '#ffab00' : '#7c4dff';
  const blockedColor = phase >= 3 ? '#ff1744' : '#00e676';
  const blockedDash = phase >= 3 ? '6,4' : 'none';

  return (
    <DiagramShell title="STP — SPANNING TREE CONVERGENCE" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: 20 }}>
        <svg width="100%" viewBox="0 0 400 200" style={{ maxHeight: 200, display: 'block', margin: '0 auto' }}>
          {/* Links */}
          <line x1="200" y1="40" x2="80" y2="155" stroke="#00e676" strokeWidth="2" />
          <line x1="200" y1="40" x2="320" y2="155" stroke="#00e676" strokeWidth="2" />
          <line x1="80" y1="155" x2="320" y2="155" stroke={blockedColor} strokeWidth="2" strokeDasharray={blockedDash} style={{ transition: 'stroke 0.5s' }} />

          {/* SW1 — root */}
          <rect x="165" y="18" width="70" height="36" rx="5" fill={phase >= 1 ? 'rgba(255,171,0,0.15)' : 'rgba(124,77,255,0.1)'} stroke={sw1color} strokeWidth="2" style={{ transition: 'all 0.4s' }} />
          <text x="200" y="38" textAnchor="middle" fill={sw1color} fontFamily="monospace" fontSize="11" fontWeight="bold" style={{ transition: 'fill 0.4s' }}>SW1</text>
          {phase >= 1 && <text x="200" y="50" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="8">ROOT</text>}

          {/* SW2 */}
          <rect x="45" y="133" width="70" height="36" rx="5" fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1.5" />
          <text x="80" y="153" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="11" fontWeight="bold">SW2</text>
          {phase >= 2 && <text x="80" y="165" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="8">RP↑ DP→</text>}

          {/* SW3 */}
          <rect x="285" y="133" width="70" height="36" rx="5" fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1.5" />
          <text x="320" y="153" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="11" fontWeight="bold">SW3</text>
          {phase >= 2 && <text x="320" y="165" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="8">RP↑</text>}

          {/* Blocked indicator */}
          {phase >= 3 && (
            <g>
              <circle cx="200" cy="155" r="10" fill="rgba(255,23,68,0.15)" stroke="#ff1744" strokeWidth="1.5" />
              <text x="200" y="159" textAnchor="middle" fill="#ff1744" fontSize="11" fontWeight="bold">✗</text>
            </g>
          )}

          {/* Loop warning */}
          {phase === 0 && (
            <text x="200" y="175" textAnchor="middle" fill="#ff1744" fontFamily="monospace" fontSize="9">⚠ LOOP</text>
          )}
        </svg>

        {/* Phase indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {STP_PHASES.map((p, i) => (
            <div key={i} style={{
              padding: '3px 9px', borderRadius: 4,
              background: i === phase ? 'rgba(0,229,255,0.15)' : i < phase ? 'rgba(0,229,255,0.05)' : 'var(--bg-elevated)',
              border: `1px solid ${i <= phase ? '#00e5ff' : 'var(--border-subtle)'}`,
              fontSize: '0.5875rem', fontFamily: 'var(--font-mono)', fontWeight: i === phase ? 700 : 400,
              color: i <= phase ? '#00e5ff' : 'var(--text-muted)',
              transition: 'all 0.35s', whiteSpace: 'nowrap',
            }}>{p.label}</div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)', minHeight: 20 }}>
          {STP_PHASES[phase].desc}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// DNS — recursive resolution
// ────────────────────────────────────────────────────────────────
const DNS_HOPS = [
  { from: 'Client',   to: 'Resolver',  label: 'Query: www.example.com?',  color: '#00e5ff', type: 'query'  },
  { from: 'Resolver', to: 'Root NS',   label: 'Who handles .com?',         color: '#7c4dff', type: 'query'  },
  { from: 'Root NS',  to: 'Resolver',  label: 'Ask g.gtld-servers.net',    color: '#7c4dff', type: 'reply'  },
  { from: 'Resolver', to: 'TLD NS',    label: 'Who handles example.com?',  color: '#ffab00', type: 'query'  },
  { from: 'TLD NS',   to: 'Resolver',  label: 'Ask ns1.example.com',       color: '#ffab00', type: 'reply'  },
  { from: 'Resolver', to: 'Auth NS',   label: 'What is www.example.com?',  color: '#e040fb', type: 'query'  },
  { from: 'Auth NS',  to: 'Resolver',  label: '93.184.216.34 (TTL 3600)',  color: '#e040fb', type: 'reply'  },
  { from: 'Resolver', to: 'Client',    label: '93.184.216.34 ✓',           color: '#00e676', type: 'reply'  },
];

const DNS_NODES = ['Client', 'Resolver', 'Root NS', 'TLD NS', 'Auth NS'];

function DnsDiagram() {
  const [step, setStep] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => { const t = setTimeout(() => setStep(0), 500); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (isPaused) return;
    if (step >= 0 && step < DNS_HOPS.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 950);
      return () => clearTimeout(t);
    }
  }, [step, isPaused]);

  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 300); }

  const nodeColor = (name) => {
    if (name === 'Client')   return '#00e5ff';
    if (name === 'Resolver') return '#7c4dff';
    if (name === 'Root NS')  return '#ffab00';
    if (name === 'TLD NS')   return '#e040fb';
    return '#00e676';
  };

  return (
    <DiagramShell title="DNS — RECURSIVE RESOLUTION (www.example.com)" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: '16px 20px' }}>
        {/* Node row */}
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
          {DNS_NODES.map((name) => {
            const active = step >= 0 && (DNS_HOPS[step]?.from === name || DNS_HOPS[step]?.to === name);
            const col = nodeColor(name);
            return (
              <div key={name} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 54, height: 38, borderRadius: 5,
                  background: active ? `${col}22` : 'var(--bg-elevated)',
                  border: `1.5px solid ${active ? col : 'var(--border-subtle)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: '0.6125rem', fontWeight: 700,
                  color: active ? col : 'var(--text-muted)',
                  transition: 'all 0.3s',
                }}>
                  {name.replace(' ', '\n')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Message list */}
        <div style={{ maxHeight: 180, overflowY: 'auto' }}>
          {DNS_HOPS.map((hop, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5,
              opacity: step >= i ? 1 : 0.15, transition: 'opacity 0.35s',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: nodeColor(hop.from), minWidth: 60, textAlign: 'right' }}>{hop.from}</span>
              <span style={{ color: hop.color, fontSize: '0.75rem' }}>{hop.type === 'query' ? '→' : '←'}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: nodeColor(hop.to), minWidth: 60 }}>{hop.to}</span>
              <span style={{
                flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                padding: '2px 8px', borderRadius: 3,
                background: step === i ? `${hop.color}18` : 'transparent',
                border: step === i ? `1px solid ${hop.color}40` : '1px solid transparent',
                color: step >= i ? 'var(--text-secondary)' : 'var(--text-muted)',
                transition: 'all 0.3s',
              }}>{hop.label}</span>
            </div>
          ))}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// NAT — address translation table
// ────────────────────────────────────────────────────────────────
function NatDiagram() {
  const [entries, setEntries] = useState([]);
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const TRANSLATIONS = [
    { inside_local: '10.0.1.10:1234', inside_global: '203.0.113.5:1234', outside: '8.8.8.8:53', proto: 'UDP' },
    { inside_local: '10.0.1.11:5678', inside_global: '203.0.113.5:5678', outside: '142.250.4.46:443', proto: 'TCP' },
    { inside_local: '10.0.1.12:9999', inside_global: '203.0.113.5:9999', outside: '13.32.0.10:80', proto: 'TCP' },
  ];

  useEffect(() => {
    if (isPaused || step >= TRANSLATIONS.length) return;
    const t = setTimeout(() => {
      setEntries((prev) => [...prev, TRANSLATIONS[step]]);
      setStep((s) => s + 1);
    }, 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  function replay() { setEntries([]); setStep(0); setIsPaused(false); }

  return (
    <DiagramShell title="NAT/PAT — TRANSLATION TABLE (Inside Local → Inside Global)" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: '16px 20px' }}>
        {/* Diagram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🖥🖥🖥</div>
            INSIDE<br />10.0.1.0/24
          </div>
          <div style={{ flex: 1, maxWidth: 80, height: 2, background: 'var(--border-default)' }} />
          <div style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(0,229,255,0.1)', border: '1.5px solid var(--accent)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>
            NAT<br />ROUTER
          </div>
          <div style={{ flex: 1, maxWidth: 80, height: 2, background: 'var(--border-default)' }} />
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🌐</div>
            OUTSIDE<br />203.0.113.5
          </div>
        </div>

        {/* Translation table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <thead>
              <tr>
                {['Proto', 'Inside Local', 'Inside Global', 'Outside'].map((h) => (
                  <th key={h} style={{ padding: '5px 10px', textAlign: 'left', borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} style={{ animation: 'nat-row-in 0.3s ease' }}>
                  <td style={{ padding: '4px 10px', color: '#ffab00', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{e.proto}</td>
                  <td style={{ padding: '4px 10px', color: '#ff6d00', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{e.inside_local}</td>
                  <td style={{ padding: '4px 10px', color: '#00e5ff', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{e.inside_global}</td>
                  <td style={{ padding: '4px 10px', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{e.outside}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>Waiting for connections...</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <style>{`@keyframes nat-row-in { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: none; } }`}</style>
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Private addresses are mapped to a single public IP using unique port numbers (PAT/overload)
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// GRE — tunnel encapsulation
// ────────────────────────────────────────────────────────────────
function GreDiagram() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    if (isPaused || step >= 4) return;
    const t = setTimeout(() => setStep((s) => s + 1), 950);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function replay() { setStep(0); setIsPaused(false); }

  return (
    <DiagramShell title="GRE TUNNEL — PACKET ENCAPSULATION" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 20, justifyContent: 'center' }}>
          {[
            { label: 'SITE A', sub: '10.1.0.0/24', icon: '🏢', active: step >= 0 },
            { label: 'R1',     sub: '203.0.113.1',  icon: '⬡',  active: step >= 1, isRouter: true },
            { label: 'INTERNET', sub: '',           icon: '🌐', active: step >= 2 },
            { label: 'R2',     sub: '198.51.100.2', icon: '⬡',  active: step >= 3, isRouter: true },
            { label: 'SITE B', sub: '10.2.0.0/24', icon: '🏢', active: step >= 4 },
          ].map((node, i, arr) => (
            <React.Fragment key={node.label}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 40, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: node.active ? (node.isRouter ? 'rgba(41,121,255,0.15)' : 'rgba(0,229,255,0.08)') : 'var(--bg-elevated)',
                  border: `1.5px solid ${node.active ? (node.isRouter ? '#2979ff' : '#00e5ff') : 'var(--border-subtle)'}`,
                  fontSize: node.icon === '⬡' ? '0.875rem' : '1.1rem',
                  fontWeight: 700, color: node.active ? '#2979ff' : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)', transition: 'all 0.4s',
                }}>
                  {node.icon === '⬡' ? node.label : node.icon}
                </div>
                <div style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3 }}>{node.label}<br />{node.sub}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{
                  flex: 1, maxWidth: 50, height: i === 1 || i === 2 ? 3 : 2,
                  background: step > i ? (i === 1 || i === 2 ? '#76ff03' : 'var(--border-default)') : 'var(--border-subtle)',
                  borderRadius: 2, transition: 'background 0.4s',
                  borderTop: i === 1 || i === 2 ? '1px dashed rgba(118,255,3,0.3)' : 'none',
                }} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Packet layers */}
        {step >= 1 && (
          <div style={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
            {step >= 2 && (
              <div style={{ padding: '5px 10px', background: 'rgba(118,255,3,0.1)', border: '1px solid #76ff03', borderRadius: 4, fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#76ff03', textAlign: 'center' }}>
                Outer IP<br /><span style={{ opacity: 0.7, fontSize: '0.5875rem' }}>203→198</span>
              </div>
            )}
            {step >= 2 && (
              <div style={{ padding: '5px 10px', background: 'rgba(118,255,3,0.08)', border: '1px dashed #76ff03', borderRadius: 4, fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#76ff03', textAlign: 'center' }}>
                GRE Hdr<br /><span style={{ opacity: 0.7, fontSize: '0.5875rem' }}>Proto:IP</span>
              </div>
            )}
            <div style={{ padding: '5px 10px', background: 'rgba(41,121,255,0.12)', border: '1px solid #2979ff', borderRadius: 4, fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: '#2979ff', textAlign: 'center' }}>
              Inner IP<br /><span style={{ opacity: 0.7, fontSize: '0.5875rem' }}>10.1→10.2</span>
            </div>
            <div style={{ padding: '5px 10px', background: 'rgba(0,229,255,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 4, fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'center' }}>
              Payload<br /><span style={{ opacity: 0.7, fontSize: '0.5875rem' }}>DATA</span>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.8125rem', color: 'var(--text-secondary)', minHeight: 20 }}>
          {step === 0 && 'Site A traffic originates with private 10.x.x.x addresses'}
          {step === 1 && 'R1 encapsulates packet: adds GRE header + outer IP (public addresses)'}
          {step === 2 && 'Encapsulated packet traverses internet — outer IP is all routers see'}
          {step === 3 && 'R2 strips outer IP + GRE header, recovers original inner packet'}
          {step === 4 && '✓ Site B receives packet with original 10.1.x.x → 10.2.x.x addresses'}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// LACP — port bonding
// ────────────────────────────────────────────────────────────────
function LacpDiagram() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    if (isPaused || step >= 4) return;
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function replay() { setStep(0); setIsPaused(false); }

  return (
    <DiagramShell title="LACP — PORT CHANNEL BONDING (802.3ad)" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: 20 }}>
        <svg width="100%" viewBox="0 0 440 180" style={{ maxHeight: 180, display: 'block', margin: '0 auto' }}>
          {/* SW1 */}
          <rect x="30" y="60" width="80" height="60" rx="5" fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1.5" />
          <text x="70" y="86" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="12" fontWeight="bold">SW1</text>
          <text x="70" y="100" textAnchor="middle" fill="#546e7a" fontFamily="monospace" fontSize="9">Gi0/1-2</text>
          <text x="70" y="112" textAnchor="middle" fill={step >= 3 ? '#00e676' : '#546e7a'} fontFamily="monospace" fontSize="9" style={{ transition: 'fill 0.4s' }}>Po1</text>

          {/* SW2 */}
          <rect x="330" y="60" width="80" height="60" rx="5" fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1.5" />
          <text x="370" y="86" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="12" fontWeight="bold">SW2</text>
          <text x="370" y="100" textAnchor="middle" fill="#546e7a" fontFamily="monospace" fontSize="9">Gi0/1-2</text>
          <text x="370" y="112" textAnchor="middle" fill={step >= 3 ? '#00e676' : '#546e7a'} fontFamily="monospace" fontSize="9" style={{ transition: 'fill 0.4s' }}>Po1</text>

          {/* Link 1 */}
          <line x1="110" y1="82" x2="330" y2="82" stroke={step >= 1 ? '#ffab00' : 'var(--border-subtle)'} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
          {step >= 1 && step < 3 && <rect x="205" y="74" width="30" height="14" rx="3" fill="rgba(255,171,0,0.15)" stroke="#ffab00" strokeWidth="1" />}
          {step >= 1 && step < 3 && <text x="220" y="84" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="8">LACP</text>}

          {/* Link 2 */}
          <line x1="110" y1="108" x2="330" y2="108" stroke={step >= 2 ? '#ffab00' : 'var(--border-subtle)'} strokeWidth="2" style={{ transition: 'stroke 0.4s' }} />
          {step >= 2 && step < 3 && <rect x="205" y="100" width="30" height="14" rx="3" fill="rgba(255,171,0,0.15)" stroke="#ffab00" strokeWidth="1" />}
          {step >= 2 && step < 3 && <text x="220" y="110" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="8">LACP</text>}

          {/* Bundled arrow */}
          {step >= 3 && (
            <>
              <path d="M 110 82 C 160 82 160 95 220 95 C 280 95 280 82 330 82" stroke="#00e676" strokeWidth="2.5" fill="none" />
              <path d="M 110 108 C 160 108 160 95 220 95 C 280 95 280 108 330 108" stroke="#00e676" strokeWidth="2.5" fill="none" />
              <text x="220" y="99" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="10" fontWeight="bold">Po1 (2Gbps)</text>
            </>
          )}

          {/* Bandwidth labels */}
          <text x="220" y="75" textAnchor="middle" fill="#546e7a" fontFamily="monospace" fontSize="9">1 Gbps</text>
          <text x="220" y="125" textAnchor="middle" fill="#546e7a" fontFamily="monospace" fontSize="9">1 Gbps</text>
        </svg>

        <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)', minHeight: 20 }}>
          {step === 0 && 'Two separate 1 Gbps links between SW1 and SW2'}
          {step === 1 && 'SW1 sends LACP PDU on Gi0/1 — negotiating channel membership'}
          {step === 2 && 'SW1 sends LACP PDU on Gi0/2 — both links negotiated'}
          {step === 3 && '✓ Port-channel Po1 formed — logical 2 Gbps link with load balancing'}
          {step === 4 && 'Traffic distributed across both physical links using hashing (src/dst IP/MAC)'}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// Subnetting — visual subnet division
// ────────────────────────────────────────────────────────────────
function SubnettingDiagram() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    if (isPaused || step >= 4) return;
    const t = setTimeout(() => setStep((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function replay() { setStep(0); setIsPaused(false); }

  const subnets = [
    { net: '10.0.0.0/26',   range: '10.0.0.1 – 10.0.0.62',   hosts: 62,  color: '#00e5ff' },
    { net: '10.0.0.64/26',  range: '10.0.0.65 – 10.0.0.126', hosts: 62,  color: '#7c4dff' },
    { net: '10.0.0.128/26', range: '10.0.0.129 – 10.0.0.190', hosts: 62, color: '#e040fb' },
    { net: '10.0.0.192/26', range: '10.0.0.193 – 10.0.0.254', hosts: 62, color: '#ffab00' },
  ];

  return (
    <DiagramShell title="SUBNETTING — DIVIDING 10.0.0.0/24 INTO /26 SUBNETS" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: 20 }}>
        {/* Bit boundary visual */}
        <div style={{ marginBottom: 16, overflowX: 'auto' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, textAlign: 'center' }}>
            IP ADDRESS STRUCTURE — 10.0.0.<span style={{ color: 'var(--accent)' }}>nnnnnnhh</span> (n=network, h=host bits)
          </div>
          <div style={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {['10', '.', '0', '.', '0', '.'].map((b, i) => (
              <div key={i} style={{ padding: '4px 8px', background: 'rgba(0,229,255,0.08)', border: '1px solid var(--border-subtle)', borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b}</div>
            ))}
            {[1, 1, 0, 0, 0, 0, 0, 0].map((bit, i) => (
              <div key={i} style={{
                width: 22, padding: '4px 0', textAlign: 'center',
                background: i < 2 ? 'rgba(0,229,255,0.15)' : 'rgba(255,171,0,0.12)',
                border: `1px solid ${i < 2 ? 'var(--accent)' : '#ffab00'}`,
                borderRadius: 3, fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                color: i < 2 ? 'var(--accent)' : '#ffab00', fontWeight: 700,
              }}>{bit}</div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 1, marginTop: 2 }}>
            <div style={{ width: 148 }} />
            <div style={{ display: 'flex', gap: 1 }}>
              <div style={{ width: 46, textAlign: 'center', fontSize: '0.5875rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>← /26 net →</div>
              <div style={{ width: 92, textAlign: 'center', fontSize: '0.5875rem', color: '#ffab00', fontFamily: 'var(--font-mono)' }}>←  host  →</div>
            </div>
          </div>
        </div>

        {/* Subnet blocks */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {subnets.map((s, i) => (
            <div key={i} style={{
              padding: '8px 10px', borderRadius: 5,
              background: step > i ? `${s.color}12` : 'var(--bg-elevated)',
              border: `1px solid ${step > i ? s.color : 'var(--border-subtle)'}`,
              transition: 'all 0.4s',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: step > i ? s.color : 'var(--text-muted)', marginBottom: 2 }}>{s.net}</div>
              <div style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
                {s.range}<br />
                <span style={{ color: step > i ? s.color : 'var(--text-muted)' }}>{s.hosts} hosts</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 12, fontSize: '0.8125rem', color: 'var(--text-secondary)', minHeight: 20 }}>
          {step === 0 && '10.0.0.0/24 has 254 usable hosts in one flat broadcast domain'}
          {step === 1 && 'Borrowing 2 bits from the host portion gives us 4 subnets (/26)'}
          {step === 2 && 'Each /26 subnet has 64 IPs total — 62 usable hosts'}
          {step === 3 && 'Subnets divide the address space into isolated broadcast domains'}
          {step === 4 && '✓ Smaller subnets = better security, reduced broadcast traffic, easier management'}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// Network Types — geographic scope visual
// ────────────────────────────────────────────────────────────────
const NET_TYPES = [
  { name: 'PAN',      scope: 'Personal (~10m)',     speed: '< 3 Mbps',      color: '#78909c', ex: 'Bluetooth, NFC',        radius: 28  },
  { name: 'LAN',      scope: 'Building (< 100m)',   speed: '1–100 Gbps',    color: '#00e5ff', ex: 'Ethernet, Wi-Fi',       radius: 52  },
  { name: 'WLAN',     scope: 'Building (wireless)', speed: '600M–9.6 Gbps', color: '#039be5', ex: '802.11ax (Wi-Fi 6)',    radius: 52  },
  { name: 'MAN',      scope: 'City (5–50 km)',      speed: '1–100 Gbps',    color: '#7c4dff', ex: 'Metro Ethernet',        radius: 76  },
  { name: 'WAN',      scope: 'Country/Globe',       speed: '1M–100 Gbps',   color: '#f50057', ex: 'MPLS, SD-WAN, VPN',     radius: 100 },
  { name: 'Internet', scope: 'Global',              speed: 'Varies',        color: '#ffab00', ex: '~80,000 ASes via BGP',  radius: 124 },
];

function NetworkTypesDiagram() {
  const [active, setActive] = useState(null);
  const [step, setStep]     = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || step >= NET_TYPES.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 380);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  function replay() { setStep(0); setActive(null); setIsPaused(false); }

  const info = active !== null ? NET_TYPES[active] : NET_TYPES[Math.min(step - 1, NET_TYPES.length - 1)];

  return (
    <DiagramShell title="NETWORK TYPES — GEOGRAPHIC SCOPE" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: 20, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* Concentric circles */}
        <svg width="260" height="260" viewBox="0 0 260 260" style={{ flexShrink: 0 }}>
          {NET_TYPES.map((t, i) => (
            <circle key={t.name}
              cx="130" cy="130"
              r={t.radius}
              fill="none"
              stroke={step > i ? t.color : 'var(--border-subtle)'}
              strokeWidth={active === i ? 2.5 : 1.5}
              strokeDasharray={i >= 2 && i < 4 ? '5,3' : 'none'}
              opacity={step > i ? (active === i ? 1 : 0.6) : 0.15}
              style={{ cursor: 'pointer', transition: 'all 0.35s' }}
              onClick={() => setActive(active === i ? null : i)}
            />
          ))}
          {NET_TYPES.map((t, i) => step > i && (
            <text key={t.name + '-l'}
              x={130 + t.radius - 4}
              y={130}
              fill={t.color}
              fontSize="9"
              fontFamily="monospace"
              fontWeight="700"
              textAnchor="end"
              dominantBaseline="middle"
              style={{ cursor: 'pointer', pointerEvents: 'none' }}
            >{t.name}</text>
          ))}
          <circle cx="130" cy="130" r="8" fill="var(--accent)" opacity="0.9" />
          <text x="130" y="130" fill="#000" fontSize="7" fontWeight="800" textAnchor="middle" dominantBaseline="middle">YOU</text>
        </svg>

        {/* Detail panel */}
        {info && step > 0 && (
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
              {active !== null ? 'SELECTED' : 'LATEST'} →
            </div>
            {NET_TYPES.map((t, i) => (
              <div key={t.name} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5,
                opacity: step > i ? 1 : 0.2, transition: 'opacity 0.35s',
                cursor: 'pointer',
              }} onClick={() => setActive(active === i ? null : i)}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0,
                  boxShadow: active === i ? `0 0 8px ${t.color}` : 'none', transition: 'box-shadow 0.2s' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: t.color }}>{t.name}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: 6 }}>{t.scope}</span>
                </div>
              </div>
            ))}
            {active !== null && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: `${info.color}12`, border: `1px solid ${info.color}40`, borderRadius: 6 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: info.color, marginBottom: 4 }}>{info.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>📏 {info.scope}</div>
                  <div>⚡ {info.speed}</div>
                  <div>🔌 {info.ex}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// Network Topologies — animated comparison with failure sim
// ────────────────────────────────────────────────────────────────
const TOPOS = [
  { name: 'Bus',    color: '#ff6d00' },
  { name: 'Star',   color: '#00e5ff' },
  { name: 'Ring',   color: '#7c4dff' },
  { name: 'Mesh',   color: '#00e676' },
];

function TopologyComparisonDiagram() {
  const [active, setActive] = useState(1); // default to Star
  const [failed, setFailed] = useState(null);
  const [showFail, setShowFail]   = useState(false);

  function simulateFail() {
    setShowFail(true);
    setFailed(active === 1 ? 'center' : active === 0 ? 'bus' : active === 2 ? 'link' : null);
    setTimeout(() => { setShowFail(false); setFailed(null); }, 2000);
  }

  const topo = TOPOS[active];

  // Node positions for each topology
  const cx = 100, cy = 90, r = 55;
  const nodes = Array.from({ length: 5 }, (_, i) => ({
    x: cx + r * Math.cos((i * 2 * Math.PI) / 5 - Math.PI / 2),
    y: cy + r * Math.sin((i * 2 * Math.PI) / 5 - Math.PI / 2),
  }));
  const hub = { x: cx, y: cy };

  const impactMsg = {
    0: showFail ? '⚠ Entire network down — single cable failure' : 'All share one cable. Break anywhere = total outage.',
    1: showFail ? '⚠ Only one device disconnected — others unaffected' : 'Central switch is SPOF. One cable = one device affected.',
    2: showFail ? '⚠ Ring broken — traffic disrupted (unless dual-ring)' : 'Break in ring disrupts entire loop (single-ring).',
    3: showFail ? '✓ Network continues — multiple redundant paths' : 'Every device connects to every other. Maximum resilience.',
  };

  return (
    <DiagramShell title="NETWORK TOPOLOGIES — COMPARISON">
      <div style={{ padding: '14px 20px' }}>
        {/* Selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {TOPOS.map((t, i) => (
            <button key={t.name} style={{
              padding: '4px 14px', borderRadius: 4, border: `1px solid ${active === i ? t.color : 'var(--border-subtle)'}`,
              background: active === i ? `${t.color}18` : 'var(--bg-elevated)',
              color: active === i ? t.color : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: active === i ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }} onClick={() => { setActive(i); setShowFail(false); setFailed(null); }}>
              {t.name}
            </button>
          ))}
          <button style={{
            padding: '4px 14px', borderRadius: 4, border: '1px solid var(--color-error)',
            background: 'rgba(255,23,68,0.08)', color: 'var(--color-error)',
            fontFamily: 'var(--font-mono)', fontSize: '0.75rem', cursor: 'pointer', marginLeft: 'auto',
          }} onClick={simulateFail}>
            ⚡ Simulate Failure
          </button>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* SVG diagram */}
          <svg width="200" height="180" viewBox="0 0 200 180" style={{ flexShrink: 0 }}>
            {/* Bus */}
            {active === 0 && (<>
              <line x1="20" y1="90" x2="180" y2="90" stroke={showFail ? '#ff1744' : topo.color} strokeWidth="3" strokeDasharray={showFail ? '6,4' : 'none'} />
              {[0,1,2,3,4].map(i => {
                const x = 30 + i * 35;
                return (<g key={i}>
                  <line x1={x} y1="90" x2={x} y2={i%2===0?55:125} stroke={topo.color} strokeWidth="1.5" opacity={showFail ? 0.3 : 0.7} />
                  <circle cx={x} cy={i%2===0?50:130} r="10" fill={`${topo.color}22`} stroke={topo.color} strokeWidth="1.5" opacity={showFail ? 0.3 : 1} />
                  <text x={x} y={i%2===0?54:134} textAnchor="middle" fill={topo.color} fontSize="8" fontWeight="bold" dominantBaseline="middle">PC</text>
                </g>);
              })}
              {showFail && <text x="100" y="75" textAnchor="middle" fill="#ff1744" fontSize="11" fontWeight="bold">✗ BREAK</text>}
            </>)}

            {/* Star */}
            {active === 1 && (<>
              {nodes.map((n, i) => (
                <line key={i} x1={hub.x} y1={hub.y} x2={n.x} y2={n.y}
                  stroke={showFail && i === 2 ? '#ff1744' : topo.color}
                  strokeWidth="1.5" opacity={showFail && i === 2 ? 1 : 0.7}
                  strokeDasharray={showFail && i === 2 ? '5,3' : 'none'} />
              ))}
              <rect x={hub.x-18} y={hub.y-14} width="36" height="28" rx="4"
                fill={showFail ? 'rgba(0,229,255,0.1)' : 'rgba(0,229,255,0.15)'}
                stroke={topo.color} strokeWidth="2" />
              <text x={hub.x} y={hub.y} textAnchor="middle" fill={topo.color} fontSize="8" fontWeight="bold" dominantBaseline="middle">SW</text>
              {nodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="11" fill={showFail && i === 2 ? 'rgba(255,23,68,0.15)' : `${topo.color}22`}
                    stroke={showFail && i === 2 ? '#ff1744' : topo.color} strokeWidth="1.5" />
                  <text x={n.x} y={n.y} textAnchor="middle" fill={showFail && i === 2 ? '#ff1744' : topo.color}
                    fontSize="7" fontWeight="bold" dominantBaseline="middle">{showFail && i === 2 ? '✗' : 'PC'}</text>
                </g>
              ))}
            </>)}

            {/* Ring */}
            {active === 2 && (<>
              {nodes.map((n, i) => {
                const next = nodes[(i + 1) % nodes.length];
                const broken = showFail && i === 1;
                return <line key={i} x1={n.x} y1={n.y} x2={next.x} y2={next.y}
                  stroke={broken ? '#ff1744' : topo.color} strokeWidth="1.5"
                  strokeDasharray={broken ? '5,3' : 'none'} opacity={broken ? 1 : 0.7} />;
              })}
              {nodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="11" fill={`${topo.color}22`} stroke={topo.color} strokeWidth="1.5" />
                  <text x={n.x} y={n.y} textAnchor="middle" fill={topo.color} fontSize="7" fontWeight="bold" dominantBaseline="middle">SW</text>
                </g>
              ))}
              {showFail && <text x="100" y="165" textAnchor="middle" fill="#ff1744" fontSize="9" fontWeight="bold">⚠ Ring broken</text>}
            </>)}

            {/* Mesh */}
            {active === 3 && (<>
              {nodes.map((n, i) => nodes.slice(i+1).map((m, j) => (
                <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y}
                  stroke={topo.color} strokeWidth="1" opacity={showFail && i===0 && j===0 ? 0.1 : 0.5} />
              )))}
              {nodes.map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="12" fill={`${topo.color}22`} stroke={topo.color} strokeWidth="1.5" />
                  <text x={n.x} y={n.y} textAnchor="middle" fill={topo.color} fontSize="7" fontWeight="bold" dominantBaseline="middle">R{i+1}</text>
                </g>
              ))}
              {showFail && <text x="100" y="165" textAnchor="middle" fill="#00e676" fontSize="9" fontWeight="bold">✓ Rerouting via alternate paths</text>}
            </>)}
          </svg>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: topo.color, marginBottom: 8 }}>{topo.name}</div>
            {[
              ['Status', active === 0 || active === 2 ? 'Obsolete' : active === 1 ? 'Most common (LAN)' : 'WAN / DC core'],
              ['SPOF', active === 0 ? 'Bus cable' : active === 1 ? 'Central switch' : active === 2 ? 'Any link' : 'None'],
              ['Cost', active === 3 ? 'High (many links)' : active === 0 ? 'Low' : 'Medium'],
              ['Scale', active === 3 ? 'Poor (n²)' : active === 1 ? 'Excellent' : 'Poor'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-muted)', minWidth: 50, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
              </div>
            ))}
            <div style={{
              marginTop: 12, padding: '8px 10px', borderRadius: 5,
              background: showFail ? (active === 3 ? 'rgba(0,230,118,0.08)' : 'rgba(255,23,68,0.08)') : `${topo.color}0f`,
              border: `1px solid ${showFail ? (active === 3 ? '#00e676' : '#ff1744') : topo.color}40`,
              fontSize: '0.75rem', color: 'var(--text-secondary)', transition: 'all 0.3s',
            }}>
              {impactMsg[active]}
            </div>
          </div>
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// Network Devices — OSI layer mapping
// ────────────────────────────────────────────────────────────────
const DEVICE_LAYER_DATA = [
  { layer: 7, name: 'Application', color: '#6366f1', devices: ['Proxy', 'WAF', 'Load Balancer'], protocols: 'HTTP, DNS, SMTP' },
  { layer: 6, name: 'Presentation', color: '#8b5cf6', devices: ['IPS/IDS', 'NGFW'], protocols: 'TLS, SSL, JPEG' },
  { layer: 5, name: 'Session', color: '#a855f7', devices: [], protocols: 'RPC, NetBIOS' },
  { layer: 4, name: 'Transport', color: '#ec4899', devices: ['Firewall (stateful)'], protocols: 'TCP, UDP' },
  { layer: 3, name: 'Network', color: '#f43f5e', devices: ['Router', 'L3 Switch'], protocols: 'IP, ICMP, OSPF' },
  { layer: 2, name: 'Data Link', color: '#f97316', devices: ['Switch', 'Bridge', 'AP'], protocols: 'Ethernet, 802.11' },
  { layer: 1, name: 'Physical', color: '#eab308', devices: ['Hub', 'Repeater', 'NIC', 'Cable'], protocols: 'Signals, bits' },
];

function NetworkDevicesDiagram() {
  const [highlight, setHighlight] = useState(null);

  return (
    <DiagramShell title="NETWORK DEVICES — OSI LAYER MAPPING">
      <div style={{ padding: '14px 20px' }}>
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 10, textAlign: 'center' }}>
          Click a layer to highlight — devices operate at that layer and below
        </div>
        {DEVICE_LAYER_DATA.map((row) => {
          const isHighlighted = highlight === null || highlight >= row.layer;
          return (
            <div key={row.layer} style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3,
              cursor: 'pointer', opacity: isHighlighted ? 1 : 0.3, transition: 'opacity 0.2s',
            }} onClick={() => setHighlight(highlight === row.layer ? null : row.layer)}>
              {/* Layer badge */}
              <div style={{
                width: 22, height: 22, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isHighlighted ? `${row.color}22` : 'var(--bg-elevated)',
                border: `1px solid ${isHighlighted ? row.color : 'var(--border-subtle)'}`,
                fontSize: '0.625rem', fontWeight: 700, color: row.color, flexShrink: 0, transition: 'all 0.2s',
              }}>{row.layer}</div>

              {/* Layer name */}
              <div style={{ width: 100, fontSize: '0.75rem', fontWeight: 600, color: isHighlighted ? row.color : 'var(--text-muted)', flexShrink: 0 }}>
                {row.name}
              </div>

              {/* Devices */}
              <div style={{ flex: 1, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {row.devices.map((d) => (
                  <span key={d} style={{
                    padding: '1px 8px', borderRadius: 3,
                    background: isHighlighted ? `${row.color}18` : 'var(--bg-elevated)',
                    border: `1px solid ${isHighlighted ? row.color : 'var(--border-subtle)'}`,
                    fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: isHighlighted ? row.color : 'var(--text-muted)',
                    transition: 'all 0.2s',
                  }}>{d}</span>
                ))}
                {row.devices.length === 0 && <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>—</span>}
              </div>

              {/* Protocols */}
              <div style={{ width: 130, fontSize: '0.6375rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
                {row.protocols}
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {highlight ? `L${highlight} devices understand all layers up to L${highlight}` : 'Higher-layer devices understand all layers below them'}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// Cables & Transmission — speed/distance comparison bars
// ────────────────────────────────────────────────────────────────
const CABLE_DATA = [
  { name: 'Cat5e UTP',    type: 'Copper', speed: '1 Gbps',    distM: 100, speedN: 1,   color: '#ffab00',  icon: '🔶', notes: 'Standard office LAN' },
  { name: 'Cat6 UTP',     type: 'Copper', speed: '10 Gbps',   distM: 55,  speedN: 10,  color: '#ff9800',  icon: '🔶', notes: '10G only at 55m' },
  { name: 'Cat6a UTP',    type: 'Copper', speed: '10 Gbps',   distM: 100, speedN: 10,  color: '#ff6d00',  icon: '🔶', notes: 'Full 10G at 100m' },
  { name: 'Cat8 UTP',     type: 'Copper', speed: '40 Gbps',   distM: 30,  speedN: 40,  color: '#e64a19',  icon: '🔶', notes: 'Data centre only' },
  { name: 'MMF OM4',      type: 'Fibre',  speed: '10 Gbps',   distM: 400, speedN: 10,  color: '#e040fb',  icon: '🟣', notes: 'Orange/aqua jacket' },
  { name: 'MMF OM5',      type: 'Fibre',  speed: '100 Gbps',  distM: 150, speedN: 100, color: '#ab47bc',  icon: '🟣', notes: 'Short-reach 400G' },
  { name: 'SMF OS2',      type: 'Fibre',  speed: '100 Gbps',  distM: 10000, speedN: 100, color: '#00e676', icon: '🟡', notes: 'Yellow jacket, long-haul' },
  { name: 'Wi-Fi 5 (ac)', type: 'Wireless', speed: '3.5 Gbps', distM: 50, speedN: 3.5, color: '#039be5',  icon: '📡', notes: '5 GHz, 23 channels' },
  { name: 'Wi-Fi 6 (ax)', type: 'Wireless', speed: '9.6 Gbps', distM: 100, speedN: 9.6, color: '#0288d1', icon: '📡', notes: 'OFDMA, dense envs' },
];

function CablesDiagram() {
  const [sort, setSort] = useState('speed');
  const maxSpeed = 100, maxDist = 10000;
  const sorted = [...CABLE_DATA].sort((a, b) => sort === 'speed' ? b.speedN - a.speedN : b.distM - a.distM);

  return (
    <DiagramShell title="CABLES & TRANSMISSION — SPEED AND DISTANCE COMPARISON">
      <div style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Sort:</span>
          {['speed', 'distance'].map((s) => (
            <button key={s} style={{
              padding: '2px 10px', borderRadius: 4, border: `1px solid ${sort === s ? 'var(--accent)' : 'var(--border-subtle)'}`,
              background: sort === s ? 'var(--accent-glow)' : 'var(--bg-elevated)',
              color: sort === s ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', cursor: 'pointer',
            }} onClick={() => setSort(s)}>{s}</button>
          ))}
        </div>

        {sorted.map((c) => (
          <div key={c.name} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: '0.6875rem', minWidth: 110, fontFamily: 'var(--font-mono)', color: c.color }}>{c.icon} {c.name}</span>
              <div style={{ flex: 1, height: 10, background: 'var(--bg-elevated)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: `${(c.speedN / maxSpeed) * 100}%`, height: '100%', background: c.color, borderRadius: 5, opacity: 0.85, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ minWidth: 68, fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: c.color, textAlign: 'right' }}>{c.speed}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ minWidth: 110, fontSize: '0.5875rem', color: 'var(--text-muted)', paddingLeft: 18, fontFamily: 'var(--font-mono)' }}>{c.notes}</span>
              <div style={{ flex: 1, height: 5, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div style={{ width: `${Math.min((c.distM / maxDist) * 100, 100)}%`, height: '100%', background: c.color, borderRadius: 3, opacity: 0.4, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ minWidth: 68, fontSize: '0.5875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'right' }}>{c.distM >= 1000 ? (c.distM/1000) + ' km' : c.distM + ' m'}</span>
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: '0.6375rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>🔶 Copper</span><span>🟣 MMF Fibre</span><span>🟡 SMF Fibre</span><span>📡 Wireless</span>
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// Routing Fundamentals — animated longest-prefix-match lookup
// ────────────────────────────────────────────────────────────────
const ROUTING_TABLE = [
  { prefix: '10.0.0.0/8',   via: 'Gi0/0 (connected)', ad: 'C/0',  color: '#546e7a' },
  { prefix: '10.0.1.0/24',  via: '10.0.12.2',          ad: 'O/110',color: '#00e5ff' },
  { prefix: '10.0.1.50/32', via: '10.0.12.3',          ad: 'S/1',  color: '#ffab00' },
  { prefix: '0.0.0.0/0',    via: '10.0.12.1',          ad: 'S*/1', color: '#00e676' },
];

const TEST_PACKETS = [
  { dst: '10.0.1.50',  desc: 'Host route match', winner: 2 },
  { dst: '10.0.1.100', desc: 'Subnet match',     winner: 1 },
  { dst: '10.0.2.1',   desc: 'Class A match',    winner: 0 },
  { dst: '8.8.8.8',    desc: 'Default route',    winner: 3 },
];

function RoutingDiagram() {
  const [packetIdx, setPacketIdx] = useState(0);
  const [checking, setChecking]   = useState(-1);
  const [winner, setWinner]       = useState(null);
  const [isPaused, setIsPaused]   = useState(false);

  const pkt = TEST_PACKETS[packetIdx];

  useEffect(() => {
    if (isPaused) return;
    setChecking(-1); setWinner(null);
    let idx = 0;
    const run = () => {
      if (idx <= pkt.winner) {
        setChecking(idx);
        if (idx === pkt.winner) {
          setTimeout(() => setWinner(pkt.winner), 450);
        }
        idx++;
        if (idx <= pkt.winner) setTimeout(run, 600);
      }
    };
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, [packetIdx, isPaused]);

  return (
    <DiagramShell title="ROUTING — LONGEST PREFIX MATCH LOOKUP" onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: '14px 20px' }}>
        {/* Packet selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Destination:</span>
          {TEST_PACKETS.map((p, i) => (
            <button key={p.dst} style={{
              padding: '3px 10px', borderRadius: 4,
              border: `1px solid ${packetIdx === i ? '#00e5ff' : 'var(--border-subtle)'}`,
              background: packetIdx === i ? 'rgba(0,229,255,0.12)' : 'var(--bg-elevated)',
              color: packetIdx === i ? '#00e5ff' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', cursor: 'pointer',
            }} onClick={() => setPacketIdx(i)}>{p.dst}</button>
          ))}
        </div>

        {/* Routing table */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
            ROUTING TABLE — checking for dst: <span style={{ color: '#00e5ff', fontWeight: 700 }}>{pkt.dst}</span>
          </div>
          {ROUTING_TABLE.map((row, i) => {
            const isChecking = checking === i && winner === null;
            const isWinner   = winner === i;
            const isLooser   = winner !== null && i !== winner && i <= pkt.winner;
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 3,
                borderRadius: 5, transition: 'all 0.3s',
                background: isWinner ? `${row.color}18` : isChecking ? `${row.color}0d` : isLooser ? 'rgba(255,23,68,0.04)' : 'var(--bg-elevated)',
                border: `1px solid ${isWinner ? row.color : isChecking ? `${row.color}60` : isLooser ? 'rgba(255,23,68,0.15)' : 'var(--border-subtle)'}`,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', fontWeight: 700, color: row.color, minWidth: 130 }}>{row.prefix}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', minWidth: 55 }}>{row.ad}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-secondary)', flex: 1 }}>via {row.via}</span>
                <span style={{ fontSize: '0.875rem' }}>
                  {isWinner ? '✓' : isChecking ? '⟳' : isLooser ? '✗' : ''}
                </span>
              </div>
            );
          })}
        </div>

        {winner !== null && (
          <div style={{
            padding: '8px 12px', borderRadius: 6, animation: 'fade-in-up 0.25s ease',
            background: `${ROUTING_TABLE[winner].color}15`,
            border: `1px solid ${ROUTING_TABLE[winner].color}50`,
            fontFamily: 'var(--font-mono)', fontSize: '0.8125rem',
            color: ROUTING_TABLE[winner].color,
          }}>
            ✓ Best match: <strong>{ROUTING_TABLE[winner].prefix}</strong> — {pkt.desc} (longest prefix wins)
          </div>
        )}
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// How The Internet Works — end-to-end browser request journey
// ────────────────────────────────────────────────────────────────
const INTERNET_STEPS = [
  { label: 'DNS Query',       icon: '🔍', color: '#ffab00', detail: 'Browser asks resolver: what is the IP for www.example.com?', mac: 'Changes', ip: 'PC → DNS' },
  { label: 'DNS Response',    icon: '📋', color: '#ffab00', detail: 'Resolver returns: 93.184.216.34 (cached for TTL seconds)', mac: 'Changes', ip: 'DNS → PC' },
  { label: 'TCP SYN',         icon: '🤝', color: '#00e5ff', detail: 'PC sends SYN to 93.184.216.34:443 — initiating connection', mac: 'Changes each hop', ip: 'Constant end-to-end' },
  { label: 'TCP SYN-ACK',     icon: '🤝', color: '#00e5ff', detail: 'Server acknowledges — sends its own sequence number', mac: 'Changes each hop', ip: 'Constant end-to-end' },
  { label: 'TCP ACK + TLS',   icon: '🔒', color: '#00e676', detail: 'Connection established. TLS handshake begins (cipher negotiation + certificate)', mac: 'Changes each hop', ip: 'Constant end-to-end' },
  { label: 'NAT Translation', icon: '🔄', color: '#7c4dff', detail: 'Home router rewrites src IP: 192.168.1.10 → 203.0.113.5 and records port mapping', mac: 'N/A', ip: 'Private → Public' },
  { label: 'BGP Routing',     icon: '🌐', color: '#f50057', detail: 'Packet traverses ISP backbone — BGP routers forward based on AS path', mac: 'Changes every hop', ip: 'Constant end-to-end' },
  { label: 'HTTP Request',    icon: '📨', color: '#e040fb', detail: 'Browser sends GET /index.html over encrypted TLS channel', mac: 'Changes each hop', ip: 'Constant end-to-end' },
  { label: 'HTTP Response',   icon: '📥', color: '#00e676', detail: 'Server responds 200 OK with HTML. TCP delivers all segments reliably.', mac: 'Changes each hop', ip: 'Constant end-to-end' },
  { label: 'Page Rendered',   icon: '✅', color: '#00e676', detail: 'Browser parses HTML/CSS/JS and renders the page. Total: ~50–200ms', mac: '—', ip: '—' },
];

function HowInternetWorksDiagram() {
  const [step, setStep] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStep(0), 500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (isPaused) return;
    if (step >= 0 && step < INTERNET_STEPS.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 800);
      return () => clearTimeout(t);
    }
  }, [step, isPaused]);
  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 300); }

  return (
    <DiagramShell title="HOW THE INTERNET WORKS — END-TO-END BROWSER REQUEST" onReplay={replay} onPause={() => setIsPaused(p => !p)} isPaused={isPaused}>
      <div style={{ padding: '14px 20px' }}>
        {/* Key concept banner */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'MAC addresses', val: 'Change every hop (L2 — node to node)', color: '#f97316' },
            { label: 'IP addresses', val: 'Stay the same end-to-end (L3)', color: '#00e5ff' },
          ].map((b) => (
            <div key={b.label} style={{
              flex: 1, padding: '6px 10px', borderRadius: 5, minWidth: 180,
              background: `${b.color}0f`, border: `1px solid ${b.color}30`,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, color: b.color }}>{b.label}: </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{b.val}</span>
            </div>
          ))}
        </div>

        {/* Step list */}
        <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
          {INTERNET_STEPS.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6,
              opacity: step >= i ? 1 : 0.15, transition: 'opacity 0.4s',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: step >= i ? `${s.color}22` : 'var(--bg-elevated)',
                border: `1.5px solid ${step >= i ? s.color : 'var(--border-subtle)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.875rem', transition: 'all 0.3s',
              }}>{s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.8125rem', color: step >= i ? s.color : 'var(--text-muted)' }}>{s.label}</span>
                  <span style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    IP: {s.ip}
                  </span>
                </div>
                {step >= i && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.detail}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DiagramShell>
  );
}

// ────────────────────────────────────────────────────────────────
// Dispatcher — maps slug → diagram component
// ────────────────────────────────────────────────────────────────
const DIAGRAM_MAP = {
  // Foundation topics
  'osi-model':            OsiDiagram,
  'network-layer-arch':   OsiDiagram,
  'network-types':        NetworkTypesDiagram,
  'network-topologies':   TopologyComparisonDiagram,
  'network-devices':      NetworkDevicesDiagram,
  'cables-transmission':  CablesDiagram,
  'routing-fundamentals': RoutingDiagram,
  'how-internet-works':   HowInternetWorksDiagram,
  // CCNA topics
  'vlans':                VlanDiagram,
  'vlan-roas':            VlanDiagram,
  'vlan-svi':             VlanDiagram,
  'dhcp':                 DhcpDiagram,
  'ospf':                 OspfDiagram,
  'stp':                  StpDiagram,
  'dns':                  DnsDiagram,
  'nat':                  NatDiagram,
  'pat':                  NatDiagram,
  'gre':                  GreDiagram,
  'tunneling':            GreDiagram,
  'lacp':                 LacpDiagram,
  'subnetting':           SubnettingDiagram,
};

export default function TheoryDiagram({ slug }) {
  const Component = DIAGRAM_MAP[slug];
  if (!Component) return null;
  return <Component />;
}

// ══════════════════════════════════════════════════════════════
// INLINE DIAGRAMS — injected between markdown sections
// ══════════════════════════════════════════════════════════════

// ── Shared inline shell ────────────────────────────────────────
function InlineViz({ label, children, accent = 'var(--accent)' }) {
  return (
    <div style={{
      margin: '24px 0', borderRadius: 10, overflow: 'hidden',
      border: `1px solid ${accent}30`,
      background: `${accent}05`,
    }}>
      {label && (
        <div style={{
          padding: '5px 14px', borderBottom: `1px solid ${accent}20`,
          fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
          letterSpacing: '0.1em', color: accent, opacity: 0.8,
          background: `${accent}08`,
        }}>
          ◈ {label}
        </div>
      )}
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// OSI — inline layer-by-layer breakdown with PDU names
// ────────────────────────────────────────────────────────────────
function OsiLayerBreakdown() {
  const [hovered, setHovered] = useState(null);
  const layers = [
    { n: 7, name: 'Application',  pdu: 'Data',    proto: 'HTTP, DNS, FTP, SMTP',   color: '#6366f1', device: 'Host' },
    { n: 6, name: 'Presentation', pdu: 'Data',    proto: 'TLS/SSL, JPEG, ASCII',   color: '#8b5cf6', device: 'Host' },
    { n: 5, name: 'Session',      pdu: 'Data',    proto: 'NetBIOS, RPC, SOCKS',    color: '#a855f7', device: 'Host' },
    { n: 4, name: 'Transport',    pdu: 'Segment', proto: 'TCP, UDP, SCTP',         color: '#ec4899', device: 'Host' },
    { n: 3, name: 'Network',      pdu: 'Packet',  proto: 'IP, ICMP, OSPF, BGP',   color: '#f43f5e', device: 'Router' },
    { n: 2, name: 'Data Link',    pdu: 'Frame',   proto: '802.3 Ethernet, 802.11', color: '#f97316', device: 'Switch' },
    { n: 1, name: 'Physical',     pdu: 'Bits',    proto: 'Copper, Fiber, Wi-Fi',   color: '#eab308', device: 'Hub/NIC' },
  ];
  return (
    <InlineViz label="OSI MODEL — 7 LAYERS" accent="#6366f1">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {layers.map((l) => (
          <div key={l.n}
            onMouseEnter={() => setHovered(l.n)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 70px 1fr 60px',
              alignItems: 'center', gap: 10,
              padding: '7px 12px', borderRadius: 6, cursor: 'default',
              background: hovered === l.n ? `${l.color}18` : `${l.color}08`,
              border: `1px solid ${hovered === l.n ? l.color : l.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: l.color, fontSize: '0.875rem', textAlign: 'center' }}>{l.n}</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>{l.name}</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
              color: l.color, background: `${l.color}18`,
              padding: '2px 8px', borderRadius: 4, textAlign: 'center',
            }}>{l.pdu}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{l.proto}</div>
            <div style={{ fontSize: '0.6rem', color: l.color, fontFamily: 'var(--font-mono)', textAlign: 'right', opacity: 0.8 }}>{l.device}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
        Hover a row · Sender encapsulates top→bottom · Receiver decapsulates bottom→top
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// OSI — encapsulation animation inline
// ────────────────────────────────────────────────────────────────
function OsiEncapsulationInline() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const layers = ['App', 'Pres', 'Sess', 'Trans', 'Net', 'Data', 'Phys'];
  const colors = ['#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316','#eab308'];
  const headers = ['HTTP', 'TLS', 'SYN', 'TCP', 'IP', 'ETH', '01010'];
  useEffect(() => {
    if (isPaused || step >= layers.length) return;
    const t = setTimeout(() => setStep(s => s + 1), 500);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  return (
    <InlineViz label="ENCAPSULATION — EACH LAYER ADDS A HEADER" accent="#f43f5e">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        {/* Encapsulation stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 220 }}>
          {layers.map((l, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6, opacity: step > i ? 1 : 0.25,
              transition: 'opacity 0.4s',
            }}>
              <div style={{ width: 44, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: colors[i] }}>{l}</div>
              {/* headers added so far */}
              {[...Array(i + 1)].map((_, j) => (
                <div key={j} style={{
                  padding: '3px 6px', borderRadius: 3, fontSize: '0.5875rem',
                  fontFamily: 'var(--font-mono)', fontWeight: 700,
                  background: step > i ? `${colors[j]}25` : 'transparent',
                  border: `1px solid ${step > i ? colors[j] : 'transparent'}`,
                  color: colors[j], transition: 'all 0.4s',
                  opacity: j === i ? 1 : 0.5,
                }}>{headers[j]}</div>
              ))}
              <div style={{
                flex: 1, padding: '3px 8px', borderRadius: 3, fontSize: '0.5875rem',
                fontFamily: 'var(--font-mono)',
                background: step > i ? 'var(--bg-elevated)' : 'transparent',
                border: `1px solid ${step > i ? 'var(--border-subtle)' : 'transparent'}`,
                color: 'var(--text-muted)', transition: 'all 0.4s',
              }}>DATA</div>
            </div>
          ))}
        </div>
        {/* Status */}
        <div style={{ textAlign: 'center', minWidth: 120 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
            {step === 0 && 'Application generates data'}
            {step === 1 && 'Presentation encrypts (TLS)'}
            {step === 2 && 'Session adds sync info'}
            {step === 3 && 'Transport adds port + seq'}
            {step === 4 && 'Network adds IP addresses'}
            {step === 5 && 'Data Link adds MAC frame'}
            {step >= 6 && '✓ Bits transmitted on wire'}
          </div>
          <button style={{ ...BASE.btn, fontSize: '0.6rem' }} onClick={() => setIsPaused(p => !p)}>
            {isPaused ? '▶' : '⏸'}
          </button>
          {' '}
          <button style={{ ...BASE.btn, fontSize: '0.6rem' }} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Network Devices — interactive device explorer
// ────────────────────────────────────────────────────────────────
function DeviceExplorer() {
  const [selected, setSelected] = useState(0);
  const devices = [
    {
      name: 'Hub', icon: '●', layer: 'L1 — Physical', color: '#78909c',
      desc: 'Repeats every incoming bit out ALL ports simultaneously. No intelligence — cannot read MAC addresses. Creates one large collision domain. Obsolete in modern networks.',
      pros: ['Simple', 'Cheap', 'Easy to troubleshoot'],
      cons: ['Collisions on every frame', 'All ports share bandwidth', 'Security risk — all traffic visible to all'],
      ports: [
        { id: 'A', label: 'IN', active: true },
        { id: 'B', label: 'OUT', active: true },
        { id: 'C', label: 'OUT', active: true },
        { id: 'D', label: 'OUT', active: true },
      ],
    },
    {
      name: 'Switch', icon: '⊞', layer: 'L2 — Data Link', color: '#00e5ff',
      desc: 'Learns MAC addresses per port and forwards frames only to the correct destination. Each port is its own collision domain. Foundation of modern LANs.',
      pros: ['Per-port collision domains', 'Learns MAC table automatically', 'Full-duplex on each port'],
      cons: ['Broadcasts still flood all ports', 'Vulnerable to MAC flooding attacks', 'No IP routing'],
      ports: [
        { id: 'A', label: 'IN', active: true },
        { id: 'B', label: 'OUT', active: true },
        { id: 'C', label: 'idle', active: false },
        { id: 'D', label: 'idle', active: false },
      ],
    },
    {
      name: 'Router', icon: '⬡', layer: 'L3 — Network', color: '#2979ff',
      desc: 'Forwards packets between different IP networks using a routing table. Makes hop-by-hop decisions based on destination IP. Separates broadcast domains entirely.',
      pros: ['Connects different networks/subnets', 'Stops broadcast storms', 'NAT, DHCP, ACLs, QoS'],
      cons: ['Slower than switching (historically)', 'More complex config', 'Single point of failure without redundancy'],
      ports: [
        { id: 'A', label: 'LAN', active: true },
        { id: 'B', label: 'WAN', active: true },
        { id: 'C', label: 'LAN2', active: false },
        { id: 'D', label: 'Mgmt', active: false },
      ],
    },
    {
      name: 'Firewall', icon: '🔥', layer: 'L3–L7', color: '#ff6d00',
      desc: 'Inspects traffic against policy rules and permits or denies based on IP, port, state, or deep packet inspection. Guards the network perimeter and segments internal zones.',
      pros: ['Stateful inspection', 'Application-layer filtering', 'Zone-based security policies'],
      cons: ['Latency overhead', 'Complex rule management', 'Misconfiguration is common cause of outages'],
      ports: [
        { id: 'A', label: 'INSIDE', active: true },
        { id: 'B', label: 'OUTSIDE', active: true },
        { id: 'C', label: 'DMZ', active: true },
        { id: 'D', label: 'Mgmt', active: false },
      ],
    },
    {
      name: 'Access Point', icon: '📡', layer: 'L1–L2', color: '#00e676',
      desc: 'Bridges wireless clients onto a wired LAN. Operates as a multiport wireless bridge. Clients share the radio spectrum (CSMA/CA). Managed by a WLC in enterprise.',
      pros: ['Wireless client access', 'VLAN tagging per SSID', 'Roaming with WLC'],
      cons: ['Shared spectrum = contention', 'RF interference', 'Hidden-node problem'],
      ports: [
        { id: 'A', label: '2.4GHz', active: true },
        { id: 'B', label: '5GHz', active: true },
        { id: 'C', label: 'Uplink', active: true },
        { id: 'D', label: 'PoE', active: false },
      ],
    },
  ];

  const dev = devices[selected];

  return (
    <InlineViz label="DEVICE EXPLORER — CLICK TO EXPLORE" accent={dev.color}>
      {/* Selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {devices.map((d, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            padding: '5px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: selected === i ? `${d.color}22` : 'var(--bg-elevated)',
            border: `1px solid ${selected === i ? d.color : 'var(--border-subtle)'}`,
            color: selected === i ? d.color : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>{d.icon} {d.name}</button>
        ))}
      </div>

      {/* Device detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: diagram */}
        <div>
          <div style={{
            borderRadius: 8, padding: 16,
            background: `${dev.color}08`, border: `1px solid ${dev.color}30`,
            marginBottom: 10,
          }}>
            {/* Device box */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{
                width: 72, height: 56, borderRadius: 8,
                background: `${dev.color}18`, border: `2px solid ${dev.color}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: dev.icon.length > 1 ? '1.5rem' : '1.25rem',
                boxShadow: `0 0 20px ${dev.color}30`,
              }}>
                <span>{dev.icon}</span>
                <span style={{ fontSize: '0.5rem', color: dev.color, fontWeight: 700, letterSpacing: '0.05em' }}>{dev.name.toUpperCase()}</span>
              </div>
            </div>
            {/* Ports */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {dev.ports.map(p => (
                <div key={p.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                  <div style={{
                    width: 8, height: 20,
                    background: p.active ? dev.color : 'var(--border-subtle)',
                    borderRadius: 2, transition: 'all 0.4s',
                    boxShadow: p.active ? `0 0 6px ${dev.color}` : 'none',
                  }} />
                  <div style={{ fontSize: '0.5rem', color: p.active ? dev.color : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{p.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 99,
            fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 700,
            background: `${dev.color}18`, color: dev.color, border: `1px solid ${dev.color}40`,
          }}>{dev.layer}</div>
        </div>

        {/* Right: description + pros/cons */}
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>{dev.desc}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#00e676', marginBottom: 4 }}>✓ STRENGTHS</div>
              {dev.pros.map((p, i) => (
                <div key={i} style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: 2 }}>• {p}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', fontFamily: 'var(--font-mono)', color: '#ff1744', marginBottom: 4 }}>✗ LIMITATIONS</div>
              {dev.cons.map((c, i) => (
                <div key={i} style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', marginBottom: 2 }}>• {c}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Network Devices — traffic forwarding animation
// ────────────────────────────────────────────────────────────────
function DeviceForwardingAnim() {
  const [mode, setMode] = useState('switch'); // hub | switch
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || step >= 4) return;
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  function reset(m) { setMode(m); setStep(0); setIsPaused(false); }

  const ports = ['PC-A\n.10', 'PC-B\n.20', 'PC-C\n.30', 'PC-D\n.40'];
  const isHub = mode === 'hub';
  // Hub: frame floods to all, Switch: only to .20
  const activePort = (i) => {
    if (step === 0) return false;
    if (isHub) return i !== 0; // floods to all except source
    return i === 1; // switch: only to PC-B
  };

  return (
    <InlineViz label="HUB vs SWITCH — FRAME FORWARDING BEHAVIOUR" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['hub', 'switch'].map(m => (
          <button key={m} onClick={() => reset(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? (m === 'hub' ? 'rgba(120,144,156,0.2)' : 'rgba(0,229,255,0.15)') : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? (m === 'hub' ? '#78909c' : '#00e5ff') : 'var(--border-subtle)'}`,
            color: mode === m ? (m === 'hub' ? '#78909c' : '#00e5ff') : 'var(--text-muted)',
            transition: 'all 0.2s', textTransform: 'uppercase',
          }}>{m}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={() => reset(mode)}>↺</button>
        </div>
      </div>

      {/* Network diagram */}
      <svg viewBox="0 0 400 160" style={{ width: '100%', maxHeight: 160, display: 'block' }}>
        {/* Central device */}
        <rect x="160" y="60" width="80" height="40" rx="6"
          fill={isHub ? 'rgba(120,144,156,0.12)' : 'rgba(0,229,255,0.1)'}
          stroke={isHub ? '#78909c' : '#00e5ff'} strokeWidth="1.5" />
        <text x="200" y="77" textAnchor="middle" fill={isHub ? '#78909c' : '#00e5ff'}
          fontFamily="monospace" fontSize="11" fontWeight="bold">{isHub ? 'HUB' : 'SWITCH'}</text>
        <text x="200" y="91" textAnchor="middle" fill="var(--text-muted)"
          fontFamily="monospace" fontSize="8">{isHub ? 'L1 — Dumb repeater' : 'L2 — MAC aware'}</text>

        {/* Ports + links */}
        {[
          { x: 40,  y: 80, label: 'PC-A', sub: '(source)', isSource: true  },
          { x: 360, y: 40, label: 'PC-B', sub: '(dest)',   isSource: false },
          { x: 360, y: 80, label: 'PC-C', sub: '',         isSource: false },
          { x: 360, y: 120,label: 'PC-D', sub: '',         isSource: false },
        ].map((p, i) => {
          const active = i === 0 ? step >= 1 : activePort(i);
          const color = i === 0 ? '#ffab00' : (isHub ? '#ff5252' : (i === 1 ? '#00e676' : '#78909c'));
          return (
            <g key={i}>
              <line
                x1={i === 0 ? 80 : 320} y1={p.y}
                x2={i === 0 ? 160 : 240} y2={80}
                stroke={active ? color : 'var(--border-subtle)'}
                strokeWidth={active ? 2 : 1}
                strokeDasharray={active && i > 0 && isHub && i > 1 ? '4,2' : 'none'}
                style={{ transition: 'stroke 0.4s, stroke-width 0.4s' }}
              />
              {/* Packet dot */}
              {active && step >= 2 && i > 0 && (
                <circle r="5" fill={color} opacity="0.9">
                  <animateMotion
                    dur="0.6s" repeatCount="1"
                    path={`M${i === 0 ? '80,80' : '240,80'} L${i === 0 ? '160,80' : `${320},${p.y}`}`}
                  />
                </circle>
              )}
              <rect x={i === 0 ? 10 : 330} y={p.y - 12} width={i === 0 ? 70 : 60} height={24} rx="4"
                fill={active ? `${color}15` : 'var(--bg-elevated)'}
                stroke={active ? color : 'var(--border-subtle)'} strokeWidth="1"
                style={{ transition: 'all 0.4s' }} />
              <text x={i === 0 ? 45 : 360} y={p.y - 2} textAnchor="middle"
                fill={active ? color : 'var(--text-muted)'}
                fontFamily="monospace" fontSize="9" fontWeight="bold"
                style={{ transition: 'fill 0.4s' }}>{p.label}</text>
              <text x={i === 0 ? 45 : 360} y={p.y + 8} textAnchor="middle"
                fill="var(--text-muted)" fontFamily="monospace" fontSize="7">{p.sub}</text>
            </g>
          );
        })}
      </svg>

      <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)', minHeight: 20 }}>
        {step === 0 && (isHub ? 'Hub has no MAC table — treats all traffic identically' : 'Switch builds MAC table: PC-A → Port 1')}
        {step === 1 && 'PC-A sends frame destined for PC-B (MAC: aa:bb:cc:00:20)'}
        {step === 2 && (isHub ? '⚠ Hub floods frame to ALL ports — PC-C and PC-D receive unwanted traffic' : '✓ Switch looks up MAC table → forwards ONLY to PC-B')}
        {step >= 3 && (isHub ? '⚠ Every transmission wastes bandwidth — all devices share the collision domain' : '✓ PC-C and PC-D are not disturbed — each port is its own collision domain')}
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Network Types — scope rings interactive
// ────────────────────────────────────────────────────────────────
function NetworkScopeRings() {
  const [active, setActive] = useState(null);
  const types = [
    { name: 'PAN',  r: 36,  color: '#78909c', desc: 'Personal Area — Bluetooth, NFC. ~10m range, <3 Mbps.' },
    { name: 'LAN',  r: 58,  color: '#00e5ff', desc: 'Local Area — Ethernet/Wi-Fi. Building-scale, 1–100 Gbps.' },
    { name: 'MAN',  r: 80,  color: '#7c4dff', desc: 'Metro Area — City-scale. Metro Ethernet, 1–100 Gbps.' },
    { name: 'WAN',  r: 102, color: '#f50057', desc: 'Wide Area — Country/continent. MPLS, SD-WAN, VPN.' },
    { name: 'NET',  r: 124, color: '#ffab00', desc: 'Internet — Global. ~80,000 ASes connected via BGP.' },
  ];
  const cx = 140, cy = 130;
  return (
    <InlineViz label="NETWORK SCOPE — CLICK A RING" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 150" style={{ width: 280, flexShrink: 0, maxHeight: 150 }}>
          {[...types].reverse().map(t => (
            <circle key={t.name} cx={cx} cy={cy} r={t.r}
              fill={active === t.name ? `${t.color}18` : 'transparent'}
              stroke={t.color} strokeWidth={active === t.name ? 2 : 1}
              strokeDasharray={t.name === 'NET' ? 'none' : t.name === 'WAN' ? 'none' : ''}
              opacity={active && active !== t.name ? 0.3 : 1}
              style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              onClick={() => setActive(a => a === t.name ? null : t.name)}
            />
          ))}
          {types.map(t => (
            <text key={t.name} x={cx} y={cy - t.r + 10}
              textAnchor="middle" fill={t.color}
              fontFamily="monospace" fontSize="8" fontWeight="bold"
              opacity={active && active !== t.name ? 0.3 : 1}
              style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
              onClick={() => setActive(a => a === t.name ? null : t.name)}>
              {t.name}
            </text>
          ))}
          {/* Building icon */}
          <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12">🏢</text>
        </svg>
        <div style={{ flex: 1, minWidth: 140 }}>
          {active ? (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: types.find(t => t.name === active)?.color, marginBottom: 6 }}>
                {active === 'NET' ? 'Internet' : active}
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {types.find(t => t.name === active)?.desc}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Click a ring to learn about that network type and its typical speed and scale.
            </p>
          )}
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Network Topologies — animated comparison
// ────────────────────────────────────────────────────────────────
function TopologyAnimComparison() {
  const [topo, setTopo] = useState('star');
  const topos = {
    star: {
      label: 'Star', color: '#00e5ff',
      desc: 'All nodes connect to a central switch/hub. Most common LAN topology. Easy to add/remove nodes. Single point of failure at center.',
      nodes: [{x:140,y:75,center:true}, {x:70,y:30}, {x:210,y:30}, {x:50,y:110}, {x:230,y:110}, {x:140,y:140}],
      links: [[0,1],[0,2],[0,3],[0,4],[0,5]],
    },
    bus: {
      label: 'Bus', color: '#ffab00',
      desc: 'All nodes connect to a single shared cable (bus). Simple but collisions occur. A break anywhere takes the whole network down.',
      nodes: [{x:30,y:80},{x:80,y:80},{x:130,y:80},{x:180,y:80},{x:230,y:80}],
      links: [[0,1],[1,2],[2,3],[3,4]],
    },
    ring: {
      label: 'Ring', color: '#e040fb',
      desc: 'Each node connects to exactly two neighbours forming a loop. Token passing prevents collisions. One break can disrupt the ring.',
      nodes: [{x:140,y:20},{x:225,y:65},{x:200,y:145},{x:80,y:145},{x:55,y:65}],
      links: [[0,1],[1,2],[2,3],[3,4],[4,0]],
    },
    mesh: {
      label: 'Full Mesh', color: '#f43f5e',
      desc: 'Every node connects to every other node. Maximum redundancy but cable count grows as n(n-1)/2. Used in WAN core and data centres.',
      nodes: [{x:140,y:20},{x:240,y:80},{x:200,y:160},{x:80,y:160},{x:40,y:80}],
      links: [[0,1],[0,2],[0,3],[0,4],[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]],
    },
  };
  const t = topos[topo];
  return (
    <InlineViz label="TOPOLOGY COMPARISON — CLICK TO SWITCH" accent={t.color}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(topos).map(([k, v]) => (
          <button key={k} onClick={() => setTopo(k)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: topo === k ? `${v.color}20` : 'var(--bg-elevated)',
            border: `1px solid ${topo === k ? v.color : 'var(--border-subtle)'}`,
            color: topo === k ? v.color : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 170" style={{ width: 280, flexShrink: 0, maxHeight: 170 }}>
          {t.links.map(([a, b], i) => (
            <line key={i}
              x1={t.nodes[a].x} y1={t.nodes[a].y}
              x2={t.nodes[b].x} y2={t.nodes[b].y}
              stroke={t.color} strokeWidth="1.5" opacity="0.6" />
          ))}
          {t.nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={n.center ? 14 : 10}
                fill={`${t.color}20`} stroke={t.color} strokeWidth={n.center ? 2 : 1.5} />
              <text x={n.x} y={n.y + 4} textAnchor="middle"
                fill={t.color} fontFamily="monospace"
                fontSize={n.center ? 9 : 8} fontWeight="bold">
                {n.center ? 'SW' : `N${i}`}
              </text>
            </g>
          ))}
        </svg>
        <div style={{ flex: 1, minWidth: 140 }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t.desc}</p>
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.6875rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ color: '#00e676' }}>Links: {t.links.length}</div>
            <div style={{ color: '#00e676' }}>Nodes: {t.nodes.length}</div>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Cables — visual speed/distance comparison
// ────────────────────────────────────────────────────────────────
function CablesComparisonInline() {
  const [active, setActive] = useState(null);
  const cables = [
    { name: 'Cat5e UTP',   speed: '1 Gbps',    dist: '100m',  color: '#ffab00', speedPct: 25, distPct: 20, use: 'Office LAN, older installs' },
    { name: 'Cat6 UTP',    speed: '10 Gbps',   dist: '55m',   color: '#ff6d00', speedPct: 50, distPct: 11, use: 'Modern LAN, data centres (short)' },
    { name: 'Cat6A STP',   speed: '10 Gbps',   dist: '100m',  color: '#f43f5e', speedPct: 50, distPct: 20, use: 'Data centres, structured cabling' },
    { name: 'MMF (OM4)',   speed: '100 Gbps',  dist: '400m',  color: '#7c4dff', speedPct: 80, distPct: 40, use: 'Campus backbone, data centre uplink' },
    { name: 'SMF (OS2)',   speed: '100 Gbps',  dist: '80km',  color: '#2979ff', speedPct: 80, distPct: 100,use: 'WAN, inter-campus, long-haul' },
    { name: 'Wi-Fi 6E',    speed: '9.6 Gbps',  dist: '~50m',  color: '#00e676', speedPct: 45, distPct: 10, use: 'Wireless LAN, high-density venues' },
  ];
  return (
    <InlineViz label="CABLE TYPES — SPEED & DISTANCE" accent="#7c4dff">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cables.map((c, i) => (
          <div key={i} onClick={() => setActive(a => a === i ? null : i)}
            style={{ cursor: 'pointer', borderRadius: 6, padding: '8px 10px',
              background: active === i ? `${c.color}12` : 'transparent',
              border: `1px solid ${active === i ? c.color : 'transparent'}`,
              transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 80, fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: c.color, fontWeight: 700, flexShrink: 0 }}>{c.name}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 40, fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Speed</div>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${c.speedPct}%`, height: '100%', background: c.color, borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ width: 60, fontSize: '0.5875rem', color: c.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{c.speed}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 40, fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Range</div>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${c.distPct}%`, height: '100%', background: `${c.color}80`, borderRadius: 3, transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ width: 60, fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.dist}</div>
                </div>
              </div>
            </div>
            {active === i && (
              <div style={{ marginTop: 6, fontSize: '0.6875rem', color: 'var(--text-secondary)', paddingLeft: 90 }}>
                Use case: {c.use}
              </div>
            )}
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Routing — routing table walkthrough
// ────────────────────────────────────────────────────────────────
function RoutingTableWalkthrough() {
  const [dest, setDest] = useState('10.0.1.50');
  const [step, setStep] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);

  const routes = [
    { prefix: '10.0.1.0/24',  mask: 24, nh: '10.0.0.1', iface: 'Gi0/0', type: 'C', color: '#00e5ff' },
    { prefix: '10.0.2.0/24',  mask: 24, nh: '10.0.0.2', iface: 'Gi0/1', type: 'O', color: '#00e676' },
    { prefix: '192.168.1.0/24', mask:24, nh: '10.1.0.1', iface: 'Gi0/2', type: 'S', color: '#ffab00' },
    { prefix: '0.0.0.0/0',    mask: 0,  nh: '8.8.8.8',  iface: 'Gi0/3', type: 'S*', color: '#78909c' },
  ];

  const destIp = dest;
  const match = routes.findIndex(r => {
    if (r.mask === 0) return true;
    const bits = destIp.split('.').map(Number);
    const nbits = r.prefix.split('/')[0].split('.').map(Number);
    const mask = r.mask;
    let hostBits = 32 - mask;
    let dNum = bits.reduce((a, b) => a * 256 + b, 0);
    let nNum = nbits.reduce((a, b) => a * 256 + b, 0);
    let mNum = ~((1 << hostBits) - 1) >>> 0;
    return (dNum & mNum) === (nNum & mNum);
  });

  useEffect(() => {
    if (isPaused) return;
    setStep(-1);
    let i = 0;
    const run = () => {
      setStep(i);
      if (i < (match === -1 ? routes.length : match)) {
        i++;
        const t = setTimeout(run, 500);
        return () => clearTimeout(t);
      }
    };
    const t = setTimeout(run, 300);
    return () => clearTimeout(t);
  }, [dest, isPaused]);

  return (
    <InlineViz label="ROUTING TABLE — LONGEST PREFIX MATCH" accent="#2979ff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Destination IP:</span>
        {['10.0.1.50', '10.0.2.99', '192.168.1.1', '8.8.8.8'].map(ip => (
          <button key={ip} onClick={() => { setDest(ip); setIsPaused(false); }} style={{
            padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
            background: dest === ip ? 'rgba(41,121,255,0.15)' : 'var(--bg-elevated)',
            border: `1px solid ${dest === ip ? '#2979ff' : 'var(--border-subtle)'}`,
            color: dest === ip ? '#2979ff' : 'var(--text-muted)',
          }}>{ip}</button>
        ))}
        <button style={{ ...BASE.btn, marginLeft: 'auto' }} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {routes.map((r, i) => {
          const checked = step >= i;
          const isMatch = i === match && step >= match;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '20px 130px 1fr 80px 60px',
              alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
              background: isMatch ? `${r.color}18` : checked ? `${r.color}06` : 'var(--bg-elevated)',
              border: `1px solid ${isMatch ? r.color : checked ? `${r.color}40` : 'var(--border-subtle)'}`,
              transition: 'all 0.4s',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, color: r.color }}>{r.type}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: checked ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isMatch ? 700 : 400 }}>{r.prefix}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {checked ? (isMatch ? '✓ MATCH — forwarding via ' + r.nh : '✗ no match — checking next') : '…'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{r.iface}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: isMatch ? r.color : 'transparent' }}>
                {isMatch ? '← BEST' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// How the Internet Works — browser request journey
// ────────────────────────────────────────────────────────────────
function BrowserRequestJourney() {
  const [step, setStep] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const hops = [
    { icon: '💻', label: 'Browser',       color: '#2979ff', detail: 'User types www.example.com. Browser checks local DNS cache.' },
    { icon: '🔍', label: 'DNS Resolver',  color: '#7c4dff', detail: 'Recursive resolver queries root → TLD → authoritative DNS. Returns 93.184.216.34.' },
    { icon: '🏠', label: 'Home Router',   color: '#ffab00', detail: 'NAT translates private IP → public IP. Forwards packet to ISP.' },
    { icon: '🌐', label: 'ISP / BGP',     color: '#f43f5e', detail: 'BGP routing across ~4 AS hops. Each router makes next-hop decision from routing table.' },
    { icon: '☁️', label: 'CDN Edge',      color: '#00e676', detail: 'CDN PoP closest to you responds. TLS handshake, HTTP/2 stream established.' },
    { icon: '📄', label: 'Page Loads',    color: '#00e5ff', detail: 'HTML/CSS/JS delivered. Browser parses, renders. Total RTT: ~20–200ms.' },
  ];
  useEffect(() => {
    if (isPaused || step >= hops.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 300); }

  return (
    <InlineViz label="INTERNET REQUEST — BROWSER TO SERVER" accent="#2979ff">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>What happens when you press Enter?</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={replay}>↺</button>
        </div>
      </div>
      {/* Hop timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {hops.map((h, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            opacity: step >= i ? 1 : 0.25, transition: 'opacity 0.5s',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: step >= i ? `${h.color}20` : 'var(--bg-elevated)',
              border: `1.5px solid ${step >= i ? h.color : 'var(--border-subtle)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', transition: 'all 0.4s',
              boxShadow: step === i ? `0 0 12px ${h.color}50` : 'none',
            }}>{h.icon}</div>
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: step >= i ? h.color : 'var(--text-muted)', marginBottom: 2 }}>{h.label}</div>
              {step >= i && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{h.detail}</div>}
            </div>
            {i < hops.length - 1 && (
              <div style={{
                position: 'absolute', left: 29, marginTop: 36,
                width: 2, height: 6, background: step > i ? h.color : 'var(--border-subtle)',
              }} />
            )}
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Network Layer Arch — TCP/IP vs OSI comparison
// ────────────────────────────────────────────────────────────────
function TcpIpVsOsi() {
  const [hovered, setHovered] = useState(null);
  const mapping = [
    { osi: ['Application (7)', 'Presentation (6)', 'Session (5)'], tcp: 'Application', color: '#6366f1', proto: 'HTTP, FTP, DNS, SMTP, SSH' },
    { osi: ['Transport (4)'], tcp: 'Transport', color: '#ec4899', proto: 'TCP, UDP' },
    { osi: ['Network (3)'], tcp: 'Internet', color: '#f43f5e', proto: 'IP, ICMP, ARP' },
    { osi: ['Data Link (2)', 'Physical (1)'], tcp: 'Network Access', color: '#f97316', proto: 'Ethernet, Wi-Fi, Drivers' },
  ];
  return (
    <InlineViz label="TCP/IP MODEL vs OSI MODEL" accent="#6366f1">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 8, alignItems: 'stretch' }}>
        {/* OSI */}
        <div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: 6 }}>OSI MODEL (7 layers)</div>
          {mapping.map((m, i) => m.osi.map((l, j) => (
            <div key={`${i}-${j}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '5px 10px', marginBottom: 3, borderRadius: 5, cursor: 'default',
                background: hovered === i ? `${m.color}20` : `${m.color}08`,
                border: `1px solid ${hovered === i ? m.color : m.color + '30'}`,
                fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                color: hovered === i ? m.color : 'var(--text-secondary)',
                transition: 'all 0.2s', textAlign: 'center',
              }}>{l}</div>
          )))}
        </div>
        {/* Arrows */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center' }}>
          {mapping.map((m, i) => (
            <div key={i} style={{ color: m.color, fontSize: '0.875rem', opacity: 0.7 }}>↔</div>
          ))}
        </div>
        {/* TCP/IP */}
        <div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: 6 }}>TCP/IP MODEL (4 layers)</div>
          {mapping.map((m, i) => (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '5px 10px', marginBottom: 3, borderRadius: 5, cursor: 'default',
                background: hovered === i ? `${m.color}20` : `${m.color}08`,
                border: `1px solid ${hovered === i ? m.color : m.color + '30'}`,
                fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                color: hovered === i ? m.color : 'var(--text-secondary)',
                height: `${m.osi.length * 32}px`,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                transition: 'all 0.2s', textAlign: 'center',
              }}>
              <div style={{ fontWeight: 700 }}>{m.tcp}</div>
              {hovered === i && <div style={{ fontSize: '0.5875rem', marginTop: 2, opacity: 0.8 }}>{m.proto}</div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 8, textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
        Hover to see protocols at each layer
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// VLANs — why VLANs exist (without vs with)
// ────────────────────────────────────────────────────────────────
function VlanWhyItMatters() {
  const [mode, setMode] = useState('without');
  const isWithout = mode === 'without';
  return (
    <InlineViz label="VLAN — WITHOUT vs WITH" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {['without', 'with'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? (m === 'without' ? 'rgba(255,82,82,0.15)' : 'rgba(124,77,255,0.15)') : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? (m === 'without' ? '#ff5252' : '#7c4dff') : 'var(--border-subtle)'}`,
            color: mode === m ? (m === 'without' ? '#ff5252' : '#7c4dff') : 'var(--text-muted)',
          }}>{m === 'without' ? '✗ Without VLANs' : '✓ With VLANs'}</button>
        ))}
      </div>
      <svg viewBox="0 0 420 160" style={{ width: '100%', maxHeight: 160, display: 'block' }}>
        {/* Switch */}
        <rect x="175" y="65" width="70" height="30" rx="4"
          fill={isWithout ? 'rgba(255,82,82,0.1)' : 'rgba(124,77,255,0.1)'}
          stroke={isWithout ? '#ff5252' : '#7c4dff'} strokeWidth="1.5" />
        <text x="210" y="83" textAnchor="middle"
          fill={isWithout ? '#ff5252' : '#7c4dff'}
          fontFamily="monospace" fontSize="10" fontWeight="bold">SWITCH</text>

        {/* Ports/devices */}
        {[
          { x: 40,  y: 40,  label: 'Eng-1',  vlan: 10, color: '#00e5ff' },
          { x: 40,  y: 100, label: 'Eng-2',  vlan: 10, color: '#00e5ff' },
          { x: 390, y: 40,  label: 'HR-1',   vlan: 20, color: '#00e676' },
          { x: 390, y: 100, label: 'HR-2',   vlan: 20, color: '#00e676' },
        ].map((d, i) => {
          const fromLeft = i < 2;
          const color = isWithout ? '#ff5252' : d.color;
          return (
            <g key={i}>
              <line
                x1={fromLeft ? 90 : 350} y1={d.y}
                x2={fromLeft ? 175 : 245} y2={80}
                stroke={color} strokeWidth="1.5" opacity={isWithout ? 0.4 : 0.8}
                strokeDasharray={isWithout ? 'none' : fromLeft ? '4,2' : '4,2'}
              />
              <rect x={fromLeft ? 10 : 350} y={d.y - 12} width={80} height={24} rx="4"
                fill={`${isWithout ? '#ff5252' : d.color}12`}
                stroke={isWithout ? '#ff5252' : d.color} strokeWidth="1" opacity="0.9" />
              <text x={fromLeft ? 50 : 390} y={d.y - 1} textAnchor="middle"
                fill={isWithout ? '#ff5252' : d.color}
                fontFamily="monospace" fontSize="9" fontWeight="bold">{d.label}</text>
              {!isWithout && (
                <text x={fromLeft ? 50 : 390} y={d.y + 9} textAnchor="middle"
                  fill={d.color} fontFamily="monospace" fontSize="7">VLAN {d.vlan}</text>
              )}
            </g>
          );
        })}

        {/* Broadcast flood arrows when without VLANs */}
        {isWithout && ['⚡','⚡','⚡'].map((s, i) => (
          <text key={i} x={140 + i * 50} y={50} textAnchor="middle"
            fill="#ff5252" fontSize="14" opacity="0.7">⚡</text>
        ))}

        {/* VLAN separation line when with */}
        {!isWithout && (
          <line x1="210" y1="50" x2="210" y2="120"
            stroke="#7c4dff" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />
        )}
      </svg>
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
        {isWithout
          ? '⚠ All devices in one broadcast domain — HR traffic visible to Engineering, broadcasts flood everywhere'
          : '✓ VLAN 10 (Engineering) and VLAN 20 (HR) are logically isolated — broadcasts stay within their VLAN'}
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// VLANs — trunk link animation
// ────────────────────────────────────────────────────────────────
function VlanTrunkAnimation() {
  const [step, setStep] = useState(0);
  const [vlan, setVlan] = useState(10);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || step >= 5) return;
    const t = setTimeout(() => setStep(s => s + 1), 800);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  function reset(v) { setVlan(v); setStep(0); setIsPaused(false); }

  const color = vlan === 10 ? '#00e5ff' : '#00e676';
  const label = vlan === 10 ? 'VLAN 10' : 'VLAN 20';

  return (
    <InlineViz label="802.1Q TRUNK — TAGGED FRAMES BETWEEN SWITCHES" accent={color}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        {[10, 20].map(v => (
          <button key={v} onClick={() => reset(v)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: vlan === v ? `${v === 10 ? '#00e5ff' : '#00e676'}20` : 'var(--bg-elevated)',
            border: `1px solid ${vlan === v ? (v === 10 ? '#00e5ff' : '#00e676') : 'var(--border-subtle)'}`,
            color: vlan === v ? (v === 10 ? '#00e5ff' : '#00e676') : 'var(--text-muted)',
          }}>Send VLAN {v} frame</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={() => reset(vlan)}>↺</button>
        </div>
      </div>
      <svg viewBox="0 0 420 130" style={{ width: '100%', maxHeight: 130, display: 'block' }}>
        {/* SW1 */}
        <rect x="10" y="45" width="80" height="40" rx="5"
          fill={`${color}10`} stroke={color} strokeWidth="1.5" />
        <text x="50" y="63" textAnchor="middle" fill={color} fontFamily="monospace" fontSize="11" fontWeight="bold">SW1</text>
        <text x="50" y="77" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">Access port</text>

        {/* SW2 */}
        <rect x="330" y="45" width="80" height="40" rx="5"
          fill={`${color}10`} stroke={color} strokeWidth="1.5" />
        <text x="370" y="63" textAnchor="middle" fill={color} fontFamily="monospace" fontSize="11" fontWeight="bold">SW2</text>
        <text x="370" y="77" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">Access port</text>

        {/* Trunk link */}
        <line x1="90" y1="65" x2="330" y2="65"
          stroke={step >= 1 ? color : 'var(--border-subtle)'} strokeWidth="3"
          style={{ transition: 'stroke 0.4s' }} />
        <text x="210" y="55" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">Trunk (carries all VLANs)</text>

        {/* Frame travelling */}
        {step >= 1 && step < 5 && (
          <g>
            {/* Untagged frame leaving PC */}
            {step === 1 && (
              <rect x="95" y="58" width="40" height="14" rx="3"
                fill={`${color}20`} stroke={color} strokeWidth="1" />
            )}
            {/* Tagged frame on trunk */}
            {step >= 2 && step < 4 && (
              <g>
                <rect x={90 + (step - 2) * 80} y="56" width="60" height="18" rx="3"
                  fill={`${color}20`} stroke={color} strokeWidth="1" />
                <text x={90 + (step - 2) * 80 + 8} y="68"
                  fill={color} fontFamily="monospace" fontSize="7" fontWeight="bold">
                  {label} TAG
                </text>
              </g>
            )}
            {/* Frame at SW2 — tag stripped */}
            {step >= 4 && (
              <rect x="280" y="58" width="40" height="14" rx="3"
                fill={`${color}20`} stroke={color} strokeWidth="1" />
            )}
          </g>
        )}

        {/* PC icons */}
        <text x="50" y="115" textAnchor="middle" fill={color} fontSize="14">🖥</text>
        <text x="50" y="128" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">{label}</text>
        <text x="370" y="115" textAnchor="middle" fill={color} fontSize="14">🖥</text>
        <text x="370" y="128" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">{label}</text>
      </svg>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)', minHeight: 20 }}>
        {step === 0 && `PC sends untagged ${label} frame to SW1 access port`}
        {step === 1 && `SW1 recognises port belongs to ${label} — inserts 802.1Q tag`}
        {step === 2 && `Tagged frame travels across trunk link (both VLANs share this wire)`}
        {step === 3 && `SW2 reads the 802.1Q tag — knows this is ${label} traffic`}
        {step === 4 && `SW2 strips tag before delivering to access port`}
        {step >= 5 && `✓ Destination PC receives clean untagged frame — VLAN isolation preserved`}
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// OSPF — adjacency state machine walkthrough
// ────────────────────────────────────────────────────────────────
function OspfAdjacencyWalkthrough() {
  const [step, setStep] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);

  const states = [
    { name: 'Down',         color: '#78909c', desc: 'No OSPF hellos received. Interface configured but no neighbour seen yet.' },
    { name: 'Init',         color: '#ffab00', desc: 'Hello received from neighbour but our Router ID not yet in their hello. One-way contact.' },
    { name: '2-Way',        color: '#ff6d00', desc: 'Our Router ID appears in neighbour\'s hello. Bidirectional communication confirmed. DR/BDR election happens here.' },
    { name: 'ExStart',      color: '#f43f5e', desc: 'Master/slave relationship negotiated. Higher Router ID becomes master. DBD sequence numbers agreed.' },
    { name: 'Exchange',     color: '#e040fb', desc: 'Database Description (DBD) packets exchanged — each router describes its LSDB summary.' },
    { name: 'Loading',      color: '#7c4dff', desc: 'LSR/LSU/LSAck — routers request and receive LSAs they are missing to complete their LSDB.' },
    { name: 'Full',         color: '#00e676', desc: 'LSDBs are synchronised. Adjacency complete. SPF runs, routes installed. Hellos maintain the adjacency.' },
  ];

  useEffect(() => {
    if (isPaused || step >= states.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1000);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 300); }

  return (
    <InlineViz label="OSPF — ADJACENCY STATE MACHINE" accent="#00e676">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={replay}>↺</button>
      </div>
      <div style={{ display: 'flex', gap: 0, alignItems: 'center', overflowX: 'auto', paddingBottom: 4 }}>
        {states.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: step >= i ? 1 : 0.25, transition: 'opacity 0.5s', minWidth: 56,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: step >= i ? `${s.color}20` : 'var(--bg-elevated)',
                border: `2px solid ${step >= i ? s.color : 'var(--border-subtle)'}`,
                fontFamily: 'var(--font-mono)', fontSize: '0.5rem', fontWeight: 700,
                color: step >= i ? s.color : 'var(--text-muted)',
                textAlign: 'center', lineHeight: 1.2, padding: 4,
                boxShadow: step === i ? `0 0 14px ${s.color}50` : 'none',
                transition: 'all 0.5s',
              }}>{s.name}</div>
            </div>
            {i < states.length - 1 && (
              <div style={{
                width: 16, height: 2, flexShrink: 0,
                background: step > i ? states[i].color : 'var(--border-subtle)',
                transition: 'background 0.4s',
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
      {step >= 0 && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 6,
          background: `${states[step].color}10`,
          border: `1px solid ${states[step].color}40`,
          fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          transition: 'all 0.3s',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: states[step].color }}>
            {states[step].name}:
          </span>{' '}{states[step].desc}
        </div>
      )}
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// OSPF — SPF tree calculation visual
// ────────────────────────────────────────────────────────────────
function OspfSpfTree() {
  const [step, setStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const routers = [
    { id: 'R1', x: 60,  y: 80,  root: true,  color: '#00e676' },
    { id: 'R2', x: 160, y: 40,  root: false, color: '#00e5ff' },
    { id: 'R3', x: 160, y: 120, root: false, color: '#7c4dff' },
    { id: 'R4', x: 260, y: 40,  root: false, color: '#ffab00' },
    { id: 'R5', x: 260, y: 120, root: false, color: '#f43f5e' },
  ];
  const links = [
    { a: 0, b: 1, cost: 10, atStep: 1 },
    { a: 0, b: 2, cost: 20, atStep: 2 },
    { a: 1, b: 3, cost: 10, atStep: 3 },
    { a: 2, b: 4, cost: 10, atStep: 4 },
    { a: 1, b: 4, cost: 30, atStep: 5 }, // longer path — not chosen
  ];

  useEffect(() => {
    if (isPaused || step >= links.length) return;
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  return (
    <InlineViz label="OSPF — SHORTEST PATH FIRST (DIJKSTRA)" accent="#00e676">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 320 160" style={{ width: 320, maxHeight: 160, flexShrink: 0 }}>
          {links.map((l, i) => {
            const a = routers[l.a], b = routers[l.b];
            const chosen = l.atStep <= step;
            const isAlt = i === 4; // the longer path
            return (
              <g key={i}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={chosen ? (isAlt && step > 4 ? '#ff5252' : a.color) : 'var(--border-subtle)'}
                  strokeWidth={chosen ? 2 : 1}
                  strokeDasharray={isAlt ? '4,3' : 'none'}
                  opacity={isAlt && step > 4 ? 0.5 : 1}
                  style={{ transition: 'all 0.4s' }} />
                {chosen && (
                  <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4}
                    textAnchor="middle" fill={isAlt ? '#ff5252' : 'var(--text-muted)'}
                    fontFamily="monospace" fontSize="9">
                    {isAlt ? '×' : ''} cost {l.cost}
                  </text>
                )}
              </g>
            );
          })}
          {routers.map((r, i) => (
            <g key={i}>
              <circle cx={r.x} cy={r.y} r={18}
                fill={`${r.color}15`} stroke={r.color} strokeWidth={r.root ? 2.5 : 1.5} />
              <text x={r.x} y={r.y + 4} textAnchor="middle"
                fill={r.color} fontFamily="monospace" fontSize="11" fontWeight="bold">{r.id}</text>
              {r.root && <text x={r.x} y={r.y + 16} textAnchor="middle" fill={r.color} fontFamily="monospace" fontSize="7">ROOT</text>}
            </g>
          ))}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            {step === 0 && 'R1 is the SPF root. It knows about all LSAs in the LSDB.'}
            {step === 1 && 'Shortest path to R2: cost 10 via direct link.'}
            {step === 2 && 'Shortest path to R3: cost 20 via direct link.'}
            {step === 3 && 'R4 reached via R2: total cost 10 + 10 = 20.'}
            {step === 4 && 'R5 reached via R3: total cost 20 + 10 = 30.'}
            {step >= 5 && '✗ Alternative R1→R2→R5 costs 10+30=40 — longer path discarded. Dijkstra always finds the lowest-cost tree.'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Inline diagram registry
// Each entry: { afterSection: 'heading text to inject AFTER', component }
// ────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────
// Cisco Three-Tier Hierarchical Model
// ────────────────────────────────────────────────────────────────
function ThreeTierModel() {
  const [hovered, setHovered] = React.useState(null);
  const tiers = [
    {
      name: 'Core Layer',
      color: '#f43f5e',
      devices: ['Core Switch A', 'Core Switch B'],
      icon: '⬡',
      purpose: 'High-speed backbone — forwards packets as fast as possible. No policy, no filtering. Redundant high-capacity switches (e.g. Catalyst 9500). Connects distribution blocks.',
      keywords: ['High speed', 'Redundancy', 'No policy enforcement', 'L3 switching'],
    },
    {
      name: 'Distribution Layer',
      color: '#7c4dff',
      devices: ['Dist-SW1', 'Dist-SW2'],
      icon: '⬡',
      purpose: 'Policy boundary — routing between VLANs, QoS marking, ACL enforcement, summarisation of routes toward core. Aggregates access layer uplinks.',
      keywords: ['Inter-VLAN routing', 'ACLs & QoS', 'Route summarisation', 'Redundant uplinks'],
    },
    {
      name: 'Access Layer',
      color: '#00e5ff',
      devices: ['Acc-SW1', 'Acc-SW2', 'Acc-SW3', 'Acc-SW4'],
      icon: '⊞',
      purpose: 'End-device connectivity — where PCs, IP phones, APs and printers plug in. Port security, VLAN assignment, PoE, STP PortFast/BPDU Guard all configured here.',
      keywords: ['End-device ports', 'VLAN assignment', 'PortFast / BPDU Guard', 'PoE'],
    },
  ];
  return (
    <InlineViz label="CISCO THREE-TIER HIERARCHICAL MODEL" accent="#7c4dff">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {tiers.map((tier, ti) => (
          <div key={ti}>
            {/* Tier row */}
            <div
              onMouseEnter={() => setHovered(ti)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                background: hovered === ti ? `${tier.color}12` : `${tier.color}06`,
                border: `1px solid ${hovered === ti ? tier.color : tier.color + '25'}`,
                borderRadius: ti === 0 ? '6px 6px 0 0' : ti === tiers.length-1 ? '0 0 6px 6px' : 0,
                cursor: 'default', transition: 'all 0.2s',
                borderBottom: ti < tiers.length - 1 ? `1px solid ${tier.color}20` : undefined,
              }}>
              {/* Label */}
              <div style={{ width: 130, flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: tier.color }}>{tier.name}</div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  {tier.keywords.slice(0,2).map((k,i) => (
                    <span key={i} style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)', color: tier.color, background: `${tier.color}15`, padding: '1px 5px', borderRadius: 3 }}>{k}</span>
                  ))}
                </div>
              </div>
              {/* Devices */}
              <div style={{ display: 'flex', gap: 8, flex: 1, justifyContent: 'center' }}>
                {tier.devices.map((d, di) => (
                  <div key={di} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}>
                    <div style={{
                      width: 44, height: 36, borderRadius: 6, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      background: `${tier.color}15`, border: `1.5px solid ${tier.color}`,
                      fontFamily: 'var(--font-mono)', fontSize: '0.875rem', color: tier.color,
                      fontWeight: 700,
                    }}>{tier.icon}</div>
                    <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{d}</div>
                  </div>
                ))}
              </div>
              {/* Description on hover */}
              <div style={{ flex: 2, fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5, opacity: hovered === ti ? 1 : 0, transition: 'opacity 0.2s', minWidth: 0 }}>
                {tier.purpose}
              </div>
            </div>
            {/* Uplink lines between tiers */}
            {ti < tiers.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 40, padding: '3px 0', background: 'transparent' }}>
                {[0,1].map(i => (
                  <div key={i} style={{ width: 2, height: 12, background: `${tiers[ti].color}50` }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Hover a tier to see its role · Traffic flows access → distribution → core → distribution → access
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Two-Tier (Collapsed Core) Model
// ────────────────────────────────────────────────────────────────
function TwoTierModel() {
  return (
    <InlineViz label="TWO-TIER (COLLAPSED CORE) vs THREE-TIER" accent="#ffab00">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Three-tier mini */}
        <div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#7c4dff', marginBottom: 8 }}>THREE-TIER</div>
          {['Core','Distribution','Access'].map((l, i) => {
            const colors = ['#f43f5e','#7c4dff','#00e5ff'];
            return (
              <div key={i} style={{
                padding: '6px 10px', marginBottom: 3, textAlign: 'center',
                background: `${colors[i]}10`, border: `1px solid ${colors[i]}40`,
                borderRadius: 5, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                color: colors[i], fontWeight: 600,
              }}>{l}</div>
            );
          })}
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 6 }}>
            3 separate physical layers. Best for large campus (&gt;500 users). Supports modular growth.
          </div>
        </div>
        {/* Two-tier mini */}
        <div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: '#ffab00', marginBottom: 8 }}>TWO-TIER (COLLAPSED CORE)</div>
          {['Distribution/Core (merged)','Access'].map((l, i) => {
            const colors = ['#ffab00','#00e5ff'];
            return (
              <div key={i} style={{
                padding: '6px 10px', marginBottom: 3, textAlign: 'center',
                background: `${colors[i]}10`, border: `1px solid ${colors[i]}40`,
                borderRadius: 5, fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                color: colors[i], fontWeight: 600,
              }}>{l}</div>
            );
          })}
          <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Core + Distribution collapsed into one layer. Fewer devices, lower cost. Ideal for small/medium sites (&lt;500 users).
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Hub — broadcast flood animation
// ────────────────────────────────────────────────────────────────
function HubFloodAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  useEffect(() => {
    if (isPaused || step >= 3) return;
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  const ports = [
    { label: 'PC-A', sub: 'Source', x: 40,  y: 80,  isSource: true  },
    { label: 'PC-B', sub: 'Port 2', x: 270, y: 30,  isSource: false },
    { label: 'PC-C', sub: 'Port 3', x: 270, y: 80,  isSource: false },
    { label: 'PC-D', sub: 'Port 4', x: 270, y: 130, isSource: false },
  ];
  return (
    <InlineViz label="HUB — EVERY FRAME FLOODED TO ALL PORTS (L1)" accent="#78909c">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 320 160" style={{ width: 300, maxHeight: 160, flexShrink: 0 }}>
          {/* Hub */}
          <rect x="120" y="60" width="70" height="40" rx="5"
            fill="rgba(120,144,156,0.12)" stroke="#78909c" strokeWidth="1.5"/>
          <text x="155" y="78" textAnchor="middle" fill="#78909c" fontFamily="monospace" fontSize="11" fontWeight="bold">HUB</text>
          <text x="155" y="91" textAnchor="middle" fill="#546e7a" fontFamily="monospace" fontSize="8">Layer 1 only</text>
          {/* Links + packets */}
          {ports.map((p, i) => {
            const active = p.isSource ? step >= 1 : step >= 2;
            const color = p.isSource ? '#ffab00' : '#ff5252';
            const x2 = p.isSource ? 120 : 190;
            return (
              <g key={i}>
                <line x1={p.isSource ? 80 : 270} y1={p.y}
                  x2={x2} y2={80}
                  stroke={active ? color : 'var(--border-subtle)'}
                  strokeWidth={active ? 2 : 1}
                  style={{ transition: 'stroke 0.4s' }}/>
                {active && step >= 2 && !p.isSource && (
                  <circle cx={p.isSource ? 80 : 270} cy={p.y} r="5" fill={color} opacity="0.8">
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
                  </circle>
                )}
                <rect x={p.isSource ? 5 : 275} y={p.y - 12} width={65} height={24} rx="4"
                  fill={active ? `${color}12` : 'var(--bg-elevated)'}
                  stroke={active ? color : 'var(--border-subtle)'} strokeWidth="1"
                  style={{ transition: 'all 0.4s' }}/>
                <text x={p.isSource ? 37 : 307} y={p.y - 2} textAnchor="middle"
                  fill={active ? color : 'var(--text-muted)'}
                  fontFamily="monospace" fontSize="9" fontWeight="bold">{p.label}</text>
                <text x={p.isSource ? 37 : 307} y={p.y + 8} textAnchor="middle"
                  fill="var(--text-muted)" fontFamily="monospace" fontSize="7">{p.sub}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            {step === 0 && 'Hub has no intelligence — it cannot read MAC addresses.'}
            {step === 1 && 'PC-A transmits a frame onto the hub.'}
            {step === 2 && '⚠ Hub repeats the signal out ALL ports simultaneously. PC-B, C, D all receive the frame.'}
            {step >= 3 && '⚠ Only the intended recipient keeps it; others discard — but bandwidth is wasted and collisions are possible.'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Switch — MAC table learning animation
// ────────────────────────────────────────────────────────────────
function SwitchMacLearning() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const events = [
    { text: 'PC-A sends a frame. Switch has empty MAC table — floods to all ports except source.', mac: null },
    { text: 'Switch learns: aa:bb:01 is on Port 1. MAC table updated.', mac: { addr: 'aa:bb:01', port: 'Gi0/1' } },
    { text: 'PC-B replies. Switch learns aa:bb:02 → Port 2.', mac: { addr: 'aa:bb:02', port: 'Gi0/2' } },
    { text: 'PC-A sends again to PC-B. Switch looks up aa:bb:02 → forwards only to Port 2. ✓ Unicast forwarding.', mac: null },
  ];
  const macTable = [
    { addr: 'aa:bb:01', port: 'Gi0/1', visible: step >= 1 },
    { addr: 'aa:bb:02', port: 'Gi0/2', visible: step >= 2 },
  ];
  useEffect(() => {
    if (isPaused || step >= events.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="SWITCH — MAC ADDRESS TABLE LEARNING (L2)" accent="#00e5ff">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: diagram */}
        <div>
          <svg viewBox="0 0 240 140" style={{ width: '100%', maxHeight: 140 }}>
            <rect x="85" y="55" width="70" height="30" rx="4"
              fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1.5"/>
            <text x="120" y="70" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="10" fontWeight="bold">SWITCH</text>
            <text x="120" y="80" textAnchor="middle" fill="#546e7a" fontFamily="monospace" fontSize="7">MAC table</text>
            {[
              { x: 30, y: 70, label: 'PC-A', port: 'Gi0/1', color: '#ffab00', active: step >= 0 },
              { x: 210, y: 40, label: 'PC-B', port: 'Gi0/2', color: '#00e676', active: step >= 1 },
              { x: 210, y: 100, label: 'PC-C', port: 'Gi0/3', color: '#7c4dff', active: step === 0 },
            ].map((p, i) => (
              <g key={i}>
                <line x1={i === 0 ? 68 : 155} y1={p.y} x2={i === 0 ? 85 : 155} y2={70}
                  stroke={p.active ? p.color : 'var(--border-subtle)'}
                  strokeWidth={p.active ? 2 : 1} style={{ transition: 'stroke 0.4s' }}/>
                <rect x={i === 0 ? 5 : 175} y={p.y - 10} width={55} height={20} rx="3"
                  fill={p.active ? `${p.color}12` : 'var(--bg-elevated)'}
                  stroke={p.active ? p.color : 'var(--border-subtle)'} strokeWidth="1"/>
                <text x={i === 0 ? 32 : 202} y={p.y + 4} textAnchor="middle"
                  fill={p.active ? p.color : 'var(--text-muted)'}
                  fontFamily="monospace" fontSize="9" fontWeight="bold">{p.label}</text>
              </g>
            ))}
          </svg>
        </div>
        {/* Right: MAC table + explanation */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)', marginBottom: 6 }}>MAC ADDRESS TABLE</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', marginBottom: 10 }}>
            <thead>
              <tr>
                {['MAC Address','Port'].map(h => (
                  <th key={h} style={{ textAlign: 'left', color: 'var(--text-muted)', padding: '2px 6px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.5875rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {macTable.map((r, i) => r.visible && (
                <tr key={i}>
                  <td style={{ padding: '3px 6px', color: '#00e5ff' }}>{r.addr}</td>
                  <td style={{ padding: '3px 6px', color: '#ffab00' }}>{r.port}</td>
                </tr>
              ))}
              {macTable.every(r => !r.visible) && (
                <tr><td colSpan={2} style={{ padding: '3px 6px', color: 'var(--text-muted)', fontStyle: 'italic' }}>(empty)</td></tr>
              )}
            </tbody>
          </table>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
            {events[step]?.text}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Router — packet forwarding across subnets
// ────────────────────────────────────────────────────────────────
function RouterForwardingAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  useEffect(() => {
    if (isPaused || step >= 5) return;
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="ROUTER — PACKET FORWARDING ACROSS SUBNETS (L3)" accent="#2979ff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 380 120" style={{ width: 360, maxHeight: 120, flexShrink: 0 }}>
          {/* Subnet A */}
          <rect x="5" y="30" width="80" height="60" rx="5"
            fill="rgba(0,229,255,0.06)" stroke="rgba(0,229,255,0.3)" strokeWidth="1"/>
          <text x="45" y="47" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="8">10.0.1.0/24</text>
          <rect x="15" y="55" width="60" height="24" rx="3" fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1"/>
          <text x="45" y="65" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="8" fontWeight="bold">PC-A</text>
          <text x="45" y="74" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">10.0.1.10</text>
          {/* Arrow A→R */}
          <line x1="85" y1="67" x2="150" y2="67"
            stroke={step >= 1 ? '#00e5ff' : 'var(--border-subtle)'}
            strokeWidth="2" style={{ transition: 'stroke 0.4s' }}/>
          {step >= 1 && step < 3 && (
            <circle cx={110 + (step-1)*20} cy={67} r="6" fill="#00e5ff" opacity="0.9"/>
          )}
          {/* Router */}
          <circle cx="185" cy="67" r="28"
            fill={step >= 2 ? 'rgba(41,121,255,0.15)' : 'rgba(41,121,255,0.06)'}
            stroke="#2979ff" strokeWidth="1.5" style={{ transition: 'all 0.4s' }}/>
          <text x="185" y="63" textAnchor="middle" fill="#2979ff" fontFamily="monospace" fontSize="10" fontWeight="bold">R1</text>
          <text x="185" y="74" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">TTL--</text>
          {step >= 2 && (
            <text x="185" y="85" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="7">Routing...</text>
          )}
          {/* Arrow R→B */}
          <line x1="213" y1="67" x2="280" y2="67"
            stroke={step >= 3 ? '#00e676' : 'var(--border-subtle)'}
            strokeWidth="2" style={{ transition: 'stroke 0.4s' }}/>
          {step >= 3 && step < 5 && (
            <circle cx={230 + (step-3)*30} cy={67} r="6" fill="#00e676" opacity="0.9"/>
          )}
          {/* Subnet B */}
          <rect x="290" y="30" width="80" height="60" rx="5"
            fill="rgba(0,230,118,0.06)" stroke="rgba(0,230,118,0.3)" strokeWidth="1"/>
          <text x="330" y="47" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="8">10.0.2.0/24</text>
          <rect x="300" y="55" width="60" height="24" rx="3" fill="rgba(0,230,118,0.1)" stroke="#00e676" strokeWidth="1"/>
          <text x="330" y="65" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="8" fontWeight="bold">PC-B</text>
          <text x="330" y="74" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">10.0.2.20</text>
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            {step === 0 && 'Two subnets on different IP networks — a switch cannot bridge them.'}
            {step === 1 && 'PC-A sends packet to its default gateway (R1 Gi0/0: 10.0.1.1).'}
            {step === 2 && 'Router receives packet. Looks up 10.0.2.20 in routing table. Decrements TTL.'}
            {step === 3 && 'Match found: 10.0.2.0/24 via Gi0/1. Router forwards packet.'}
            {step === 4 && 'Packet arrives on the 10.0.2.0/24 subnet.'}
            {step >= 5 && '✓ PC-B receives packet. Router enabled communication between two different subnets.'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Firewall — zone-based permit/deny
// ────────────────────────────────────────────────────────────────
function FirewallZoneAnim() {
  const [selected, setSelected] = React.useState(0);
  const scenarios = [
    { label: 'Permit outbound',  from: 'INSIDE', to: 'OUTSIDE', result: 'permit', color: '#00e676', desc: 'Established session from inside → outside. Stateful table created. Reply traffic auto-permitted.' },
    { label: 'Block inbound',    from: 'OUTSIDE', to: 'INSIDE', result: 'deny',   color: '#ff5252', desc: 'Unsolicited packet from outside. No matching session in state table. Firewall drops silently.' },
    { label: 'DMZ server',       from: 'OUTSIDE', to: 'DMZ',    result: 'permit', color: '#ffab00', desc: 'HTTP/443 to DMZ web server. Explicit rule permits. DMZ cannot initiate to INSIDE.' },
  ];
  const s = scenarios[selected];
  return (
    <InlineViz label="FIREWALL — ZONE-BASED STATEFUL INSPECTION (L3–L7)" accent="#ff6d00">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {scenarios.map((sc, i) => (
          <button key={i} onClick={() => setSelected(i)} style={{
            padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: selected === i ? `${sc.color}20` : 'var(--bg-elevated)',
            border: `1px solid ${selected === i ? sc.color : 'var(--border-subtle)'}`,
            color: selected === i ? sc.color : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>{sc.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 340 120" style={{ width: 320, maxHeight: 120, flexShrink: 0 }}>
          {/* Zones */}
          {[
            { label: 'OUTSIDE', x: 5,   color: '#ff5252' },
            { label: 'DMZ',     x: 125, color: '#ffab00' },
            { label: 'INSIDE',  x: 245, color: '#00e676' },
          ].map((z, i) => (
            <g key={i}>
              <rect x={z.x} y="20" width="85" height="80" rx="5"
                fill={`${z.color}08`} stroke={`${z.color}30`} strokeWidth="1"/>
              <text x={z.x+42} y="36" textAnchor="middle" fill={z.color}
                fontFamily="monospace" fontSize="9" fontWeight="bold">{z.label}</text>
              <rect x={z.x+17} y="50" width="50" height="30" rx="3"
                fill={`${z.color}15`} stroke={z.color} strokeWidth="1"/>
              <text x={z.x+42} y="69" textAnchor="middle" fill={z.color}
                fontFamily="monospace" fontSize="8">
                {i === 0 ? 'Internet' : i === 1 ? 'Web Server' : 'Corp Host'}
              </text>
            </g>
          ))}
          {/* Firewall boxes between zones */}
          {[95, 215].map((x, i) => (
            <g key={i}>
              <rect x={x} y="45" width="24" height="30" rx="3"
                fill="rgba(255,109,0,0.2)" stroke="#ff6d00" strokeWidth="1.5"/>
              <text x={x+12} y="58" textAnchor="middle" fill="#ff6d00"
                fontFamily="monospace" fontSize="7" fontWeight="bold">FW</text>
              <text x={x+12} y="68" textAnchor="middle" fill="#ff6d00"
                fontFamily="monospace" fontSize="7">🔥</text>
            </g>
          ))}
          {/* Animated arrow */}
          {(() => {
            const fromX = s.from === 'OUTSIDE' ? 90 : s.from === 'DMZ' ? 210 : 335;
            const toX   = s.to === 'INSIDE'  ? 335 : s.to === 'DMZ'    ? 210 : 90;
            const dir   = fromX < toX ? 1 : -1;
            return (
              <g>
                <line x1={fromX} y1={65} x2={toX} y2={65}
                  stroke={s.color} strokeWidth="2" strokeDasharray="6,3"
                  markerEnd="url(#arrow)"/>
                <text x={(fromX+toX)/2} y={55} textAnchor="middle"
                  fill={s.color} fontFamily="monospace" fontSize="9" fontWeight="bold">
                  {s.result === 'permit' ? '✓ PERMIT' : '✗ DENY'}
                </text>
              </g>
            );
          })()}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Access Point — client association
// ────────────────────────────────────────────────────────────────
function ApAssociationAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const steps2 = [
    'AP broadcasts beacon frames — announces SSID "CorpWiFi" every 100ms.',
    'Client sends Probe Request for CorpWiFi.',
    'AP sends Probe Response with capabilities (channel, security, data rates).',
    'Client sends Authentication Request. AP responds with Authentication Response.',
    'Client sends Association Request (chosen rates, SSID). AP assigns AID.',
    '✓ Client associated. AP bridges client onto VLAN 10 (wired LAN). Client gets IP via DHCP.',
  ];
  useEffect(() => {
    if (isPaused || step >= steps2.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1000);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="ACCESS POINT — 802.11 CLIENT ASSOCIATION (L1–L2)" accent="#00e676">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 130" style={{ width: 260, maxHeight: 130, flexShrink: 0 }}>
          {/* AP */}
          <rect x="95" y="20" width="90" height="40" rx="5"
            fill="rgba(0,230,118,0.1)" stroke="#00e676" strokeWidth="1.5"/>
          <text x="140" y="37" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="10" fontWeight="bold">AP1</text>
          <text x="140" y="49" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">CorpWiFi · Ch6</text>
          {/* Radio waves from AP */}
          {[18,28,38].map((r,i) => (
            <circle key={i} cx="140" cy="40" r={r}
              fill="none" stroke="#00e676" strokeWidth="0.8"
              opacity={step >= 1 ? 0.3 + i*0.1 : 0.1}
              style={{ transition: 'opacity 0.4s' }}/>
          ))}
          {/* Client */}
          <rect x="10" y="85" width="65" height="30" rx="4"
            fill={step >= 2 ? 'rgba(0,230,118,0.12)' : 'var(--bg-elevated)'}
            stroke={step >= 2 ? '#00e676' : 'var(--border-subtle)'} strokeWidth="1"
            style={{ transition: 'all 0.4s' }}/>
          <text x="42" y="99" textAnchor="middle" fill={step >= 2 ? '#00e676' : 'var(--text-muted)'}
            fontFamily="monospace" fontSize="9" fontWeight="bold">Laptop</text>
          <text x="42" y="109" textAnchor="middle" fill="var(--text-muted)"
            fontFamily="monospace" fontSize="7">{step >= 5 ? '10.0.10.55/24' : 'searching...'}</text>
          {/* Connection line */}
          {step >= 4 && (
            <line x1="75" y1="100" x2="115" y2="60"
              stroke="#00e676" strokeWidth="2" strokeDasharray="4,2"/>
          )}
          {/* Uplink to switch */}
          <rect x="200" y="60" width="70" height="30" rx="4"
            fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1"/>
          <text x="235" y="75" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="9" fontWeight="bold">SW1</text>
          <text x="235" y="85" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">VLAN 10</text>
          <line x1="185" y1="40" x2="200" y2="75"
            stroke={step >= 5 ? '#00e5ff' : 'rgba(0,229,255,0.2)'}
            strokeWidth="2" style={{ transition: 'stroke 0.5s' }}/>
          {/* Step labels */}
          {step >= 1 && step < 5 && (
            <text x="140" y="120" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="8">
              {['','Probe','Auth req','Auth resp','Assoc'][Math.min(step,4)]}
            </text>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            {steps2[step]}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// VLAN Database — switch VLAN table visualiser
// ────────────────────────────────────────────────────────────────
function VlanDatabaseViz() {
  const [selected, setSelected] = React.useState(null);
  const vlans = [
    { id: 1,   name: 'default',     ports: ['Gi0/1','Gi0/2','Gi0/3','Gi0/4'], color: '#78909c', note: 'All ports start here. Cannot delete VLAN 1.' },
    { id: 10,  name: 'Engineering', ports: ['Gi0/5','Gi0/6','Gi0/7'],          color: '#00e5ff', note: 'Engineering dept. Subnet 10.0.10.0/24.' },
    { id: 20,  name: 'Sales',       ports: ['Gi0/8','Gi0/9'],                  color: '#00e676', note: 'Sales dept. Subnet 10.0.20.0/24.' },
    { id: 30,  name: 'Management',  ports: ['Gi0/10'],                         color: '#ffab00', note: 'OOB management. Subnet 10.0.99.0/24.' },
    { id: 40,  name: 'Voice',       ports: ['Gi0/5','Gi0/6','Gi0/7'],          color: '#e040fb', note: 'IP phones. Auxiliary VLAN on same ports as Eng.' },
    { id: 100, name: 'Trunk',       ports: ['Gi0/24 (trunk)'],                 color: '#f43f5e', note: 'Trunk port carries all VLANs to distribution switch.' },
  ];
  return (
    <InlineViz label="VLAN DATABASE — show vlan brief" accent="#7c4dff">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Table */}
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
            <thead>
              <tr>
                {['VLAN','Name','Status','Ports'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '3px 8px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.5875rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vlans.map((v) => (
                <tr key={v.id}
                  onClick={() => setSelected(selected === v.id ? null : v.id)}
                  style={{
                    cursor: 'pointer',
                    background: selected === v.id ? `${v.color}15` : 'transparent',
                    transition: 'background 0.2s',
                  }}>
                  <td style={{ padding: '4px 8px', color: v.color, fontWeight: 700 }}>{v.id}</td>
                  <td style={{ padding: '4px 8px', color: selected === v.id ? v.color : 'var(--text-primary)' }}>{v.name}</td>
                  <td style={{ padding: '4px 8px', color: '#00e676' }}>active</td>
                  <td style={{ padding: '4px 8px', color: 'var(--text-muted)', fontSize: '0.5875rem' }}>{v.ports.slice(0,2).join(', ')}{v.ports.length > 2 ? '…' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Detail panel */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {selected ? (
            (() => {
              const v = vlans.find(x => x.id === selected);
              return (
                <div style={{ padding: '12px 14px', borderRadius: 6, background: `${v.color}10`, border: `1px solid ${v.color}40` }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: v.color, marginBottom: 6 }}>VLAN {v.id} — {v.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>{v.note}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                    Ports: {v.ports.join(', ')}
                  </div>
                </div>
              );
            })()
          ) : (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              Click a row to see VLAN details
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Stored in flash:/vlan.dat · Synchronised via VTP (if enabled)
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// Inter-VLAN Routing — Router-on-a-Stick animation
// ────────────────────────────────────────────────────────────────
function InterVlanRoutingAnim() {
  const [step, setStep] = React.useState(0);
  const [mode, setMode] = React.useState('roas'); // roas | svi
  const [isPaused, setIsPaused] = React.useState(false);
  useEffect(() => {
    if (isPaused || step >= 7) return;
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function reset(m) { setMode(m); setStep(0); setIsPaused(false); }
  const isRoas = mode === 'roas';
  return (
    <InlineViz label="INTER-VLAN ROUTING — TWO APPROACHES" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['roas','Router-on-a-Stick'],['svi','L3 Switch SVI']].map(([m, label]) => (
          <button key={m} onClick={() => reset(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? 'rgba(124,77,255,0.15)' : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? '#7c4dff' : 'var(--border-subtle)'}`,
            color: mode === m ? '#7c4dff' : 'var(--text-muted)',
          }}>{label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={() => reset(mode)}>↺</button>
        </div>
      </div>
      <svg viewBox="0 0 420 140" style={{ width: '100%', maxHeight: 140, display: 'block' }}>
        {/* PC-A VLAN 10 */}
        <rect x="5" y="20" width="65" height="30" rx="4"
          fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1"/>
        <text x="37" y="32" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="8" fontWeight="bold">PC-A</text>
        <text x="37" y="42" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="7">VLAN 10</text>
        {/* PC-B VLAN 20 */}
        <rect x="5" y="90" width="65" height="30" rx="4"
          fill="rgba(0,230,118,0.1)" stroke="#00e676" strokeWidth="1"/>
        <text x="37" y="102" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="8" fontWeight="bold">PC-B</text>
        <text x="37" y="112" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="7">VLAN 20</text>
        {/* Switch */}
        <rect x="100" y="55" width="70" height="30" rx="4"
          fill="rgba(124,77,255,0.1)" stroke="#7c4dff" strokeWidth="1.5"/>
        <text x="135" y="70" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="9" fontWeight="bold">SW1</text>
        <text x="135" y="80" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">{isRoas ? 'L2 Switch' : 'L3 Switch'}</text>
        {/* Links PC→SW */}
        <line x1="70" y1="35" x2="100" y2="70" stroke={step>=1 ? '#00e5ff':'var(--border-subtle)'} strokeWidth="1.5" style={{transition:'stroke 0.4s'}}/>
        <line x1="70" y1="105" x2="100" y2="70" stroke={step>=5 ? '#00e676':'var(--border-subtle)'} strokeWidth="1.5" style={{transition:'stroke 0.4s'}}/>
        {isRoas ? (
          <>
            {/* Router */}
            <circle cx="290" cy="70" r="28"
              fill={step>=2&&step<=5 ? 'rgba(255,171,0,0.15)' : 'rgba(255,171,0,0.06)'}
              stroke="#ffab00" strokeWidth="1.5" style={{transition:'all 0.4s'}}/>
            <text x="290" y="66" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="9" fontWeight="bold">R1</text>
            <text x="290" y="77" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">Gi0/0.10+.20</text>
            {/* Trunk SW→R */}
            <line x1="170" y1="70" x2="262" y2="70"
              stroke={step>=1 ? '#7c4dff':'var(--border-subtle)'} strokeWidth="2.5" style={{transition:'stroke 0.4s'}}/>
            <text x="216" y="62" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="7">Trunk</text>
            {/* Packet dot */}
            {step>=1 && step<=4 && (
              <circle cx={135+step*35} cy={70} r="7"
                fill={step<=2?'#00e5ff':'#00e676'} opacity="0.9"/>
            )}
          </>
        ) : (
          <>
            {/* SVI inside switch */}
            <rect x="185" y="50" width="80" height="40" rx="4"
              fill={step>=2 ? 'rgba(0,230,118,0.15)' : 'rgba(0,230,118,0.06)'}
              stroke="#00e676" strokeWidth="1.5" style={{transition:'all 0.4s'}}/>
            <text x="225" y="64" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="8" fontWeight="bold">SVI</text>
            <text x="225" y="74" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">Vlan10+Vlan20</text>
            <text x="225" y="83" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="7">Wire-speed</text>
            {/* Routing inside switch */}
            <line x1="170" y1="70" x2="185" y2="70"
              stroke={step>=1 ? '#7c4dff':'var(--border-subtle)'} strokeWidth="2" style={{transition:'stroke 0.4s'}}/>
            {step>=1 && step<=5 && (
              <circle cx={145+step*15} cy={70} r="7"
                fill={step<=2?'#00e5ff':'#00e676'} opacity="0.9"/>
            )}
          </>
        )}
      </svg>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.8125rem', color: 'var(--text-secondary)', minHeight: 20 }}>
        {step===0 && 'PC-A (VLAN 10) needs to reach PC-B (VLAN 20). Different subnets — needs L3 routing.'}
        {step===1 && 'PC-A sends packet to default gateway. Frame tagged VLAN 10 on trunk.'}
        {step===2 && (isRoas ? 'Router receives on sub-interface Gi0/0.10. Strips VLAN 10 tag.' : 'L3 Switch routes internally between SVI Vlan10 and SVI Vlan20. No external hop.')}
        {step===3 && (isRoas ? 'Router routes: dest is 10.0.20.0/24 → out Gi0/0.20. Tags frame VLAN 20.' : 'Packet switched at wire speed inside the ASIC.')}
        {step===4 && 'Tagged frame returned to switch on trunk. Switch sees VLAN 20 tag.'}
        {step===5 && 'Switch delivers frame to PC-B access port (VLAN 20). Tag stripped.'}
        {step>=6 && '✓ PC-B receives packet. Inter-VLAN routing complete.'}
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// OSPF DR/BDR Election animation
// ────────────────────────────────────────────────────────────────
function DrBdrElectionAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  useEffect(() => {
    if (isPaused || step >= 4) return;
    const t = setTimeout(() => setStep(s => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  const routers = [
    { id: 'R1', rid: '4.4.4.4', pri: 1, x: 210, y: 70,  role: step>=3 ? 'DR'  : '?', color: step>=3 ? '#00e676' : '#ffab00' },
    { id: 'R2', rid: '3.3.3.3', pri: 1, x: 140, y: 40,  role: step>=3 ? 'BDR' : '?', color: step>=3 ? '#7c4dff' : '#ffab00' },
    { id: 'R3', rid: '2.2.2.2', pri: 1, x: 70,  y: 70,  role: step>=3 ? 'DRother' : '?', color: step>=3 ? '#78909c' : '#ffab00' },
    { id: 'R4', rid: '1.1.1.1', pri: 0, x: 140, y: 110, role: step>=2 ? 'Excluded' : '?', color: step>=2 ? '#ff5252' : '#ffab00' },
  ];
  return (
    <InlineViz label="OSPF — DR/BDR ELECTION ON MULTI-ACCESS NETWORK" accent="#00e676">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 150" style={{ width: 260, maxHeight: 150, flexShrink: 0 }}>
          {/* Ethernet segment */}
          <rect x="50" y="65" width="180" height="10" rx="3"
            fill="rgba(255,171,0,0.1)" stroke="#ffab00" strokeWidth="1"
            opacity={step>=1?1:0.2} style={{transition:'opacity 0.4s'}}/>
          <text x="140" y="88" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="7">Ethernet segment 192.168.1.0/24</text>
          {routers.map((r, i) => (
            <g key={i}>
              <line x1={r.x} y1={r.y > 70 ? r.y : r.y + 18} x2={r.x} y2={70}
                stroke={step>=1 ? r.color : 'var(--border-subtle)'}
                strokeWidth="1.5" style={{transition:'stroke 0.4s'}}/>
              <circle cx={r.x} cy={r.y} r={16}
                fill={`${r.color}18`} stroke={r.color}
                strokeWidth={r.role==='DR'||r.role==='BDR' ? 2.5 : 1.5}
                style={{transition:'all 0.4s'}}/>
              <text x={r.x} y={r.y-2} textAnchor="middle" fill={r.color}
                fontFamily="monospace" fontSize="9" fontWeight="bold">{r.id}</text>
              <text x={r.x} y={r.y+8} textAnchor="middle" fill={r.color}
                fontFamily="monospace" fontSize="6">{r.rid}</text>
              {step>=3 && (
                <text x={r.x} y={r.y+22} textAnchor="middle" fill={r.color}
                  fontFamily="monospace" fontSize="8" fontWeight="bold">{r.role}</text>
              )}
              {step>=2 && r.pri===0 && (
                <text x={r.x} y={r.y-20} textAnchor="middle" fill="#ff5252"
                  fontFamily="monospace" fontSize="8">pri=0</text>
              )}
            </g>
          ))}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            {step===0 && 'Four routers on the same Ethernet segment. All discover each other via Hello packets.'}
            {step===1 && 'Hellos exchanged. Each router shares its Router ID and priority.'}
            {step===2 && 'R4 has priority 0 — excluded from DR/BDR election. Priority 0 means "never become DR".'}
            {step===3 && 'DR elected: R1 (highest Router ID 4.4.4.4). BDR: R2 (3.3.3.3). R3 is DROther.'}
            {step>=4 && '✓ DROther routers form Full adjacency only with DR and BDR — not with each other. Reduces LSA flooding from O(n²) to O(n).'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ────────────────────────────────────────────────────────────────
// OSPF LSA flooding animation
// ────────────────────────────────────────────────────────────────
function LsaFloodingAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const nodes = [
    { id: 'R1', x: 140, y: 40, color: '#00e676', root: true },
    { id: 'R2', x: 60,  y: 90, color: '#00e5ff' },
    { id: 'R3', x: 220, y: 90, color: '#7c4dff' },
    { id: 'R4', x: 60,  y: 150, color: '#ffab00' },
    { id: 'R5', x: 220, y: 150, color: '#f43f5e' },
  ];
  const links = [
    { a: 0, b: 1, step: 1 }, { a: 0, b: 2, step: 1 },
    { a: 1, b: 3, step: 2 }, { a: 2, b: 4, step: 2 },
    { a: 1, b: 2, step: 3 }, { a: 3, b: 4, step: 3 },
  ];
  const reached = new Set(links.filter(l => l.step <= step).flatMap(l => [l.a, l.b]));
  if (step >= 1) reached.add(0);
  useEffect(() => {
    if (isPaused || step >= 4) return;
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="OSPF — LSA FLOODING (TYPE 1 ROUTER LSA)" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 190" style={{ width: 260, maxHeight: 190, flexShrink: 0 }}>
          {links.map((l, i) => {
            const a = nodes[l.a], b = nodes[l.b];
            const active = l.step <= step;
            return (
              <g key={i}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={active ? a.color : 'var(--border-subtle)'}
                  strokeWidth={active ? 2 : 1}
                  style={{ transition: 'stroke 0.4s' }}/>
                {active && step === l.step && (
                  <circle r="6" fill={a.color} opacity="0.8">
                    <animateMotion dur="0.5s" repeatCount="1"
                      path={`M${a.x},${a.y} L${b.x},${b.y}`}/>
                  </circle>
                )}
              </g>
            );
          })}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={n.root ? 20 : 16}
                fill={reached.has(i) ? `${n.color}20` : 'var(--bg-elevated)'}
                stroke={reached.has(i) ? n.color : 'var(--border-subtle)'}
                strokeWidth={n.root ? 2.5 : 1.5}
                style={{ transition: 'all 0.4s' }}/>
              <text x={n.x} y={n.y+4} textAnchor="middle"
                fill={reached.has(i) ? n.color : 'var(--text-muted)'}
                fontFamily="monospace" fontSize="10" fontWeight="bold">{n.id}</text>
              {reached.has(i) && step>=2 && (
                <text x={n.x} y={n.y+26} textAnchor="middle"
                  fill={n.color} fontFamily="monospace" fontSize="7">LSA rcvd ✓</text>
              )}
            </g>
          ))}
          {step>=1 && (
            <text x="140" y="185" textAnchor="middle" fill="#00e676"
              fontFamily="monospace" fontSize="8">LSA originated by R1</text>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            {step===0 && 'R1 detects a link-state change (interface comes up). Generates a Router LSA.'}
            {step===1 && 'R1 floods Type 1 LSA to all OSPF neighbours (R2, R3).'}
            {step===2 && 'R2 and R3 install LSA in their LSDB, then re-flood to their neighbours (R4, R5).'}
            {step===3 && 'LSA propagates across all remaining links. Each router sends LSAck to confirm receipt.'}
            {step>=4 && '✓ All routers have identical LSDBs. Each runs SPF independently to find shortest paths.'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// SUBNETTING INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── IPv4 Address Structure — bit breakdown ─────────────────
function SubnetBitBreakdown() {
  const [cidr, setCidr] = React.useState(26);
  const options = [24, 25, 26, 27, 28, 29, 30];
  const hostBits = 32 - cidr;
  const netBits  = cidr;
  const subnets  = Math.pow(2, cidr - 24);
  const hosts    = Math.pow(2, hostBits) - 2;
  const block    = Math.pow(2, hostBits);
  // Show last octet bits
  const lastOctetNetBits = Math.max(0, cidr - 24);
  const lastOctetHostBits = 8 - lastOctetNetBits;
  const maskLastOctet = 256 - block;
  return (
    <InlineViz label="IPv4 ADDRESS STRUCTURE — NETWORK vs HOST BITS" accent="#f43f5e">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {options.map(c => (
          <button key={c} onClick={() => setCidr(c)} style={{
            padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: cidr === c ? 'rgba(244,63,94,0.15)' : 'var(--bg-elevated)',
            border: `1px solid ${cidr === c ? '#f43f5e' : 'var(--border-subtle)'}`,
            color: cidr === c ? '#f43f5e' : 'var(--text-muted)',
          }}>/{c}</button>
        ))}
      </div>
      {/* 32-bit visual */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4, textAlign: 'center' }}>
          32-BIT ADDRESS (showing last two octets)
        </div>
        <div style={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
          {/* First 24 bits = 3 octets collapsed */}
          <div style={{
            padding: '5px 12px', borderRadius: 4, background: 'rgba(0,229,255,0.08)',
            border: '1px solid rgba(0,229,255,0.3)', fontFamily: 'var(--font-mono)',
            fontSize: '0.6875rem', color: '#00e5ff',
          }}>192.168.1 (24 fixed bits)</div>
          <div style={{ display: 'flex', gap: 1 }}>
            {Array.from({length: 8}, (_, i) => {
              const isNet = i < lastOctetNetBits;
              return (
                <div key={i} style={{
                  width: 22, height: 32, borderRadius: 3, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: isNet ? 'rgba(244,63,94,0.2)' : 'rgba(255,171,0,0.15)',
                  border: `1px solid ${isNet ? '#f43f5e' : '#ffab00'}`,
                  fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 700,
                  color: isNet ? '#f43f5e' : '#ffab00',
                  transition: 'all 0.3s',
                }}>{isNet ? 'N' : 'H'}</div>
              );
            })}
          </div>
        </div>
        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
            <div style={{ width: 12, height: 12, background: 'rgba(244,63,94,0.2)', border: '1px solid #f43f5e', borderRadius: 2 }} />
            Network ({netBits} bits)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.6875rem', color: '#ffab00', fontFamily: 'var(--font-mono)' }}>
            <div style={{ width: 12, height: 12, background: 'rgba(255,171,0,0.15)', border: '1px solid #ffab00', borderRadius: 2 }} />
            Host ({hostBits} bits)
          </div>
        </div>
      </div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'CIDR',       value: `/${cidr}`,        color: '#f43f5e' },
          { label: 'Mask',       value: `255.255.255.${maskLastOctet}`, color: '#00e5ff' },
          { label: 'Block size', value: block,              color: '#7c4dff' },
          { label: 'Usable hosts', value: hosts,            color: '#00e676' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: 6, background: `${s.color}10`, border: `1px solid ${s.color}30`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.875rem', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ── Subnetting Reference Table — interactive ───────────────
function SubnetReferenceTable() {
  const [selected, setSelected] = React.useState(null);
  const rows = [
    { cidr: 24, mask: '255.255.255.0',   subnets: 1,  hosts: 254, block: 256, example: '10.0.0.0/24' },
    { cidr: 25, mask: '255.255.255.128', subnets: 2,  hosts: 126, block: 128, example: '10.0.0.0/25, 10.0.0.128/25' },
    { cidr: 26, mask: '255.255.255.192', subnets: 4,  hosts: 62,  block: 64,  example: '10.0.0.0, .64, .128, .192' },
    { cidr: 27, mask: '255.255.255.224', subnets: 8,  hosts: 30,  block: 32,  example: '10.0.0.0, .32, .64, .96…' },
    { cidr: 28, mask: '255.255.255.240', subnets: 16, hosts: 14,  block: 16,  example: '10.0.0.0, .16, .32, .48…' },
    { cidr: 29, mask: '255.255.255.248', subnets: 32, hosts: 6,   block: 8,   example: '10.0.0.0, .8, .16, .24…' },
    { cidr: 30, mask: '255.255.255.252', subnets: 64, hosts: 2,   block: 4,   example: 'Point-to-point WAN links' },
  ];
  const colors = ['#6366f1','#8b5cf6','#a855f7','#ec4899','#f43f5e','#f97316','#eab308'];
  return (
    <InlineViz label="CLASS C SUBNETTING REFERENCE — CLICK A ROW" accent="#7c4dff">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              {['CIDR','Subnet Mask','Subnets','Hosts/Subnet','Block Size','Starts at'].map(h => (
                <th key={h} style={{ padding: '5px 10px', textAlign: 'left', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.5875rem', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <React.Fragment key={r.cidr}>
                <tr onClick={() => setSelected(selected === r.cidr ? null : r.cidr)}
                  style={{ cursor: 'pointer', background: selected === r.cidr ? `${colors[i]}15` : 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ padding: '6px 10px', color: colors[i], fontWeight: 700 }}>/{r.cidr}</td>
                  <td style={{ padding: '6px 10px', color: selected === r.cidr ? colors[i] : 'var(--text-primary)' }}>{r.mask}</td>
                  <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.subnets}</td>
                  <td style={{ padding: '6px 10px', color: '#00e676', fontWeight: selected === r.cidr ? 700 : 400 }}>{r.hosts}</td>
                  <td style={{ padding: '6px 10px', color: '#ffab00' }}>{r.block}</td>
                  <td style={{ padding: '6px 10px', color: 'var(--text-muted)', fontSize: '0.6rem' }}>{r.example}</td>
                </tr>
                {selected === r.cidr && (
                  <tr style={{ background: `${colors[i]}08` }}>
                    <td colSpan={6} style={{ padding: '8px 10px 10px 28px' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        <span style={{ color: colors[i], fontWeight: 700 }}>/{r.cidr}</span> borrows <span style={{ color: colors[i] }}>{r.cidr - 24} bits</span> from the host portion.{' '}
                        Block size = 256 − {256 - r.block} = <span style={{ color: '#ffab00' }}>{r.block}</span>.{' '}
                        Subnets start at multiples of {r.block}: 0, {r.block}, {r.block*2}, {r.block*3}…{' '}
                        Each subnet has <span style={{ color: '#00e676' }}>{r.hosts} usable hosts</span> (2^{32-r.cidr} − 2).
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </InlineViz>
  );
}

// ── How to Subnet — animated step-by-step ─────────────────
function SubnetStepByStep() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  // Example: subnet 192.168.1.0/24 for Engineering (50 hosts)
  const steps2 = [
    { label: 'Step 1: Count required hosts', detail: 'Engineering needs 50 hosts. We need 2^n − 2 ≥ 50, so n=6 host bits → 2^6 − 2 = 62 ✓', result: null },
    { label: 'Step 2: Find the mask',        detail: '6 host bits → 32 − 6 = /26. Mask = 255.255.255.192 (last octet: 11000000)', result: '/26 → 255.255.255.192' },
    { label: 'Step 3: Calculate block size', detail: 'Block size = 256 − 192 = 64. Subnets start at: .0, .64, .128, .192', result: 'Block = 64' },
    { label: 'Step 4: Map the subnet',       detail: 'First /26 subnet: Network 192.168.1.0, First usable .1, Last usable .62, Broadcast .63', result: '192.168.1.0/26' },
  ];
  useEffect(() => {
    if (isPaused || step >= steps2.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1400);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  return (
    <InlineViz label="HOW TO SUBNET — STEP BY STEP (50 hosts needed)" accent="#00e5ff">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps2.map((s, i) => (
          <div key={i} style={{
            padding: '10px 14px', borderRadius: 6,
            background: step >= i ? 'rgba(0,229,255,0.08)' : 'var(--bg-elevated)',
            border: `1px solid ${step >= i ? (step === i ? '#00e5ff' : 'rgba(0,229,255,0.3)') : 'var(--border-subtle)'}`,
            opacity: step >= i ? 1 : 0.3,
            transition: 'all 0.5s',
            boxShadow: step === i ? '0 0 12px rgba(0,229,255,0.15)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: step >= i ? 5 : 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: step > i ? '#00e676' : step === i ? '#00e5ff' : 'var(--border-default)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.625rem', fontWeight: 700, color: '#000',
                transition: 'background 0.4s',
              }}>{step > i ? '✓' : i + 1}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: step >= i ? '#00e5ff' : 'var(--text-muted)' }}>{s.label}</div>
              {s.result && step > i && (
                <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: '#00e676' }}>{s.result}</div>
              )}
            </div>
            {step >= i && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: 32 }}>{s.detail}</div>
            )}
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ── VLSM — visual block allocation ─────────────────────────
function VlsmVisual() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const allocs = [
    { label: 'Engineering /26', start: 0,   size: 64,  color: '#00e5ff', hosts: 62, cidr: '/26', net: '192.168.1.0' },
    { label: 'Sales /27',       start: 64,  size: 32,  color: '#00e676', hosts: 30, cidr: '/27', net: '192.168.1.64' },
    { label: 'Mgmt /28',        start: 96,  size: 16,  color: '#7c4dff', hosts: 14, cidr: '/28', net: '192.168.1.96' },
    { label: 'WAN /30',         start: 112, size: 4,   color: '#ffab00', hosts: 2,  cidr: '/30', net: '192.168.1.112' },
  ];
  const totalUsed = allocs.slice(0, step).reduce((a, b) => a + b.size, 0);
  const remaining = 256 - totalUsed;

  useEffect(() => {
    if (isPaused || step >= allocs.length) return;
    const t = setTimeout(() => setStep(s => s + 1), 1000);
    return () => clearTimeout(t);
  }, [step, isPaused]);

  return (
    <InlineViz label="VLSM — VARIABLE-LENGTH SUBNET MASKING (192.168.1.0/24)" accent="#7c4dff">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
      </div>
      {/* Address space bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          192.168.1.0/24 — 256 addresses (254 usable)
        </div>
        <div style={{ display: 'flex', height: 32, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          {allocs.map((a, i) => step > i && (
            <div key={i} style={{
              width: `${(a.size / 256) * 100}%`, background: `${a.color}40`,
              borderRight: `2px solid ${a.color}`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', transition: 'width 0.5s',
              fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: a.color, fontWeight: 700,
            }}>{a.cidr}</div>
          ))}
          <div style={{
            flex: 1, background: 'var(--bg-elevated)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)',
          }}>{remaining} free</div>
        </div>
        {/* Scale labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          {['.0', '.64', '.128', '.192', '.255'].map(l => (
            <div key={l} style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{l}</div>
          ))}
        </div>
      </div>
      {/* Allocation list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {allocs.map((a, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '140px 60px 80px 1fr',
            alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 5,
            background: step > i ? `${a.color}10` : 'var(--bg-elevated)',
            border: `1px solid ${step > i ? a.color + '40' : 'var(--border-subtle)'}`,
            opacity: step > i ? 1 : 0.35, transition: 'all 0.4s',
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem', color: a.color }}>{a.net}{a.cidr}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#00e676' }}>{a.hosts} hosts</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: '#ffab00' }}>block/{a.size}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{a.label}</div>
          </div>
        ))}
        <div style={{ padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          .116–.255 ({remaining} addresses) — unallocated, available for future subnets
        </div>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// STP INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Broadcast Storm — the problem STP solves ───────────────
function BroadcastStormAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  useEffect(() => {
    if (isPaused || step >= 4) return;
    const t = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  const active = step >= 2;
  const strobeOp = step >= 3 ? [1,0.3,1,0.3,1][step % 2] : 1;
  return (
    <InlineViz label="THE PROBLEM — BROADCAST STORM WITHOUT STP" accent="#ff5252">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 170" style={{ width: 260, maxHeight: 170, flexShrink: 0 }}>
          {/* Three switches in a triangle — no STP */}
          {[
            { id: 'SW1', x: 140, y: 25  },
            { id: 'SW2', x: 40,  y: 140 },
            { id: 'SW3', x: 240, y: 140 },
          ].map((sw, i) => (
            <g key={i}>
              <rect x={sw.x - 28} y={sw.y - 16} width={56} height={32} rx="5"
                fill={active ? 'rgba(255,82,82,0.2)' : 'rgba(0,229,255,0.08)'}
                stroke={active ? '#ff5252' : '#00e5ff'} strokeWidth="1.5"
                style={{ transition: 'all 0.4s' }}/>
              <text x={sw.x} y={sw.y + 5} textAnchor="middle"
                fill={active ? '#ff5252' : '#00e5ff'}
                fontFamily="monospace" fontSize="11" fontWeight="bold">{sw.id}</text>
            </g>
          ))}
          {/* Links */}
          {[[140,41,56,140],[140,41,212,140],[56,140,212,140]].map(([x1,y1,x2,y2],i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={active ? '#ff5252' : 'var(--border-subtle)'}
              strokeWidth={active ? 2.5 : 1.5}
              style={{ transition: 'stroke 0.4s' }}/>
          ))}
          {/* Storm arrows */}
          {active && [
            { x1:100,y1:65,  x2:70,  y2:120, rot: 0   },
            { x1:180,y1:65,  x2:210, y2:120, rot: 0   },
            { x1:120,y1:140, x2:180, y2:140, rot: 0   },
          ].map((a, i) => (
            <g key={i} opacity={step >= 3 ? (0.4 + (i%2)*0.5) : 0.8}>
              <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                stroke="#ff5252" strokeWidth="2" markerEnd="url(#arrowRed)"
                strokeDasharray="4,2"/>
              <text x={(a.x1+a.x2)/2} y={(a.y1+a.y2)/2 - 4}
                textAnchor="middle" fill="#ff5252" fontSize="10">⚡</text>
            </g>
          ))}
          {step >= 3 && (
            <text x="140" y="90" textAnchor="middle" fill="#ff5252"
              fontFamily="monospace" fontSize="22" fontWeight="bold" opacity="0.6">∞</text>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            {step === 0 && 'Three switches are connected in a physical loop — common for redundancy.'}
            {step === 1 && 'PC sends a broadcast frame. SW1 receives it and floods to all ports.'}
            {step === 2 && 'SW2 and SW3 receive the frame and each flood it back — the loop is complete.'}
            {step === 3 && '⚠ Frames circulate forever. CPU spikes to 100%, links saturate, network collapses.'}
            {step >= 4 && '⚠ Without STP, one broadcast creates an infinite forwarding loop. STP prevents this by blocking one port in the triangle.'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Root Bridge Election ───────────────────────────────────
function RootBridgeElection() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const switches = [
    { id: 'SW1', priority: 32768, mac: 'aa:bb:cc:00:00:01', x: 140, y: 30  },
    { id: 'SW2', priority: 32768, mac: 'aa:bb:cc:00:00:02', x: 40,  y: 140 },
    { id: 'SW3', priority: 4096,  mac: 'aa:bb:cc:00:00:03', x: 240, y: 140 },
  ];
  // SW3 wins because priority 4096 < 32768
  const rootIdx = 2;
  useEffect(() => {
    if (isPaused || step >= 3) return;
    const t = setTimeout(() => setStep(s => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="STEP 1 — ROOT BRIDGE ELECTION (lowest Bridge ID wins)" accent="#ffab00">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 185" style={{ width: 260, maxHeight: 185, flexShrink: 0 }}>
          {/* Links */}
          {[[140,46,56,140],[140,46,212,140],[56,140,212,140]].map(([x1,y1,x2,y2],i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={step >= 1 ? '#ffab00' : 'var(--border-subtle)'}
              strokeWidth="1.5" strokeDasharray={step >= 1 ? '5,3' : 'none'}
              style={{ transition: 'stroke 0.4s' }}/>
          ))}
          {step >= 1 && (
            <text x="140" y="100" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="8">
              BPDU exchanges
            </text>
          )}
          {switches.map((sw, i) => {
            const isRoot = i === rootIdx && step >= 2;
            const color = isRoot ? '#00e676' : step >= 1 ? '#ffab00' : '#00e5ff';
            return (
              <g key={i}>
                <rect x={sw.x - 34} y={sw.y - 22} width={68} height={44} rx="5"
                  fill={isRoot ? 'rgba(0,230,118,0.15)' : 'rgba(255,171,0,0.08)'}
                  stroke={color} strokeWidth={isRoot ? 2.5 : 1.5}
                  style={{ transition: 'all 0.4s' }}/>
                <text x={sw.x} y={sw.y - 6} textAnchor="middle" fill={color}
                  fontFamily="monospace" fontSize="11" fontWeight="bold">{sw.id}</text>
                <text x={sw.x} y={sw.y + 6} textAnchor="middle" fill={color}
                  fontFamily="monospace" fontSize="8">pri: {sw.priority}</text>
                <text x={sw.x} y={sw.y + 16} textAnchor="middle" fill="var(--text-muted)"
                  fontFamily="monospace" fontSize="7">…{sw.mac.slice(-5)}</text>
                {isRoot && (
                  <text x={sw.x} y={sw.y + 36} textAnchor="middle" fill="#00e676"
                    fontFamily="monospace" fontSize="9" fontWeight="bold">★ ROOT</text>
                )}
              </g>
            );
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            {step === 0 && 'Each switch starts claiming to be the root bridge and sends BPDUs.'}
            {step === 1 && 'Switches exchange BPDUs. Bridge ID = Priority (2B) + MAC Address (6B). Lowest Bridge ID wins.'}
            {step === 2 && 'SW3 has priority 4096 vs SW1/SW2\'s 32768. SW3 has the lowest Bridge ID — it becomes root.'}
            {step >= 3 && '✓ SW3 is the Root Bridge. All other switches now calculate paths TO SW3 to determine port roles.'}
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,171,0,0.08)', border: '1px solid rgba(255,171,0,0.2)', fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
            Bridge ID = Priority + MAC<br/>
            SW1: 32768.aa:bb:cc:…:01<br/>
            SW3: <span style={{ color: '#00e676' }}>04096</span>.aa:bb:cc:…:03 ← wins
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Port Role Assignment ───────────────────────────────────
function PortRoleAssignment() {
  const [hovered, setHovered] = React.useState(null);
  const roles = [
    { name: 'Root Port',       color: '#00e676', abbr: 'RP', desc: 'Best path toward the Root Bridge. One per non-root switch. Always in forwarding state.' },
    { name: 'Designated Port', color: '#00e5ff', abbr: 'DP', desc: 'Best port on each network segment toward root. Forwards traffic away from root. Root bridge has all designated ports.' },
    { name: 'Blocking Port',   color: '#ff5252', abbr: 'BP', desc: 'Not root port or designated port. Blocked to break the loop. Receives BPDUs but discards data frames.' },
  ];
  return (
    <InlineViz label="STEP 2 — PORT ROLE ASSIGNMENT (3-switch triangle)" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 185" style={{ width: 260, maxHeight: 185, flexShrink: 0 }}>
          {/* SW3 = root (bottom right) */}
          {[
            { id: 'SW1', x: 140, y: 28,  label: 'non-root', color: '#ffab00' },
            { id: 'SW2', x: 40,  y: 145, label: 'non-root', color: '#ffab00' },
            { id: 'SW3', x: 240, y: 145, label: '★ ROOT',   color: '#00e676' },
          ].map((sw, i) => (
            <g key={i}>
              <rect x={sw.x-30} y={sw.y-18} width={60} height={36} rx="5"
                fill={i===2 ? 'rgba(0,230,118,0.12)' : 'rgba(255,171,0,0.08)'}
                stroke={sw.color} strokeWidth={i===2 ? 2.5 : 1.5}/>
              <text x={sw.x} y={sw.y-3} textAnchor="middle" fill={sw.color} fontFamily="monospace" fontSize="10" fontWeight="bold">{sw.id}</text>
              <text x={sw.x} y={sw.y+9} textAnchor="middle" fill={sw.color} fontFamily="monospace" fontSize="7">{sw.label}</text>
            </g>
          ))}
          {/* Links with port role labels */}
          {/* SW1-SW3 (right side): SW1 RP, SW3 DP */}
          <line x1="165" y1="40" x2="222" y2="132" stroke="#546e7a" strokeWidth="1.5"/>
          <text x="205" y="88" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="9" fontWeight="bold">RP</text>
          <text x="222" y="125" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="9" fontWeight="bold">DP</text>
          {/* SW2-SW3 (bottom): SW2 RP, SW3 DP */}
          <line x1="70" y1="145" x2="210" y2="145" stroke="#546e7a" strokeWidth="1.5"/>
          <text x="105" y="158" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="9" fontWeight="bold">RP</text>
          <text x="185" y="158" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="9" fontWeight="bold">DP</text>
          {/* SW1-SW2 (left side): one DP, one BP */}
          <line x1="115" y1="40" x2="58" y2="132" stroke="#ff5252" strokeWidth="2" strokeDasharray="5,3"/>
          <text x="75" y="82" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="9" fontWeight="bold">DP</text>
          <text x="60" y="125" textAnchor="middle" fill="#ff5252" fontFamily="monospace" fontSize="9" fontWeight="bold">BP</text>
          <text x="75" y="175" textAnchor="middle" fill="#ff5252" fontFamily="monospace" fontSize="8">⛔ BLOCKED</text>
        </svg>
        <div style={{ flex: 1, minWidth: 140 }}>
          {roles.map((r, i) => (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ padding: '7px 10px', marginBottom: 6, borderRadius: 5,
                background: hovered === i ? `${r.color}15` : `${r.color}06`,
                border: `1px solid ${hovered === i ? r.color : r.color + '30'}`,
                transition: 'all 0.2s', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <div style={{ width: 24, height: 18, borderRadius: 3, background: `${r.color}25`,
                  border: `1px solid ${r.color}`, fontFamily: 'var(--font-mono)',
                  fontSize: '0.625rem', fontWeight: 700, color: r.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.abbr}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: r.color }}>{r.name}</div>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </InlineViz>
  );
}

// ── Port States — state machine ────────────────────────────
function StpPortStates() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const states = [
    { name: 'Blocking',   time: '—',    color: '#ff5252', desc: 'Receives BPDUs only. No data frames forwarded. Default state for non-designated ports.', bpdu: true,  learn: false, fwd: false },
    { name: 'Listening',  time: '15s',  color: '#ffab00', desc: 'Participates in active topology. Sends and receives BPDUs. No data forwarding, no MAC learning.', bpdu: true, learn: false, fwd: false },
    { name: 'Learning',   time: '15s',  color: '#7c4dff', desc: 'Starts learning MAC addresses to populate the MAC table. Still no data forwarding.', bpdu: true, learn: true, fwd: false },
    { name: 'Forwarding', time: '∞',    color: '#00e676', desc: 'Normal operation. Forwards data frames and BPDUs. MAC table populated.', bpdu: true, learn: true, fwd: true },
  ];
  useEffect(() => {
    if (isPaused || step >= states.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="STEP 3 — STP PORT STATES (total ~30–50 seconds)" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, justifyContent: 'flex-end' }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
      </div>
      {/* State flow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, overflowX: 'auto' }}>
        {states.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: step >= i ? 1 : 0.25, transition: 'opacity 0.5s', minWidth: 72,
            }}>
              <div style={{
                width: 56, height: 40, borderRadius: 6, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: step >= i ? `${s.color}20` : 'var(--bg-elevated)',
                border: `2px solid ${step >= i ? s.color : 'var(--border-subtle)'}`,
                fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', fontWeight: 700,
                color: step >= i ? s.color : 'var(--text-muted)',
                boxShadow: step === i ? `0 0 14px ${s.color}50` : 'none',
                transition: 'all 0.5s',
              }}>
                <span>{s.name}</span>
                <span style={{ fontSize: '0.5rem', opacity: 0.7 }}>{s.time}</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[['BPDU',s.bpdu],['Learn',s.learn],['Fwd',s.fwd]].map(([label,enabled]) => (
                  <div key={label} style={{ fontSize: '0.4rem', fontFamily: 'var(--font-mono)',
                    color: enabled ? s.color : '#546e7a',
                    background: enabled ? `${s.color}15` : 'transparent',
                    padding: '1px 3px', borderRadius: 2 }}>{label}</div>
                ))}
              </div>
            </div>
            {i < states.length - 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '0 4px' }}>
                <div style={{ width: 20, height: 2, background: step > i ? states[i].color : 'var(--border-subtle)', transition: 'background 0.4s' }}/>
                <div style={{ fontSize: '0.45rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{states[i].time}</div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      {step < states.length && (
        <div style={{ padding: '8px 12px', borderRadius: 6,
          background: `${states[step].color}10`, border: `1px solid ${states[step].color}30`,
          fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: states[step].color }}>{states[step].name}: </span>
          {states[step].desc}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        Total convergence: 15s (listening) + 15s (learning) = ~30s · Max age: 20s · Hello: 2s
      </div>
    </InlineViz>
  );
}

// ── RSTP vs STP convergence comparison ─────────────────────
function RstpComparison() {
  const [mode, setMode] = React.useState('stp');
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const isStp = mode === 'stp';
  const totalSteps = isStp ? 5 : 2;
  useEffect(() => {
    if (isPaused || step >= totalSteps) return;
    const t = setTimeout(() => setStep(s => s + 1), isStp ? 1000 : 700);
    return () => clearTimeout(t);
  }, [step, isPaused, mode]);
  function reset(m) { setMode(m); setStep(0); setIsPaused(false); }
  const stpStages  = ['Detect failure','Max Age (20s)','Listening (15s)','Learning (15s)','Forwarding ✓'];
  const rstpStages = ['Detect failure','Forwarding ✓ (<1s)'];
  const stages = isStp ? stpStages : rstpStages;
  return (
    <InlineViz label="RSTP vs STP — CONVERGENCE TIME" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['stp','802.1D STP'],['rstp','802.1w RSTP']].map(([m, label]) => (
          <button key={m} onClick={() => reset(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? (m==='stp' ? 'rgba(255,82,82,0.15)' : 'rgba(0,229,255,0.15)') : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? (m==='stp' ? '#ff5252' : '#00e5ff') : 'var(--border-subtle)'}`,
            color: mode === m ? (m==='stp' ? '#ff5252' : '#00e5ff') : 'var(--text-muted)',
          }}>{label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={() => reset(mode)}>↺</button>
        </div>
      </div>
      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {stages.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: step >= i ? 1 : 0.2, transition: 'opacity 0.4s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              background: step > i ? '#00e676' : step === i ? (isStp ? '#ff5252' : '#00e5ff') : 'var(--bg-elevated)',
              border: `2px solid ${step >= i ? (isStp ? '#ff5252' : '#00e5ff') : 'var(--border-subtle)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.5rem', color: '#000', fontWeight: 700,
              transition: 'all 0.4s',
            }}>{step > i ? '✓' : i+1}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
              color: step >= i ? (isStp ? '#ff5252' : '#00e5ff') : 'var(--text-muted)',
              fontWeight: s.includes('✓') ? 700 : 400 }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6,
        background: isStp ? 'rgba(255,82,82,0.06)' : 'rgba(0,229,255,0.06)',
        border: `1px solid ${isStp ? 'rgba(255,82,82,0.2)' : 'rgba(0,229,255,0.2)'}`,
        fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
        {isStp
          ? '802.1D STP — Convergence ~30–50 seconds. Network is unreachable during transition.'
          : '802.1w RSTP — Convergence <1 second using proposal/agreement handshake. Backwards compatible with 802.1D.'}
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// LACP INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── What Is LACP — link bundling animation ────────────────
function LacpBundlingAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  useEffect(() => {
    if (isPaused || step >= 4) return;
    const t = setTimeout(() => setStep(s => s + 1), 1000);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="LACP — BUNDLING PHYSICAL LINKS INTO ONE LOGICAL LINK" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 320 140" style={{ width: 300, maxHeight: 140, flexShrink: 0 }}>
          {/* SW1 */}
          <rect x="10" y="50" width="70" height="40" rx="5"
            fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1.5"/>
          <text x="45" y="68" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="11" fontWeight="bold">SW1</text>
          <text x="45" y="81" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">Gi0/1-4</text>
          {/* SW2 */}
          <rect x="240" y="50" width="70" height="40" rx="5"
            fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1.5"/>
          <text x="275" y="68" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="11" fontWeight="bold">SW2</text>
          <text x="275" y="81" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">Gi0/1-4</text>
          {/* Individual links (steps 0-1) */}
          {step <= 1 && [55,70,85,100].map((y, i) => (
            <g key={i}>
              <line x1="80" y1={y} x2="240" y2={y}
                stroke={step >= 1 ? '#ffab00' : 'var(--border-subtle)'}
                strokeWidth="1.5" strokeDasharray={step >= 1 ? '4,2' : 'none'}
                style={{ transition: 'stroke 0.4s' }}/>
              {step >= 1 && (
                <text x="160" y={y - 3} textAnchor="middle" fill="#ffab00"
                  fontFamily="monospace" fontSize="7">LACPDU</text>
              )}
            </g>
          ))}
          {/* Bundled port-channel (steps 2+) */}
          {step >= 2 && (
            <g>
              {[62,70,78].map((y, i) => (
                <line key={i} x1="80" y1={y} x2="240" y2={y}
                  stroke="#00e676" strokeWidth="2.5"
                  style={{ transition: 'all 0.5s' }}/>
              ))}
              <rect x="130" y="58" width="60" height="24" rx="4"
                fill="rgba(0,230,118,0.15)" stroke="#00e676" strokeWidth="1.5"/>
              <text x="160" y="68" textAnchor="middle" fill="#00e676"
                fontFamily="monospace" fontSize="9" fontWeight="bold">Po1</text>
              <text x="160" y="78" textAnchor="middle" fill="#00e676"
                fontFamily="monospace" fontSize="8">4 Gbps</text>
            </g>
          )}
          {/* Failure scenario (step 4) */}
          {step >= 4 && (
            <g>
              <line x1="80" y1="62" x2="240" y2="62"
                stroke="#ff5252" strokeWidth="2" strokeDasharray="4,4"/>
              <text x="160" y="55" textAnchor="middle" fill="#ff5252"
                fontFamily="monospace" fontSize="9">✗ link down</text>
              <text x="160" y="100" textAnchor="middle" fill="#00e676"
                fontFamily="monospace" fontSize="9">↓ traffic shifts to remaining 3 links</text>
            </g>
          )}
          {/* Bandwidth labels */}
          <text x="45" y="115" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">4 × 1G ports</text>
          <text x="275" y="115" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">4 × 1G ports</text>
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            {step === 0 && '4 separate 1 Gbps links exist between SW1 and SW2 — but they\'re not yet bundled.'}
            {step === 1 && 'LACP sends LACPDUs on each link — negotiating which ports should join the channel.'}
            {step === 2 && '✓ Port-channel Po1 formed: 4 × 1G = 4 Gbps logical link with automatic load balancing.'}
            {step === 3 && 'Traffic is hashed across all 4 member links simultaneously — no single link is a bottleneck.'}
            {step >= 4 && '✓ One link fails — LACP detects it and redistributes traffic across the remaining 3 links. No manual intervention needed.'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── LACP Modes — negotiation matrix ───────────────────────
function LacpModeMatrix() {
  const [hovered, setHovered] = React.useState(null);
  const modes = ['Active', 'Passive', 'On'];
  const matrix = {
    'Active-Active':   { result: 'Channel forms ✓',  color: '#00e676', note: 'Both sides initiate — recommended' },
    'Active-Passive':  { result: 'Channel forms ✓',  color: '#00e676', note: 'Active side initiates, passive responds' },
    'Active-On':       { result: 'No channel ✗',     color: '#ff5252', note: 'On mode doesn\'t speak LACP' },
    'Passive-Active':  { result: 'Channel forms ✓',  color: '#00e676', note: 'Same as Active-Passive' },
    'Passive-Passive': { result: 'No channel ✗',     color: '#ff5252', note: 'Neither side initiates negotiation' },
    'Passive-On':      { result: 'No channel ✗',     color: '#ff5252', note: 'On mode doesn\'t speak LACP' },
    'On-Active':       { result: 'No channel ✗',     color: '#ff5252', note: 'On mode doesn\'t speak LACP' },
    'On-Passive':      { result: 'No channel ✗',     color: '#ff5252', note: 'On mode doesn\'t speak LACP' },
    'On-On':           { result: 'Channel forms ✓',  color: '#ffab00', note: 'Static — no LACP, no negotiation, fragile' },
  };
  return (
    <InlineViz label="LACP MODES — NEGOTIATION COMPATIBILITY MATRIX" accent="#ffab00">
      <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(3, 1fr)', gap: 4, marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>SW1 → SW2 ↓</div>
        {modes.map(m => (
          <div key={m} style={{ padding: '5px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-glow)', borderRadius: 4 }}>{m}</div>
        ))}
        {modes.map(row => (
          <React.Fragment key={row}>
            <div style={{ padding: '5px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-glow)', borderRadius: 4, display: 'flex', alignItems: 'center' }}>{row}</div>
            {modes.map(col => {
              const key = `${row}-${col}`;
              const cell = matrix[key];
              const isHovered = hovered === key;
              return (
                <div key={col}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    padding: '6px 4px', borderRadius: 4, textAlign: 'center', cursor: 'default',
                    background: isHovered ? `${cell.color}20` : `${cell.color}08`,
                    border: `1px solid ${isHovered ? cell.color : cell.color + '30'}`,
                    transition: 'all 0.2s',
                  }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', fontWeight: 700, color: cell.color }}>{cell.result}</div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      {hovered && (
        <div style={{ padding: '7px 12px', borderRadius: 5,
          background: `${matrix[hovered].color}10`,
          border: `1px solid ${matrix[hovered].color}30`,
          fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: matrix[hovered].color }}>{hovered}: </span>
          {matrix[hovered].note}
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
        Hover a cell for details · PAgP equivalents: Desirable = Active, Auto = Passive
      </div>
    </InlineViz>
  );
}

// ── Load Balancing — hash visualization ───────────────────
function LacpLoadBalancing() {
  const [method, setMethod] = React.useState('src-dst-ip');
  const methods = [
    { id: 'src-mac',    label: 'src-mac',     desc: 'Hash source MAC. Good for L2 networks where many source MACs exist.' },
    { id: 'dst-mac',    label: 'dst-mac',     desc: 'Hash destination MAC. Good when traffic goes to many different destinations.' },
    { id: 'src-dst-ip', label: 'src-dst-ip',  desc: 'Hash source+destination IP. Best for L3 — provides most balanced distribution.' },
    { id: 'src-ip',     label: 'src-ip',      desc: 'Hash source IP only. Can be unbalanced if few source IPs exist.' },
  ];
  // Simulated traffic flows and which link they hash to
  const flows = [
    { src: '10.0.1.10', dst: '10.0.2.20', link: 0 },
    { src: '10.0.1.11', dst: '10.0.2.20', link: 1 },
    { src: '10.0.1.10', dst: '10.0.2.21', link: method === 'src-ip' ? 0 : 2 },
    { src: '10.0.1.12', dst: '10.0.2.20', link: method === 'src-ip' ? 2 : 3 },
    { src: '10.0.1.13', dst: '10.0.2.22', link: method === 'src-ip' ? 3 : 1 },
    { src: '10.0.1.10', dst: '10.0.2.23', link: method === 'src-ip' ? 0 : 2 },
  ];
  const linkColors = ['#00e5ff', '#00e676', '#7c4dff', '#ffab00'];
  const linkLoads = [0, 1, 2, 3].map(l => flows.filter(f => f.link === l).length);
  return (
    <InlineViz label="LACP LOAD BALANCING — TRAFFIC HASHING ACROSS MEMBER LINKS" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {methods.map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)} style={{
            padding: '3px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: method === m.id ? 'rgba(124,77,255,0.15)' : 'var(--bg-elevated)',
            border: `1px solid ${method === m.id ? '#7c4dff' : 'var(--border-subtle)'}`,
            color: method === m.id ? '#7c4dff' : 'var(--text-muted)',
          }}>{m.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Flow table */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 5 }}>TRAFFIC FLOWS → LINK ASSIGNMENT</div>
          {flows.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
              padding: '4px 8px', borderRadius: 4, background: `${linkColors[f.link]}08`,
              border: `1px solid ${linkColors[f.link]}25` }}>
              <div style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flex: 1 }}>
                {f.src} → {f.dst}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 700,
                color: linkColors[f.link], background: `${linkColors[f.link]}20`,
                padding: '1px 6px', borderRadius: 3, flexShrink: 0 }}>
                Gi0/{f.link + 1}
              </div>
            </div>
          ))}
        </div>
        {/* Link utilization bars */}
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 5 }}>LINK UTILIZATION</div>
          {[0,1,2,3].map(l => (
            <div key={l} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: linkColors[l] }}>Gi0/{l+1}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: linkColors[l] }}>{linkLoads[l]} flows</span>
              </div>
              <div style={{ height: 10, background: 'var(--bg-elevated)', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${(linkLoads[l] / flows.length) * 100}%`, height: '100%',
                  background: linkColors[l], borderRadius: 5, transition: 'width 0.4s' }}/>
              </div>
            </div>
          ))}
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
            {methods.find(m => m.id === method)?.desc}
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Requirements for bundling — checklist ─────────────────
function LacpRequirements() {
  const [checked, setChecked] = React.useState({});
  const reqs = [
    { id: 'speed',   label: 'Same speed & duplex',      detail: 'All member ports must run at the same speed (e.g. all 1G or all 10G). Full duplex required.',           pass: true },
    { id: 'vlan',    label: 'Same VLAN configuration',  detail: 'Access ports must be in the same VLAN. Trunk ports must carry the same allowed VLANs and native VLAN.', pass: true },
    { id: 'stp',     label: 'Same STP settings',        detail: 'PortFast, guard settings, and port cost must match across all member ports.',                           pass: true },
    { id: 'mtu',     label: 'Same MTU',                 detail: 'MTU must match on all member ports. Mismatched MTU causes EXSTART issues for protocols like OSPF.',      pass: true },
    { id: 'mode',    label: 'Compatible LACP modes',    detail: 'At least one side must be Active. Passive-Passive will not form a channel.',                            pass: true },
    { id: 'native',  label: 'Same native VLAN (trunks)', detail: 'Native VLAN mismatch on trunk port-channels causes CDP warnings and possible VLAN hopping.',           pass: true },
  ];
  const allChecked = reqs.every(r => checked[r.id]);
  return (
    <InlineViz label="REQUIREMENTS FOR BUNDLING — ALL MUST MATCH ON BOTH SIDES" accent="#00e676">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {reqs.map(r => (
          <div key={r.id}
            onClick={() => setChecked(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px',
              borderRadius: 6, cursor: 'pointer',
              background: checked[r.id] ? 'rgba(0,230,118,0.08)' : 'var(--bg-elevated)',
              border: `1px solid ${checked[r.id] ? '#00e676' : 'var(--border-subtle)'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{
              width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
              background: checked[r.id] ? '#00e676' : 'var(--bg-panel)',
              border: `2px solid ${checked[r.id] ? '#00e676' : 'var(--border-default)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', transition: 'all 0.2s',
            }}>{checked[r.id] ? '✓' : ''}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem',
                color: checked[r.id] ? '#00e676' : 'var(--text-primary)', marginBottom: 2 }}>{r.label}</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.detail}</div>
            </div>
          </div>
        ))}
      </div>
      {allChecked && (
        <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6,
          background: 'rgba(0,230,118,0.12)', border: '1px solid #00e676',
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: '#00e676' }}>
          ✓ All requirements met — channel-group will form successfully
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
        Click each item to check it off · If any requirement fails, the port goes to individual (I) or suspended (s) state
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// DHCP INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── DHCP DORA — detailed packet animation ─────────────────
function DhcpDoraDetailed() {
  const [step, setStep] = React.useState(-1);
  const [isPaused, setIsPaused] = React.useState(false);
  const doraSteps = [
    { name: 'DISCOVER',  dir: 'right', color: '#ffab00', src: '0.0.0.0',      dst: '255.255.255.255', port: 'UDP 68→67', detail: 'Client has no IP. Broadcasts to find any DHCP server.' },
    { name: 'OFFER',     dir: 'left',  color: '#00e5ff', src: '10.0.1.1',     dst: '255.255.255.255', port: 'UDP 67→68', detail: 'Server offers 10.0.1.50 with lease options.' },
    { name: 'REQUEST',   dir: 'right', color: '#00e676', src: '0.0.0.0',      dst: '255.255.255.255', port: 'UDP 68→67', detail: 'Client formally requests the offered IP (still broadcasts to notify other servers).' },
    { name: 'ACK',       dir: 'left',  color: '#7c4dff', src: '10.0.1.1',     dst: '10.0.1.50',       port: 'UDP 67→68', detail: 'Server confirms. Client configures IP, mask, gateway, DNS.' },
  ];
  useEffect(() => {
    const t = setTimeout(() => setStep(0), 500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (isPaused || step < 0 || step >= doraSteps.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1300);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 300); }
  return (
    <InlineViz label="DHCP — DORA SEQUENCE (Discover → Offer → Request → Acknowledge)" accent="#ffab00">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={replay}>↺</button>
      </div>
      <svg viewBox="0 0 400 180" style={{ width: '100%', maxHeight: 180, display: 'block' }}>
        {/* Client */}
        <rect x="10" y="30" width="80" height="50" rx="5"
          fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1.5"/>
        <text x="50" y="52" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="10" fontWeight="bold">CLIENT</text>
        <text x="50" y="65" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">
          {step >= 3 ? '10.0.1.50/24' : '0.0.0.0'}
        </text>
        {step >= 3 && <text x="50" y="76" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="7">GW: 10.0.1.1</text>}
        {/* Server */}
        <rect x="310" y="30" width="80" height="50" rx="5"
          fill="rgba(0,230,118,0.08)" stroke="#00e676" strokeWidth="1.5"/>
        <text x="350" y="52" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="10" fontWeight="bold">DHCP</text>
        <text x="350" y="65" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="10" fontWeight="bold">SERVER</text>
        <text x="350" y="76" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">10.0.1.1</text>
        {/* DORA arrows */}
        {doraSteps.map((s, i) => {
          if (step < i) return null;
          const y = 100 + i * 18;
          const isRight = s.dir === 'right';
          return (
            <g key={i}>
              <line x1={isRight ? 90 : 310} y1={y} x2={isRight ? 310 : 90} y2={y}
                stroke={s.color} strokeWidth="1.5"/>
              <polygon
                points={isRight
                  ? `310,${y-4} 318,${y} 310,${y+4}`
                  : `90,${y-4} 82,${y} 90,${y+4}`}
                fill={s.color}/>
              <rect x={isRight ? 150 : 130} y={y-10} width={isRight ? 90 : 80} height={14} rx={3}
                fill={`${s.color}20`} stroke={`${s.color}50`} strokeWidth={1}/>
              <text x="200" y={y} textAnchor="middle" fill={s.color}
                fontFamily="monospace" fontSize="9" fontWeight="bold">{s.name}</text>
            </g>
          );
        })}
      </svg>
      {step >= 0 && (
        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6,
          background: `${doraSteps[Math.min(step, 3)].color}10`,
          border: `1px solid ${doraSteps[Math.min(step, 3)].color}30`,
          fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: doraSteps[Math.min(step, 3)].color }}>
            {doraSteps[Math.min(step, 3)].name} </span>
          — {doraSteps[Math.min(step, 3)].detail}
          <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)' }}>
            Src: {doraSteps[Math.min(step, 3)].src} · Dst: {doraSteps[Math.min(step, 3)].dst} · {doraSteps[Math.min(step, 3)].port}
          </div>
        </div>
      )}
    </InlineViz>
  );
}

// ── DHCP Key Concepts — relay agent animation ─────────────
function DhcpRelayAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  useEffect(() => {
    if (isPaused || step >= 5) return;
    const t = setTimeout(() => setStep(s => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="DHCP RELAY — ip helper-address (crossing subnet boundaries)" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 420 130" style={{ width: 400, maxHeight: 130, flexShrink: 0 }}>
          {/* Client subnet */}
          <rect x="5" y="15" width="90" height="100" rx="5"
            fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.2)" strokeWidth="1"/>
          <text x="50" y="30" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="8">10.0.1.0/24</text>
          <rect x="15" y="40" width="70" height="28" rx="4"
            fill={step>=1?'rgba(0,229,255,0.12)':'var(--bg-elevated)'}
            stroke={step>=1?'#00e5ff':'var(--border-subtle)'} strokeWidth="1"/>
          <text x="50" y="54" textAnchor="middle" fill={step>=1?'#00e5ff':'var(--text-muted)'}
            fontFamily="monospace" fontSize="9" fontWeight="bold">CLIENT</text>
          <text x="50" y="64" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">10.0.1.10</text>
          {/* Router */}
          <rect x="140" y="40" width="80" height="50" rx="5"
            fill={step>=2?'rgba(255,171,0,0.12)':'rgba(255,171,0,0.05)'}
            stroke="#ffab00" strokeWidth="1.5"/>
          <text x="180" y="62" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="10" fontWeight="bold">R1</text>
          <text x="180" y="74" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="7">ip helper-address</text>
          <text x="180" y="83" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="7">10.0.2.100</text>
          {/* DHCP Server subnet */}
          <rect x="270" y="15" width="145" height="100" rx="5"
            fill="rgba(0,230,118,0.04)" stroke="rgba(0,230,118,0.2)" strokeWidth="1"/>
          <text x="342" y="30" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="8">10.0.2.0/24</text>
          <rect x="290" y="40" width="105" height="28" rx="4"
            fill={step>=4?'rgba(0,230,118,0.12)':'var(--bg-elevated)'}
            stroke={step>=4?'#00e676':'var(--border-subtle)'} strokeWidth="1"/>
          <text x="342" y="54" textAnchor="middle" fill={step>=4?'#00e676':'var(--text-muted)'}
            fontFamily="monospace" fontSize="9" fontWeight="bold">DHCP SERVER</text>
          <text x="342" y="64" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">10.0.2.100</text>
          {/* Packet flow */}
          {step>=1 && step<=2 && (
            <circle cx={85+step*30} cy={55} r="7" fill="#ffab00" opacity="0.9">
              <animateMotion dur="0.5s" repeatCount="1" path="M0,0 L60,0"/>
            </circle>
          )}
          {step>=1 && (
            <line x1="85" y1="55" x2="140" y2="55"
              stroke={step>=2?'#ffab00':'var(--border-subtle)'} strokeWidth="2"
              style={{transition:'stroke 0.4s'}}/>
          )}
          {step>=2 && step<=4 && (
            <line x1="220" y1="55" x2="290" y2="55"
              stroke="#7c4dff" strokeWidth="2.5"/>
          )}
          {step>=4 && (
            <line x1="290" y1="55" x2="220" y2="55"
              stroke="#00e676" strokeWidth="2" strokeDasharray="4,2"/>
          )}
          {step>=2 && (
            <text x="255" y="48" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="8">
              {step>=4?'OFFER→ACK':'DISCOVER→'}
            </text>
          )}
          {/* Labels */}
          <text x="85" y="115" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="7">
            Broadcast→Unicast
          </text>
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            {step===0 && 'Client is on 10.0.1.0/24. DHCP server is on a different subnet — 10.0.2.0/24.'}
            {step===1 && 'Client broadcasts DISCOVER (255.255.255.255). Broadcasts don\'t cross routers.'}
            {step===2 && 'R1\'s Gi0/0 has ip helper-address 10.0.2.100. R1 converts the broadcast to a unicast OFFER and forwards it to the DHCP server.'}
            {step===3 && 'DHCP server receives the relayed request. It sees the giaddr field (R1\'s interface IP) and knows which pool to allocate from.'}
            {step===4 && 'Server sends OFFER/ACK back to R1 (unicast). R1 relays to client.'}
            {step>=5 && '✓ Client gets IP from centralized server despite being on a different subnet. One server serves many subnets via helper-address.'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── DHCP Troubleshooting flowchart ────────────────────────
function DhcpTroubleshoot() {
  const [selected, setSelected] = React.useState(null);
  const issues = [
    { q: 'Client gets 169.254.x.x (APIPA)', color: '#ff5252',
      steps: ['1. Check DHCP server is running and reachable', '2. Verify ip helper-address if client is on a different subnet', '3. Check pool is not exhausted (show ip dhcp pool)', '4. Verify no ip dhcp excluded-address blocks the entire pool', '5. Check interface is up (show ip interface brief)'] },
    { q: 'Client gets wrong default gateway', color: '#ffab00',
      steps: ['1. Check default-router in the DHCP pool config', '2. Verify the pool matches the correct subnet', '3. Check if multiple pools overlap — first match wins', '4. Verify client is getting lease from the right server'] },
    { q: 'DHCP works locally but not across router', color: '#7c4dff',
      steps: ['1. Check ip helper-address is configured on the correct interface (facing client subnet)', '2. Verify helper points to DHCP server IP (not broadcast)', '3. Check ACL — UDP port 67/68 must not be blocked', '4. Confirm router interface facing clients is up/up'] },
    { q: 'IP address conflict detected', color: '#f43f5e',
      steps: ['1. Run show ip dhcp conflict to see conflicting IPs', '2. clear ip dhcp conflict * to reset', '3. Add the conflicting static IPs to excluded-address range', '4. Verify no hosts have static IPs in the DHCP pool range'] },
  ];
  return (
    <InlineViz label="DHCP TROUBLESHOOTING — COMMON ISSUES" accent="#ff5252">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {issues.map((issue, i) => (
          <div key={i}>
            <div onClick={() => setSelected(selected === i ? null : i)}
              style={{
                padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                background: selected === i ? `${issue.color}12` : `${issue.color}06`,
                border: `1px solid ${selected === i ? issue.color : issue.color + '30'}`,
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: issue.color }}>
                ⚠ {issue.q}
              </span>
              <span style={{ color: issue.color, fontSize: '0.75rem' }}>{selected === i ? '▲' : '▼'}</span>
            </div>
            {selected === i && (
              <div style={{ padding: '8px 12px 10px 20px',
                background: `${issue.color}06`, borderLeft: `2px solid ${issue.color}40`,
                marginTop: 2, borderRadius: '0 0 6px 6px' }}>
                {issue.steps.map((s, j) => (
                  <div key={j} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>{s}</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// DNS INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── DNS Hierarchy — interactive tree ──────────────────────
function DnsHierarchyTree() {
  const [active, setActive] = React.useState(null);
  const nodes = [
    { id: 'root', label: '. (Root)',       x: 200, y: 20,  color: '#f43f5e', desc: '13 root server clusters worldwide (a-m.root-servers.net). Managed by ICANN. Knows where every TLD\'s nameservers are.' },
    { id: 'com',  label: '.com',           x: 80,  y: 75,  color: '#ffab00', desc: 'TLD nameserver for .com. Managed by Verisign. Delegates to authoritative nameservers for each domain.' },
    { id: 'org',  label: '.org',           x: 200, y: 75,  color: '#ffab00', desc: 'TLD nameserver for .org. Managed by the Public Interest Registry.' },
    { id: 'net',  label: '.net',           x: 320, y: 75,  color: '#ffab00', desc: 'TLD nameserver for .net. Also managed by Verisign.' },
    { id: 'ex',   label: 'example.com',   x: 40,  y: 135, color: '#00e5ff', desc: 'Authoritative nameserver for example.com. Holds the actual DNS records (A, CNAME, MX, etc.) for this domain.' },
    { id: 'gc',   label: 'google.com',    x: 120, y: 135, color: '#00e5ff', desc: 'Authoritative nameserver for google.com. Managed by Google. Contains A records for www, mail, etc.' },
    { id: 'wp',   label: 'wikipedia.org', x: 200, y: 135, color: '#7c4dff', desc: 'Authoritative nameserver for wikipedia.org. The final answer for any wikipedia.org query.' },
    { id: 'cf',   label: 'cloudflare.net',x: 320, y: 135, color: '#7c4dff', desc: 'Authoritative nameserver for cloudflare.net — also operates public resolvers 1.1.1.1 and 1.0.0.1.' },
  ];
  const edges = [
    ['root','com'],['root','org'],['root','net'],
    ['com','ex'],['com','gc'],['org','wp'],['net','cf'],
  ];
  return (
    <InlineViz label="DNS HIERARCHY — ROOT → TLD → AUTHORITATIVE" accent="#f43f5e">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 400 165" style={{ width: 380, maxHeight: 165, flexShrink: 0 }}>
          {edges.map(([a, b], i) => {
            const na = nodes.find(n => n.id === a);
            const nb = nodes.find(n => n.id === b);
            return (
              <line key={i} x1={na.x} y1={na.y + 12} x2={nb.x} y2={nb.y - 12}
                stroke={active === a || active === b ? na.color : 'var(--border-subtle)'}
                strokeWidth={active === a || active === b ? 2 : 1}
                style={{ transition: 'all 0.2s' }}/>
            );
          })}
          {nodes.map(n => (
            <g key={n.id} onClick={() => setActive(active === n.id ? null : n.id)}
              style={{ cursor: 'pointer' }}>
              <rect x={n.x - 38} y={n.y - 12} width={76} height={24} rx={4}
                fill={active === n.id ? `${n.color}25` : `${n.color}10`}
                stroke={active === n.id ? n.color : `${n.color}40`}
                strokeWidth={active === n.id ? 2 : 1}
                style={{ transition: 'all 0.2s' }}/>
              <text x={n.x} y={n.y + 4} textAnchor="middle"
                fill={active === n.id ? n.color : 'var(--text-secondary)'}
                fontFamily="monospace" fontSize="9" fontWeight={active === n.id ? 'bold' : 'normal'}
                style={{ transition: 'fill 0.2s' }}>{n.label}</text>
            </g>
          ))}
          {/* Level labels */}
          <text x="395" y="25" textAnchor="end" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">Root</text>
          <text x="395" y="80" textAnchor="end" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">TLD</text>
          <text x="395" y="140" textAnchor="end" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">Authoritative</text>
        </svg>
        <div style={{ flex: 1, minWidth: 130 }}>
          {active ? (
            <div style={{ padding: '10px 12px', borderRadius: 6,
              background: `${nodes.find(n=>n.id===active).color}10`,
              border: `1px solid ${nodes.find(n=>n.id===active).color}40` }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem',
                color: nodes.find(n=>n.id===active).color, marginBottom: 6 }}>
                {nodes.find(n=>n.id===active).label}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {nodes.find(n=>n.id===active).desc}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Click any node to learn about that level of the DNS hierarchy.
            </p>
          )}
        </div>
      </div>
    </InlineViz>
  );
}

// ── DNS Record Types — clickable cards ────────────────────
function DnsRecordTypes() {
  const [selected, setSelected] = React.useState(null);
  const records = [
    { type: 'A',     color: '#00e5ff', desc: 'Maps hostname → IPv4 address', example: 'www.example.com → 93.184.216.34',    use: 'Most common record. Every web server needs one.' },
    { type: 'AAAA',  color: '#2979ff', desc: 'Maps hostname → IPv6 address', example: 'www → 2606:2800:220:1:248:1893:25c8:1946', use: 'IPv6 equivalent of A record. "Quad-A".' },
    { type: 'CNAME', color: '#7c4dff', desc: 'Alias to another hostname',    example: 'mail.example.com → mailserver.example.com', use: 'Points one name to another. Cannot be used at zone apex.' },
    { type: 'MX',    color: '#e040fb', desc: 'Mail server for domain',       example: 'example.com → mail.example.com (pri 10)', use: 'Required for email delivery. Lower priority number = higher preference.' },
    { type: 'PTR',   color: '#ffab00', desc: 'Reverse lookup (IP → name)',   example: '34.216.184.93.in-addr.arpa → www.example.com', use: 'Used for reverse DNS lookups. Required for email anti-spam (rDNS).' },
    { type: 'NS',    color: '#f43f5e', desc: 'Authoritative nameserver',     example: 'example.com → ns1.example.com', use: 'Delegates a zone to a nameserver. Needed for domain delegation.' },
    { type: 'TXT',   color: '#00e676', desc: 'Free-text / SPF / DKIM',      example: 'example.com → "v=spf1 include:… ~all"', use: 'SPF, DKIM, DMARC email auth. Also domain verification tokens.' },
    { type: 'SOA',   color: '#78909c', desc: 'Zone authority / serial',      example: 'Serial: 2024010101, Refresh: 3600', use: 'First record in every zone. Controls zone transfers and caching.' },
  ];
  return (
    <InlineViz label="DNS RECORD TYPES — CLICK TO EXPAND" accent="#00e5ff">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {records.map((r, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)}
            style={{
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              background: selected === i ? `${r.color}18` : `${r.color}08`,
              border: `1px solid ${selected === i ? r.color : r.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.875rem',
              color: r.color, marginBottom: 3 }}>{r.type}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.desc}</div>
          </div>
        ))}
      </div>
      {selected !== null && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 6,
          background: `${records[selected].color}10`,
          border: `1px solid ${records[selected].color}40` }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: records[selected].color, marginBottom: 4 }}>
            {records[selected].type} Record
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 6, padding: '4px 8px', background: 'var(--bg-terminal)', borderRadius: 4 }}>
            {records[selected].example}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {records[selected].use}
          </div>
        </div>
      )}
    </InlineViz>
  );
}

// ── DNS Resolution — recursive query animation ────────────
function DnsResolutionAnim() {
  const [step, setStep] = React.useState(-1);
  const [isPaused, setIsPaused] = React.useState(false);
  const hops = [
    { from: 'Client',     to: 'Resolver',     q: 'www.example.com?',   a: null,               color: '#ffab00', detail: 'Client asks its configured DNS resolver (e.g. 8.8.8.8 or ISP DNS). Checks resolver cache first.' },
    { from: 'Resolver',   to: 'Root',         q: 'www.example.com?',   a: null,               color: '#f43f5e', detail: 'Cache miss. Resolver queries a root server — "who handles .com?"' },
    { from: 'Root',       to: 'Resolver',     q: null,                 a: 'Ask .com TLD',    color: '#f43f5e', detail: 'Root server responds with the .com TLD nameserver addresses.' },
    { from: 'Resolver',   to: '.com TLD',     q: 'www.example.com?',   a: null,               color: '#7c4dff', detail: 'Resolver asks the .com TLD — "who is authoritative for example.com?"' },
    { from: '.com TLD',   to: 'Resolver',     q: null,                 a: 'Ask ns1.example', color: '#7c4dff', detail: 'TLD responds with the authoritative nameservers for example.com.' },
    { from: 'Resolver',   to: 'Auth NS',      q: 'www.example.com?',   a: null,               color: '#00e5ff', detail: 'Resolver asks the authoritative nameserver for the final answer.' },
    { from: 'Auth NS',    to: 'Resolver',     q: null,                 a: '93.184.216.34',   color: '#00e5ff', detail: 'Auth NS returns the A record. Resolver caches it per TTL.' },
    { from: 'Resolver',   to: 'Client',       q: null,                 a: '93.184.216.34',   color: '#00e676', detail: '✓ Client receives the IP. Browser connects to 93.184.216.34:443.' },
  ];
  useEffect(() => {
    const t = setTimeout(() => setStep(0), 400);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (isPaused || step < 0 || step >= hops.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1000);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 300); }
  const actors = ['Client', 'Resolver', 'Root', '.com TLD', 'Auth NS'];
  const colors  = { Client: '#00e5ff', Resolver: '#ffab00', Root: '#f43f5e', '.com TLD': '#7c4dff', 'Auth NS': '#00e676' };
  const xPos = { Client: 30, Resolver: 110, Root: 190, '.com TLD': 270, 'Auth NS': 355 };
  return (
    <InlineViz label="DNS RESOLUTION — RECURSIVE QUERY WALKTHROUGH" accent="#ffab00">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={replay}>↺</button>
      </div>
      <svg viewBox="0 0 400 205" style={{ width: '100%', maxHeight: 205, display: 'block' }}>
        {/* Actor headers */}
        {actors.map(a => (
          <g key={a}>
            <rect x={xPos[a]-32} y="2" width={64} height={22} rx={4}
              fill={`${colors[a]}18`} stroke={`${colors[a]}50`} strokeWidth={1}/>
            <text x={xPos[a]} y="16" textAnchor="middle" fill={colors[a]}
              fontFamily="monospace" fontSize={a==='.com TLD'?'7':'8'} fontWeight="bold">{a}</text>
            {/* Lifeline */}
            <line x1={xPos[a]} y1="24" x2={xPos[a]} y2="205"
              stroke={`${colors[a]}20`} strokeWidth="1" strokeDasharray="3,3"/>
          </g>
        ))}
        {/* Query/response arrows */}
        {hops.map((h, i) => {
          if (step < i) return null;
          const y = 34 + i * 21;
          const x1 = xPos[h.from], x2 = xPos[h.to];
          const isRight = x2 > x1;
          const label = h.q || h.a;
          const isAnswer = !!h.a;
          return (
            <g key={i}>
              <line x1={x1} y1={y} x2={x2} y2={y}
                stroke={h.color} strokeWidth="1.5"
                strokeDasharray={isAnswer ? '4,2' : 'none'}/>
              <polygon
                points={isRight
                  ? `${x2-6},${y-4} ${x2},${y} ${x2-6},${y+4}`
                  : `${x2+6},${y-4} ${x2},${y} ${x2+6},${y+4}`}
                fill={h.color}/>
              <rect x={(x1+x2)/2-30} y={y-9} width={60} height={11} rx={2}
                fill="var(--bg-panel)"/>
              <text x={(x1+x2)/2} y={y} textAnchor="middle"
                fill={h.color} fontFamily="monospace" fontSize="7"
                fontStyle={isAnswer ? 'italic' : 'normal'}>{label}</text>
            </g>
          );
        })}
      </svg>
      {step >= 0 && (
        <div style={{ marginTop: 6, padding: '7px 12px', borderRadius: 5,
          background: `${hops[Math.min(step, hops.length-1)].color}10`,
          border: `1px solid ${hops[Math.min(step, hops.length-1)].color}30`,
          fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: hops[Math.min(step, hops.length-1)].color }}>
            Step {step + 1}: </span>
          {hops[Math.min(step, hops.length-1)].detail}
        </div>
      )}
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// NAT / PAT INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── NAT Terminology — packet label diagram ────────────────
function NatTerminology() {
  const [hovered, setHovered] = React.useState(null);
  const terms = [
    { id: 'il', label: 'Inside Local',  color: '#00e5ff', x: 55,  y: 75,  desc: 'Private IP of the internal host as seen from INSIDE the network. This is the host\'s actual configured IP (e.g. 10.0.1.10).', example: '10.0.1.10' },
    { id: 'ig', label: 'Inside Global', color: '#00e676', x: 55,  y: 135, desc: 'Public IP that represents the internal host as seen from OUTSIDE. This is what the internet sees — usually the router\'s WAN IP.', example: '203.0.113.5' },
    { id: 'og', label: 'Outside Global',color: '#ffab00', x: 345, y: 75,  desc: 'Real public IP of the external host (e.g. web server). This is the destination IP the internal client is trying to reach.', example: '8.8.8.8' },
    { id: 'ol', label: 'Outside Local', color: '#f43f5e', x: 345, y: 135, desc: 'How the external host\'s IP appears from inside. Usually the same as Outside Global unless hairpin NAT or policy NAT is used.', example: '8.8.8.8' },
  ];
  return (
    <InlineViz label="NAT TERMINOLOGY — FOUR ADDRESS TYPES" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 400 185" style={{ width: 380, maxHeight: 185, flexShrink: 0 }}>
          {/* Inside zone */}
          <rect x="5" y="10" width="150" height="170" rx="6"
            fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.25)" strokeWidth="1"/>
          <text x="80" y="26" textAnchor="middle" fill="#00e5ff"
            fontFamily="monospace" fontSize="9" fontWeight="bold">INSIDE</text>
          {/* NAT router */}
          <rect x="170" y="75" width="60" height="50" rx="5"
            fill="rgba(255,171,0,0.12)" stroke="#ffab00" strokeWidth="2"/>
          <text x="200" y="97" textAnchor="middle" fill="#ffab00"
            fontFamily="monospace" fontSize="10" fontWeight="bold">NAT</text>
          <text x="200" y="109" textAnchor="middle" fill="#ffab00"
            fontFamily="monospace" fontSize="9">Router</text>
          {/* Outside zone */}
          <rect x="245" y="10" width="150" height="170" rx="6"
            fill="rgba(255,171,0,0.04)" stroke="rgba(255,171,0,0.25)" strokeWidth="1"/>
          <text x="320" y="26" textAnchor="middle" fill="#ffab00"
            fontFamily="monospace" fontSize="9" fontWeight="bold">OUTSIDE (Internet)</text>
          {/* Host boxes */}
          {terms.map(t => (
            <g key={t.id} onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              <rect x={t.x - 48} y={t.y - 18} width={96} height={36} rx={4}
                fill={hovered === t.id ? `${t.color}22` : `${t.color}10`}
                stroke={hovered === t.id ? t.color : `${t.color}40`}
                strokeWidth={hovered === t.id ? 2 : 1}
                style={{ transition: 'all 0.2s' }}/>
              <text x={t.x} y={t.y - 4} textAnchor="middle" fill={t.color}
                fontFamily="monospace" fontSize="8" fontWeight="bold">{t.label}</text>
              <text x={t.x} y={t.y + 8} textAnchor="middle" fill={t.color}
                fontFamily="monospace" fontSize="9">{t.example}</text>
            </g>
          ))}
          {/* Arrows */}
          <line x1="103" y1="90" x2="170" y2="100" stroke="#00e5ff" strokeWidth="1.5" strokeDasharray="4,2"/>
          <line x1="103" y1="120" x2="170" y2="110" stroke="#00e676" strokeWidth="1.5" strokeDasharray="4,2"/>
          <line x1="230" y1="100" x2="297" y2="90"  stroke="#ffab00" strokeWidth="1.5" strokeDasharray="4,2"/>
          <line x1="230" y1="110" x2="297" y2="120" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4,2"/>
          {/* Translation label */}
          <text x="200" y="148" textAnchor="middle" fill="var(--text-muted)"
            fontFamily="monospace" fontSize="7">IL↔IG translation</text>
        </svg>
        <div style={{ flex: 1, minWidth: 130 }}>
          {hovered ? (
            (() => {
              const t = terms.find(x => x.id === hovered);
              return (
                <div style={{ padding: '10px 12px', borderRadius: 6,
                  background: `${t.color}10`, border: `1px solid ${t.color}40` }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: t.color, marginBottom: 5 }}>{t.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                    color: t.color, marginBottom: 6, padding: '3px 8px',
                    background: 'var(--bg-terminal)', borderRadius: 3 }}>{t.example}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {t.desc}
                  </div>
                </div>
              );
            })()
          ) : (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Hover each address box to understand what each NAT term means and where it appears.
            </p>
          )}
        </div>
      </div>
    </InlineViz>
  );
}

// ── NAT Types — comparison animation ─────────────────────
function NatTypesComparison() {
  const [mode, setMode] = React.useState('static');
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const types = {
    static: {
      label: 'Static NAT',   color: '#00e5ff',
      desc:  '1:1 permanent mapping. Same public IP always represents the same private host. Used for servers that must be reachable from internet.',
      mapping: [
        { priv: '10.0.1.100', pub: '203.0.113.100', permanent: true },
      ],
    },
    dynamic: {
      label: 'Dynamic NAT',  color: '#7c4dff',
      desc:  'Pool of public IPs assigned on demand. First host to initiate gets the first available public IP. No port translation — each host needs its own public IP.',
      mapping: [
        { priv: '10.0.1.10',  pub: '203.0.113.10', permanent: false },
        { priv: '10.0.1.11',  pub: '203.0.113.11', permanent: false },
      ],
    },
    pat: {
      label: 'PAT (Overload)', color: '#00e676',
      desc:  'Many private hosts share ONE public IP using unique source port numbers. The most common type — how your home router works.',
      mapping: [
        { priv: '10.0.1.10:52341', pub: '203.0.113.1:1024', permanent: false },
        { priv: '10.0.1.11:49201', pub: '203.0.113.1:1025', permanent: false },
        { priv: '10.0.1.12:60001', pub: '203.0.113.1:1026', permanent: false },
      ],
    },
  };
  const t = types[mode];
  useEffect(() => {
    if (isPaused || step >= t.mapping.length) return;
    const tm = setTimeout(() => setStep(s => s + 1), 900);
    return () => clearTimeout(tm);
  }, [step, isPaused, mode]);
  function reset(m) { setMode(m); setStep(0); setIsPaused(false); }
  return (
    <InlineViz label="NAT TYPES — STATIC vs DYNAMIC vs PAT" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {Object.entries(types).map(([k, v]) => (
          <button key={k} onClick={() => reset(k)} style={{
            padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === k ? `${v.color}20` : 'var(--bg-elevated)',
            border: `1px solid ${mode === k ? v.color : 'var(--border-subtle)'}`,
            color: mode === k ? v.color : 'var(--text-muted)', transition: 'all 0.2s',
          }}>{v.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={() => reset(mode)}>↺</button>
        </div>
      </div>
      {/* Translation table */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 5 }}>
          TRANSLATION TABLE — show ip nat translations
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              {['Inside Local', 'Inside Global', 'Type'].map(h => (
                <th key={h} style={{ padding: '4px 10px', textAlign: 'left',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)', fontSize: '0.5875rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.mapping.map((m, i) => step > i && (
              <tr key={i} style={{ background: `${t.color}08` }}>
                <td style={{ padding: '5px 10px', color: '#00e5ff' }}>{m.priv}</td>
                <td style={{ padding: '5px 10px', color: t.color, fontWeight: 700 }}>{m.pub}</td>
                <td style={{ padding: '5px 10px', color: 'var(--text-muted)', fontSize: '0.625rem' }}>
                  {t.label}
                </td>
              </tr>
            ))}
            {step === 0 && (
              <tr><td colSpan={3} style={{ padding: '5px 10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>(empty — waiting for traffic)</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: `${t.color}08`, border: `1px solid ${t.color}30`,
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {t.desc}
      </div>
    </InlineViz>
  );
}

// ── PAT — port tracking animation ────────────────────────
function PatPortTracking() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const flows = [
    { client: '10.0.1.10', sport: 52341, dst: '8.8.8.8:53',    proto: 'UDP', natPort: 1024, color: '#00e5ff' },
    { client: '10.0.1.11', sport: 49201, dst: '142.250.4.46:443', proto: 'TCP', natPort: 1025, color: '#00e676' },
    { client: '10.0.1.10', sport: 60001, dst: '13.32.0.10:80',  proto: 'TCP', natPort: 1026, color: '#7c4dff' },
    { client: '10.0.1.12', sport: 44444, dst: '8.8.8.8:53',    proto: 'UDP', natPort: 1027, color: '#ffab00' },
  ];
  useEffect(() => {
    if (isPaused || step >= flows.length) return;
    const t = setTimeout(() => setStep(s => s + 1), 1000);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="PAT — HOW PORT NUMBERS TRACK SESSIONS (203.0.113.1 shared)" accent="#00e676">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
      </div>
      {/* Live translation table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', marginBottom: 12 }}>
        <thead>
          <tr>
            {['Proto','Inside Local','Inside Global','Outside'].map(h => (
              <th key={h} style={{ padding: '4px 8px', textAlign: 'left',
                borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.5875rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {flows.map((f, i) => step > i && (
            <tr key={i}>
              <td style={{ padding: '4px 8px', color: f.color }}>{f.proto}</td>
              <td style={{ padding: '4px 8px', color: '#00e5ff' }}>{f.client}:{f.sport}</td>
              <td style={{ padding: '4px 8px', color: f.color, fontWeight: 700 }}>203.0.113.1:{f.natPort}</td>
              <td style={{ padding: '4px 8px', color: 'var(--text-muted)' }}>{f.dst}</td>
            </tr>
          ))}
          {step === 0 && (
            <tr><td colSpan={4} style={{ padding: '4px 8px', color: 'var(--text-muted)', fontStyle: 'italic' }}>(no active sessions)</td></tr>
          )}
        </tbody>
      </table>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)',
        fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {step === 0 && 'All four hosts share a single public IP: 203.0.113.1. Each session is tracked by source port.'}
        {step === 1 && `10.0.1.10 connects to 8.8.8.8:53 (DNS). PAT assigns port 1024 on the public IP.`}
        {step === 2 && `10.0.1.11 connects to 142.250.4.46:443 (HTTPS). PAT assigns port 1025 — different session, same public IP.`}
        {step === 3 && `10.0.1.10 opens a second session to a different server. PAT assigns a new port 1026 — same private host, new translation entry.`}
        {step >= 4 && `✓ 4 simultaneous sessions from 3 different hosts all share 203.0.113.1. Return traffic is de-multiplexed by destination port number.`}
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// ACL INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── ACL Types — standard vs extended ─────────────────────
function AclTypesComparison() {
  const [selected, setSelected] = React.useState('extended');
  const types = {
    standard: {
      label: 'Standard ACL',
      range: '1–99, 1300–1999',
      color: '#ffab00',
      matches: ['Source IP address only'],
      cannot: ['Destination IP', 'Protocol (TCP/UDP/ICMP)', 'Port numbers', 'Flags (SYN, ACK)'],
      placement: 'Place CLOSE TO DESTINATION — because it can only match source IP, placing near source would block traffic to ALL destinations.',
      example: 'access-list 10 permit 10.0.1.0 0.0.0.255',
      use: 'Simple permit/deny by source. Good for route-map match or VTY line access control.',
    },
    extended: {
      label: 'Extended ACL',
      range: '100–199, 2000–2699',
      color: '#00e5ff',
      matches: ['Source IP + wildcard', 'Destination IP + wildcard', 'Protocol (TCP/UDP/ICMP/IP)', 'Source & destination port', 'TCP flags (established, syn)'],
      cannot: ['Application payload (use NBAR/DPI for that)'],
      placement: 'Place CLOSE TO SOURCE — because it can match destination, it only blocks specific unwanted traffic without affecting other flows.',
      example: 'access-list 110 deny tcp 10.0.1.0 0.0.0.255 any eq 23\naccess-list 110 permit ip any any',
      use: 'Granular filtering. Blocks specific protocols and ports while permitting others.',
    },
    named: {
      label: 'Named ACL',
      range: 'Any text name',
      color: '#7c4dff',
      matches: ['Same as standard or extended', 'Specified by "standard" or "extended" keyword'],
      cannot: ['Nothing extra over numbered — just easier management'],
      placement: 'Same rules as numbered equivalents apply.',
      example: 'ip access-list extended BLOCK-TELNET\n deny tcp any any eq 23\n permit ip any any',
      use: 'Preferred in production. Can insert/delete individual lines. Descriptive names improve readability.',
    },
  };
  const t = types[selected];
  return (
    <InlineViz label="ACL TYPES — STANDARD vs EXTENDED vs NAMED" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {Object.entries(types).map(([k, v]) => (
          <button key={k} onClick={() => setSelected(k)} style={{
            padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: selected === k ? `${v.color}20` : 'var(--bg-elevated)',
            border: `1px solid ${selected === k ? v.color : 'var(--border-subtle)'}`,
            color: selected === k ? v.color : 'var(--text-muted)', transition: 'all 0.2s',
          }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 6 }}>CAN MATCH</div>
          {t.matches.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'flex-start' }}>
              <span style={{ color: '#00e676', flexShrink: 0, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m}</span>
            </div>
          ))}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginTop: 10, marginBottom: 6 }}>CANNOT MATCH</div>
          {t.cannot.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'flex-start' }}>
              <span style={{ color: '#ff5252', flexShrink: 0, fontWeight: 700 }}>✗</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 6 }}>PLACEMENT RULE</div>
          <div style={{ padding: '8px 10px', borderRadius: 5, background: `${t.color}10`,
            border: `1px solid ${t.color}30`, fontSize: '0.75rem', color: 'var(--text-secondary)',
            lineHeight: 1.6, marginBottom: 10 }}>{t.placement}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 6 }}>EXAMPLE</div>
          <pre style={{ background: 'var(--bg-terminal)', border: '1px solid var(--border-subtle)',
            borderRadius: 4, padding: '6px 8px', fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem', color: t.color, overflowX: 'auto', lineHeight: 1.6,
            margin: 0 }}>{t.example}</pre>
        </div>
      </div>
    </InlineViz>
  );
}

// ── ACL Processing — top-down first-match animation ───────
function AclProcessingAnim() {
  const [packetSrc, setPacketSrc] = React.useState('10.0.1.50');
  const [step, setStep] = React.useState(-1);
  const [isPaused, setIsPaused] = React.useState(false);
  const acl = [
    { seq: 10,  action: 'deny',   match: '10.0.1.50 0.0.0.0', desc: 'Deny specific host 10.0.1.50', color: '#ff5252' },
    { seq: 20,  action: 'permit', match: '10.0.1.0 0.0.0.255', desc: 'Permit the entire /24 subnet', color: '#00e676' },
    { seq: 30,  action: 'permit', match: '192.168.1.0 0.0.0.255', desc: 'Permit another subnet', color: '#00e676' },
    { seq: null, action: 'deny',  match: 'any',                desc: 'Implicit deny — always at end', color: '#78909c' },
  ];
  const packets = {
    '10.0.1.50':  { matchIdx: 0, result: 'deny',   reason: 'Matches ACE 10 (exact host match)' },
    '10.0.1.100': { matchIdx: 1, result: 'permit', reason: 'No match on ACE 10, matches ACE 20 (/24 subnet)' },
    '172.16.0.1': { matchIdx: 3, result: 'deny',   reason: 'No match on any explicit ACE — hits implicit deny' },
  };
  const pkt = packets[packetSrc];
  useEffect(() => {
    setStep(-1);
    const t = setTimeout(() => setStep(0), 300);
    return () => clearTimeout(t);
  }, [packetSrc]);
  useEffect(() => {
    if (isPaused || step < 0 || step >= pkt.matchIdx) return;
    const t = setTimeout(() => setStep(s => s + 1), 700);
    return () => clearTimeout(t);
  }, [step, isPaused, packetSrc]);
  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 200); }
  return (
    <InlineViz label="ACL PROCESSING — TOP-DOWN, FIRST MATCH WINS" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Packet src:</span>
        {Object.keys(packets).map(ip => (
          <button key={ip} onClick={() => { setPacketSrc(ip); setIsPaused(false); }} style={{
            padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
            background: packetSrc === ip ? 'rgba(0,229,255,0.15)' : 'var(--bg-elevated)',
            border: `1px solid ${packetSrc === ip ? '#00e5ff' : 'var(--border-subtle)'}`,
            color: packetSrc === ip ? '#00e5ff' : 'var(--text-muted)',
          }}>{ip}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={replay}>↺</button>
        </div>
      </div>
      {/* ACL entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {acl.map((ace, i) => {
          const isCurrent = step === i;
          const isPast    = step > i && i < pkt.matchIdx;
          const isMatch   = step >= pkt.matchIdx && i === pkt.matchIdx;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
              borderRadius: 5, transition: 'all 0.4s',
              background: isMatch ? `${ace.color}18` : isCurrent ? 'rgba(0,229,255,0.08)' : isPast ? 'rgba(120,144,156,0.06)' : 'var(--bg-elevated)',
              border: `1px solid ${isMatch ? ace.color : isCurrent ? '#00e5ff' : isPast ? 'rgba(120,144,156,0.2)' : 'var(--border-subtle)'}`,
              opacity: step < 0 ? 0.4 : 1,
            }}>
              {/* Sequence */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
                color: 'var(--text-muted)', width: 24, flexShrink: 0, textAlign: 'right' }}>
                {ace.seq || '—'}
              </div>
              {/* Action badge */}
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem',
                color: ace.color, background: `${ace.color}18`, padding: '2px 8px',
                borderRadius: 4, flexShrink: 0, width: 50, textAlign: 'center' }}>
                {ace.action.toUpperCase()}
              </div>
              {/* Match */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                color: isMatch ? ace.color : 'var(--text-secondary)', flex: 1 }}>{ace.match}</div>
              {/* Status */}
              <div style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {isMatch && <span style={{ color: ace.color, fontWeight: 700 }}>← MATCH</span>}
                {isPast && <span style={{ color: '#78909c' }}>no match ↓</span>}
                {isCurrent && !isMatch && <span style={{ color: '#00e5ff' }}>checking…</span>}
              </div>
            </div>
          );
        })}
      </div>
      {/* Result */}
      {step >= pkt.matchIdx && (
        <div style={{ padding: '8px 12px', borderRadius: 5,
          background: pkt.result === 'permit' ? 'rgba(0,230,118,0.10)' : 'rgba(255,82,82,0.10)',
          border: `1px solid ${pkt.result === 'permit' ? '#00e676' : '#ff5252'}30`,
          fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
            color: pkt.result === 'permit' ? '#00e676' : '#ff5252' }}>
            {pkt.result === 'permit' ? '✓ PERMIT' : '✗ DENY'}
          </span>{' — '}{pkt.reason}
        </div>
      )}
    </InlineViz>
  );
}

// ── ACL Direction — inbound vs outbound ───────────────────
function AclDirectionViz() {
  const [dir, setDir] = React.useState('in');
  const isIn = dir === 'in';
  return (
    <InlineViz label="ACL DIRECTION — INBOUND vs OUTBOUND ON AN INTERFACE" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['in','Inbound (in)'],['out','Outbound (out)']].map(([d, label]) => (
          <button key={d} onClick={() => setDir(d)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: dir === d ? 'rgba(124,77,255,0.15)' : 'var(--bg-elevated)',
            border: `1px solid ${dir === d ? '#7c4dff' : 'var(--border-subtle)'}`,
            color: dir === d ? '#7c4dff' : 'var(--text-muted)',
          }}>{label}</button>
        ))}
      </div>
      <svg viewBox="0 0 420 120" style={{ width: '100%', maxHeight: 120, display: 'block', marginBottom: 12 }}>
        {/* Router */}
        <rect x="160" y="40" width="100" height="40" rx="5"
          fill="rgba(124,77,255,0.1)" stroke="#7c4dff" strokeWidth="1.5"/>
        <text x="210" y="58" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="11" fontWeight="bold">Router</text>
        <text x="210" y="71" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">
          ip access-group ACL {dir}
        </text>
        {/* Interface label */}
        <text x="210" y="28" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="8">Gi0/0</text>
        {/* Incoming traffic */}
        <line x1="30" y1="60" x2="160" y2="60" stroke={isIn ? '#ff5252' : '#546e7a'} strokeWidth="2.5"
          style={{ transition: 'stroke 0.4s' }}/>
        <polygon points="155,55 163,60 155,65" fill={isIn ? '#ff5252' : '#546e7a'}
          style={{ transition: 'fill 0.4s' }}/>
        {/* ACL check box on inbound */}
        {isIn && (
          <g>
            <rect x="70" y="45" width="55" height="28" rx="4"
              fill="rgba(255,82,82,0.15)" stroke="#ff5252" strokeWidth="1.5"/>
            <text x="97" y="58" textAnchor="middle" fill="#ff5252" fontFamily="monospace" fontSize="8" fontWeight="bold">ACL</text>
            <text x="97" y="68" textAnchor="middle" fill="#ff5252" fontFamily="monospace" fontSize="7">checked</text>
          </g>
        )}
        {/* Label */}
        <text x="97" y="95" textAnchor="middle" fill={isIn ? '#ff5252' : '#546e7a'}
          fontFamily="monospace" fontSize="8">
          {isIn ? '← packets ENTERING' : '← packets entering (no ACL)'}
        </text>
        {/* Outgoing traffic */}
        <line x1="260" y1="60" x2="390" y2="60" stroke={!isIn ? '#ff5252' : '#546e7a'} strokeWidth="2.5"
          style={{ transition: 'stroke 0.4s' }}/>
        <polygon points="385,55 393,60 385,65" fill={!isIn ? '#ff5252' : '#546e7a'}
          style={{ transition: 'fill 0.4s' }}/>
        {/* ACL check box on outbound */}
        {!isIn && (
          <g>
            <rect x="300" y="45" width="55" height="28" rx="4"
              fill="rgba(255,82,82,0.15)" stroke="#ff5252" strokeWidth="1.5"/>
            <text x="327" y="58" textAnchor="middle" fill="#ff5252" fontFamily="monospace" fontSize="8" fontWeight="bold">ACL</text>
            <text x="327" y="68" textAnchor="middle" fill="#ff5252" fontFamily="monospace" fontSize="7">checked</text>
          </g>
        )}
        <text x="327" y="95" textAnchor="middle" fill={!isIn ? '#ff5252' : '#546e7a'}
          fontFamily="monospace" fontSize="8">
          {!isIn ? 'packets LEAVING →' : 'packets leaving (no ACL) →'}
        </text>
      </svg>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.25)',
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {isIn
          ? 'Inbound ACL: packets are checked BEFORE being routed. Most efficient — drops unwanted traffic immediately without consuming routing resources. Use when filtering traffic arriving from an untrusted network.'
          : 'Outbound ACL: packets are checked AFTER routing, just before leaving the interface. Use when the same traffic comes from multiple input interfaces and you want to filter at the exit point.'}
        <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--accent)' }}>
          ip access-group {isIn ? 'BLOCK-TELNET in' : 'PERMIT-MGMT out'}
        </div>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// SSH INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── SSH vs Telnet — plaintext vs encrypted ────────────────
function SshVsTelnet() {
  const [mode, setMode] = React.useState('telnet');
  const isTelnet = mode === 'telnet';
  const telnetCapture = [
    { bytes: 'ff fd 18 ff fd 20 ff fd 23', decoded: 'Telnet option negotiation (plaintext)' },
    { bytes: '75 73 65 72 6e 61 6d 65 3a', decoded: '"username:" — visible to anyone on the wire' },
    { bytes: '61 64 6d 69 6e',             decoded: '"admin" — username in plaintext ⚠' },
    { bytes: '70 61 73 73 77 6f 72 64 3a', decoded: '"password:" — visible to anyone on the wire' },
    { bytes: '53 75 70 65 72 53 65 63 72', decoded: '"SuperSecr…" — password in plaintext ⚠' },
  ];
  const sshCapture = [
    { bytes: 'SS H-2.0-OpenSSH_8.9p1',   decoded: 'Version banner — only non-encrypted part' },
    { bytes: '00 00 05 dc 06 14 …',       decoded: 'Key Exchange Init (DH parameters)' },
    { bytes: 'c3 9a f2 08 b1 7d 45 …',   decoded: 'Encrypted payload — unreadable without key' },
    { bytes: 'a4 f9 12 88 3c e0 71 …',   decoded: 'Encrypted payload — credentials hidden' },
    { bytes: '8b 2d 9f 04 17 cc 5a …',   decoded: 'Encrypted payload — all commands hidden' },
  ];
  const capture = isTelnet ? telnetCapture : sshCapture;
  return (
    <InlineViz label="SSH vs TELNET — WHAT AN ATTACKER SEES ON THE WIRE" accent={isTelnet ? '#ff5252' : '#00e676'}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['telnet','Telnet (TCP 23)'],['ssh','SSH (TCP 22)']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? (m==='telnet' ? 'rgba(255,82,82,0.15)' : 'rgba(0,230,118,0.15)') : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? (m==='telnet' ? '#ff5252' : '#00e676') : 'var(--border-subtle)'}`,
            color: mode === m ? (m==='telnet' ? '#ff5252' : '#00e676') : 'var(--text-muted)',
          }}>{label}</button>
        ))}
      </div>
      {/* Simulated packet capture */}
      <div style={{ background: 'var(--bg-terminal)', border: '1px solid var(--border-subtle)',
        borderRadius: 6, padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.5875rem' }}>
          Wireshark capture — {isTelnet ? 'TCP stream follow' : 'SSH session'}
        </div>
        {capture.map((row, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 6, alignItems: 'flex-start' }}>
            <div style={{ color: '#546e7a', width: 180, flexShrink: 0, letterSpacing: '0.05em' }}>
              {row.bytes}
            </div>
            <div style={{ color: isTelnet && row.decoded.includes('⚠') ? '#ff5252' : (isTelnet ? '#ffab00' : '#00e676'),
              flex: 1, fontSize: '0.625rem' }}>
              {row.decoded}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 5,
        background: isTelnet ? 'rgba(255,82,82,0.08)' : 'rgba(0,230,118,0.08)',
        border: `1px solid ${isTelnet ? 'rgba(255,82,82,0.25)' : 'rgba(0,230,118,0.25)'}`,
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {isTelnet
          ? '⚠ Telnet sends everything in plaintext. Any attacker with access to the network path can capture credentials with a simple packet sniffer. Never use Telnet for device management.'
          : '✓ SSH encrypts the entire session after the key exchange. An attacker can see the connection metadata but cannot read any commands, credentials, or output.'}
      </div>
    </InlineViz>
  );
}

// ── SSH Handshake — animated 4-phase sequence ─────────────
function SshHandshakeAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const phases = [
    {
      name: 'TCP Connection',
      color: '#78909c',
      desc: 'Client opens TCP connection to server port 22. Three-way handshake completes.',
      client: 'SYN →',
      server: '← SYN-ACK',
    },
    {
      name: 'Version Exchange',
      color: '#ffab00',
      desc: 'Both sides announce their SSH version. Only plaintext exchanged so far.',
      client: 'SSH-2.0-OpenSSH_8.9 →',
      server: '← SSH-2.0-Cisco-2.0',
    },
    {
      name: 'Key Exchange (DH)',
      color: '#7c4dff',
      desc: 'Diffie-Hellman key exchange. Both sides generate a shared secret without ever sending it — an attacker cannot derive it from the exchanged values.',
      client: 'KexInit + DH public key →',
      server: '← DH public key + host key + signature',
    },
    {
      name: 'Server Auth',
      color: '#f43f5e',
      desc: 'Client verifies the server\'s host key against known_hosts. First connection asks "trust this key?" — subsequent connections auto-verify.',
      client: 'Verify host key fingerprint',
      server: null,
    },
    {
      name: 'User Auth',
      color: '#00e5ff',
      desc: 'User credentials sent — encrypted inside the secure channel. Can be password or public key. All transmitted bytes are ciphertext at this point.',
      client: '→ username + password (encrypted)',
      server: '← success/failure (encrypted)',
    },
    {
      name: 'Encrypted Session',
      color: '#00e676',
      desc: '✓ Secure channel established. All commands and output are encrypted with AES. Session continues until logout or timeout.',
      client: '→ commands (encrypted)',
      server: '← output (encrypted)',
    },
  ];
  useEffect(() => {
    if (isPaused || step >= phases.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="SSH HANDSHAKE — 4 PHASES TO SECURE CHANNEL" accent="#00e676">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
      </div>
      {/* Phase progress */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, overflowX: 'auto' }}>
        {phases.map((p, i) => (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              opacity: step >= i ? 1 : 0.25, transition: 'opacity 0.5s', minWidth: 60,
            }}>
              <div style={{
                width: 44, height: 36, borderRadius: 5, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: step >= i ? `${p.color}20` : 'var(--bg-elevated)',
                border: `1.5px solid ${step >= i ? p.color : 'var(--border-subtle)'}`,
                fontFamily: 'var(--font-mono)', fontSize: '0.45rem', fontWeight: 700,
                color: step >= i ? p.color : 'var(--text-muted)', textAlign: 'center', padding: 2,
                boxShadow: step === i ? `0 0 12px ${p.color}40` : 'none',
                transition: 'all 0.4s', lineHeight: 1.3,
              }}>{p.name}</div>
            </div>
            {i < phases.length - 1 && (
              <div style={{ width: 12, height: 2, alignSelf: 'center', flexShrink: 0, marginBottom: 10,
                background: step > i ? phases[i].color : 'var(--border-subtle)',
                transition: 'background 0.4s' }}/>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* Current phase detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        {/* Client */}
        <div style={{ padding: '8px 10px', borderRadius: 5, background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.25)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem',
            color: '#00e5ff', marginBottom: 4 }}>CLIENT</div>
          {phases[step].client && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
              color: phases[step].color }}>{phases[step].client}</div>
          )}
        </div>
        {/* Arrow */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem',
          color: phases[step].color, textAlign: 'center' }}>⇌</div>
        {/* Server */}
        <div style={{ padding: '8px 10px', borderRadius: 5, background: 'rgba(0,230,118,0.08)',
          border: '1px solid rgba(0,230,118,0.25)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem',
            color: '#00e676', marginBottom: 4 }}>ROUTER / SERVER</div>
          {phases[step].server && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
              color: phases[step].color }}>{phases[step].server}</div>
          )}
        </div>
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: `${phases[step].color}10`,
        border: `1px solid ${phases[step].color}30`,
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: phases[step].color }}>{phases[step].name}: </span>
        {phases[step].desc}
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// FIREWALL INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Firewall Types — comparison ───────────────────────────
function FirewallTypesComparison() {
  const [selected, setSelected] = React.useState('stateful');
  const types = {
    packet: {
      label: 'Packet Filter',
      gen: 'Generation 1',
      color: '#ffab00',
      desc: 'Inspects each packet in isolation against static ACL rules. No memory of previous packets — cannot detect multi-packet attacks.',
      matches: ['Source/Destination IP', 'Protocol (TCP/UDP/ICMP)', 'Port numbers'],
      blind: ['Connection state (SYN vs established)', 'Application payload', 'Fragmented attack packets'],
      example: 'Cisco IOS extended ACLs',
    },
    stateful: {
      label: 'Stateful Firewall',
      gen: 'Generation 2',
      color: '#00e5ff',
      desc: 'Tracks the state of every active connection in a state table. Can distinguish between a new connection attempt and a reply to an established session.',
      matches: ['All packet filter criteria', 'Connection state (NEW/ESTABLISHED/RELATED)', 'TCP flags (SYN flood detection)', 'Return traffic auto-permitted'],
      blind: ['Application-layer content', 'Encrypted traffic', 'Evasion via allowed ports (HTTP/S)'],
      example: 'Cisco ASA, IOS Zone-Based Firewall',
    },
    ngfw: {
      label: 'NGFW',
      gen: 'Generation 3',
      color: '#00e676',
      desc: 'Next-Generation Firewall adds deep packet inspection, application identification, user identity, IPS, and TLS inspection on top of stateful tracking.',
      matches: ['All stateful criteria', 'Application identity (Facebook, Netflix, BitTorrent)', 'User identity (AD/LDAP integration)', 'URL categories', 'TLS/SSL decryption & inspection'],
      blind: ['Truly novel/unknown threats (requires threat intel updates)', 'Perfect-forward-secrecy TLS without decryption'],
      example: 'Cisco Firepower (FTD), Palo Alto PA-series',
    },
  };
  const t = types[selected];
  return (
    <InlineViz label="FIREWALL TYPES — THREE GENERATIONS" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {Object.entries(types).map(([k, v]) => (
          <button key={k} onClick={() => setSelected(k)} style={{
            padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: selected === k ? `${v.color}20` : 'var(--bg-elevated)',
            border: `1px solid ${selected === k ? v.color : 'var(--border-subtle)'}`,
            color: selected === k ? v.color : 'var(--text-muted)', transition: 'all 0.2s',
          }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: '#00e676', marginBottom: 5 }}>✓ CAN INSPECT</div>
          {t.matches.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
              <span style={{ color: '#00e676', flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: '#ff5252', marginBottom: 5 }}>✗ CANNOT SEE</div>
          {t.blind.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
              <span style={{ color: '#ff5252', flexShrink: 0 }}>✗</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 5, background: `${t.color}08`,
        border: `1px solid ${t.color}30`, marginBottom: 6 }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>{t.desc}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: t.color }}>
          Example: {t.example}
        </div>
      </div>
    </InlineViz>
  );
}

// ── Zone-Based Firewall — topology + policies ──────────────
function ZbfTopology() {
  const [flow, setFlow] = React.useState(null);
  const flows = [
    { id: 'out-in',  from: 'OUTSIDE', to: 'INSIDE', label: 'Internet → Corp',     result: 'deny',   color: '#ff5252', rule: 'Default deny — no unsolicited inbound traffic from internet to corp network.' },
    { id: 'in-out',  from: 'INSIDE',  to: 'OUTSIDE', label: 'Corp → Internet',     result: 'permit', color: '#00e676', rule: 'Permit outbound web/email. Stateful — return traffic auto-allowed.' },
    { id: 'out-dmz', from: 'OUTSIDE', to: 'DMZ',     label: 'Internet → Web Server', result: 'permit', color: '#ffab00', rule: 'Explicit permit TCP 80/443 to DMZ web server only. All other ports denied.' },
    { id: 'dmz-in',  from: 'DMZ',     to: 'INSIDE',  label: 'Web Server → Corp DB',  result: 'deny',   color: '#ff5252', rule: 'DMZ cannot initiate connections to INSIDE — compromise of web server doesn\'t reach core network.' },
    { id: 'in-dmz',  from: 'INSIDE',  to: 'DMZ',     label: 'Admin → Web Server',    result: 'permit', color: '#00e676', rule: 'Admin hosts permitted SSH access to DMZ servers for management.' },
  ];
  const zones = [
    { name: 'OUTSIDE', color: '#ff5252', x: 30,  y: 75, desc: 'Untrusted (internet)' },
    { name: 'DMZ',     color: '#ffab00', x: 200, y: 30, desc: 'Semi-trusted (servers)' },
    { name: 'INSIDE',  color: '#00e676', x: 370, y: 75, desc: 'Trusted (corporate)' },
  ];
  const active = flow ? flows.find(f => f.id === flow) : null;
  return (
    <InlineViz label="ZONE-BASED FIREWALL — ZONES AND TRAFFIC POLICIES" accent="#ff6d00">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <svg viewBox="0 0 420 155" style={{ width: '100%', maxHeight: 155, display: 'block', marginBottom: 10 }}>
            {/* Firewall box */}
            <rect x="175" y="60" width="70" height="35" rx="5"
              fill="rgba(255,109,0,0.15)" stroke="#ff6d00" strokeWidth="2"/>
            <text x="210" y="75" textAnchor="middle" fill="#ff6d00"
              fontFamily="monospace" fontSize="10" fontWeight="bold">FW</text>
            <text x="210" y="87" textAnchor="middle" fill="#ff6d00"
              fontFamily="monospace" fontSize="8">Zone-Based</text>
            {/* Zones */}
            {zones.map((z, i) => (
              <g key={i}>
                <rect x={z.x - 50} y={z.y - 20} width={100} height={40} rx={5}
                  fill={`${z.color}12`} stroke={`${z.color}50`} strokeWidth={1.5}/>
                <text x={z.x} y={z.y - 5} textAnchor="middle" fill={z.color}
                  fontFamily="monospace" fontSize="10" fontWeight="bold">{z.name}</text>
                <text x={z.x} y={z.y + 8} textAnchor="middle" fill={z.color}
                  fontFamily="monospace" fontSize="7">{z.desc}</text>
              </g>
            ))}
            {/* Links to firewall */}
            <line x1="80"  y1="75" x2="175" y2="77" stroke="#546e7a" strokeWidth="1.5"/>
            <line x1="200" y1="50" x2="200" y2="60" stroke="#546e7a" strokeWidth="1.5"/>
            <line x1="320" y1="75" x2="245" y2="77" stroke="#546e7a" strokeWidth="1.5"/>
            {/* Flow arrows */}
            {flows.map(f => {
              const isActive = flow === f.id;
              const fromZ = zones.find(z => z.name === f.from);
              const toZ   = zones.find(z => z.name === f.to);
              if (!isActive) return null;
              return (
                <g key={f.id}>
                  <line x1={fromZ.x} y1={fromZ.y + 22} x2={toZ.x} y2={toZ.y + 22}
                    stroke={f.color} strokeWidth="2.5" strokeDasharray={f.result==='deny'?'5,3':'none'}
                    markerEnd="url(#arrowFw)"/>
                  <text x={(fromZ.x+toZ.x)/2} y={120} textAnchor="middle"
                    fill={f.color} fontFamily="monospace" fontSize="9" fontWeight="bold">
                    {f.result === 'permit' ? '✓ PERMIT' : '✗ DENY'}
                  </text>
                </g>
              );
            })}
          </svg>
          {/* Flow buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {flows.map(f => (
              <button key={f.id} onClick={() => setFlow(flow === f.id ? null : f.id)} style={{
                padding: '5px 10px', borderRadius: 5, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
                background: flow === f.id ? `${f.color}18` : 'var(--bg-elevated)',
                border: `1px solid ${flow === f.id ? f.color : 'var(--border-subtle)'}`,
                color: flow === f.id ? f.color : 'var(--text-secondary)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontWeight: 700 }}>{f.result === 'permit' ? '✓' : '✗'}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ minWidth: 160, flex: 1 }}>
          {active ? (
            <div style={{ padding: '10px 12px', borderRadius: 6,
              background: `${active.color}10`, border: `1px solid ${active.color}40` }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: active.color, marginBottom: 6, fontSize: '0.75rem' }}>
                {active.from} → {active.to}:{' '}
                <span style={{ textTransform: 'uppercase' }}>{active.result}</span>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {active.rule}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Click a traffic flow to see the zone-pair policy that controls it.
            </p>
          )}
          <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 5,
            background: 'rgba(255,109,0,0.06)', border: '1px solid rgba(255,109,0,0.2)',
            fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            ZBF key rule: traffic between zones requires an explicit zone-pair + service-policy. Traffic within the same zone is permitted by default. Self-zone (router itself) needs its own policy.
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Stateful Inspection — connection table ────────────────
function StatefulInspectionAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const events = [
    { desc: 'Host 10.0.1.10 sends SYN to 8.8.8.8:443. Firewall sees NEW connection.', action: 'add', entry: { src: '10.0.1.10:52341', dst: '8.8.8.8:443', proto: 'TCP', state: 'SYN_SENT', color: '#ffab00' } },
    { desc: 'SYN-ACK returns from 8.8.8.8. State upgrades to ESTABLISHED. Return traffic auto-permitted — no ACL needed.', action: 'update', entry: { src: '10.0.1.10:52341', dst: '8.8.8.8:443', proto: 'TCP', state: 'ESTABLISHED', color: '#00e676' } },
    { desc: 'Second host 10.0.1.11 opens DNS query to 1.1.1.1:53 (UDP). Added to state table.', action: 'add', entry: { src: '10.0.1.11:49201', dst: '1.1.1.1:53', proto: 'UDP', state: 'SINGLE', color: '#00e5ff' } },
    { desc: 'Attacker sends unsolicited SYN from internet to 10.0.1.10. No matching state entry — DROPPED.', action: 'drop', entry: { src: '203.0.113.99:80', dst: '10.0.1.10:445', proto: 'TCP', state: 'BLOCKED', color: '#ff5252' } },
  ];
  const [table, setTable] = React.useState([]);
  useEffect(() => {
    if (isPaused || step >= events.length) return;
    const t = setTimeout(() => {
      const ev = events[step];
      if (ev.action === 'add') setTable(prev => [...prev, ev.entry]);
      else if (ev.action === 'update') setTable(prev => prev.map((e, i) => i === 0 ? ev.entry : e));
      setStep(s => s + 1);
    }, 1200);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function replay() { setStep(0); setTable([]); setIsPaused(false); }
  return (
    <InlineViz label="STATEFUL INSPECTION — CONNECTION STATE TABLE" accent="#00e5ff">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={replay}>↺</button>
      </div>
      {/* State table */}
      <table style={{ width: '100%', borderCollapse: 'collapse',
        fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', marginBottom: 12 }}>
        <thead>
          <tr>
            {['Proto','Source','Destination','State'].map(h => (
              <th key={h} style={{ padding: '4px 8px', textAlign: 'left',
                borderBottom: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)', fontSize: '0.5875rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.length === 0 && (
            <tr><td colSpan={4} style={{ padding: '6px 8px', color: 'var(--text-muted)', fontStyle: 'italic' }}>(empty — no active sessions)</td></tr>
          )}
          {table.map((e, i) => (
            <tr key={i} style={{ background: `${e.color}08` }}>
              <td style={{ padding: '5px 8px', color: e.color }}>{e.proto}</td>
              <td style={{ padding: '5px 8px', color: '#00e5ff' }}>{e.src}</td>
              <td style={{ padding: '5px 8px', color: 'var(--text-secondary)' }}>{e.dst}</td>
              <td style={{ padding: '5px 8px', fontWeight: 700, color: e.color }}>{e.state}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {step > 0 && step <= events.length && (
        <div style={{ padding: '8px 12px', borderRadius: 5,
          background: `${events[step-1].entry.color}10`,
          border: `1px solid ${events[step-1].entry.color}30`,
          fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {events[step-1].desc}
        </div>
      )}
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// AUTONOMOUS SYSTEMS INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Internet Structure — Tier hierarchy ───────────────────
function InternetTierHierarchy() {
  const [hovered, setHovered] = React.useState(null);
  const tiers = [
    {
      tier: 1, label: 'Tier 1 — Global Transit',
      color: '#f43f5e', y: 20,
      nodes: ['AT&T (AS7018)', 'NTT (AS2914)', 'Telia (AS1299)', 'Level3 (AS3356)'],
      desc: 'Global backbone providers. Peer freely with each other — no transit fees. Can reach every prefix on the internet without paying upstream. ~15 networks worldwide.',
      links: 'settlement-free peering',
    },
    {
      tier: 2, label: 'Tier 2 — Regional ISPs',
      color: '#7c4dff', y: 85,
      nodes: ['Comcast (AS7922)', 'Deutsche Telekom', 'BT (AS2856)', 'Telstra'],
      desc: 'Regional providers. Buy transit from Tier 1 for global reach. Peer with other Tier 2s where traffic volumes justify it. Your ISP is likely Tier 2 or Tier 3.',
      links: 'paid transit + peering',
    },
    {
      tier: 3, label: 'Tier 3 — Local / Access',
      color: '#00e5ff', y: 150,
      nodes: ['Local ISP A', 'Enterprise AS', 'University AS', 'Cloud DC AS'],
      desc: 'Last-mile providers and enterprise networks. Buy all transit from Tier 2 upstream. Typically single-homed or dual-homed. Many use private ASNs (64512–65534).',
      links: 'paid transit only',
    },
  ];
  return (
    <InlineViz label="INTERNET STRUCTURE — THREE-TIER AS HIERARCHY" accent="#f43f5e">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 380 200" style={{ width: 360, maxHeight: 200, flexShrink: 0 }}>
          {/* Tier connections */}
          {/* T1-T1 peering */}
          <line x1="75" y1="42" x2="155" y2="42" stroke="#f43f5e" strokeWidth="2"/>
          <line x1="155" y1="42" x2="235" y2="42" stroke="#f43f5e" strokeWidth="2"/>
          <line x1="235" y1="42" x2="305" y2="42" stroke="#f43f5e" strokeWidth="2"/>
          {/* T1-T2 transit */}
          {[75,155,235,305].map((x,i) => (
            <line key={i} x1={x} y1="50" x2={[75,155,235,305][i]} y2="95"
              stroke="#546e7a" strokeWidth="1" strokeDasharray="3,2"/>
          ))}
          {/* T2-T3 transit */}
          {[75,155,235,305].map((x,i) => (
            <line key={i} x1={x} y1="103" x2={[75,155,235,305][i]} y2="155"
              stroke="#546e7a" strokeWidth="1" strokeDasharray="3,2"/>
          ))}
          {tiers.map((t, ti) => (
            <g key={ti}>
              {/* Tier label */}
              <text x="5" y={t.y + 22} fill={t.color} fontFamily="monospace" fontSize="8" fontWeight="bold">{`T${t.tier}`}</text>
              {t.nodes.map((n, i) => {
                const x = 50 + i * 80;
                const isHov = hovered === `${ti}-${i}`;
                return (
                  <g key={i}
                    onMouseEnter={() => setHovered(`${ti}-${i}`)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: 'pointer' }}>
                    <rect x={x - 32} y={t.y + 8} width={64} height={26} rx={4}
                      fill={isHov ? `${t.color}22` : `${t.color}10`}
                      stroke={isHov ? t.color : `${t.color}40`} strokeWidth={isHov ? 2 : 1}
                      style={{ transition: 'all 0.2s' }}/>
                    <text x={x} y={t.y + 24} textAnchor="middle" fill={t.color}
                      fontFamily="monospace" fontSize="7" fontWeight="bold">{n.split(' ')[0]}</text>
                    <text x={x} y={t.y + 31} textAnchor="middle" fill="var(--text-muted)"
                      fontFamily="monospace" fontSize="6">{n.split('(')[1]?.replace(')','') || ''}</text>
                  </g>
                );
              })}
              {/* Link type label */}
              <text x="190" y={t.y + 70} textAnchor="middle" fill="var(--text-muted)"
                fontFamily="monospace" fontSize="7" fontStyle="italic">{t.links}</text>
            </g>
          ))}
        </svg>
        <div style={{ flex: 1, minWidth: 130 }}>
          {hovered ? (() => {
            const [ti] = hovered.split('-').map(Number);
            const t = tiers[ti];
            return (
              <div style={{ padding: '10px 12px', borderRadius: 6,
                background: `${t.color}10`, border: `1px solid ${t.color}40` }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: t.color, marginBottom: 6, fontSize: '0.75rem' }}>{t.label}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {t.desc}
                </div>
              </div>
            );
          })() : (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Hover any AS node to learn about that tier's role, cost model, and who operates at that level.
            </p>
          )}
          <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 5,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            fontSize: '0.625rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            T1↔T1: free settlement-free peering<br/>
            T2→T1: paid transit (per Mbps/Gbps)<br/>
            T3→T2: paid transit (per Mbps or flat)
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Peering Types — transit vs peering at IXP ────────────
function PeeringTypesViz() {
  const [selected, setSelected] = React.useState(null);
  const types = [
    {
      id: 'transit',
      label: 'Transit',
      color: '#ff5252',
      icon: '💰',
      desc: 'AS A pays AS B to carry traffic to/from the entire internet. AS B provides a default route. Used when AS A can\'t peer directly with every destination.',
      example: 'Your ISP sells you internet access — you pay for transit to all destinations.',
      direction: 'bidirectional, paid',
    },
    {
      id: 'peer',
      label: 'Settlement-Free Peering',
      color: '#00e676',
      icon: '🤝',
      desc: 'Two ASes exchange traffic for FREE between their own customers only. No default route exchanged. Traffic must originate or terminate within one of the two ASes.',
      example: 'Two large ISPs at an IXP agree to exchange traffic — saves both money on transit costs.',
      direction: 'bilateral, free',
    },
    {
      id: 'paid-peer',
      label: 'Paid Peering',
      color: '#ffab00',
      icon: '📄',
      desc: 'Peering where one side pays a smaller fee (less than transit). Common when traffic ratios are asymmetric — the side sending more traffic often pays.',
      example: 'Content provider with high outbound traffic pays a nominal fee to peer with a large ISP.',
      direction: 'bilateral, partial payment',
    },
    {
      id: 'customer',
      label: 'Customer Cone',
      color: '#7c4dff',
      icon: '📡',
      desc: 'The set of all ASes reachable through a provider\'s customer relationships. Providers carry customer routes to peers and upstreams to give customers global reach.',
      example: 'Enterprise buys transit from ISP — ISP advertises enterprise prefixes to its peers and upstreams.',
      direction: 'provider → customer routes',
    },
  ];
  return (
    <InlineViz label="PEERING TYPES — HOW ASes EXCHANGE TRAFFIC" accent="#00e676">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        {types.map(t => (
          <div key={t.id} onClick={() => setSelected(selected === t.id ? null : t.id)}
            style={{
              padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
              background: selected === t.id ? `${t.color}15` : `${t.color}06`,
              border: `1px solid ${selected === t.id ? t.color : t.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: '1rem' }}>{t.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.75rem', color: t.color }}>{t.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
              color: 'var(--text-muted)' }}>{t.direction}</div>
          </div>
        ))}
      </div>
      {selected && (() => {
        const t = types.find(x => x.id === selected);
        return (
          <div style={{ padding: '10px 14px', borderRadius: 6,
            background: `${t.color}10`, border: `1px solid ${t.color}40` }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)',
              lineHeight: 1.6, marginBottom: 6 }}>{t.desc}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
              color: t.color, padding: '4px 8px', background: 'var(--bg-terminal)',
              borderRadius: 4 }}>Example: {t.example}</div>
          </div>
        );
      })()}
    </InlineViz>
  );
}

// ── ASN Ranges — visual number line ───────────────────────
function AsnRangeViz() {
  const [hovered, setHovered] = React.useState(null);
  const ranges = [
    { label: '1–64495',              desc: 'Public 16-bit ASNs (IANA assigned)',    color: '#00e5ff', pct: 25, use: 'Global internet routing. Requires ARIN/RIPE/APNIC application.' },
    { label: '64512–65534',          desc: 'Private 16-bit ASNs',                   color: '#00e676', pct: 12, use: 'Internal use — MPLS VPNs, labs, multi-AS enterprise. Not routed on public internet.' },
    { label: '65535',                desc: 'Reserved',                              color: '#78909c', pct: 3,  use: 'Reserved by IANA. Do not use.' },
    { label: '131072–4199999999',    desc: 'Public 32-bit ASNs',                    color: '#7c4dff', pct: 40, use: 'Expanded public pool. Written as plain number (e.g. 131072) or dotted (2.0).' },
    { label: '4200000000–4294967294',desc: 'Private 32-bit ASNs',                   color: '#ffab00', pct: 18, use: 'Private use with 32-bit ASNs. Useful for large-scale MPLS/SD-WAN deployments.' },
    { label: '4294967295',           desc: 'Reserved',                              color: '#546e7a', pct: 2,  use: 'Reserved (AS_TRANS — RFC 4893). Do not use.' },
  ];
  return (
    <InlineViz label="ASN RANGES — 16-BIT AND 32-BIT ALLOCATION" accent="#00e5ff">
      {/* Bar chart */}
      <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', marginBottom: 12, border: '1px solid var(--border-subtle)' }}>
        {ranges.map((r, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width: `${r.pct}%`, background: hovered === i ? `${r.color}60` : `${r.color}30`,
              borderRight: i < ranges.length-1 ? `1px solid var(--border-subtle)` : 'none',
              transition: 'background 0.2s', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
            {r.pct >= 10 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
                color: r.color, fontWeight: 700 }}>
                {r.label.split('–')[0].replace('4200000000','4.2B').replace('131072','131K').replace('64512','64K')}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {ranges.map((r, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '5px 8px',
              borderRadius: 4, cursor: 'default',
              background: hovered === i ? `${r.color}10` : 'transparent',
              border: `1px solid ${hovered === i ? r.color + '40' : 'transparent'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, flexShrink: 0, marginTop: 2,
              background: r.color }}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 1 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                  fontSize: '0.6875rem', color: r.color }}>{r.label}</span>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>{r.desc}</span>
              </div>
              {hovered === i && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {r.use}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// BGP INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── eBGP vs iBGP — topology diagram ──────────────────────
function EbgpVsIbgp() {
  const [mode, setMode] = React.useState('ebgp');
  const isEbgp = mode === 'ebgp';
  return (
    <InlineViz label="eBGP vs iBGP — SESSION TYPES AND KEY DIFFERENCES" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['ebgp','eBGP (between ASes)'],['ibgp','iBGP (within AS)']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? (m==='ebgp' ? 'rgba(0,229,255,0.15)' : 'rgba(124,77,255,0.15)') : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? (m==='ebgp' ? '#00e5ff' : '#7c4dff') : 'var(--border-subtle)'}`,
            color: mode === m ? (m==='ebgp' ? '#00e5ff' : '#7c4dff') : 'var(--text-muted)',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 380 140" style={{ width: 360, maxHeight: 140, flexShrink: 0 }}>
          {isEbgp ? (
            <>
              {/* AS 65001 */}
              <rect x="5" y="20" width="155" height="100" rx="6"
                fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.3)" strokeWidth="1"/>
              <text x="82" y="38" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="9" fontWeight="bold">AS 65001</text>
              <rect x="20" y="55" width="120" height="40" rx="4"
                fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1.5"/>
              <text x="80" y="72" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="10" fontWeight="bold">R1</text>
              <text x="80" y="84" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">10.0.0.1</text>
              {/* AS 65002 */}
              <rect x="220" y="20" width="155" height="100" rx="6"
                fill="rgba(0,230,118,0.04)" stroke="rgba(0,230,118,0.3)" strokeWidth="1"/>
              <text x="297" y="38" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="9" fontWeight="bold">AS 65002</text>
              <rect x="240" y="55" width="120" height="40" rx="4"
                fill="rgba(0,230,118,0.1)" stroke="#00e676" strokeWidth="1.5"/>
              <text x="300" y="72" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="10" fontWeight="bold">R2</text>
              <text x="300" y="84" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="8">10.0.0.2</text>
              {/* eBGP session */}
              <line x1="140" y1="75" x2="240" y2="75" stroke="#f43f5e" strokeWidth="2.5"/>
              <text x="190" y="65" textAnchor="middle" fill="#f43f5e" fontFamily="monospace" fontSize="9" fontWeight="bold">eBGP</text>
              <text x="190" y="93" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">TTL=1 · must be adjacent</text>
            </>
          ) : (
            <>
              {/* Single AS */}
              <rect x="5" y="10" width="370" height="125" rx="6"
                fill="rgba(124,77,255,0.04)" stroke="rgba(124,77,255,0.3)" strokeWidth="1"/>
              <text x="190" y="27" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="9" fontWeight="bold">AS 65001 — requires full iBGP mesh (or route reflector)</text>
              {/* Three routers */}
              {[{id:'R1',x:60,y:75},{id:'R2',x:190,y:45},{id:'R3',x:320,y:75}].map((r,i) => (
                <g key={i}>
                  <rect x={r.x-28} y={r.y-18} width={56} height={36} rx="4"
                    fill="rgba(124,77,255,0.12)" stroke="#7c4dff" strokeWidth="1.5"/>
                  <text x={r.x} y={r.y-2} textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="10" fontWeight="bold">{r.id}</text>
                  <text x={r.x} y={r.y+10} textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">Lo0: 1.1.1.{i+1}</text>
                </g>
              ))}
              {/* iBGP sessions — full mesh */}
              {[[60,75,190,45],[190,45,320,75],[60,75,320,75]].map(([x1,y1,x2,y2],i) => (
                <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#7c4dff" strokeWidth="1.5" strokeDasharray="5,3"/>
              ))}
              <text x="190" y="115" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="8">
                TTL=255 · next-hop unchanged · no AS_PATH prepend
              </text>
            </>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 130 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem' }}>
            <thead>
              <tr>
                {['Feature','eBGP','iBGP'].map(h => (
                  <th key={h} style={{ padding: '4px 8px', textAlign: 'left',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)', fontSize: '0.5875rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Between',   'Different ASes', 'Same AS'],
                ['TTL',       '1 (adjacent)',   '255 (any hop)'],
                ['Next-hop',  'Changes to self','Preserved'],
                ['AS-PATH',   'Prepends own AS','No change'],
                ['Full mesh', 'No',             'Required (or RR)'],
              ].map(([feat, e, i], idx) => (
                <tr key={idx}>
                  <td style={{ padding: '4px 8px', color: 'var(--text-muted)' }}>{feat}</td>
                  <td style={{ padding: '4px 8px', color: '#00e5ff' }}>{e}</td>
                  <td style={{ padding: '4px 8px', color: '#7c4dff' }}>{i}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InlineViz>
  );
}

// ── BGP Path Selection — decision tree ────────────────────
function BgpPathSelection() {
  const [step, setStep] = React.useState(-1);
  const [isPaused, setIsPaused] = React.useState(false);
  const attrs = [
    { n: 1,  attr: 'Weight',           scope: 'Cisco-local', color: '#f43f5e', detail: 'Highest wins. Cisco-proprietary — not advertised to peers. Set per-router. Use to prefer paths on one specific router.' },
    { n: 2,  attr: 'Local Preference', scope: 'AS-wide',     color: '#ff6d00', detail: 'Highest wins. Shared within the AS via iBGP. Use to prefer which exit point leaves your AS.' },
    { n: 3,  attr: 'Locally Originated', scope: 'Local',     color: '#ffab00', detail: 'Routes originated by this router (network cmd or redistribute) preferred over learned routes.' },
    { n: 4,  attr: 'AS-Path Length',   scope: 'Global',      color: '#00e676', detail: 'Shortest AS-PATH wins. Count of AS hops to destination. Prepending artificially inflates path length to influence inbound traffic.' },
    { n: 5,  attr: 'Origin Code',      scope: 'Global',      color: '#00e5ff', detail: 'IGP (i) < EGP (e) < Incomplete (?). Rarely a tiebreaker in practice.' },
    { n: 6,  attr: 'MED',              scope: 'Between ASes', color: '#2979ff', detail: 'Lowest wins. Sent to eBGP peers to suggest preferred entry point. Only compared between paths from the same AS.' },
    { n: 7,  attr: 'eBGP over iBGP',  scope: 'Local',        color: '#7c4dff', detail: 'eBGP-learned routes preferred over iBGP-learned routes.' },
    { n: 8,  attr: 'IGP Metric',       scope: 'Local',        color: '#e040fb', detail: 'Lowest IGP cost to the BGP next-hop wins. Influences which iBGP path is used inside the AS.' },
    { n: 9,  attr: 'Oldest Route',     scope: 'Local',        color: '#78909c', detail: 'Prefer the oldest (most stable) eBGP route. Reduces route flap.' },
    { n: 10, attr: 'Lowest Router ID', scope: 'Local',        color: '#546e7a', detail: 'Final tiebreaker. Lowest BGP Router ID (or originator ID) wins.' },
  ];
  useEffect(() => {
    if (isPaused || step >= attrs.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 700);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  function replay() { setStep(-1); setIsPaused(false); setTimeout(() => setStep(0), 300); }
  return (
    <InlineViz label="BGP PATH SELECTION — 10-STEP DECISION PROCESS (highest/lowest wins at each step)" accent="#f43f5e">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={replay}>↺</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {attrs.map((a, i) => {
          const active  = step === i;
          const past    = step > i;
          const pending = step < i;
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 80px',
              alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 5,
              background: active ? `${a.color}18` : past ? `${a.color}06` : 'var(--bg-elevated)',
              border: `1px solid ${active ? a.color : past ? a.color + '25' : 'var(--border-subtle)'}`,
              opacity: pending ? 0.35 : 1, transition: 'all 0.4s',
              boxShadow: active ? `0 0 10px ${a.color}30` : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800,
                fontSize: '0.625rem', color: active ? a.color : 'var(--text-muted)',
                textAlign: 'center' }}>{a.n}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                  fontSize: '0.75rem', color: active ? a.color : past ? a.color : 'var(--text-secondary)' }}>
                  {a.attr}
                </div>
                {active && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)',
                    lineHeight: 1.5, marginTop: 2 }}>{a.detail}</div>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
                color: a.color, background: `${a.color}15`, padding: '2px 5px',
                borderRadius: 3, textAlign: 'center' }}>{a.scope}</div>
            </div>
          );
        })}
      </div>
    </InlineViz>
  );
}

// ── BGP Message Types — session lifecycle ─────────────────
function BgpMessageTypes() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const msgs = [
    { type: 'OPEN',         color: '#ffab00', dir: 'both',  detail: 'TCP connection established. Both peers send OPEN with: BGP version (4), AS number, Hold Time (default 180s), BGP Router ID, capabilities.' },
    { type: 'KEEPALIVE',    color: '#00e5ff', dir: 'both',  detail: 'Sent every 60s (default). Confirms session is still alive. If no KEEPALIVE received within Hold Time (180s) the session is torn down.' },
    { type: 'UPDATE',       color: '#00e676', dir: 'both',  detail: 'Advertises new prefixes (NLRI + path attributes) or withdraws previously announced prefixes. This is how routing information propagates.' },
    { type: 'NOTIFICATION', color: '#ff5252', dir: 'error', detail: 'Sent when an error occurs — authentication failure, hold timer expired, bad AS number. Session is immediately closed after sending.' },
  ];
  useEffect(() => {
    if (isPaused || step >= msgs.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="BGP MESSAGE TYPES — SESSION LIFECYCLE" accent="#ffab00">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 160" style={{ width: 260, maxHeight: 160, flexShrink: 0 }}>
          {/* Peers */}
          {[{label:'R1 (AS65001)', x:50},{label:'R2 (AS65002)', x:230}].map((p,i) => (
            <g key={i}>
              <rect x={p.x-45} y="10" width="90" height="28" rx="4"
                fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1"/>
              <text x={p.x} y="26" textAnchor="middle" fill="#00e5ff"
                fontFamily="monospace" fontSize="8" fontWeight="bold">{p.label}</text>
              <line x1={p.x} y1="38" x2={p.x} y2="155"
                stroke="rgba(0,229,255,0.15)" strokeWidth="1" strokeDasharray="3,3"/>
            </g>
          ))}
          {/* Message arrows */}
          {msgs.map((m, i) => {
            if (step < i) return null;
            const y = 50 + i * 26;
            const isError = m.dir === 'error';
            return (
              <g key={i}>
                {/* Forward */}
                <line x1="50" y1={y} x2="230" y2={y}
                  stroke={m.color} strokeWidth={step === i ? 2 : 1.5}
                  strokeDasharray={isError ? '4,3' : 'none'}/>
                <polygon points={`225,${y-4} 233,${y} 225,${y+4}`} fill={m.color}/>
                {/* Return (for bidirectional) */}
                {m.dir === 'both' && (
                  <>
                    <line x1="230" y1={y+6} x2="50" y2={y+6}
                      stroke={m.color} strokeWidth={step === i ? 2 : 1.5} opacity="0.6"/>
                    <polygon points={`55,${y+2} 47,${y+6} 55,${y+10}`} fill={m.color} opacity="0.6"/>
                  </>
                )}
                <rect x="115" y={y-9} width="50" height="12" rx="2"
                  fill="var(--bg-panel)"/>
                <text x="140" y={y} textAnchor="middle" fill={m.color}
                  fontFamily="monospace" fontSize="8" fontWeight="bold">{m.type}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 130 }}>
          <div style={{ padding: '10px 12px', borderRadius: 6,
            background: `${msgs[step].color}10`,
            border: `1px solid ${msgs[step].color}40`, marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
              color: msgs[step].color, marginBottom: 5 }}>{msgs[step].type}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {msgs[step].detail}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// NETWORK TUNNELING INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Tunnel Types — comparison ─────────────────────────────
function TunnelTypesComparison() {
  const [selected, setSelected] = React.useState('gre');
  const types = {
    gre: {
      label: 'GRE',
      color: '#00e5ff',
      overhead: '24 bytes',
      encrypts: false,
      multicast: true,
      routing: true,
      desc: 'Generic Routing Encapsulation. Simple point-to-point tunnel — wraps any L3 protocol in an IP header. No encryption. Commonly used to carry routing protocols (OSPF/EIGRP) or multicast over an internet path.',
      use: 'Run OSPF over internet, connect non-contiguous private networks, carry multicast',
      header: ['Outer IP (20B)', 'GRE (4B)', 'Inner IP', 'Payload'],
      colors: ['#00e5ff','#7c4dff','#ffab00','#546e7a'],
    },
    ipsec: {
      label: 'IPsec (ESP)',
      color: '#00e676',
      overhead: '50–70 bytes',
      encrypts: true,
      multicast: false,
      routing: false,
      desc: 'Encrypts and authenticates IP packets using ESP (Encapsulating Security Payload). Provides confidentiality, integrity, and authentication. Cannot carry multicast or routing protocols natively.',
      use: 'Secure site-to-site VPN, encrypt sensitive data in transit',
      header: ['Outer IP (20B)', 'ESP (8B)', 'Encrypted Payload', 'ESP Trailer+Auth'],
      colors: ['#00e676','#f43f5e','#546e7a','#546e7a'],
    },
    gre_ipsec: {
      label: 'GRE + IPsec',
      color: '#ffab00',
      overhead: '74+ bytes',
      encrypts: true,
      multicast: true,
      routing: true,
      desc: 'GRE encapsulates first (enabling multicast and routing protocols), then IPsec encrypts the entire GRE packet. Best of both worlds — but highest overhead. The standard for DMVPN.',
      use: 'DMVPN, secure tunnels that also carry OSPF/EIGRP and multicast',
      header: ['Outer IP (20B)', 'ESP (8B)', 'GRE (4B)', 'Inner IP + Payload'],
      colors: ['#ffab00','#f43f5e','#00e5ff','#546e7a'],
    },
    vxlan: {
      label: 'VXLAN',
      color: '#7c4dff',
      overhead: '50 bytes',
      encrypts: false,
      multicast: true,
      routing: true,
      desc: 'Virtual Extensible LAN. Encapsulates L2 Ethernet frames in UDP/IP, extending L2 segments across L3 boundaries. 24-bit VNI supports 16 million segments vs VLAN\'s 4094. Used in data centre overlays.',
      use: 'Data centre overlays, VM mobility across racks/DCs, SDN fabrics',
      header: ['Outer IP (20B)', 'UDP (8B)', 'VXLAN (8B)', 'L2 Frame + Payload'],
      colors: ['#7c4dff','#e040fb','#ffab00','#546e7a'],
    },
  };
  const t = types[selected];
  return (
    <InlineViz label="TUNNEL TYPES — GRE vs IPSEC vs GRE+IPSEC vs VXLAN" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(types).map(([k, v]) => (
          <button key={k} onClick={() => setSelected(k)} style={{
            padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: selected === k ? `${v.color}20` : 'var(--bg-elevated)',
            border: `1px solid ${selected === k ? v.color : 'var(--border-subtle)'}`,
            color: selected === k ? v.color : 'var(--text-muted)', transition: 'all 0.2s',
          }}>{v.label}</button>
        ))}
      </div>
      {/* Packet header diagram */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 5 }}>PACKET STRUCTURE</div>
        <div style={{ display: 'flex', gap: 2, height: 28 }}>
          {t.header.map((h, i) => (
            <div key={i} style={{
              flex: i === t.header.length - 1 ? 2 : 1,
              background: `${t.colors[i]}20`,
              border: `1px solid ${t.colors[i]}60`,
              borderRadius: 4, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontFamily: 'var(--font-mono)',
              fontSize: '0.5rem', color: t.colors[i], fontWeight: 700,
              padding: '0 4px', textAlign: 'center', lineHeight: 1.2,
            }}>{h}</div>
          ))}
        </div>
      </div>
      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
        {[
          { label: 'Overhead', value: t.overhead, color: '#ffab00' },
          { label: 'Encrypts', value: t.encrypts ? '✓ Yes' : '✗ No', color: t.encrypts ? '#00e676' : '#ff5252' },
          { label: 'Multicast', value: t.multicast ? '✓ Yes' : '✗ No', color: t.multicast ? '#00e676' : '#ff5252' },
          { label: 'Routing protos', value: t.routing ? '✓ Yes' : '✗ No', color: t.routing ? '#00e676' : '#ff5252' },
        ].map((f, i) => (
          <div key={i} style={{ padding: '6px 8px', borderRadius: 5,
            background: `${f.color}08`, border: `1px solid ${f.color}25`, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-muted)', marginBottom: 3 }}>{f.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.75rem', color: f.color }}>{f.value}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: `${t.color}08`, border: `1px solid ${t.color}30` }}>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>{t.desc}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: t.color }}>Use: {t.use}</div>
      </div>
    </InlineViz>
  );
}

// ── Encapsulation — animated tunnel wrapping ──────────────
function TunnelEncapsulationAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const layers = [
    { label: 'Original packet', headers: [{label:'IP Src: 10.0.1.10', color:'#ffab00'},{label:'TCP Port 80', color:'#00e676'},{label:'HTTP Payload', color:'#546e7a'}], desc: 'Host generates an IP packet destined for 10.0.2.20 across a GRE+IPsec tunnel.' },
    { label: 'GRE encapsulation', headers: [{label:'GRE Header (4B)', color:'#00e5ff'},{label:'IP Src: 10.0.1.10', color:'#ffab00'},{label:'TCP Port 80', color:'#00e676'},{label:'Payload', color:'#546e7a'}], desc: 'Tunnel source router wraps the original packet inside a GRE header. GRE enables multicast and routing protocols.' },
    { label: 'IPsec ESP encryption', headers: [{label:'ESP Header (8B)', color:'#f43f5e'},{label:'🔒 Encrypted: GRE+IP+TCP+Payload', color:'#546e7a'},{label:'ESP Trailer+Auth', color:'#f43f5e'}], desc: 'IPsec encrypts the entire GRE packet. The original IP, TCP headers, and payload are now ciphertext.' },
    { label: 'Outer IP header added', headers: [{label:'Outer IP: 203.0.113.1→203.0.113.2', color:'#7c4dff'},{label:'ESP Header', color:'#f43f5e'},{label:'🔒 Encrypted GRE+IP+Payload', color:'#546e7a'},{label:'Auth', color:'#f43f5e'}], desc: 'A new outer IP header is prepended with tunnel endpoints as source and destination. This is what routers see on the internet.' },
    { label: 'Transmitted on wire', headers: [{label:'Outer IP', color:'#7c4dff'},{label:'ESP', color:'#f43f5e'},{label:'Encrypted inner packet', color:'#546e7a'},{label:'Auth', color:'#f43f5e'}], desc: '✓ The tunnel packet traverses the internet. Routers only see the outer IP header — the original destination and payload are hidden.' },
  ];
  useEffect(() => {
    if (isPaused || step >= layers.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  const cur = layers[step];
  return (
    <InlineViz label="TUNNEL ENCAPSULATION — GRE + IPSEC PACKET WRAPPING" accent="#7c4dff">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#7c4dff', fontWeight: 700 }}>
          Step {step + 1}/{layers.length}: {cur.label}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
        </div>
      </div>
      {/* Packet visual */}
      <div style={{ display: 'flex', gap: 2, height: 36, marginBottom: 12 }}>
        {cur.headers.map((h, i) => (
          <div key={i} style={{
            flex: h.label.includes('Encrypted') || h.label.includes('Payload') ? 3 : 1,
            background: `${h.color}20`, border: `1px solid ${h.color}60`,
            borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: h.color,
            fontWeight: 700, padding: '0 4px', textAlign: 'center', lineHeight: 1.3,
            transition: 'all 0.4s',
          }}>{h.label}</div>
        ))}
      </div>
      {/* Step indicator dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 10 }}>
        {layers.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
            background: i === step ? '#7c4dff' : i < step ? 'rgba(124,77,255,0.4)' : 'var(--border-default)',
            transition: 'background 0.3s',
          }} onClick={() => { setStep(i); setIsPaused(true); }}/>
        ))}
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.25)',
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {cur.desc}
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// GRE INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── GRE Header — field anatomy ────────────────────────────
function GreHeaderAnatomy() {
  const [hovered, setHovered] = React.useState(null);
  const fields = [
    { name: 'C',       bits: 1,  color: '#ffab00', desc: 'Checksum Present. If set, a 2-byte checksum field follows the header to verify integrity.' },
    { name: 'Rsvd',    bits: 1,  color: '#546e7a', desc: 'Reserved — must be 0. Was used for routing in early GRE (RFC 1701), deprecated in RFC 2784.' },
    { name: 'K',       bits: 1,  color: '#00e5ff', desc: 'Key Present. If set, a 4-byte key field is included. Used to identify different GRE tunnels sharing the same endpoints.' },
    { name: 'S',       bits: 1,  color: '#7c4dff', desc: 'Sequence Number Present. If set, a 4-byte sequence number is included. Used by GRE keepalives to detect tunnel failures.' },
    { name: 'Rsvd',    bits: 9,  color: '#546e7a', desc: 'Reserved bits — must be zero. Padded to align the Protocol Type field.' },
    { name: 'Ver',     bits: 3,  color: '#78909c', desc: 'Version — always 0 for standard GRE (RFC 2784). Enhanced GRE (PPTP) uses version 1.' },
    { name: 'Protocol Type', bits: 16, color: '#f43f5e', desc: 'EtherType of the encapsulated (inner) protocol. 0x0800 = IPv4, 0x86DD = IPv6, 0x8100 = 802.1Q VLAN.' },
  ];
  const totalBits = fields.reduce((a, f) => a + f.bits, 0); // 32
  return (
    <InlineViz label="GRE HEADER — MINIMUM 4 BYTES (32 bits)" accent="#00e5ff">
      {/* Bit field bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', height: 32, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          {fields.map((f, i) => (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: `${(f.bits / totalBits) * 100}%`,
                background: hovered === i ? `${f.color}40` : `${f.color}18`,
                borderRight: i < fields.length - 1 ? '1px solid var(--bg-panel)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'background 0.2s',
                fontFamily: 'var(--font-mono)', fontSize: f.bits >= 8 ? '0.625rem' : '0.5rem',
                fontWeight: 700, color: f.color, overflow: 'hidden',
              }}>
              {f.bits >= 3 ? f.name.split(' ')[0] : ''}
            </div>
          ))}
        </div>
        {/* Bit labels */}
        <div style={{ display: 'flex', marginTop: 2 }}>
          {fields.map((f, i) => (
            <div key={i} style={{
              width: `${(f.bits / totalBits) * 100}%`,
              textAlign: 'center', fontFamily: 'var(--font-mono)',
              fontSize: '0.45rem', color: 'var(--text-muted)',
            }}>{f.bits}b</div>
          ))}
        </div>
      </div>
      {/* Field list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {fields.filter(f => f.color !== '#546e7a').map((f, i) => {
          const origIdx = fields.indexOf(f);
          const isHov = hovered === origIdx;
          return (
            <div key={i}
              onMouseEnter={() => setHovered(origIdx)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 8px',
                borderRadius: 4, cursor: 'default',
                background: isHov ? `${f.color}12` : 'transparent',
                border: `1px solid ${isHov ? f.color + '40' : 'transparent'}`,
                transition: 'all 0.2s',
              }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, minWidth: 100 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: f.color, flexShrink: 0 }}/>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem', color: f.color }}>{f.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-muted)' }}>({f.bits}b)</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 10, padding: '7px 10px', borderRadius: 5,
        background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
        Minimum GRE overhead: 4 bytes (flags + Protocol Type only, no optional fields)<br/>
        + 20 bytes outer IP header = <span style={{ color: '#00e5ff' }}>24 bytes total minimum overhead</span><br/>
        Optional fields (C, K, S) add 4 bytes each when present
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// MPLS INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── MPLS Label Format — 4-byte header anatomy ─────────────
function MplsLabelFormat() {
  const [hovered, setHovered] = React.useState(null);
  const fields = [
    { name: 'Label',  bits: 20, color: '#00e5ff', desc: '20-bit label value (0–1,048,575). Labels 0–15 are reserved (0=IPv4 explicit null, 3=implicit null/PHP). Forwarding decision is based on this value alone — no longest-prefix lookup needed.' },
    { name: 'EXP',    bits: 3,  color: '#ffab00', desc: '3-bit Traffic Class (originally "Experimental"). Used for QoS — maps to DSCP/CoS. Allows priority queuing within the MPLS network.' },
    { name: 'S',      bits: 1,  color: '#00e676', desc: 'Bottom of Stack bit. Set to 1 on the innermost label in a label stack. MPLS supports label stacks (multiple labels stacked) for hierarchical forwarding — used in MPLS VPNs and TE tunnels.' },
    { name: 'TTL',    bits: 8,  color: '#f43f5e', desc: '8-bit Time to Live. Decremented at each LSR hop. Prevents routing loops. Can be copied from IP TTL on ingress and written back on egress (or set to 255 to hide MPLS hop count).' },
  ];
  const total = 32;
  return (
    <InlineViz label="MPLS LABEL — 4 BYTES (32 bits), INSERTED BETWEEN L2 AND L3" accent="#00e5ff">
      {/* Bit field bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.5875rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
          Ethernet Frame: [L2 Header] [<span style={{ color: '#00e5ff' }}>MPLS Label(s)</span>] [IP Header] [Payload] ← "Layer 2.5"
        </div>
        <div style={{ display: 'flex', height: 34, borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          {fields.map((f, i) => (
            <div key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: `${(f.bits / total) * 100}%`,
                background: hovered === i ? `${f.color}40` : `${f.color}18`,
                borderRight: i < fields.length - 1 ? '1px solid var(--bg-panel)' : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s',
              }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700, color: f.color }}>{f.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-muted)' }}>{f.bits}b</span>
            </div>
          ))}
        </div>
      </div>
      {/* Field details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {fields.map((f, i) => (
          <div key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 8px',
              borderRadius: 4, cursor: 'default',
              background: hovered === i ? `${f.color}10` : 'transparent',
              border: `1px solid ${hovered === i ? f.color + '35' : 'transparent'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, minWidth: 80 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: f.color, flexShrink: 0 }}/>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem', color: f.color }}>{f.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-muted)' }}>({f.bits}b)</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ── MPLS Key Operations — push/swap/pop animation ─────────
function MplsOperationsAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const nodes = [
    { id: 'CE1',  label: 'CE1',       role: 'Customer Edge',     x: 30,  color: '#546e7a' },
    { id: 'PE1',  label: 'PE1',       role: 'Ingress PE (PUSH)',  x: 110, color: '#00e5ff' },
    { id: 'P1',   label: 'P1',        role: 'Core LSR (SWAP)',    x: 200, color: '#7c4dff' },
    { id: 'P2',   label: 'P2',        role: 'Core LSR (SWAP)',    x: 290, color: '#7c4dff' },
    { id: 'PE2',  label: 'PE2',       role: 'Egress PE (POP)',    x: 370, color: '#00e676' },
    { id: 'CE2',  label: 'CE2',       role: 'Customer Edge',      x: 450, color: '#546e7a' },
  ];
  const steps = [
    { desc: 'CE1 sends an IP packet to CE2 (10.0.2.0/24). The packet enters the MPLS network at PE1.',
      pktX: 30, label: null, op: null },
    { desc: 'PE1 (Ingress PE) performs a PUSH operation — it looks up the destination IP in its FIB, finds the LSP to PE2, and pushes label 200 onto the packet.',
      pktX: 110, label: '200', op: 'PUSH', opColor: '#00e5ff' },
    { desc: 'P1 (core LSR) receives the packet. It looks up label 200 in its LFIB and performs a SWAP — replaces label 200 with label 300 and forwards toward P2.',
      pktX: 200, label: '300', op: 'SWAP', opColor: '#7c4dff' },
    { desc: 'P2 (core LSR) swaps label 300 for label 400. No IP lookup is needed — just a simple label table lookup.',
      pktX: 290, label: '400', op: 'SWAP', opColor: '#7c4dff' },
    { desc: 'PE2 (Egress PE) performs a POP — removes the MPLS label. The original IP packet is revealed. PHP (Penultimate Hop Popping) may have already popped it at P2.',
      pktX: 370, label: null, op: 'POP', opColor: '#00e676' },
    { desc: '✓ PE2 performs a normal IP lookup and forwards the packet to CE2. The IP TTL is decremented once (or copied back from MPLS TTL) and delivered.',
      pktX: 450, label: null, op: null },
  ];
  useEffect(() => {
    if (isPaused || step >= steps.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  const cur = steps[step];
  return (
    <InlineViz label="MPLS KEY OPERATIONS — PUSH / SWAP / POP ACROSS LSP" accent="#7c4dff">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
      </div>
      <svg viewBox="0 0 480 110" style={{ width: '100%', maxHeight: 110, display: 'block', marginBottom: 10 }}>
        {/* Links */}
        {nodes.slice(0, -1).map((n, i) => (
          <line key={i}
            x1={n.x + 22} y1={45}
            x2={nodes[i+1].x - 22} y2={45}
            stroke={step > i ? nodes[i+1].color : 'var(--border-subtle)'}
            strokeWidth="1.5" style={{ transition: 'stroke 0.4s' }}/>
        ))}
        {/* Nodes */}
        {nodes.map((n, i) => {
          const active = cur.pktX === n.x;
          return (
            <g key={i}>
              <rect x={n.x - 22} y={28} width={44} height={34} rx={4}
                fill={active ? `${n.color}25` : `${n.color}08`}
                stroke={n.color} strokeWidth={active ? 2 : 1}
                style={{ transition: 'all 0.4s' }}/>
              <text x={n.x} y={43} textAnchor="middle" fill={n.color}
                fontFamily="monospace" fontSize="9" fontWeight="bold">{n.label}</text>
              <text x={n.x} y={54} textAnchor="middle" fill="var(--text-muted)"
                fontFamily="monospace" fontSize="7">{n.role.split(' ')[0]}</text>
              {/* Operation badge */}
              {active && cur.op && (
                <g>
                  <rect x={n.x - 18} y={66} width={36} height={14} rx={3}
                    fill={`${cur.opColor}25`} stroke={cur.opColor} strokeWidth={1}/>
                  <text x={n.x} y={76} textAnchor="middle" fill={cur.opColor}
                    fontFamily="monospace" fontSize="8" fontWeight="bold">{cur.op}</text>
                </g>
              )}
              <text x={n.x} y={95} textAnchor="middle" fill="var(--text-muted)"
                fontFamily="monospace" fontSize="7">{n.role.split('(')[1]?.replace(')','') || ''}</text>
            </g>
          );
        })}
        {/* Packet dot */}
        <circle cx={cur.pktX} cy={18} r={6}
          fill={cur.label ? '#ffab00' : '#00e676'}
          style={{ transition: 'cx 0.5s' }}/>
        {cur.label && (
          <text x={cur.pktX} y={13} textAnchor="middle" fill="#ffab00"
            fontFamily="monospace" fontSize="7" fontWeight="bold">{cur.label}</text>
        )}
      </svg>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.25)',
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {cur.desc}
      </div>
    </InlineViz>
  );
}

// ── Why MPLS — use cases visual ───────────────────────────
function MplsUseCases() {
  const [active, setActive] = React.useState(null);
  const cases = [
    { id: 'speed',  icon: '⚡', title: 'Label Switching Speed',
      color: '#ffab00',
      desc: 'Traditional IP routing requires a longest-prefix lookup in a potentially large routing table at every hop. MPLS replaces this with a simple exact-match label lookup — historically faster and more scalable on high-speed core routers.',
    },
    { id: 'vpn',    icon: '🔒', title: 'L3VPN (RFC 4364)',
      color: '#00e5ff',
      desc: 'MPLS L3VPNs allow ISPs to provide private IP routing between customer sites over a shared MPLS backbone. Each customer VRF is kept isolated using two labels: outer transport label + inner VPN label. The foundation of enterprise MPLS WAN services.',
    },
    { id: 'te',     icon: '🛣️', title: 'Traffic Engineering',
      color: '#7c4dff',
      desc: 'MPLS-TE allows traffic to be steered along explicit paths that differ from the IGP shortest path. Used to avoid congestion, guarantee bandwidth, and implement fast-reroute (FRR) for sub-50ms failover on critical paths.',
    },
    { id: 'qos',    icon: '📊', title: 'QoS via EXP bits',
      color: '#00e676',
      desc: 'The 3-bit EXP (TC) field in the MPLS label carries QoS markings across the provider network. Core routers honour these bits for priority queuing without needing to inspect the inner IP DSCP — enabling end-to-end QoS across the MPLS backbone.',
    },
  ];
  return (
    <InlineViz label="WHY MPLS? — KEY USE CASES" accent="#ffab00">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {cases.map(c => (
          <div key={c.id} onClick={() => setActive(active === c.id ? null : c.id)}
            style={{
              padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
              background: active === c.id ? `${c.color}15` : `${c.color}06`,
              border: `1px solid ${active === c.id ? c.color : c.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: active === c.id ? 8 : 0 }}>
              <span style={{ fontSize: '1.25rem' }}>{c.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.75rem', color: c.color }}>{c.title}</span>
            </div>
            {active === c.id && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {c.desc}
              </div>
            )}
          </div>
        ))}
      </div>
      {!active && (
        <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
          Click a card to learn about each MPLS use case
        </div>
      )}
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// IPv6 INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── IPv6 Address Format — breakdown ───────────────────────
function Ipv6AddressBreakdown() {
  const [mode, setMode] = React.useState('full');
  const examples = {
    full:        '2001:0DB8:0000:0001:0000:0000:0000:0001',
    compressed:  '2001:DB8:0:1::1',
    linklocal:   'FE80::1',
    slaac:       '2001:DB8::/64 + EUI-64',
  };
  const rules = [
    { rule: 'Leading zeros per group can be omitted',    before: '0DB8', after: 'DB8',  color: '#ffab00' },
    { rule: 'One consecutive run of all-zero groups → ::', before: ':0000:0000:0000:', after: '::', color: '#00e5ff' },
    { rule: ':: can only appear once in an address',   before: 'never 2×::',  after: '1× max', color: '#f43f5e' },
  ];
  const addr = '2001:0DB8:0000:0001:0000:0000:0000:0001';
  const groups = addr.split(':');
  return (
    <InlineViz label="IPv6 ADDRESS FORMAT — 128 BITS (8 × 16-BIT GROUPS)" accent="#00e5ff">
      {/* Address visualization */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 6 }}>
          {groups.map((g, i) => {
            const isPrefix = i < 4;
            const isZero   = g === '0000';
            return (
              <div key={i} style={{
                minWidth: 52, padding: '5px 4px', borderRadius: 4, textAlign: 'center',
                background: isZero ? 'rgba(0,229,255,0.06)' : isPrefix ? 'rgba(0,230,118,0.12)' : 'rgba(124,77,255,0.12)',
                border: `1px solid ${isZero ? 'rgba(0,229,255,0.2)' : isPrefix ? 'rgba(0,230,118,0.4)' : 'rgba(124,77,255,0.4)'}`,
              }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
                  color: isZero ? '#546e7a' : isPrefix ? '#00e676' : '#7c4dff' }}>{g}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {i * 16}–{(i+1)*16-1}
                </div>
              </div>
            );
          })}
        </div>
        {/* Prefix / Interface-ID split labels */}
        <div style={{ display: 'flex', gap: 2 }}>
          <div style={{ flex: 4, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: '#00e676' }}>
            ← Network Prefix (64 bits) →
          </div>
          <div style={{ flex: 4, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: '#7c4dff' }}>
            ← Interface ID (64 bits) →
          </div>
        </div>
      </div>
      {/* Compression rules */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)', marginBottom: 6 }}>COMPRESSION RULES</div>
        {rules.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 5,
            padding: '5px 8px', borderRadius: 4, background: `${r.color}08`,
            border: `1px solid ${r.color}25` }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                color: 'var(--text-muted)', background: 'var(--bg-terminal)',
                padding: '1px 5px', borderRadius: 3 }}>{r.before}</code>
              <span style={{ color: r.color, fontWeight: 700 }}>→</span>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                color: r.color, background: `${r.color}15`,
                padding: '1px 5px', borderRadius: 3 }}>{r.after}</code>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.rule}</div>
          </div>
        ))}
      </div>
      {/* Compressed form */}
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
        fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Full:       </span>
        <span style={{ color: '#546e7a' }}>2001:0DB8:0000:0001:0000:0000:0000:0001</span><br/>
        <span style={{ color: 'var(--text-muted)' }}>Compressed: </span>
        <span style={{ color: '#00e5ff', fontWeight: 700 }}>2001:DB8:0:1::1</span>
      </div>
    </InlineViz>
  );
}

// ── IPv6 Address Types — clickable cards ──────────────────
function Ipv6AddressTypes() {
  const [selected, setSelected] = React.useState(null);
  const types = [
    {
      type: 'Global Unicast',   prefix: '2000::/3',    color: '#00e5ff',
      example: '2001:DB8:1::1/64',
      scope: 'Internet routable',
      desc: 'Public IPv6 addresses — routable on the internet. Equivalent to public IPv4 addresses. Assigned by RIRs. Range starts with 2 or 3 in hex.',
    },
    {
      type: 'Link-Local',       prefix: 'FE80::/10',   color: '#00e676',
      example: 'FE80::1/64',
      scope: 'Single link only',
      desc: 'Auto-configured on every IPv6 interface. Never routed beyond the local link. Used for neighbor discovery, routing protocol hellos, and default gateway communication. Always present even without a global address.',
    },
    {
      type: 'Unique Local',     prefix: 'FC00::/7',    color: '#7c4dff',
      example: 'FD00::/8 (common)',
      scope: 'Private (like RFC 1918)',
      desc: 'Private IPv6 addresses — not routed on internet. FD00::/8 is the commonly used sub-range (locally assigned). Equivalent to 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 in IPv4.',
    },
    {
      type: 'Multicast',        prefix: 'FF00::/8',    color: '#ffab00',
      example: 'FF02::1 (all nodes)',
      scope: 'One-to-many',
      desc: 'IPv6 has no broadcast — multicast replaces it. FF02::1 = all nodes, FF02::2 = all routers, FF02::5 = all OSPF routers. Solicited-node multicast (FF02::1:FFxx:xxxx) is used by NDP for address resolution.',
    },
    {
      type: 'Loopback',         prefix: '::1/128',     color: '#f43f5e',
      example: '::1',
      scope: 'Local host only',
      desc: 'Equivalent to IPv4 127.0.0.1. Used for testing the IPv6 stack on the local device. Only one loopback address exists in IPv6.',
    },
    {
      type: 'Unspecified',      prefix: '::/128',       color: '#78909c',
      example: '::',
      scope: 'Source during init',
      desc: 'Used as source address before a host has a valid IPv6 address. Appears in DHCPv6 and DAD (Duplicate Address Detection) packets. Never used as a destination.',
    },
  ];
  return (
    <InlineViz label="IPv6 ADDRESS TYPES — CLICK TO EXPAND" accent="#00e5ff">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {types.map((t, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)}
            style={{
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              background: selected === i ? `${t.color}18` : `${t.color}08`,
              border: `1px solid ${selected === i ? t.color : t.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
              fontSize: '0.6875rem', color: t.color, marginBottom: 2 }}>{t.type}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'var(--text-muted)' }}>{t.prefix}</div>
          </div>
        ))}
      </div>
      {selected !== null && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 6,
          background: `${types[selected].color}10`,
          border: `1px solid ${types[selected].color}40` }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)' }}>PREFIX </span>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                color: types[selected].color, fontWeight: 700 }}>{types[selected].prefix}</code>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: 'var(--text-muted)' }}>EXAMPLE </span>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
                color: types[selected].color }}>{types[selected].example}</code>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
              color: types[selected].color, background: `${types[selected].color}15`,
              padding: '2px 8px', borderRadius: 3 }}>{types[selected].scope}</div>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {types[selected].desc}
          </div>
        </div>
      )}
    </InlineViz>
  );
}

// ── NDP — neighbor discovery animation ────────────────────
function NdpAnimation() {
  const [mode, setMode] = React.useState('slaac');
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const modes = {
    slaac: {
      label: 'SLAAC (Router Discovery)',
      color: '#00e676',
      steps: [
        { from: 'Host',   to: 'FF02::2', msg: 'RS',  desc: 'Host sends Router Solicitation (RS) to all-routers multicast FF02::2 — "Is there a router on this link?"' },
        { from: 'Router', to: 'FF02::1', msg: 'RA',  desc: 'Router replies with Router Advertisement (RA) — announces prefix (e.g. 2001:DB8:1::/64), MTU, default gateway, flags.' },
        { from: 'Host',   to: null,      msg: 'DAD', desc: 'Host generates its address using prefix + EUI-64 (or random). Runs DAD (Duplicate Address Detection) via Neighbor Solicitation to ensure uniqueness.' },
        { from: 'Host',   to: null,      msg: '✓',   desc: '✓ Host is configured: 2001:DB8:1::EUI-64/64, gateway = FE80::1 (router link-local). No DHCP server needed.' },
      ],
    },
    ndp: {
      label: 'NDP (Address Resolution)',
      color: '#00e5ff',
      steps: [
        { from: 'Host A', to: 'Solicited-Node', msg: 'NS', desc: 'Host A wants to reach 2001:DB8::2. Sends Neighbor Solicitation (NS) to solicited-node multicast FF02::1:FF00:0002 — "Who has 2001:DB8::2?"' },
        { from: 'Host B', to: 'Host A',         msg: 'NA', desc: 'Host B (owner of 2001:DB8::2) replies with Neighbor Advertisement (NA) — "I have it, my MAC is aa:bb:cc:dd:ee:ff".' },
        { from: 'Host A', to: null,             msg: '✓',  desc: '✓ Host A caches the MAC in its neighbor cache and sends the packet. NDP replaces ARP — no broadcasts, uses targeted multicast instead.' },
      ],
    },
  };
  const m = modes[mode];
  useEffect(() => {
    if (isPaused || step >= m.steps.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, isPaused, mode]);
  function reset(k) { setMode(k); setStep(0); setIsPaused(false); }
  return (
    <InlineViz label="NDP — NEIGHBOR DISCOVERY (replaces ARP + ICMP Router Discovery)" accent="#00e676">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {Object.entries(modes).map(([k, v]) => (
          <button key={k} onClick={() => reset(k)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === k ? `${v.color}20` : 'var(--bg-elevated)',
            border: `1px solid ${mode === k ? v.color : 'var(--border-subtle)'}`,
            color: mode === k ? v.color : 'var(--text-muted)',
          }}>{v.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
          <button style={BASE.btn} onClick={() => reset(mode)}>↺</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {m.steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            opacity: step >= i ? 1 : 0.2, transition: 'opacity 0.5s',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: step >= i ? `${m.color}20` : 'var(--bg-elevated)',
              border: `2px solid ${step >= i ? m.color : 'var(--border-subtle)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '0.625rem', fontWeight: 700,
              color: step >= i ? m.color : 'var(--text-muted)',
              boxShadow: step === i ? `0 0 12px ${m.color}40` : 'none',
              transition: 'all 0.4s',
            }}>{s.msg}</div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              {s.from && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
                  color: 'var(--text-muted)', marginBottom: 2 }}>
                  {s.from} → {s.to || 'self'}
                </div>
              )}
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {s.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// WIRELESS ACCESS POINTS INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Key Concepts — 2.4 vs 5 GHz comparison ───────────────
function WifiBandComparison() {
  const [active, setActive] = React.useState(null);
  const bands = [
    {
      freq: '2.4 GHz', color: '#ffab00', icon: '📡',
      channels: '11 (US) / 13 (EU) — only 3 non-overlapping (1, 6, 11)',
      range: 'Longer — better wall penetration',
      throughput: 'Lower — max ~600 Mbps (802.11n)',
      congestion: 'High — shared with microwaves, Bluetooth, baby monitors',
      use: 'IoT devices, long range coverage, legacy devices',
      pros: ['Better range & penetration', 'Wider device support', 'Better for IoT'],
      cons: ['More interference', 'Only 3 non-overlapping channels', 'Lower max speed'],
    },
    {
      freq: '5 GHz', color: '#00e5ff', icon: '📶',
      channels: '25 non-overlapping 20 MHz channels (US)',
      range: 'Shorter — absorbed by walls faster',
      throughput: 'Higher — up to 3.5 Gbps (802.11ac Wave 2)',
      congestion: 'Lower — less consumer device interference',
      use: 'High-density environments, video streaming, enterprise WLANs',
      pros: ['More channels = less interference', 'Higher throughput', 'Lower congestion'],
      cons: ['Shorter range', 'Worse wall penetration', 'Older devices may not support'],
    },
    {
      freq: '6 GHz', color: '#00e676', icon: '⚡',
      channels: '59 non-overlapping 20 MHz channels (US, Wi-Fi 6E)',
      range: 'Shortest — most affected by obstacles',
      throughput: 'Highest — up to 9.6 Gbps (802.11ax)',
      congestion: 'Very low — only Wi-Fi 6E devices',
      use: 'High-density venues, AR/VR, ultra-low latency applications',
      pros: ['Massive channel availability', 'Cleanest spectrum', 'Lowest latency'],
      cons: ['Very short range', 'Requires Wi-Fi 6E hardware', 'Limited device support today'],
    },
  ];
  return (
    <InlineViz label="Wi-Fi BANDS — 2.4 GHz vs 5 GHz vs 6 GHz" accent="#ffab00">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
        {bands.map((b, i) => (
          <div key={i} onClick={() => setActive(active === i ? null : i)}
            style={{
              padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
              background: active === i ? `${b.color}18` : `${b.color}08`,
              border: `1px solid ${active === i ? b.color : b.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{b.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
              fontSize: '0.875rem', color: b.color, marginBottom: 4 }}>{b.freq}</div>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {b.use}
            </div>
          </div>
        ))}
      </div>
      {active !== null && (
        <div style={{ padding: '10px 14px', borderRadius: 6,
          background: `${bands[active].color}08`,
          border: `1px solid ${bands[active].color}30` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
            {[
              ['Channels',   bands[active].channels],
              ['Range',      bands[active].range],
              ['Throughput', bands[active].throughput],
              ['Congestion', bands[active].congestion],
            ].map(([label, val], i) => (
              <div key={i}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                  color: 'var(--text-muted)', marginBottom: 2 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {bands[active].pros.map((p, i) => (
                <div key={i} style={{ fontSize: '0.6875rem', color: '#00e676', marginBottom: 2 }}>✓ {p}</div>
              ))}
            </div>
            <div>
              {bands[active].cons.map((c, i) => (
                <div key={i} style={{ fontSize: '0.6875rem', color: '#ff5252', marginBottom: 2 }}>✗ {c}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </InlineViz>
  );
}

// ── 2.4 GHz Channels — overlap diagram ───────────────────
function WifiChannelOverlap() {
  const [highlighted, setHighlighted] = React.useState(null);
  // 2.4 GHz: channels 1-13, each 22 MHz wide, spaced 5 MHz apart
  const channels = Array.from({length: 11}, (_, i) => ({
    num: i + 1,
    center: 2412 + i * 5, // MHz
    nonOverlap: [1, 6, 11].includes(i + 1),
  }));
  const minFreq = 2401, maxFreq = 2483;
  const freqRange = maxFreq - minFreq;
  return (
    <InlineViz label="2.4 GHz CHANNEL OVERLAP — ONLY 1, 6, 11 ARE NON-OVERLAPPING" accent="#ffab00">
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <svg viewBox="0 0 500 140" style={{ width: '100%', minWidth: 400, maxHeight: 140, display: 'block' }}>
          {/* Frequency axis */}
          <line x1="20" y1="120" x2="490" y2="120" stroke="var(--border-subtle)" strokeWidth="1"/>
          {[2412,2437,2462].map((f, i) => {
            const x = 20 + ((f - minFreq) / freqRange) * 470;
            return (
              <g key={i}>
                <line x1={x} y1="115" x2={x} y2="125" stroke="#ffab00" strokeWidth="1.5"/>
                <text x={x} y="135" textAnchor="middle" fill="#ffab00"
                  fontFamily="monospace" fontSize="8">{f} MHz</text>
              </g>
            );
          })}
          {/* Channel bands */}
          {channels.map((ch, i) => {
            const startFreq = ch.center - 11;
            const endFreq   = ch.center + 11;
            const x1 = 20 + ((startFreq - minFreq) / freqRange) * 470;
            const x2 = 20 + ((endFreq   - minFreq) / freqRange) * 470;
            const cx = (x1 + x2) / 2;
            const isHighlighted = highlighted === ch.num;
            const color = ch.nonOverlap ? '#ffab00' : '#546e7a';
            const y = ch.nonOverlap ? 25 : 55 + (i % 3) * 14;
            return (
              <g key={i}
                onMouseEnter={() => setHighlighted(ch.num)}
                onMouseLeave={() => setHighlighted(null)}
                style={{ cursor: 'pointer' }}>
                <rect x={x1} y={y} width={x2-x1} height={ch.nonOverlap ? 60 : 18} rx={2}
                  fill={`${color}${isHighlighted ? '35' : '15'}`}
                  stroke={color} strokeWidth={isHighlighted ? 1.5 : 0.75}
                  opacity={ch.nonOverlap ? 1 : 0.6}
                  style={{ transition: 'all 0.2s' }}/>
                <text x={cx} y={y + (ch.nonOverlap ? 12 : 12)} textAnchor="middle"
                  fill={color} fontFamily="monospace"
                  fontSize={ch.nonOverlap ? 10 : 7} fontWeight={ch.nonOverlap ? 'bold' : 'normal'}>
                  {ch.num}
                </text>
              </g>
            );
          })}
          {/* Labels */}
          <text x="10" y="50" fill="#ffab00" fontFamily="monospace" fontSize="7" fontWeight="bold">NON-</text>
          <text x="10" y="58" fill="#ffab00" fontFamily="monospace" fontSize="7" fontWeight="bold">OVERLAPPING</text>
        </svg>
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: 'rgba(255,171,0,0.08)', border: '1px solid rgba(255,171,0,0.25)',
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Each 2.4 GHz channel is <strong style={{ color: '#ffab00' }}>22 MHz wide</strong> but channels are spaced only 5 MHz apart — so adjacent channels overlap heavily. Only channels <strong style={{ color: '#ffab00' }}>1, 6, and 11</strong> are spaced far enough apart (25 MHz) to be non-overlapping. Adjacent APs should always use these three channels to avoid co-channel interference.
      </div>
    </InlineViz>
  );
}

// ── AP Modes — autonomous vs lightweight ──────────────────
function ApModes() {
  const [selected, setSelected] = React.useState(null);
  const modes = [
    {
      name: 'Autonomous AP',  color: '#ffab00', icon: '📡',
      desc: 'Standalone — all intelligence on the AP itself. Manages its own SSIDs, security, and RF. Configured individually via CLI or GUI. Common in small offices with 1–5 APs. No WLC required.',
      pros: ['No WLC needed', 'Simple for small deployments', 'Works independently if uplink fails'],
      cons: ['No central management', 'Manual per-AP config', 'No seamless roaming', 'Harder to troubleshoot at scale'],
      config: 'Managed via: IOS CLI, web GUI, or Cisco Prime (legacy)',
    },
    {
      name: 'Lightweight AP', color: '#00e5ff', icon: '⚡',
      desc: 'Thin AP — all intelligence offloaded to a Wireless LAN Controller (WLC). AP handles only RF (real-time 802.11 MAC). WLC handles auth, roaming, config, firmware, and policy. Uses CAPWAP tunnel.',
      pros: ['Centralized management', 'Seamless Layer 2/3 roaming', 'Auto firmware updates', 'Zero-touch provisioning'],
      cons: ['Requires WLC', 'Single point of failure (mitigated by HA WLC)', 'More complex initial setup'],
      config: 'Managed via: Cisco WLC GUI/CLI, DNA Center, Meraki Dashboard',
    },
    {
      name: 'Monitor Mode',   color: '#7c4dff', icon: '👁️',
      desc: 'AP passively scans all channels continuously — does not serve clients. Used for WIDS (Wireless Intrusion Detection), rogue AP detection, and spectrum analysis. Dedicated scanning role.',
      pros: ['Full-time WIDS/WIPS', 'Rogue AP detection', 'Interference monitoring'],
      cons: ['Cannot serve clients', 'Dedicated hardware cost', 'Usually needs nearby serving APs'],
      config: 'Set via: ap-type monitor (on WLC)',
    },
    {
      name: 'SE-Connect',     color: '#00e676', icon: '🔬',
      desc: 'Spectrum Expert Connect mode — AP streams raw RF spectrum data to a PC running Cisco Spectrum Expert software. Used for deep RF analysis, interference hunting, and spectrum surveys.',
      pros: ['Detailed RF spectrum visibility', 'Identifies non-Wi-Fi interference sources', 'Real-time spectral analysis'],
      cons: ['Cannot serve clients', 'Requires Spectrum Expert software licence', 'Dedicated hardware'],
      config: 'Set via: ap-type se-connect (on WLC)',
    },
  ];
  return (
    <InlineViz label="AP MODES — AUTONOMOUS vs LIGHTWEIGHT vs MONITOR vs SE-CONNECT" accent="#00e5ff">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        {modes.map((m, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)}
            style={{
              padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
              background: selected === i ? `${m.color}18` : `${m.color}08`,
              border: `1px solid ${selected === i ? m.color : m.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.75rem', color: m.color }}>{m.name}</span>
            </div>
            {selected === i ? (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)',
                  lineHeight: 1.5, marginBottom: 8 }}>{m.desc}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                  <div>
                    {m.pros.map((p, j) => (
                      <div key={j} style={{ fontSize: '0.625rem', color: '#00e676', marginBottom: 2 }}>✓ {p}</div>
                    ))}
                  </div>
                  <div>
                    {m.cons.map((c, j) => (
                      <div key={j} style={{ fontSize: '0.625rem', color: '#ff5252', marginBottom: 2 }}>✗ {c}</div>
                    ))}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
                  color: m.color }}>{m.config}</div>
              </>
            ) : (
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {m.desc.split('.')[0]}.
              </div>
            )}
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ── CAPWAP — AP join process animation ───────────────────
function CapwapJoinAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const steps = [
    { phase: 'Discovery',      color: '#ffab00', icon: '🔍',
      ap: 'Broadcast CAPWAP Discovery Request', wlc: 'Discovery Response (IP + capability)',
      desc: 'AP boots and sends CAPWAP Discovery Requests (broadcast + multicast + DHCP Option 43 + DNS). WLC responds. AP collects responses from multiple WLCs.' },
    { phase: 'WLC Selection',  color: '#ffab00', icon: '⚖️',
      ap: 'Select best WLC', wlc: '(waiting)',
      desc: 'AP selects the best WLC based on: Master controller preference, least-loaded WLC, or configured primary/secondary/tertiary WLC.' },
    { phase: 'DTLS Handshake', color: '#7c4dff', icon: '🔒',
      ap: 'DTLS Client Hello', wlc: 'DTLS Server Hello + Certificate',
      desc: 'DTLS (Datagram TLS) tunnel established for secure CAPWAP control channel. AP and WLC exchange certificates and establish encrypted session over UDP 5246.' },
    { phase: 'Join',           color: '#00e5ff', icon: '🤝',
      ap: 'CAPWAP Join Request (AP info)', wlc: 'Join Response (Accept)',
      desc: 'AP sends Join Request with model, serial, firmware version, capabilities. WLC accepts and assigns AP to an AP group.' },
    { phase: 'Config Push',    color: '#00e5ff', icon: '⬇️',
      ap: '(receiving config)', wlc: 'Push: SSIDs, VLANs, RF policy, QoS',
      desc: 'WLC pushes the full configuration — SSID profiles, VLAN mappings, RF channel/power settings, QoS policy, security profiles.' },
    { phase: 'Run State',      color: '#00e676', icon: '✓',
      ap: 'Serving clients', wlc: 'Monitoring + managing AP',
      desc: '✓ AP enters RUN state. Starts beaconing SSIDs and accepting client associations. Keepalive heartbeats maintain CAPWAP session.' },
  ];
  useEffect(() => {
    if (isPaused || step >= steps.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1100);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  const cur = steps[step];
  return (
    <InlineViz label="CAPWAP — LIGHTWEIGHT AP JOIN PROCESS" accent="#7c4dff">
      {/* Phase progress */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, overflowX: 'auto' }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              opacity: step >= i ? 1 : 0.25, transition: 'opacity 0.4s', minWidth: 58,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step >= i ? `${s.color}20` : 'var(--bg-elevated)',
                border: `2px solid ${step >= i ? s.color : 'var(--border-subtle)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem', boxShadow: step === i ? `0 0 12px ${s.color}50` : 'none',
                transition: 'all 0.4s',
              }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem',
                color: step >= i ? s.color : 'var(--text-muted)', textAlign: 'center',
                fontWeight: step === i ? 700 : 400 }}>{s.phase}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 10, height: 2, alignSelf: 'center', marginBottom: 14, flexShrink: 0,
                background: step > i ? steps[i].color : 'var(--border-subtle)',
                transition: 'background 0.4s' }}/>
            )}
          </React.Fragment>
        ))}
      </div>
      {/* AP ↔ WLC exchange */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10,
        alignItems: 'center', marginBottom: 10 }}>
        <div style={{ padding: '8px 10px', borderRadius: 5,
          background: `${cur.color}08`, border: `1px solid ${cur.color}25`, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem',
            color: cur.color, marginBottom: 4 }}>ACCESS POINT</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
            color: 'var(--text-secondary)' }}>{cur.ap}</div>
        </div>
        <div style={{ fontSize: '1.25rem', color: cur.color, textAlign: 'center' }}>⇌</div>
        <div style={{ padding: '8px 10px', borderRadius: 5,
          background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)',
          textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem',
            color: '#00e676', marginBottom: 4 }}>WLC</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
            color: 'var(--text-secondary)' }}>{cur.wlc}</div>
        </div>
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: `${cur.color}08`, border: `1px solid ${cur.color}25`,
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {cur.desc}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// WIRELESS CONTROLLER INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── WLC Functions — split-MAC architecture ────────────────
function WlcSplitMac() {
  const [hovered, setHovered] = React.useState(null);
  const apFunctions = [
    { label: 'Real-time 802.11 MAC', color: '#00e5ff', detail: 'Beacon transmission, probe responses, ACKs, retransmissions — must happen in microseconds, cannot tolerate WLC round-trip latency.' },
    { label: 'RF Transmission/Reception', color: '#00e5ff', detail: 'Antenna, radio chipset, modulation/demodulation, power amplification — all physical layer work stays on the AP.' },
    { label: 'Encryption/Decryption (DTLS)', color: '#00e5ff', detail: 'Frame encryption for the air interface (WPA2/WPA3) happens on the AP in hardware for throughput.' },
    { label: 'Client Association (local)', color: '#00e5ff', detail: 'Initial 802.11 association frames handled locally. Auth and policy decisions forwarded to WLC.' },
  ];
  const wlcFunctions = [
    { label: 'Authentication & Policy', color: '#00e676', detail: 'WPA2-Enterprise auth, 802.1X/RADIUS integration, client policy enforcement (QoS, ACL, VLAN assignment).' },
    { label: 'SSID / VLAN Management', color: '#00e676', detail: 'SSID profiles mapped to VLANs, guest WLAN isolation, anchor controller for guest tunneling.' },
    { label: 'RF Management (RRM)', color: '#00e676', detail: 'Auto channel selection, Tx power control, coverage hole detection — WLC coordinates RF across all APs.' },
    { label: 'Roaming (L2/L3)', color: '#00e676', detail: 'Seamless client roaming between APs — L2 within same subnet, L3 (mobility tunnel) across subnets.' },
    { label: 'Firmware & Config Push', color: '#00e676', detail: 'Centralized firmware upgrades, SSID/policy changes pushed simultaneously to all APs.' },
    { label: 'Monitoring & Reporting', color: '#00e676', detail: 'Client statistics, rogue AP detection, interference alerts, compliance reporting.' },
  ];
  return (
    <InlineViz label="WLC SPLIT-MAC — WHAT THE AP DOES vs WHAT THE WLC DOES" accent="#00e5ff">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', gap: 8 }}>
        {/* AP column */}
        <div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: '0.75rem', color: '#00e5ff', marginBottom: 8,
            padding: '5px', borderRadius: 5, background: 'rgba(0,229,255,0.1)',
            border: '1px solid rgba(0,229,255,0.3)' }}>📡 ACCESS POINT<br/>
            <span style={{ fontSize: '0.5rem', fontWeight: 400, color: 'var(--text-muted)' }}>Real-time functions</span>
          </div>
          {apFunctions.map((f, i) => (
            <div key={i}
              onMouseEnter={() => setHovered(`ap-${i}`)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '6px 8px', borderRadius: 4, marginBottom: 4, cursor: 'default',
                background: hovered === `ap-${i}` ? 'rgba(0,229,255,0.12)' : 'rgba(0,229,255,0.05)',
                border: `1px solid ${hovered === `ap-${i}` ? '#00e5ff' : 'rgba(0,229,255,0.2)'}`,
                transition: 'all 0.2s',
              }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: '#00e5ff', fontWeight: 600, marginBottom: hovered === `ap-${i}` ? 4 : 0 }}>{f.label}</div>
              {hovered === `ap-${i}` && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.detail}</div>
              )}
            </div>
          ))}
        </div>
        {/* CAPWAP tunnel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 4 }}>
          <div style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)',
            color: '#7c4dff', textAlign: 'center' }}>CAPWAP</div>
          {['⬆','⬇','⬆','⬇'].map((a, i) => (
            <div key={i} style={{ color: '#7c4dff', fontSize: '0.75rem', lineHeight: 1 }}>{a}</div>
          ))}
          <div style={{ fontSize: '0.5rem', fontFamily: 'var(--font-mono)',
            color: '#7c4dff', textAlign: 'center' }}>UDP 5246/5247</div>
        </div>
        {/* WLC column */}
        <div>
          <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: '0.75rem', color: '#00e676', marginBottom: 8,
            padding: '5px', borderRadius: 5, background: 'rgba(0,230,118,0.1)',
            border: '1px solid rgba(0,230,118,0.3)' }}>🎛️ WLC<br/>
            <span style={{ fontSize: '0.5rem', fontWeight: 400, color: 'var(--text-muted)' }}>Centralized intelligence</span>
          </div>
          {wlcFunctions.map((f, i) => (
            <div key={i}
              onMouseEnter={() => setHovered(`wlc-${i}`)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '6px 8px', borderRadius: 4, marginBottom: 4, cursor: 'default',
                background: hovered === `wlc-${i}` ? 'rgba(0,230,118,0.12)' : 'rgba(0,230,118,0.05)',
                border: `1px solid ${hovered === `wlc-${i}` ? '#00e676' : 'rgba(0,230,118,0.2)'}`,
                transition: 'all 0.2s',
              }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: '#00e676', fontWeight: 600, marginBottom: hovered === `wlc-${i}` ? 4 : 0 }}>{f.label}</div>
              {hovered === `wlc-${i}` && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.detail}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.6875rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        Hover any function to see details · AP handles real-time RF · WLC handles intelligence and policy
      </div>
    </InlineViz>
  );
}

// ── Deployment Models — WLC options ───────────────────────
function WlcDeploymentModels() {
  const [selected, setSelected] = React.useState(null);
  const models = [
    {
      name: 'Centralized (Local Mode)',
      color: '#00e5ff', icon: '🏢',
      desc: 'All client traffic tunneled back to WLC via CAPWAP data tunnel. WLC is the central point — located in the data centre or campus core. Default mode for most enterprise deployments.',
      pros: ['Centralized policy enforcement', 'Full WLC visibility', 'Simple VLAN management'],
      cons: ['All traffic hairpins to WLC', 'WAN latency for remote branches', 'WLC is bottleneck'],
      use: 'Campus buildings with low-latency WLC access',
    },
    {
      name: 'FlexConnect',
      color: '#00e676', icon: '🌿',
      desc: 'AP can locally switch client traffic even when WAN to WLC is down. Config cached on AP. Best for branch offices — clients stay connected during WAN outages.',
      pros: ['Local switching reduces WAN traffic', 'Survives WLC WAN failure', 'VLAN locally mapped'],
      cons: ['More complex config', 'Some features unavailable in standalone mode', 'AP must cache config'],
      use: 'Branch offices, retail stores with unreliable WAN',
    },
    {
      name: 'Cloud (Meraki / Catalyst Center)',
      color: '#7c4dff', icon: '☁️',
      desc: 'WLC function hosted in cloud (Cisco Meraki or Catalyst Center cloud). Zero-touch provisioning — APs phone home to cloud on boot. No on-premise WLC hardware needed.',
      pros: ['No WLC hardware to manage', 'Zero-touch AP provisioning', 'Dashboard accessible anywhere'],
      cons: ['Requires internet for management', 'Subscription cost', 'Data sovereignty concerns'],
      use: 'Distributed enterprises, retail chains, SMB',
    },
    {
      name: 'Embedded / Mobility Express',
      color: '#ffab00', icon: '📦',
      desc: 'WLC software runs directly on one of the APs (master AP). Other APs join as subordinates. No separate WLC hardware. Suitable for small deployments up to 100 APs.',
      pros: ['No separate WLC hardware', 'Lower cost', 'Simple for small sites'],
      cons: ['Master AP is single point of failure', 'Limited scalability', 'Fewer advanced features'],
      use: 'SMB, single-building deployments < 100 APs',
    },
  ];
  return (
    <InlineViz label="WLC DEPLOYMENT MODELS — FOUR OPTIONS" accent="#00e5ff">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {models.map((m, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)}
            style={{
              padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
              background: selected === i ? `${m.color}15` : `${m.color}06`,
              border: `1px solid ${selected === i ? m.color : m.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1.25rem' }}>{m.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.6875rem', color: m.color }}>{m.name}</span>
            </div>
            {selected === i ? (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)',
                  lineHeight: 1.5, marginBottom: 8 }}>{m.desc}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                  <div>
                    {m.pros.map((p, j) => (
                      <div key={j} style={{ fontSize: '0.6rem', color: '#00e676', marginBottom: 2 }}>✓ {p}</div>
                    ))}
                  </div>
                  <div>
                    {m.cons.map((c, j) => (
                      <div key={j} style={{ fontSize: '0.6rem', color: '#ff5252', marginBottom: 2 }}>✗ {c}</div>
                    ))}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem', color: m.color }}>
                  Best for: {m.use}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {m.desc.split('.')[0]}.
              </div>
            )}
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ── Channel Planning — RRM visualization ─────────────────
function RrmChannelPlanning() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const aps = [
    { id: 'AP1', x: 80,  y: 60,  ch: null, power: null, finalCh: 1,  finalPow: 'Med' },
    { id: 'AP2', x: 200, y: 60,  ch: null, power: null, finalCh: 6,  finalPow: 'Low' },
    { id: 'AP3', x: 320, y: 60,  ch: null, power: null, finalCh: 11, finalPow: 'Med' },
    { id: 'AP4', x: 80,  y: 130, ch: null, power: null, finalCh: 6,  finalPow: 'Med' },
    { id: 'AP5', x: 200, y: 130, ch: null, power: null, finalCh: 11, finalPow: 'Low' },
    { id: 'AP6', x: 320, y: 130, ch: null, power: null, finalCh: 1,  finalPow: 'Med' },
  ];
  const chColors = { 1: '#00e5ff', 6: '#00e676', 11: '#ffab00' };
  useEffect(() => {
    if (isPaused || step >= 3) return;
    const t = setTimeout(() => setStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  return (
    <InlineViz label="CHANNEL PLANNING — RRM AUTO ASSIGNS NON-OVERLAPPING CHANNELS" accent="#00e676">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 400 190" style={{ width: 380, maxHeight: 190, flexShrink: 0 }}>
          {/* Floor plan outline */}
          <rect x="20" y="20" width="360" height="160" rx="6"
            fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth="1"/>
          <text x="200" y="14" textAnchor="middle" fill="var(--text-muted)"
            fontFamily="monospace" fontSize="8">Office Floor Plan</text>
          {/* Coverage circles */}
          {step >= 2 && aps.map((ap, i) => (
            <circle key={i} cx={ap.x} cy={ap.y} r={52}
              fill={`${chColors[ap.finalCh]}08`}
              stroke={`${chColors[ap.finalCh]}30`} strokeWidth="1"/>
          ))}
          {/* APs */}
          {aps.map((ap, i) => {
            const assigned = step >= 2;
            const color = assigned ? chColors[ap.finalCh] : '#546e7a';
            return (
              <g key={i}>
                <rect x={ap.x - 20} y={ap.y - 16} width={40} height={32} rx={4}
                  fill={assigned ? `${color}20` : 'var(--bg-elevated)'}
                  stroke={color} strokeWidth={assigned ? 1.5 : 1}
                  style={{ transition: 'all 0.5s' }}/>
                <text x={ap.x} y={ap.y - 3} textAnchor="middle" fill={color}
                  fontFamily="monospace" fontSize="9" fontWeight="bold">{ap.id}</text>
                <text x={ap.x} y={ap.y + 9} textAnchor="middle" fill={color}
                  fontFamily="monospace" fontSize="8">
                  {assigned ? `ch${ap.finalCh}` : '?'}
                </text>
              </g>
            );
          })}
          {/* RRM scanning arrows */}
          {step === 1 && (
            <g opacity="0.6">
              <text x="200" y="110" textAnchor="middle" fill="#7c4dff"
                fontFamily="monospace" fontSize="10">📡 scanning RF...</text>
            </g>
          )}
          {/* Legend */}
          {step >= 2 && (
            <g>
              {[[1,'#00e5ff'],[6,'#00e676'],[11,'#ffab00']].map(([ch, col], i) => (
                <g key={i}>
                  <rect x={30 + i*60} y={170} width={10} height={10} rx={2}
                    fill={`${col}40`} stroke={col} strokeWidth={1}/>
                  <text x={44 + i*60} y={179} fill={col}
                    fontFamily="monospace" fontSize="8">Ch {ch}</text>
                </g>
              ))}
            </g>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            {step === 0 && 'APs boot up. All channels are unassigned (shown as ?).'}
            {step === 1 && 'RRM (Radio Resource Management) scans all channels on each AP — measuring neighbour signal strength and interference levels.'}
            {step === 2 && 'WLC runs the RRM algorithm. Adjacent APs are assigned non-overlapping channels (1, 6, 11) to minimize co-channel interference.'}
            {step >= 3 && '✓ Tx power is also automatically tuned — APs in the centre of dense areas use lower power to avoid overlapping coverage and causing hidden node problems.'}
          </div>
          <div style={{ padding: '8px 10px', borderRadius: 5,
            background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)',
            fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            RRM runs automatically and continuously — it can respond to interference from a new microwave or neighbouring WLAN by reassigning channels with minimal disruption.
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// WIRELESS SECURITY INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Wi-Fi Security Evolution — timeline ───────────────────
function WifiSecurityEvolution() {
  const [selected, setSelected] = React.useState(null);
  const standards = [
    {
      name: 'WEP',  year: '1997', color: '#ff5252', status: 'Broken',
      cipher: 'RC4 (40-bit key)', auth: 'Shared key / Open',
      broken: '2001 — RC4 implementation flaws, IV reuse, weak key scheduling. Any WEP network crackable in minutes with aircrack-ng.',
      desc: 'Wired Equivalent Privacy. First wireless security standard. Intended to provide same security as wired LAN — failed catastrophically.',
    },
    {
      name: 'WPA',  year: '2003', color: '#ff6d00', status: 'Deprecated',
      cipher: 'TKIP (RC4 with per-packet keys)', auth: 'PSK / 802.1X',
      broken: '2008 — TKIP cracked via Beck-Tews attack. Still uses RC4. Deprecated by IEEE in 2012.',
      desc: 'Wi-Fi Protected Access. Emergency fix after WEP collapse. Introduced TKIP as a software upgrade to existing WEP hardware.',
    },
    {
      name: 'WPA2', year: '2004', color: '#ffab00', status: 'Current (legacy)',
      cipher: 'AES-CCMP (128-bit)', auth: 'PSK / 802.1X (EAP)',
      broken: 'KRACK (2017) — Key Reinstallation Attack allows nonce reuse. PMKID attack enables offline PSK brute force. Still widely used.',
      desc: 'Mandatory AES encryption. CCMP replaced TKIP. Strong when properly configured with complex PSK or 802.1X.',
    },
    {
      name: 'WPA3', year: '2018', color: '#00e676', status: 'Current (recommended)',
      cipher: 'AES-GCMP-256 (WPA3-Enterprise)', auth: 'SAE (PSK) / 802.1X',
      broken: 'Dragonblood (2019) — timing/cache side-channels in SAE. Patched. No known practical breaks on updated implementations.',
      desc: 'SAE (Simultaneous Authentication of Equals) replaces PSK — resistant to offline dictionary attacks. Forward secrecy. PMF mandatory.',
    },
  ];
  return (
    <InlineViz label="WI-FI SECURITY EVOLUTION — WEP → WPA → WPA2 → WPA3" accent="#00e676">
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, overflowX: 'auto' }}>
        {standards.map((s, i) => (
          <React.Fragment key={i}>
            <div onClick={() => setSelected(selected === i ? null : i)}
              style={{
                flex: 1, minWidth: 80, padding: '10px 8px', cursor: 'pointer',
                background: selected === i ? `${s.color}18` : `${s.color}08`,
                border: `1px solid ${selected === i ? s.color : s.color + '30'}`,
                borderRadius: i === 0 ? '6px 0 0 6px' : i === standards.length-1 ? '0 6px 6px 0' : 0,
                borderLeft: i > 0 ? 'none' : undefined,
                textAlign: 'center', transition: 'all 0.2s',
              }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800,
                fontSize: '1rem', color: s.color, marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
                color: 'var(--text-muted)', marginBottom: 4 }}>{s.year}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                fontWeight: 700, color: s.color, background: `${s.color}15`,
                padding: '2px 6px', borderRadius: 3 }}>{s.status}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      {selected !== null && (
        <div style={{ padding: '10px 14px', borderRadius: 6,
          background: `${standards[selected].color}08`,
          border: `1px solid ${standards[selected].color}35` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                color: 'var(--text-muted)', marginBottom: 2 }}>CIPHER</div>
              <div style={{ fontSize: '0.75rem', color: standards[selected].color,
                fontFamily: 'var(--font-mono)' }}>{standards[selected].cipher}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                color: 'var(--text-muted)', marginBottom: 2 }}>AUTHENTICATION</div>
              <div style={{ fontSize: '0.75rem', color: standards[selected].color,
                fontFamily: 'var(--font-mono)' }}>{standards[selected].auth}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)',
            lineHeight: 1.6, marginBottom: 6 }}>{standards[selected].desc}</div>
          <div style={{ padding: '6px 10px', borderRadius: 4,
            background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)',
            fontSize: '0.75rem', color: '#ff8a80', lineHeight: 1.5 }}>
            ⚠ {standards[selected].broken}
          </div>
        </div>
      )}
      {selected === null && (
        <div style={{ textAlign: 'center', fontSize: '0.8125rem',
          color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Click any standard to see cipher, auth method, and known vulnerabilities
        </div>
      )}
    </InlineViz>
  );
}

// ── Authentication Modes — PSK vs 802.1X ──────────────────
function WifiAuthModes() {
  const [mode, setMode] = React.useState('psk');
  const isPsk = mode === 'psk';
  return (
    <InlineViz label="AUTHENTICATION MODES — PSK vs 802.1X (Enterprise)" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['psk','WPA2/3-Personal (PSK)'],['8021x','WPA2/3-Enterprise (802.1X)']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? (m==='psk' ? 'rgba(255,171,0,0.15)' : 'rgba(0,229,255,0.15)') : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? (m==='psk' ? '#ffab00' : '#00e5ff') : 'var(--border-subtle)'}`,
            color: mode === m ? (m==='psk' ? '#ffab00' : '#00e5ff') : 'var(--text-muted)',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <svg viewBox="0 0 200 140" style={{ width: '100%', maxHeight: 140, display: 'block' }}>
            {isPsk ? (
              <>
                {/* Client */}
                <rect x="10" y="50" width="60" height="30" rx="4"
                  fill="rgba(255,171,0,0.1)" stroke="#ffab00" strokeWidth="1.5"/>
                <text x="40" y="63" textAnchor="middle" fill="#ffab00"
                  fontFamily="monospace" fontSize="9" fontWeight="bold">Client</text>
                <text x="40" y="73" textAnchor="middle" fill="var(--text-muted)"
                  fontFamily="monospace" fontSize="7">PSK known</text>
                {/* AP */}
                <rect x="130" y="50" width="60" height="30" rx="4"
                  fill="rgba(255,171,0,0.1)" stroke="#ffab00" strokeWidth="1.5"/>
                <text x="160" y="63" textAnchor="middle" fill="#ffab00"
                  fontFamily="monospace" fontSize="9" fontWeight="bold">AP</text>
                <text x="160" y="73" textAnchor="middle" fill="var(--text-muted)"
                  fontFamily="monospace" fontSize="7">PSK known</text>
                {/* 4-way handshake */}
                <line x1="70" y1="58" x2="130" y2="58" stroke="#ffab00" strokeWidth="1.5"/>
                <line x1="130" y1="65" x2="70" y2="65" stroke="#ffab00" strokeWidth="1.5" strokeDasharray="3,2"/>
                <line x1="70" y1="72" x2="130" y2="72" stroke="#ffab00" strokeWidth="1.5"/>
                <line x1="130" y1="79" x2="70" y2="79" stroke="#ffab00" strokeWidth="1.5" strokeDasharray="3,2"/>
                <text x="100" y="100" textAnchor="middle" fill="#ffab00"
                  fontFamily="monospace" fontSize="8">4-Way Handshake</text>
                <text x="100" y="112" textAnchor="middle" fill="var(--text-muted)"
                  fontFamily="monospace" fontSize="7">(derives session keys)</text>
                <text x="100" y="130" textAnchor="middle" fill="#ffab00"
                  fontFamily="monospace" fontSize="8">No RADIUS needed</text>
              </>
            ) : (
              <>
                {/* Client */}
                <rect x="5" y="55" width="50" height="25" rx="3"
                  fill="rgba(0,229,255,0.1)" stroke="#00e5ff" strokeWidth="1"/>
                <text x="30" y="70" textAnchor="middle" fill="#00e5ff"
                  fontFamily="monospace" fontSize="8" fontWeight="bold">Client</text>
                {/* AP/Authenticator */}
                <rect x="75" y="45" width="50" height="44" rx="3"
                  fill="rgba(124,77,255,0.1)" stroke="#7c4dff" strokeWidth="1"/>
                <text x="100" y="62" textAnchor="middle" fill="#7c4dff"
                  fontFamily="monospace" fontSize="8" fontWeight="bold">AP</text>
                <text x="100" y="72" textAnchor="middle" fill="#7c4dff"
                  fontFamily="monospace" fontSize="7">Authenticator</text>
                <text x="100" y="83" textAnchor="middle" fill="var(--text-muted)"
                  fontFamily="monospace" fontSize="6">passes EAP</text>
                {/* RADIUS */}
                <rect x="145" y="55" width="50" height="25" rx="3"
                  fill="rgba(0,230,118,0.1)" stroke="#00e676" strokeWidth="1"/>
                <text x="170" y="66" textAnchor="middle" fill="#00e676"
                  fontFamily="monospace" fontSize="7" fontWeight="bold">RADIUS</text>
                <text x="170" y="74" textAnchor="middle" fill="var(--text-muted)"
                  fontFamily="monospace" fontSize="6">Auth Server</text>
                {/* Arrows */}
                <line x1="55" y1="67" x2="75" y2="67" stroke="#00e5ff" strokeWidth="1.5"/>
                <text x="65" y="62" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="6">EAP</text>
                <line x1="125" y1="67" x2="145" y2="67" stroke="#7c4dff" strokeWidth="1.5"/>
                <text x="135" y="62" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="6">RADIUS</text>
                <text x="100" y="115" textAnchor="middle" fill="#00e5ff"
                  fontFamily="monospace" fontSize="7">Per-user credentials</text>
                <text x="100" y="127" textAnchor="middle" fill="#00e5ff"
                  fontFamily="monospace" fontSize="7">Central auth + audit log</text>
              </>
            )}
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(isPsk ? [
              ['✓', 'Simple — one password for all users', '#00e676'],
              ['✓', 'No RADIUS server needed', '#00e676'],
              ['✓', 'Works on any AP/client', '#00e676'],
              ['✗', 'Shared secret — if one device is compromised, rotate all', '#ff5252'],
              ['✗', 'No per-user identity or audit trail', '#ff5252'],
              ['✗', 'Offline dictionary attack possible (PMKID)', '#ff5252'],
            ] : [
              ['✓', 'Per-user credentials (username + password or cert)', '#00e676'],
              ['✓', 'Central revocation — disable one user without PSK change', '#00e676'],
              ['✓', 'Full audit log — who connected, when, from where', '#00e676'],
              ['✓', 'Dynamic per-session encryption keys', '#00e676'],
              ['✗', 'Requires RADIUS server (FreeRADIUS, Cisco ISE, NPS)', '#ff5252'],
              ['✗', 'More complex to configure and troubleshoot', '#ff5252'],
            ]).map(([sym, text, color], i) => (
              <div key={i} style={{ display: 'flex', gap: 6, fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                <span style={{ color, fontWeight: 700, flexShrink: 0 }}>{sym}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── 802.1X Components — triangle animation ────────────────
function Dot1xComponents() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const steps = [
    { desc: 'Client (Supplicant) connects to AP. AP blocks all traffic except EAP auth frames.', highlight: 'sup' },
    { desc: 'AP (Authenticator) receives EAP-Start. Forwards EAP-Request/Identity to client.', highlight: 'auth' },
    { desc: 'Client responds with EAP-Response/Identity (username). AP forwards to RADIUS server.', highlight: 'sup' },
    { desc: 'RADIUS (Auth Server) validates credentials using chosen EAP method (PEAP, EAP-TLS, etc).', highlight: 'aaa' },
    { desc: 'RADIUS sends Access-Accept with session key material (MSK). AP derives PTK for client.', highlight: 'aaa' },
    { desc: '✓ Port opened. Client gets full network access. RADIUS logs the session.', highlight: 'all' },
  ];
  useEffect(() => {
    if (isPaused || step >= steps.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  const cur = steps[step];
  const isHighlighted = (id) => cur.highlight === id || cur.highlight === 'all';
  return (
    <InlineViz label="802.1X — THREE COMPONENTS (Supplicant / Authenticator / Auth Server)" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 280 160" style={{ width: 260, maxHeight: 160, flexShrink: 0 }}>
          {/* Lines */}
          <line x1="65" y1="80" x2="135" y2="80"
            stroke={isHighlighted('auth') ? '#7c4dff' : 'var(--border-subtle)'}
            strokeWidth="2" style={{ transition: 'stroke 0.4s' }}/>
          <line x1="165" y1="80" x2="215" y2="80"
            stroke={isHighlighted('aaa') ? '#00e676' : 'var(--border-subtle)'}
            strokeWidth="2" style={{ transition: 'stroke 0.4s' }}/>
          <text x="100" y="72" textAnchor="middle" fill="#7c4dff"
            fontFamily="monospace" fontSize="7">EAP over LAN</text>
          <text x="190" y="72" textAnchor="middle" fill="#00e676"
            fontFamily="monospace" fontSize="7">RADIUS (UDP 1812)</text>
          {/* Supplicant */}
          <rect x="5" y="60" width="60" height="40" rx="4"
            fill={isHighlighted('sup') ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.06)'}
            stroke="#00e5ff" strokeWidth={isHighlighted('sup') ? 2 : 1}
            style={{ transition: 'all 0.4s' }}/>
          <text x="35" y="76" textAnchor="middle" fill="#00e5ff"
            fontFamily="monospace" fontSize="9" fontWeight="bold">CLIENT</text>
          <text x="35" y="88" textAnchor="middle" fill="#00e5ff"
            fontFamily="monospace" fontSize="7">Supplicant</text>
          <text x="35" y="98" textAnchor="middle" fill="var(--text-muted)"
            fontFamily="monospace" fontSize="6">(802.1X software)</text>
          {/* Authenticator */}
          <rect x="135" y="55" width="60" height="50" rx="4"
            fill={isHighlighted('auth') ? 'rgba(124,77,255,0.2)' : 'rgba(124,77,255,0.06)'}
            stroke="#7c4dff" strokeWidth={isHighlighted('auth') ? 2 : 1}
            style={{ transition: 'all 0.4s' }}/>
          <text x="165" y="73" textAnchor="middle" fill="#7c4dff"
            fontFamily="monospace" fontSize="9" fontWeight="bold">AP / SW</text>
          <text x="165" y="85" textAnchor="middle" fill="#7c4dff"
            fontFamily="monospace" fontSize="7">Authenticator</text>
          <text x="165" y="97" textAnchor="middle" fill="var(--text-muted)"
            fontFamily="monospace" fontSize="6">blocks port</text>
          <text x="165" y="107" textAnchor="middle" fill="var(--text-muted)"
            fontFamily="monospace" fontSize="6">until auth OK</text>
          {/* Auth Server */}
          <rect x="215" y="60" width="60" height="40" rx="4"
            fill={isHighlighted('aaa') ? 'rgba(0,230,118,0.2)' : 'rgba(0,230,118,0.06)'}
            stroke="#00e676" strokeWidth={isHighlighted('aaa') ? 2 : 1}
            style={{ transition: 'all 0.4s' }}/>
          <text x="245" y="76" textAnchor="middle" fill="#00e676"
            fontFamily="monospace" fontSize="9" fontWeight="bold">RADIUS</text>
          <text x="245" y="88" textAnchor="middle" fill="#00e676"
            fontFamily="monospace" fontSize="7">Auth Server</text>
          <text x="245" y="98" textAnchor="middle" fill="var(--text-muted)"
            fontFamily="monospace" fontSize="6">(ISE, NPS)</text>
          {/* Blocked port indicator */}
          {step < 5 && (
            <text x="100" y="115" textAnchor="middle" fill="#ff5252"
              fontFamily="monospace" fontSize="8">⛔ Port blocked</text>
          )}
          {step >= 5 && (
            <text x="100" y="115" textAnchor="middle" fill="#00e676"
              fontFamily="monospace" fontSize="8">✓ Port open</text>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ padding: '8px 12px', borderRadius: 6,
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)',
            fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 10 }}>
            {cur.desc}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
            <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Wireless Threats — clickable cards ────────────────────
function WirelessThreats() {
  const [selected, setSelected] = React.useState(null);
  const threats = [
    {
      name: 'Evil Twin AP', icon: '👿', color: '#ff5252',
      desc: 'Attacker sets up a rogue AP with the same SSID as a legitimate network. Clients connect to the attacker\'s AP instead of the real one. Attacker can intercept all traffic (MitM).',
      mitigation: 'Use 802.1X (clients verify server certificate). WPA3-SAE. Rogue AP detection on WLC.',
    },
    {
      name: 'Deauthentication Attack', icon: '🚫', color: '#ff6d00',
      desc: 'Attacker sends forged 802.11 deauthentication frames (management frames are unauthenticated in WPA2). Clients are forced to disconnect, enabling denial of service or forcing re-association to evil twin.',
      mitigation: '802.11w PMF (Protected Management Frames) — mandatory in WPA3. Makes deauth frames cryptographically signed.',
    },
    {
      name: 'KRACK', icon: '🔑', color: '#ffab00',
      desc: 'Key Reinstallation Attack (2017). Exploits the WPA2 4-way handshake by replaying handshake messages, causing clients to reinstall an already-used session key and resetting nonces.',
      mitigation: 'Patch OS and drivers (all major vendors patched within weeks of disclosure). Use WPA3 SAE which is immune.',
    },
    {
      name: 'PMKID Attack', icon: '🔓', color: '#e040fb',
      desc: 'Attacker captures a single EAPOL frame containing the PMKID (derived from PSK). Allows offline brute-force of the WPA2-Personal passphrase without needing a full handshake capture.',
      mitigation: 'Use long, complex passphrases (20+ chars). WPA3 SAE makes offline attacks computationally infeasible.',
    },
    {
      name: 'Rogue AP', icon: '📡', color: '#7c4dff',
      desc: 'Unauthorised AP plugged into corporate network by an employee or attacker. Bypasses wired security controls. Provides wireless access to the internal network without IT knowledge.',
      mitigation: 'WLC rogue AP detection. 802.1X on wired ports (NAC). Network scanning for unexpected DHCP leases.',
    },
    {
      name: 'Eavesdropping', icon: '👂', color: '#78909c',
      desc: 'Passive capture of wireless frames. WEP is trivially decryptable. WPA2-Personal with known PSK can be decrypted offline if the 4-way handshake is captured.',
      mitigation: 'WPA2/WPA3 with strong PSK or 802.1X. WPA3 provides forward secrecy — past sessions safe even if PSK later compromised.',
    },
  ];
  return (
    <InlineViz label="WIRELESS THREATS — CLICK TO EXPAND" accent="#ff5252">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {threats.map((t, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)}
            style={{
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
              background: selected === i ? `${t.color}18` : `${t.color}08`,
              border: `1px solid ${selected === i ? t.color : t.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: '1.25rem', marginBottom: 3 }}>{t.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
              fontSize: '0.6875rem', color: t.color }}>{t.name}</div>
          </div>
        ))}
      </div>
      {selected !== null && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 6,
          background: `${threats[selected].color}08`,
          border: `1px solid ${threats[selected].color}35` }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)',
            lineHeight: 1.6, marginBottom: 8 }}>{threats[selected].desc}</div>
          <div style={{ padding: '6px 10px', borderRadius: 4,
            background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)',
            fontSize: '0.75rem', color: '#00e676', lineHeight: 1.5 }}>
            ✓ Mitigation: {threats[selected].mitigation}
          </div>
        </div>
      )}
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// WIRELESS TOPOLOGY INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Site Survey Types ─────────────────────────────────────
function SiteSurveyTypes() {
  const [selected, setSelected] = React.useState(null);
  const types = [
    {
      name: 'Predictive Survey',
      icon: '🗺️', color: '#7c4dff',
      desc: 'Software-based planning before deployment. Import floor plans into tools like Ekahau or Cisco Prime Infrastructure. Simulate AP placement, signal strength, and coverage areas using RF propagation models.',
      pros: ['No site visit needed initially', 'Fast iteration on AP placement', 'Cost-effective for initial planning'],
      cons: ['Doesn\'t account for real-world obstructions', 'Wall attenuation may differ from model', 'Must be validated with physical survey'],
      tools: 'Ekahau Site Survey, Cisco Prime, AirMagnet Planner',
      when: 'Pre-deployment planning, new buildings',
    },
    {
      name: 'Passive Survey',
      icon: '👂', color: '#00e5ff',
      desc: 'Walk the site with a laptop/tablet running survey software. Listen-only — don\'t associate to APs. Captures signal strength, noise floor, channel utilisation, and interference sources at each physical location.',
      pros: ['Captures real RF environment', 'Detects hidden interference sources', 'Shows actual coverage vs predicted'],
      cons: ['Time-consuming (every square metre)', 'Must revisit after AP changes', 'Client NIC card matters for accuracy'],
      tools: 'Ekahau Site Survey, AirMagnet Survey, NetSpot',
      when: 'Post-deployment validation, troubleshooting dead zones',
    },
    {
      name: 'Active Survey',
      icon: '📡', color: '#00e676',
      desc: 'Associate to APs and measure real throughput at each location. Captures TCP/UDP performance, latency, packet loss, and roaming behaviour. Most accurate for capacity planning.',
      pros: ['Measures actual throughput, not just signal', 'Validates roaming behaviour', 'Identifies performance bottlenecks'],
      cons: ['Requires APs to be installed first', 'Most time-consuming survey type', 'Results depend on network load'],
      tools: 'Ekahau Site Survey (active mode), iPerf with survey overlay',
      when: 'High-density deployments, voice/video validation',
    },
  ];
  return (
    <InlineViz label="SITE SURVEY TYPES — THREE APPROACHES" accent="#7c4dff">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {types.map((t, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)}
            style={{
              padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
              background: selected === i ? `${t.color}18` : `${t.color}08`,
              border: `1px solid ${selected === i ? t.color : t.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{t.icon}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
              fontSize: '0.75rem', color: t.color, marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {t.when}
            </div>
          </div>
        ))}
      </div>
      {selected !== null && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 6,
          background: `${types[selected].color}08`,
          border: `1px solid ${types[selected].color}35` }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)',
            lineHeight: 1.6, marginBottom: 8 }}>{types[selected].desc}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
            <div>
              {types[selected].pros.map((p, i) => (
                <div key={i} style={{ fontSize: '0.6875rem', color: '#00e676', marginBottom: 3 }}>✓ {p}</div>
              ))}
            </div>
            <div>
              {types[selected].cons.map((c, i) => (
                <div key={i} style={{ fontSize: '0.6875rem', color: '#ff5252', marginBottom: 3 }}>✗ {c}</div>
              ))}
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
            color: types[selected].color }}>Tools: {types[selected].tools}</div>
        </div>
      )}
    </InlineViz>
  );
}

// ── Design Considerations — coverage overlap viz ───────────
function WirelessCoverageDesign() {
  const [overlap, setOverlap] = React.useState(20);
  const [density, setDensity] = React.useState('medium');
  const densityInfo = {
    low:    { clients: '5–15',  spacing: 'Large',  freq: '2.4 GHz acceptable', color: '#00e676' },
    medium: { clients: '15–30', spacing: 'Medium', freq: '5 GHz preferred',    color: '#ffab00' },
    high:   { clients: '30–50', spacing: 'Small',  freq: '5 GHz required',     color: '#ff5252' },
  };
  const d = densityInfo[density];
  // AP positions for 3-AP row visualization
  const aps = [{ x: 80 }, { x: 200 }, { x: 320 }];
  const radius = 70;
  const overlapPx = radius * (overlap / 100);
  return (
    <InlineViz label="DESIGN CONSIDERATIONS — COVERAGE, CAPACITY & OVERLAP" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Coverage visualization */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <svg viewBox="0 0 400 130" style={{ width: '100%', maxHeight: 130, display: 'block' }}>
            {/* Floor */}
            <rect x="10" y="15" width="380" height="100" rx="4"
              fill="var(--bg-elevated)" stroke="var(--border-subtle)" strokeWidth="1"/>
            {/* Coverage circles */}
            {aps.map((ap, i) => (
              <g key={i}>
                <circle cx={ap.x} cy={65} r={radius}
                  fill={`${d.color}12`} stroke={`${d.color}40`} strokeWidth="1"/>
                {/* Overlap zones */}
                {i < aps.length - 1 && (
                  <text x={(ap.x + aps[i+1].x) / 2} y={44}
                    textAnchor="middle" fill={overlap >= 15 ? '#00e676' : '#ff5252'}
                    fontFamily="monospace" fontSize="7">
                    {overlap >= 15 ? `${overlap}% ✓` : `${overlap}% ✗`}
                  </text>
                )}
                {/* AP icon */}
                <circle cx={ap.x} cy={65} r={8}
                  fill={`${d.color}30`} stroke={d.color} strokeWidth="1.5"/>
                <text x={ap.x} y={69} textAnchor="middle"
                  fill={d.color} fontFamily="monospace" fontSize="7" fontWeight="bold">AP</text>
                <text x={ap.x} y={105} textAnchor="middle"
                  fill="var(--text-muted)" fontFamily="monospace" fontSize="7">
                  ~{density === 'low' ? '35' : density === 'medium' ? '30' : '20'}m
                </text>
              </g>
            ))}
            {/* Roaming zone indicator */}
            <text x="200" y="125" textAnchor="middle" fill="var(--text-muted)"
              fontFamily="monospace" fontSize="7">Client roams within overlap zone — minimum 15–20% overlap needed</text>
          </svg>
          {/* Overlap slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)', flexShrink: 0 }}>Overlap:</span>
            <input type="range" min={5} max={40} value={overlap}
              onChange={e => setOverlap(Number(e.target.value))}
              style={{ flex: 1, accentColor: overlap >= 15 ? '#00e676' : '#ff5252' }}/>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
              color: overlap >= 15 ? '#00e676' : '#ff5252', fontWeight: 700, flexShrink: 0 }}>
              {overlap}% {overlap >= 15 ? '✓' : '⚠ Too low'}
            </span>
          </div>
        </div>
        {/* Client density selector */}
        <div style={{ minWidth: 160 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
            color: 'var(--text-muted)', marginBottom: 8 }}>CLIENT DENSITY</div>
          {Object.entries(densityInfo).map(([k, v]) => (
            <div key={k} onClick={() => setDensity(k)}
              style={{
                padding: '7px 10px', borderRadius: 5, cursor: 'pointer', marginBottom: 4,
                background: density === k ? `${v.color}15` : `${v.color}05`,
                border: `1px solid ${density === k ? v.color : v.color + '30'}`,
                transition: 'all 0.2s',
              }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.6875rem', color: v.color, textTransform: 'capitalize' }}>{k}</div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                {v.clients} clients/AP · {v.freq}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 4,
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
            lineHeight: 1.6 }}>
            Rule: 20% overlap for voice/roaming<br/>
            Max Tx power → more interference<br/>
            Lower power + more APs = better
          </div>
        </div>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// REMOTE ACCESS VPN INLINE DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Remote Access Technologies — comparison cards ─────────
function RemoteAccessComparison() {
  const [selected, setSelected] = React.useState(null);
  const techs = [
    {
      name: 'IPsec VPN',    icon: '🔒', color: '#00e5ff',
      desc: 'Full tunnel — all traffic encrypted in IPsec ESP. Requires VPN client software. Strong encryption (AES-256). Works at L3 so all applications are tunneled transparently.',
      use: 'Corporate laptops needing full network access, security-sensitive environments',
      pros: ['Full network access', 'Strong encryption', 'All traffic protected'],
      cons: ['Client software required', 'Complex firewall traversal (UDP 500/4500)', 'High overhead'],
    },
    {
      name: 'SSL/TLS VPN',  icon: '🌐', color: '#00e676',
      desc: 'Browser-based or lightweight client over HTTPS (TCP 443). Works through most firewalls and proxies. Clientless mode gives web-app access only. Full-tunnel client mode gives broader access.',
      use: 'Remote workers on personal devices, contractor access, guest VPN',
      pros: ['Works through any firewall (port 443)', 'Clientless option', 'Per-app access control'],
      cons: ['Clientless limited to web apps', 'SSL inspection can break it', 'Less performant than IPsec'],
    },
    {
      name: 'DMVPN',        icon: '🕸️', color: '#7c4dff',
      desc: 'Dynamic Multipoint VPN — hub-and-spoke WAN that dynamically builds spoke-to-spoke tunnels on demand. GRE over IPsec. Enables routing protocols (OSPF/EIGRP) over the tunnel. Cisco-proprietary.',
      use: 'Enterprise WAN replacing MPLS, connecting branch offices over internet',
      pros: ['Dynamic spoke-to-spoke tunnels', 'Supports routing protocols', 'Scalable to thousands of spokes'],
      cons: ['Cisco-proprietary (NHRP)', 'Complex configuration', 'Requires GRE overhead'],
    },
    {
      name: 'Site-to-Site VPN', icon: '🏢', color: '#ffab00',
      desc: 'Permanent IPsec tunnel between two fixed endpoints (HQ to branch). Always-on — no user interaction. Configured on routers/firewalls. Traffic between the two sites is automatically encrypted.',
      use: 'Connecting branch offices to HQ, small deployments without MPLS',
      pros: ['Transparent to users', 'Always-on — no client needed', 'Simple two-site connection'],
      cons: ['Fixed endpoints only', 'All traffic via hub (no direct branch-branch)', 'Manual provisioning per site'],
    },
  ];
  return (
    <InlineViz label="REMOTE ACCESS TECHNOLOGIES — FOUR APPROACHES" accent="#00e5ff">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {techs.map((t, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)}
            style={{
              padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
              background: selected === i ? `${t.color}18` : `${t.color}08`,
              border: `1px solid ${selected === i ? t.color : t.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1.25rem' }}>{t.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.75rem', color: t.color }}>{t.name}</span>
            </div>
            {selected === i ? (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)',
                  lineHeight: 1.5, marginBottom: 8 }}>{t.desc}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 6 }}>
                  <div>
                    {t.pros.map((p, j) => (
                      <div key={j} style={{ fontSize: '0.625rem', color: '#00e676', marginBottom: 2 }}>✓ {p}</div>
                    ))}
                  </div>
                  <div>
                    {t.cons.map((c, j) => (
                      <div key={j} style={{ fontSize: '0.625rem', color: '#ff5252', marginBottom: 2 }}>✗ {c}</div>
                    ))}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
                  color: t.color }}>Best for: {t.use}</div>
              </>
            ) : (
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {t.desc.split('.')[0]}.
              </div>
            )}
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ── IPsec Phases — Phase 1 IKE + Phase 2 IPsec ────────────
function IpsecPhasesAnim() {
  const [step, setStep] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const steps = [
    {
      phase: 1, label: 'IKE Phase 1 — Main Mode',
      color: '#7c4dff',
      peer1: 'Propose: AES-256, SHA-256, DH group 14',
      peer2: 'Accept proposal',
      desc: 'Peers negotiate encryption algorithm, hash, DH group, and authentication method (PSK or certificate). Sets up a secure channel to protect Phase 2.',
    },
    {
      phase: 1, label: 'IKE Phase 1 — Key Exchange',
      color: '#7c4dff',
      peer1: 'DH public key →',
      peer2: '← DH public key',
      desc: 'Diffie-Hellman key exchange derives shared secret. Both peers compute the same symmetric key without ever transmitting it.',
    },
    {
      phase: 1, label: 'IKE Phase 1 — Authentication',
      color: '#7c4dff',
      peer1: 'Authenticate (PSK hash / cert)',
      peer2: 'Authenticate (PSK hash / cert)',
      desc: 'Peers authenticate each other. PSK: each side hashes the pre-shared key + IDs. Certificate: RSA/ECDSA signature. ISAKMP SA established.',
    },
    {
      phase: 2, label: 'IKE Phase 2 — Quick Mode',
      color: '#00e5ff',
      peer1: 'Propose: ESP, AES-256-GCM, traffic selectors',
      peer2: 'Accept IPsec proposal',
      desc: 'Negotiates IPsec SA parameters — protocol (ESP/AH), encryption, HMAC, and which traffic to protect (traffic selectors/ACL). Protected by Phase 1 channel.',
    },
    {
      phase: 2, label: 'IPsec SA Established',
      color: '#00e676',
      peer1: '→ Encrypted data (ESP)',
      peer2: '← Encrypted data (ESP)',
      desc: '✓ Bidirectional IPsec SAs established. All matching traffic is encrypted in ESP. SAs have lifetime (time/bytes) — Phase 2 renegotiated before expiry.',
    },
  ];
  useEffect(() => {
    if (isPaused || step >= steps.length - 1) return;
    const t = setTimeout(() => setStep(s => s + 1), 1200);
    return () => clearTimeout(t);
  }, [step, isPaused]);
  const cur = steps[step];
  return (
    <InlineViz label="IPSEC PHASES — IKE PHASE 1 (ISAKMP SA) + PHASE 2 (IPSEC SA)" accent="#7c4dff">
      {/* Phase indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[1, 2].map(ph => {
          const isActive = cur.phase === ph;
          const isDone   = (ph === 1 && step >= 3) || (ph === 2 && step >= 4);
          const color    = ph === 1 ? '#7c4dff' : '#00e5ff';
          return (
            <div key={ph} style={{
              flex: 1, padding: '6px 10px', borderRadius: 5, textAlign: 'center',
              background: isActive ? `${color}20` : isDone ? `${color}10` : 'var(--bg-elevated)',
              border: `1px solid ${isActive ? color : isDone ? color + '40' : 'var(--border-subtle)'}`,
              transition: 'all 0.4s',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.75rem', color: isActive || isDone ? color : 'var(--text-muted)' }}>
                {isDone && ph === 1 ? '✓ ' : ''}Phase {ph}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
                color: 'var(--text-muted)' }}>
                {ph === 1 ? 'ISAKMP SA (management channel)' : 'IPsec SA (data channel)'}
              </div>
            </div>
          );
        })}
      </div>
      {/* Peer exchange */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ padding: '8px 10px', borderRadius: 5,
          background: `${cur.color}08`, border: `1px solid ${cur.color}25`, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: '0.6875rem', color: cur.color, marginBottom: 4 }}>PEER A</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
            color: 'var(--text-secondary)' }}>{cur.peer1}</div>
        </div>
        <div style={{ fontSize: '1.25rem', color: cur.color, textAlign: 'center' }}>⇌</div>
        <div style={{ padding: '8px 10px', borderRadius: 5,
          background: `${cur.color}08`, border: `1px solid ${cur.color}25`, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: '0.6875rem', color: cur.color, marginBottom: 4 }}>PEER B</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5875rem',
            color: 'var(--text-secondary)' }}>{cur.peer2}</div>
        </div>
      </div>
      <div style={{ padding: '8px 12px', borderRadius: 5,
        background: `${cur.color}08`, border: `1px solid ${cur.color}30`,
        fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
          color: cur.color }}>{cur.label}: </span>{cur.desc}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>{isPaused ? '▶' : '⏸'}</button>
        <button style={BASE.btn} onClick={() => { setStep(0); setIsPaused(false); }}>↺</button>
      </div>
    </InlineViz>
  );
}

// ── VPN Split Tunneling — traffic flow toggle ──────────────
function VpnSplitTunnel() {
  const [mode, setMode] = React.useState('full');
  const isFull = mode === 'full';
  return (
    <InlineViz label="VPN SPLIT TUNNELING — FULL TUNNEL vs SPLIT TUNNEL" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['full','Full Tunnel'],['split','Split Tunnel']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? (m==='full' ? 'rgba(0,229,255,0.15)' : 'rgba(0,230,118,0.15)') : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? (m==='full' ? '#00e5ff' : '#00e676') : 'var(--border-subtle)'}`,
            color: mode === m ? (m==='full' ? '#00e5ff' : '#00e676') : 'var(--text-muted)',
          }}>{label}</button>
        ))}
      </div>
      <svg viewBox="0 0 420 140" style={{ width: '100%', maxHeight: 140, display: 'block', marginBottom: 12 }}>
        {/* Client */}
        <rect x="10" y="55" width="70" height="35" rx="4"
          fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1.5"/>
        <text x="45" y="70" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="9" fontWeight="bold">CLIENT</text>
        <text x="45" y="81" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">Remote user</text>
        {/* VPN Gateway */}
        <rect x="170" y="50" width="80" height="45" rx="4"
          fill="rgba(124,77,255,0.1)" stroke="#7c4dff" strokeWidth="1.5"/>
        <text x="210" y="68" textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="9" fontWeight="bold">VPN GW</text>
        <text x="210" y="79" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">IPsec/SSL</text>
        <text x="210" y="89" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">Terminator</text>
        {/* Corp Network */}
        <rect x="330" y="55" width="80" height="35" rx="4"
          fill="rgba(0,230,118,0.08)" stroke="#00e676" strokeWidth="1.5"/>
        <text x="370" y="70" textAnchor="middle" fill="#00e676" fontFamily="monospace" fontSize="9" fontWeight="bold">CORP</text>
        <text x="370" y="81" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">Internal apps</text>
        {/* Internet cloud */}
        {!isFull && (
          <ellipse cx="210" cy="120" rx="50" ry="14"
            fill="rgba(255,171,0,0.08)" stroke="#ffab00" strokeWidth="1" strokeDasharray="3,2"/>
        )}
        {!isFull && (
          <text x="210" y="124" textAnchor="middle" fill="#ffab00"
            fontFamily="monospace" fontSize="8">Internet (direct)</text>
        )}
        {/* Full tunnel — all traffic to VPN GW */}
        {isFull && (
          <>
            <line x1="80" y1="70" x2="170" y2="72"
              stroke="#00e5ff" strokeWidth="2.5"/>
            <line x1="80" y1="75" x2="170" y2="80"
              stroke="#ffab00" strokeWidth="2.5"/>
            <text x="125" y="63" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="7">Corp traffic</text>
            <text x="125" y="90" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="7">Internet traffic</text>
            <line x1="250" y1="72" x2="330" y2="70"
              stroke="#00e5ff" strokeWidth="2.5"/>
            <text x="340" y="120" textAnchor="middle" fill="#ffab00"
              fontFamily="monospace" fontSize="7">Internet exits via GW</text>
            <text x="290" y="63" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="7">Corp only →</text>
          </>
        )}
        {/* Split tunnel */}
        {!isFull && (
          <>
            <line x1="80" y1="68" x2="170" y2="68"
              stroke="#00e5ff" strokeWidth="2.5"/>
            <text x="125" y="60" textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="7">Corp traffic →</text>
            <line x1="250" y1="68" x2="330" y2="68"
              stroke="#00e5ff" strokeWidth="2"/>
            <line x1="80" y1="80" x2="160" y2="110"
              stroke="#ffab00" strokeWidth="2.5" strokeDasharray="4,2"/>
            <text x="100" y="103" textAnchor="middle" fill="#ffab00" fontFamily="monospace" fontSize="7">Internet →</text>
          </>
        )}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ padding: '8px 12px', borderRadius: 5,
          background: isFull ? 'rgba(0,229,255,0.08)' : 'rgba(0,229,255,0.04)',
          border: `1px solid ${isFull ? '#00e5ff40' : 'var(--border-subtle)'}` }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: '0.6875rem', color: '#00e5ff', marginBottom: 4 }}>Full Tunnel</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            ALL traffic routed through VPN gateway — both corporate and internet. Corp can inspect/filter internet traffic. Higher latency for internet browsing. More secure for compliance.
          </div>
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 5,
          background: !isFull ? 'rgba(0,230,118,0.08)' : 'rgba(0,230,118,0.04)',
          border: `1px solid ${!isFull ? '#00e67640' : 'var(--border-subtle)'}` }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
            fontSize: '0.6875rem', color: '#00e676', marginBottom: 4 }}>Split Tunnel</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Corporate traffic via VPN, internet traffic goes direct. Lower VPN gateway load. Better internet performance. Risk: malware on client can reach internet without corp inspection.
          </div>
        </div>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// OSI MODEL — ENHANCED / REPLACEMENT DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── OSI Layer deep-dive — one layer at a time ─────────────
function OsiLayerDeepDive() {
  const [layer, setLayer] = React.useState(7);
  const layers = [
    {
      n: 7, name: 'Application',  color: '#6366f1',
      pdu: 'Data', device: 'Host',
      protocols: 'HTTP, HTTPS, FTP, SSH, DNS, DHCP, SMTP, IMAP, SNMP, Telnet',
      role: 'Provides network services directly to end-user applications. Does NOT refer to the app itself — it is the API the network exposes. When your browser makes an HTTP request, this layer handles it.',
      ccna: 'Know which protocols live here. DNS (UDP/TCP 53), DHCP (UDP 67/68), HTTP (80), HTTPS (443), SSH (22), Telnet (23), FTP (20/21), SMTP (25).',
    },
    {
      n: 6, name: 'Presentation', color: '#8b5cf6',
      pdu: 'Data', device: 'Host',
      protocols: 'TLS/SSL, JPEG, MPEG, GIF, ASCII, EBCDIC, encryption/compression',
      role: 'Translates data between application format and network format. Handles encryption (TLS), compression, and character encoding. Ensures data sent by one app is readable by another regardless of platform.',
      ccna: 'Rarely tested in isolation. TLS/SSL lives here. Remember: encryption and compression happen at L6.',
    },
    {
      n: 5, name: 'Session',      color: '#a855f7',
      pdu: 'Data', device: 'Host',
      protocols: 'NetBIOS, RPC, PPTP, SAP, SQL, NFS',
      role: 'Establishes, manages, and terminates sessions between applications. Handles checkpointing (allowing a download to resume after interruption) and synchronisation between hosts.',
      ccna: 'Least tested layer on CCNA. Remember: sessions, dialogues, checkpoints. NetBIOS and RPC live here.',
    },
    {
      n: 4, name: 'Transport',    color: '#ec4899',
      pdu: 'Segment (TCP) / Datagram (UDP)', device: 'Host',
      protocols: 'TCP, UDP, SCTP',
      role: 'End-to-end data delivery between processes on different hosts. TCP: reliable, ordered, connection-oriented (3-way handshake, seq/ack, flow control). UDP: fast, connectionless, no guarantee — used for DNS, DHCP, VoIP, streaming.',
      ccna: 'High priority. Know TCP vs UDP differences, the 3-way handshake (SYN/SYN-ACK/ACK), port numbers, and windowing. TCP is reliable; UDP is fast.',
    },
    {
      n: 3, name: 'Network',      color: '#f43f5e',
      pdu: 'Packet', device: 'Router',
      protocols: 'IPv4, IPv6, ICMP, ARP (debated), OSPF, BGP, EIGRP',
      role: 'Logical addressing and routing between different networks. Routers make hop-by-hop forwarding decisions based on destination IP. Source and destination IPs remain constant end-to-end; MAC addresses change at each hop.',
      ccna: 'Critical. IP addressing, subnetting, routing protocols, and ICMP all live here. "Layer 3 switch" means routing capability. ping uses ICMP at L3.',
    },
    {
      n: 2, name: 'Data Link',    color: '#f97316',
      pdu: 'Frame', device: 'Switch / Bridge',
      protocols: 'Ethernet (802.3), Wi-Fi (802.11), PPP, VLANs (802.1Q), STP, ARP',
      role: 'Node-to-node delivery on the same network segment using MAC addresses. Divided into MAC (media access control) and LLC (logical link control) sublayers. Switches operate here — they learn MAC addresses and forward frames to the correct port.',
      ccna: 'Critical. MAC addresses, VLANs, STP, EtherChannel, and ARP all live at L2. "Layer 2 issue" = MAC/switching/VLAN/STP problem.',
    },
    {
      n: 1, name: 'Physical',     color: '#eab308',
      pdu: 'Bits', device: 'Hub / NIC / Cable',
      protocols: 'IEEE 802.3 (Ethernet cabling), USB, DSL, Bluetooth PHY, SONET',
      role: 'Transmits raw bits over a physical medium — electrical signals (copper), light pulses (fibre), or radio waves (Wi-Fi). Defines voltages, frequencies, connector types, and cable specifications. Hubs operate here — they repeat electrical signals.',
      ccna: 'Know cable types (Cat5e/Cat6/fibre), connector types (RJ-45, LC, SC), and that hubs are L1 devices. "Layer 1 issue" = physical cable, port, or NIC problem.',
    },
  ];
  const l = layers.find(x => x.n === layer);
  return (
    <InlineViz label="THE SEVEN LAYERS — CLICK A LAYER TO EXPLORE" accent={l.color}>
      {/* Layer selector */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>
        {layers.map(la => (
          <button key={la.n} onClick={() => setLayer(la.n)} style={{
            flex: 1, padding: '5px 2px', borderRadius: 4, cursor: 'pointer',
            background: layer === la.n ? `${la.color}25` : `${la.color}08`,
            border: `1px solid ${layer === la.n ? la.color : la.color + '30'}`,
            fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.6875rem',
            color: layer === la.n ? la.color : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}>L{la.n}</button>
        ))}
      </div>
      {/* Layer detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16 }}>
        {/* Left: metadata */}
        <div>
          <div style={{ padding: '10px 12px', borderRadius: 6,
            background: `${l.color}12`, border: `1px solid ${l.color}40`,
            marginBottom: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800,
              fontSize: '1.5rem', color: l.color, marginBottom: 4 }}>L{l.n}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
              fontSize: '0.875rem', color: l.color, marginBottom: 8 }}>{l.name}</div>
            {[['PDU', l.pdu], ['Device', l.device]].map(([label, val]) => (
              <div key={label} style={{ marginBottom: 5 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
                  color: 'var(--text-muted)', marginBottom: 1 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem',
                  color: l.color, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
          {/* Protocols */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem',
            color: 'var(--text-muted)', marginBottom: 4 }}>KEY PROTOCOLS</div>
          <div style={{ fontSize: '0.625rem', color: 'var(--text-secondary)',
            lineHeight: 1.6 }}>{l.protocols}</div>
        </div>
        {/* Right: description + CCNA tip */}
        <div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)',
            lineHeight: 1.6, marginBottom: 10 }}>{l.role}</div>
          <div style={{ padding: '7px 10px', borderRadius: 5,
            background: `${l.color}08`, border: `1px solid ${l.color}30`,
            fontSize: '0.75rem', color: l.color, lineHeight: 1.5 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              CCNA tip: </span>{l.ccna}
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── OSI Troubleshooting — bottom-up approach ──────────────
function OsiTroubleshootingApproach() {
  const [step, setStep] = React.useState(null);
  const [scenario, setScenario] = React.useState('no-ping');
  const scenarios = {
    'no-ping': {
      label: 'Cannot ping remote host',
      checks: [
        { layer: 1, label: 'Physical',   color: '#eab308', check: 'Is the cable plugged in? Is the link light on? show interface — is it up/up?', fix: 'Reseat cable, replace cable, check switchport mode' },
        { layer: 2, label: 'Data Link',  color: '#f97316', check: 'Is the switchport in the correct VLAN? show mac address-table — is the MAC learned?', fix: 'Check VLAN assignment, STP port state, duplex mismatch' },
        { layer: 3, label: 'Network',    color: '#f43f5e', check: 'Is the IP address correct? Is there a route? show ip route — is the destination reachable?', fix: 'Fix IP/mask, add static route, check default gateway' },
        { layer: 4, label: 'Transport',  color: '#ec4899', check: 'Is a firewall/ACL blocking ICMP? show ip access-lists — any hits on deny rules?', fix: 'Remove ACL blocking ICMP, check firewall policy' },
        { layer: 7, label: 'Application',color: '#6366f1', check: 'Is ping blocked at the application/OS level? Windows Firewall? Host-based IDS?', fix: 'Disable host firewall for test, check OS-level rules' },
      ],
    },
    'no-web': {
      label: 'Website unreachable (HTTP/S fails)',
      checks: [
        { layer: 1, label: 'Physical',   color: '#eab308', check: 'Physical link up? Can you ping the default gateway?', fix: 'Check physical connectivity first' },
        { layer: 3, label: 'Network',    color: '#f43f5e', check: 'Can you ping 8.8.8.8? Is there a default route? Is NAT configured?', fix: 'Add default route, fix NAT/PAT configuration' },
        { layer: 4, label: 'Transport',  color: '#ec4899', check: 'Is TCP 80/443 blocked by ACL or firewall? Try telnet x.x.x.x 443', fix: 'Permit TCP 80/443 on ACL, check firewall policy' },
        { layer: 6, label: 'Presentation',color: '#8b5cf6',check: 'TLS certificate error? SSL inspection breaking session? Check browser error message', fix: 'Fix certificate, disable SSL inspection for test' },
        { layer: 7, label: 'Application',color: '#6366f1', check: 'Is DNS resolving? nslookup example.com — does it return an IP?', fix: 'Fix DNS server config, check ip name-server' },
      ],
    },
  };
  const sc = scenarios[scenario];
  return (
    <InlineViz label="OSI TROUBLESHOOTING — BOTTOM-UP APPROACH" accent="#f43f5e">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {Object.entries(scenarios).map(([k, v]) => (
          <button key={k} onClick={() => { setScenario(k); setStep(null); }} style={{
            padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: scenario === k ? 'rgba(244,63,94,0.15)' : 'var(--bg-elevated)',
            border: `1px solid ${scenario === k ? '#f43f5e' : 'var(--border-subtle)'}`,
            color: scenario === k ? '#f43f5e' : 'var(--text-muted)',
          }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sc.checks.map((c, i) => (
          <div key={i} onClick={() => setStep(step === i ? null : i)}
            style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 12px',
              borderRadius: 5, cursor: 'pointer',
              background: step === i ? `${c.color}15` : `${c.color}06`,
              border: `1px solid ${step === i ? c.color : c.color + '25'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: `${c.color}20`, border: `1.5px solid ${c.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.625rem',
              color: c.color,
            }}>L{c.layer}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.75rem', color: c.color, marginBottom: step === i ? 5 : 0 }}>
                {c.label} — {c.check.split('?')[0]}?
              </div>
              {step === i && (
                <>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)',
                    lineHeight: 1.5, marginBottom: 5 }}>{c.check}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#00e676',
                    fontFamily: 'var(--font-mono)' }}>Fix: {c.fix}</div>
                </>
              )}
            </div>
            <div style={{ color: step === i ? c.color : 'var(--text-muted)',
              fontSize: '0.75rem', flexShrink: 0 }}>{step === i ? '▲' : '▼'}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: '0.6875rem', color: 'var(--text-muted)',
        fontStyle: 'italic', textAlign: 'center' }}>
        Click each layer to see what to check and how to fix it
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// NETWORK TYPES — ENHANCED DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Network Type explorer — one card per type ─────────────
function NetworkTypeExplorer() {
  const [selected, setSelected] = React.useState('lan');
  const types = {
    pan:      { label: 'PAN',      full: 'Personal Area Network',   color: '#78909c', range: '< 10m',      speed: '< 3 Mbps',       latency: 'Very low',   owner: 'Personal',        tech: 'Bluetooth, NFC, USB, Zigbee',         icon: '📱', example: 'Phone ↔ earbuds ↔ smartwatch ↔ laptop' },
    lan:      { label: 'LAN',      full: 'Local Area Network',      color: '#00e5ff', range: 'Building',   speed: '1–100 Gbps',     latency: '< 1 ms',     owner: 'Organisation',    tech: 'Ethernet (802.3), Wi-Fi (802.11)',    icon: '🏢', example: 'Office switches, APs, servers in a building' },
    wlan:     { label: 'WLAN',     full: 'Wireless LAN',            color: '#2979ff', range: '30–100m',    speed: '600 Mbps–9.6 Gbps', latency: 'Low',    owner: 'Organisation',    tech: 'IEEE 802.11 (Wi-Fi 5/6/6E)',          icon: '📶', example: 'Wi-Fi in an office — logically part of the LAN' },
    man:      { label: 'MAN',      full: 'Metropolitan Area Network',color: '#7c4dff', range: '5–50 km',   speed: '1–100 Gbps',     latency: 'Low–Med',    owner: 'ISP / City',      tech: 'Metro Ethernet, SONET, fibre rings',  icon: '🌆', example: 'Bank HQ to branches across a city' },
    wan:      { label: 'WAN',      full: 'Wide Area Network',       color: '#f43f5e', range: 'Country/Globe', speed: '1 Mbps–100 Gbps', latency: '10–150ms', owner: 'ISP',          tech: 'MPLS, SD-WAN, leased lines, IPsec VPN', icon: '🌍', example: 'Corporate HQ to overseas offices via MPLS' },
    internet: { label: 'Internet', full: 'Global Internet',         color: '#ffab00', range: 'Global',     speed: 'Varies',         latency: '10–150ms',   owner: 'None (federated)',tech: 'BGP (~80,000 ASes), IP, TCP/UDP',     icon: '🌐', example: '~80,000 autonomous systems peered via BGP' },
    san:      { label: 'SAN',      full: 'Storage Area Network',    color: '#00e676', range: 'Data centre',speed: '8–64 Gbps FC',   latency: 'Microseconds', owner: 'Organisation',  tech: 'Fibre Channel, iSCSI over Ethernet',  icon: '💾', example: 'Server sees remote SAN array as local disk' },
  };
  const t = types[selected];
  return (
    <InlineViz label="NETWORK TYPES — SELECT TO COMPARE" accent={t.color}>
      {/* Type buttons */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(types).map(([k, v]) => (
          <button key={k} onClick={() => setSelected(k)} style={{
            padding: '4px 10px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: selected === k ? `${v.color}22` : 'var(--bg-elevated)',
            border: `1px solid ${selected === k ? v.color : 'var(--border-subtle)'}`,
            color: selected === k ? v.color : 'var(--text-muted)', transition: 'all 0.2s',
          }}>{v.label}</button>
        ))}
      </div>
      {/* Detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Left: icon + stats */}
        <div style={{ padding: '12px', borderRadius: 8,
          background: `${t.color}10`, border: `1px solid ${t.color}35`, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>{t.icon}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800,
            fontSize: '1.125rem', color: t.color, marginBottom: 2 }}>{t.label}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
            color: 'var(--text-muted)', marginBottom: 10 }}>{t.full}</div>
          {[['Range', t.range], ['Speed', t.speed], ['Latency', t.latency], ['Owner', t.owner]].map(([k, v]) => (
            <div key={k} style={{ marginBottom: 5 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.45rem',
                color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{k.toUpperCase()}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                color: t.color, fontWeight: 600, lineHeight: 1.3 }}>{v}</div>
            </div>
          ))}
        </div>
        {/* Right: description */}
        <div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'var(--text-muted)', marginBottom: 4 }}>TECHNOLOGIES</div>
            <div style={{ fontSize: '0.8125rem', color: t.color,
              fontFamily: 'var(--font-mono)' }}>{t.tech}</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'var(--text-muted)', marginBottom: 4 }}>REAL-WORLD EXAMPLE</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)',
              lineHeight: 1.6 }}>{t.example}</div>
          </div>
          {/* Scale bar */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5625rem',
              color: 'var(--text-muted)', marginBottom: 4 }}>RELATIVE SCALE</div>
            {[['pan','📱'],['lan','🏢'],['man','🌆'],['wan','🌍'],['internet','🌐']].map(([k, icon], i) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6,
                marginBottom: 3, opacity: k === selected ? 1 : 0.35,
                transition: 'opacity 0.3s' }}>
                <div style={{ width: `${(i+1) * 18}%`, height: 6, borderRadius: 3,
                  background: types[k].color,
                  boxShadow: k === selected ? `0 0 8px ${types[k].color}60` : 'none' }}/>
                <span style={{ fontSize: '0.6rem', color: types[k].color,
                  fontFamily: 'var(--font-mono)' }}>{types[k].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── WAN Technologies — what connects sites ────────────────
function WanTechnologiesViz() {
  const [selected, setSelected] = React.useState(null);
  const techs = [
    {
      name: 'MPLS', color: '#7c4dff', icon: '🔄',
      desc: 'Provider-managed label-switched network. Guaranteed QoS, any-to-any connectivity, SLA-backed. Traffic never traverses the public internet. Most expensive option.',
      pros: ['Guaranteed QoS', 'Low latency SLA', 'Any-to-any (full mesh) easy'],
      cons: ['Expensive', 'Long provisioning times', 'Vendor lock-in'],
    },
    {
      name: 'SD-WAN', color: '#00e5ff', icon: '☁️',
      desc: 'Software-defined overlay over cheap internet (broadband, 4G/5G, MPLS). Centrally managed, automatic path selection, app-aware routing. Replacing MPLS in many enterprises.',
      pros: ['Low cost (uses internet)', 'Central policy management', 'Automatic failover'],
      cons: ['Internet quality varies', 'More complex initial setup', 'Security depends on overlay encryption'],
    },
    {
      name: 'IPsec VPN', color: '#00e676', icon: '🔒',
      desc: 'Encrypted tunnel over public internet. Hub-and-spoke (site-to-site) or DMVPN (dynamic mesh). No provider SLA — performance depends on internet path.',
      pros: ['Very low cost', 'Any internet connection works', 'Strong encryption'],
      cons: ['No SLA', 'Variable performance', 'Routing complexity at scale'],
    },
    {
      name: 'Leased Line', color: '#ffab00', icon: '📡',
      desc: 'Dedicated point-to-point circuit between two fixed sites — not shared with other customers. Consistent bandwidth and latency. Being replaced by MPLS and SD-WAN.',
      pros: ['Dedicated bandwidth', 'Consistent latency', 'Simple point-to-point'],
      cons: ['Very expensive', 'Only point-to-point', 'Slow to provision'],
    },
  ];
  return (
    <InlineViz label="WAN TECHNOLOGIES — HOW SITES CONNECT ACROSS DISTANCE" accent="#7c4dff">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {techs.map((t, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)}
            style={{
              padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
              background: selected === i ? `${t.color}18` : `${t.color}08`,
              border: `1px solid ${selected === i ? t.color : t.color + '30'}`,
              transition: 'all 0.2s',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '1.25rem' }}>{t.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700,
                fontSize: '0.75rem', color: t.color }}>{t.name}</span>
            </div>
            {selected === i ? (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)',
                  lineHeight: 1.5, marginBottom: 8 }}>{t.desc}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  <div>{t.pros.map((p, j) => <div key={j} style={{ fontSize: '0.625rem', color: '#00e676', marginBottom: 2 }}>✓ {p}</div>)}</div>
                  <div>{t.cons.map((c, j) => <div key={j} style={{ fontSize: '0.625rem', color: '#ff5252', marginBottom: 2 }}>✗ {c}</div>)}</div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {t.desc.split('.')[0]}.
              </div>
            )}
          </div>
        ))}
      </div>
    </InlineViz>
  );
}

// ── Network Type Comparison — interactive table ────────────
function NetworkTypeComparisonTable() {
  const [sort, setSort] = React.useState('scope');
  const rows = [
    { type: 'PAN',      scope: 1, speed: '< 3 Mbps',    latency: 'Very low',    owner: 'Personal',     color: '#78909c' },
    { type: 'LAN',      scope: 2, speed: '1–100 Gbps',  latency: '< 1 ms',      owner: 'Organisation', color: '#00e5ff' },
    { type: 'WLAN',     scope: 2, speed: '600M–9.6 Gbps',latency: 'Low',        owner: 'Organisation', color: '#2979ff' },
    { type: 'MAN',      scope: 3, speed: '1–100 Gbps',  latency: 'Low–Med',     owner: 'ISP/City',     color: '#7c4dff' },
    { type: 'WAN',      scope: 4, speed: '1M–100 Gbps', latency: '10–150 ms',   owner: 'ISP',          color: '#f43f5e' },
    { type: 'Internet', scope: 5, speed: 'Varies',       latency: '10–150 ms',   owner: 'Federated',    color: '#ffab00' },
    { type: 'SAN',      scope: 2, speed: '8–64 Gbps',   latency: 'Microseconds', owner: 'Organisation', color: '#00e676' },
  ];
  const sorted = [...rows].sort((a, b) => a.scope - b.scope);
  return (
    <InlineViz label="NETWORK TYPE COMPARISON TABLE" accent="#00e5ff">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse',
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          <thead>
            <tr>
              {['Type','Scope','Speed','Latency','Ownership'].map(h => (
                <th key={h} style={{ padding: '5px 10px', textAlign: 'left',
                  borderBottom: '2px solid var(--border-subtle)',
                  color: 'var(--text-muted)', fontSize: '0.5875rem',
                  whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '6px 10px', fontWeight: 700, color: r.color }}>
                  <span style={{ background: `${r.color}15`, padding: '2px 8px',
                    borderRadius: 4, border: `1px solid ${r.color}35` }}>{r.type}</span>
                </td>
                <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {Array.from({length: 5}, (_, i) => (
                      <div key={i} style={{ width: 14, height: 8, borderRadius: 2,
                        background: i < r.scope ? r.color : 'var(--border-subtle)' }}/>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '6px 10px', color: r.color }}>{r.speed}</td>
                <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>{r.latency}</td>
                <td style={{ padding: '6px 10px', color: 'var(--text-muted)' }}>{r.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InlineViz>
  );
}


// ════════════════════════════════════════════════════════════
// NETWORK TOPOLOGIES — SECTION-SPECIFIC DIAGRAMS
// ════════════════════════════════════════════════════════════

// ── Bus Topology — with failure animation ─────────────────
function BusTopologyDiagram() {
  const [broken, setBroken] = React.useState(false);
  const nodes = [20, 100, 180, 260, 340];
  return (
    <InlineViz label="BUS TOPOLOGY — SHARED SINGLE CABLE (OBSOLETE)" accent="#78909c">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 380 120" style={{ width: 360, maxHeight: 120, flexShrink: 0 }}>
          {/* Bus cable */}
          <line x1="10" y1="60" x2="370" y2="60"
            stroke={broken ? '#ff5252' : '#78909c'} strokeWidth="3"
            style={{ transition: 'stroke 0.4s' }}/>
          {/* Break indicator */}
          {broken && (
            <g>
              <line x1="178" y1="55" x2="182" y2="65" stroke="#ff5252" strokeWidth="2"/>
              <line x1="182" y1="55" x2="178" y2="65" stroke="#ff5252" strokeWidth="2"/>
              <text x="180" y="85" textAnchor="middle" fill="#ff5252"
                fontFamily="monospace" fontSize="9">BREAK</text>
            </g>
          )}
          {/* Terminators */}
          <rect x="2" y="54" width="8" height="12" rx="2"
            fill="#78909c" stroke="#546e7a" strokeWidth="1"/>
          <rect x="370" y="54" width="8" height="12" rx="2"
            fill="#78909c" stroke="#546e7a" strokeWidth="1"/>
          {/* Nodes */}
          {nodes.map((x, i) => (
            <g key={i}>
              <line x1={x} y1="60" x2={x} y2="30" stroke="#78909c" strokeWidth="1.5"/>
              <rect x={x-20} y="10" width="40" height="20" rx="3"
                fill={broken ? 'rgba(255,82,82,0.1)' : 'rgba(120,144,156,0.15)'}
                stroke={broken ? '#ff5252' : '#78909c'} strokeWidth="1"
                style={{ transition: 'all 0.4s' }}/>
              <text x={x} y="23" textAnchor="middle"
                fill={broken ? '#ff5252' : '#78909c'}
                fontFamily="monospace" fontSize="8" fontWeight="bold">PC{i+1}</text>
            </g>
          ))}
          <text x="190" y="112" textAnchor="middle" fill="var(--text-muted)"
            fontFamily="monospace" fontSize="8">
            {broken ? '⚠ Cable break isolates entire network' : 'All devices share the bus — CSMA/CD'}
          </text>
        </svg>
        <div style={{ flex: 1, minWidth: 120 }}>
          <button onClick={() => setBroken(b => !b)} style={{
            ...BASE.btn, marginBottom: 10, width: '100%',
            color: broken ? '#00e676' : '#ff5252',
            borderColor: broken ? '#00e676' : '#ff5252',
          }}>{broken ? '↺ Restore cable' : '✂ Break the cable'}</button>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {broken
              ? '⚠ Entire network down. No device can communicate. This is why bus topology is obsolete.'
              : 'Data broadcast to ALL devices. Only intended recipient accepts it. One device transmits at a time (CSMA/CD). Used in 10BASE2 coax Ethernet — now obsolete.'}
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Ring Topology — token passing animation ───────────────
function RingTopologyDiagram() {
  const [broken, setBroken] = React.useState(false);
  const [tokenPos, setTokenPos] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const nodes = [
    { x: 150, y: 20 }, { x: 260, y: 75 }, { x: 220, y: 180 },
    { x: 80,  y: 180 }, { x: 40,  y: 75 },
  ];
  useEffect(() => {
    if (isPaused || broken) return;
    const t = setTimeout(() => setTokenPos(p => (p + 1) % nodes.length), 700);
    return () => clearTimeout(t);
  }, [tokenPos, isPaused, broken]);
  return (
    <InlineViz label="RING TOPOLOGY — TOKEN PASSING (OBSOLETE FOR LAN)" accent="#e040fb">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 300 210" style={{ width: 280, maxHeight: 210, flexShrink: 0 }}>
          {/* Ring links */}
          {nodes.map((n, i) => {
            const next = nodes[(i + 1) % nodes.length];
            const isBroken = broken && i === 1;
            return (
              <line key={i} x1={n.x} y1={n.y} x2={next.x} y2={next.y}
                stroke={isBroken ? '#ff5252' : '#e040fb'}
                strokeWidth={isBroken ? 2 : 1.5}
                strokeDasharray={isBroken ? '5,3' : 'none'}
                style={{ transition: 'stroke 0.4s' }}/>
            );
          })}
          {broken && (
            <text x="215" y="135" textAnchor="middle" fill="#ff5252"
              fontFamily="monospace" fontSize="9">✗ BREAK</text>
          )}
          {/* Nodes */}
          {nodes.map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={18}
                fill={broken ? 'rgba(255,82,82,0.1)' : 'rgba(224,64,251,0.12)'}
                stroke={broken ? '#ff5252' : '#e040fb'} strokeWidth={tokenPos === i ? 2.5 : 1.5}
                style={{ transition: 'all 0.4s' }}/>
              <text x={n.x} y={n.y + 4} textAnchor="middle"
                fill={broken ? '#ff5252' : '#e040fb'}
                fontFamily="monospace" fontSize="9" fontWeight="bold">N{i+1}</text>
              {!broken && tokenPos === i && (
                <circle cx={n.x} cy={n.y} r={24}
                  fill="none" stroke="#e040fb" strokeWidth="1" opacity="0.5"
                  strokeDasharray="4,2"/>
              )}
            </g>
          ))}
          {!broken && (
            <text x="150" y="105" textAnchor="middle" fill="#e040fb"
              fontFamily="monospace" fontSize="8">🎫 Token at N{tokenPos + 1}</text>
          )}
          {broken && (
            <text x="150" y="105" textAnchor="middle" fill="#ff5252"
              fontFamily="monospace" fontSize="9">⚠ Ring broken — all down</text>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 110 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setBroken(b => !b)} style={{
              ...BASE.btn, color: broken ? '#00e676' : '#ff5252',
              borderColor: broken ? '#00e676' : '#ff5252',
            }}>{broken ? '↺ Restore' : '✂ Break link'}</button>
            {!broken && (
              <button style={BASE.btn} onClick={() => setIsPaused(p => !p)}>
                {isPaused ? '▶' : '⏸'}
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {broken
              ? '⚠ Single break takes down the entire ring. Dual-ring (FDDI) mitigates this by wrapping around the break.'
              : 'Token passed around the ring — only the device holding the token may transmit. Predictable, no collisions. Used in Token Ring (802.5) and FDDI. Now obsolete for LAN.'}
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Star Topology — failure isolation ─────────────────────
function StarTopologyDiagram() {
  const [failedLink, setFailedLink] = React.useState(null);
  const [switchFailed, setSwitchFailed] = React.useState(false);
  const spokes = [
    { label: 'PC-A', angle: -90, color: '#00e5ff' },
    { label: 'PC-B', angle: -30, color: '#00e5ff' },
    { label: 'PC-C', angle:  30, color: '#00e5ff' },
    { label: 'PC-D', angle:  90, color: '#00e5ff' },
    { label: 'PC-E', angle: 150, color: '#00e5ff' },
    { label: 'AP-1', angle: 210, color: '#00e676' },
  ];
  const cx = 150, cy = 105, r = 70;
  function pos(angle) {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }
  return (
    <InlineViz label="STAR TOPOLOGY — THE MODERN STANDARD (CLICK TO TEST FAILURES)" accent="#00e5ff">
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 300 210" style={{ width: 280, maxHeight: 210, flexShrink: 0 }}>
          {/* Links */}
          {spokes.map((s, i) => {
            const p = pos(s.angle);
            const failed = switchFailed || failedLink === i;
            return (
              <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
                stroke={failed ? '#ff5252' : '#00e5ff'}
                strokeWidth={failed ? 1.5 : 1.5}
                strokeDasharray={failed ? '4,3' : 'none'}
                style={{ transition: 'stroke 0.4s' }}
                onClick={() => !switchFailed && setFailedLink(failedLink === i ? null : i)}
              />
            );
          })}
          {/* Central switch */}
          <rect x={cx-28} y={cy-18} width={56} height={36} rx={5}
            fill={switchFailed ? 'rgba(255,82,82,0.2)' : 'rgba(0,229,255,0.12)'}
            stroke={switchFailed ? '#ff5252' : '#00e5ff'} strokeWidth={2}
            style={{ cursor: 'pointer', transition: 'all 0.4s' }}
            onClick={() => { setSwitchFailed(f => !f); setFailedLink(null); }}/>
          <text x={cx} y={cy - 2} textAnchor="middle"
            fill={switchFailed ? '#ff5252' : '#00e5ff'}
            fontFamily="monospace" fontSize="10" fontWeight="bold">SW1</text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill="var(--text-muted)" fontFamily="monospace" fontSize="7">click to fail</text>
          {/* Spoke nodes */}
          {spokes.map((s, i) => {
            const p = pos(s.angle);
            const failed = switchFailed || failedLink === i;
            return (
              <g key={i} style={{ cursor: 'pointer' }}
                onClick={() => !switchFailed && setFailedLink(failedLink === i ? null : i)}>
                <circle cx={p.x} cy={p.y} r={16}
                  fill={failed ? 'rgba(255,82,82,0.12)' : `${s.color}12`}
                  stroke={failed ? '#ff5252' : s.color} strokeWidth={1.5}
                  style={{ transition: 'all 0.4s' }}/>
                <text x={p.x} y={p.y + 4} textAnchor="middle"
                  fill={failed ? '#ff5252' : s.color}
                  fontFamily="monospace" fontSize="8" fontWeight="bold">{s.label}</text>
              </g>
            );
          })}
        </svg>
        <div style={{ flex: 1, minWidth: 110 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
            {switchFailed
              ? '⚠ Switch failure takes down ALL devices. The central switch is the single point of failure — use redundant switches (stacking or dual-homing) in production.'
              : failedLink !== null
              ? `✓ Only ${spokes[failedLink].label} is affected. All other devices continue normally — isolation is star topology's biggest advantage.`
              : 'Click any link to simulate a cable failure. Click the switch to simulate a switch failure. See how each affects the network.'}
          </div>
          <button onClick={() => { setSwitchFailed(false); setFailedLink(null); }} style={BASE.btn}>
            ↺ Reset
          </button>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Extended Star / Mesh — enterprise topology ────────────
function ExtendedStarAndMesh() {
  const [mode, setMode] = React.useState('extended');
  const isExtended = mode === 'extended';
  return (
    <InlineViz label="EXTENDED STAR vs FULL MESH — REAL-WORLD ENTERPRISE" accent="#7c4dff">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['extended','Extended Star (Enterprise)'],['mesh','Full Mesh (Core/WAN)']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '4px 14px', borderRadius: 20, cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 700,
            background: mode === m ? 'rgba(124,77,255,0.15)' : 'var(--bg-elevated)',
            border: `1px solid ${mode === m ? '#7c4dff' : 'var(--border-subtle)'}`,
            color: mode === m ? '#7c4dff' : 'var(--text-muted)',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <svg viewBox="0 0 310 190" style={{ width: 290, maxHeight: 190, flexShrink: 0 }}>
          {isExtended ? (
            <>
              {/* Core */}
              <rect x="120" y="5" width="70" height="28" rx="4"
                fill="rgba(244,63,94,0.12)" stroke="#f43f5e" strokeWidth="1.5"/>
              <text x="155" y="22" textAnchor="middle" fill="#f43f5e" fontFamily="monospace" fontSize="9" fontWeight="bold">CORE SW</text>
              {/* Dist */}
              {[{x:55, y:65},{x:255, y:65}].map((d,i) => (
                <g key={i}>
                  <line x1={155} y1={33} x2={d.x} y2={d.y}
                    stroke="#f43f5e" strokeWidth="2"/>
                  <rect x={d.x-35} y={d.y} width="70" height="24" rx="4"
                    fill="rgba(124,77,255,0.12)" stroke="#7c4dff" strokeWidth="1.5"/>
                  <text x={d.x} y={d.y+15} textAnchor="middle" fill="#7c4dff" fontFamily="monospace" fontSize="8" fontWeight="bold">DIST {i+1}</text>
                </g>
              ))}
              {/* Access */}
              {[{x:20,py:65,ay:130},{x:90,py:65,ay:130},{x:220,py:65,ay:130},{x:290,py:65,ay:130}].map((a,i) => (
                <g key={i}>
                  <line x1={i<2?55:255} y1={89} x2={a.x} y2={a.ay}
                    stroke="#7c4dff" strokeWidth="1.5"/>
                  <rect x={a.x-24} y={a.ay} width="48" height="22" rx="3"
                    fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="1"/>
                  <text x={a.x} y={a.ay+14} textAnchor="middle" fill="#00e5ff" fontFamily="monospace" fontSize="8">ACC{i+1}</text>
                  {/* End devices */}
                  {[{dx:-15},{dx:15}].map((e, ei) => (
                    <g key={ei}>
                      <line x1={a.x+e.dx} y1={a.ay+22} x2={a.x+e.dx} y2={175}
                        stroke="rgba(0,229,255,0.3)" strokeWidth="1"/>
                      <circle cx={a.x+e.dx} cy={178} r={5}
                        fill="rgba(0,229,255,0.12)" stroke="#00e5ff" strokeWidth="0.8"/>
                    </g>
                  ))}
                </g>
              ))}
              <text x="155" y="190" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">
                Access → Distribution → Core hierarchy
              </text>
            </>
          ) : (
            <>
              {/* Full mesh — 5 nodes */}
              {[{x:155,y:25},{x:265,y:85},{x:225,y:175},{x:85,y:175},{x:45,y:85}].map((n,i,arr) => (
                <g key={i}>
                  {arr.map((m2, j) => j > i && (
                    <line key={j} x1={n.x} y1={n.y} x2={m2.x} y2={m2.y}
                      stroke="rgba(124,77,255,0.5)" strokeWidth="1.5"/>
                  ))}
                  <circle cx={n.x} cy={n.y} r={20}
                    fill="rgba(124,77,255,0.12)" stroke="#7c4dff" strokeWidth="1.5"/>
                  <text x={n.x} y={n.y+4} textAnchor="middle"
                    fill="#7c4dff" fontFamily="monospace" fontSize="9" fontWeight="bold">R{i+1}</text>
                </g>
              ))}
              <text x="155" y="190" textAnchor="middle" fill="var(--text-muted)" fontFamily="monospace" fontSize="7">
                5 nodes → 10 links (n×(n-1)/2)
              </text>
            </>
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 110 }}>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {isExtended
              ? 'Extended star (hierarchical): Access switches connect to distribution switches, which connect to the core. This is the Cisco three-tier model. Scalable — add access switches without redesigning the core. Most failures are isolated to a subtree.'
              : 'Full mesh: every node directly connects to every other node. Maximum redundancy — any link can fail without isolating any device. Impractical at scale: 10 nodes need 45 links, 20 nodes need 190. Used in WAN cores and small data centre interconnects only.'}
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.625rem',
            color: '#7c4dff', padding: '5px 8px', borderRadius: 4,
            background: 'rgba(124,77,255,0.08)', border: '1px solid rgba(124,77,255,0.2)' }}>
            {isExtended ? 'Links: proportional to depth × width — scales well' : `Links = n(n-1)/2 — grows quadratically`}
          </div>
        </div>
      </div>
    </InlineViz>
  );
}

// ── Topology failure impact — interactive table ───────────
function TopologyFailureImpact() {
  const [highlighted, setHighlighted] = React.useState(null);
  const rows = [
    { topo: 'Bus',          device: '🔴 Entire network', link: '🔴 Entire network', scale: 1, color: '#ff5252' },
    { topo: 'Ring',         device: '🔴 Entire network', link: '🔴 Entire network', scale: 1, color: '#e040fb' },
    { topo: 'Star',         device: '🟡 One device',     link: '🟡 One device',     scale: 4, color: '#00e5ff' },
    { topo: 'Full Mesh',    device: '🟢 None',           link: '🟢 None',           scale: 2, color: '#7c4dff' },
    { topo: 'Partial Mesh', device: '🟡 Varies',         link: '🟡 Varies',         scale: 3, color: '#ffab00' },
    { topo: 'Extended Star',device: '🟡 Subtree only',   link: '🟡 Subtree only',   scale: 5, color: '#00e676' },
  ];
  return (
    <InlineViz label="TOPOLOGY FAILURE IMPACT — HOVER TO COMPARE" accent="#00e5ff">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
        <thead>
          <tr>
            {['Topology','Device failure','Link failure','Scalability'].map(h => (
              <th key={h} style={{ padding: '5px 10px', textAlign: 'left',
                borderBottom: '2px solid var(--border-subtle)',
                color: 'var(--text-muted)', fontSize: '0.5875rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}
              onMouseEnter={() => setHighlighted(i)}
              onMouseLeave={() => setHighlighted(null)}
              style={{ background: highlighted === i ? `${r.color}10` : 'transparent',
                cursor: 'default', transition: 'background 0.2s' }}>
              <td style={{ padding: '7px 10px', fontWeight: 700, color: r.color }}>
                <span style={{ background: `${r.color}15`, padding: '2px 8px',
                  borderRadius: 4, border: `1px solid ${r.color}30` }}>{r.topo}</span>
              </td>
              <td style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{r.device}</td>
              <td style={{ padding: '7px 10px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{r.link}</td>
              <td style={{ padding: '7px 10px' }}>
                <div style={{ display: 'flex', gap: 3 }}>
                  {Array.from({length: 5}, (_, j) => (
                    <div key={j} style={{ width: 14, height: 10, borderRadius: 2,
                      background: j < r.scale ? r.color : 'var(--border-subtle)' }}/>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </InlineViz>
  );
}

export const INLINE_DIAGRAMS = {
  // ── Remote Access VPN ─────────────────────────────────────────
  'remote-access': [
    { afterSection: 'Remote Access Technologies', component: RemoteAccessComparison },
    { afterSection: 'IPsec Phases',               component: IpsecPhasesAnim },
    { afterSection: 'VPN Split Tunneling',         component: VpnSplitTunnel },
  ],
  'remote-access-vpn': [
    { afterSection: 'Remote Access Technologies', component: RemoteAccessComparison },
    { afterSection: 'IPsec Phases',               component: IpsecPhasesAnim },
    { afterSection: 'VPN Split Tunneling',         component: VpnSplitTunnel },
  ],
  // ── Wireless Topology ─────────────────────────────────────────
  'wireless-topology': [
    { afterSection: 'Site Survey Types',      component: SiteSurveyTypes },
    { afterSection: 'Design Considerations',  component: WirelessCoverageDesign },
    { afterSection: 'Deployment Models',      component: WlcDeploymentModels },
    { afterSection: 'Channel Planning',       component: WifiChannelOverlap },
  ],
  'wireless-topology-design': [
    { afterSection: 'Site Survey Types',      component: SiteSurveyTypes },
    { afterSection: 'Design Considerations',  component: WirelessCoverageDesign },
    { afterSection: 'Deployment Models',      component: WlcDeploymentModels },
    { afterSection: 'Channel Planning',       component: WifiChannelOverlap },
  ],
  // ── Wireless Security ─────────────────────────────────────────
  'wireless-security': [
    { afterSection: 'Evolution of Wi-Fi Security', component: WifiSecurityEvolution },
    { afterSection: 'Authentication Modes',         component: WifiAuthModes },
    { afterSection: '802.1X Components',            component: Dot1xComponents },
    { afterSection: 'Wireless Threats',             component: WirelessThreats },
  ],
  'wireless-security-config': [
    { afterSection: 'Evolution of Wi-Fi Security', component: WifiSecurityEvolution },
    { afterSection: 'Authentication Modes',         component: WifiAuthModes },
    { afterSection: '802.1X Components',            component: Dot1xComponents },
    { afterSection: 'Wireless Threats',             component: WirelessThreats },
  ],
  // ── Wireless Controllers ──────────────────────────────────────
  'wireless-controller': [
    { afterSection: 'WLC Functions',      component: WlcSplitMac },
    { afterSection: 'AP Join Process',    component: CapwapJoinAnim },
    { afterSection: 'Deployment Models',  component: WlcDeploymentModels },
    { afterSection: 'Channel Planning',   component: RrmChannelPlanning },
  ],
  'wireless-controller-mgmt': [
    { afterSection: 'WLC Functions',      component: WlcSplitMac },
    { afterSection: 'AP Join Process',    component: CapwapJoinAnim },
    { afterSection: 'Deployment Models',  component: WlcDeploymentModels },
    { afterSection: 'Channel Planning',   component: RrmChannelPlanning },
  ],
  // ── Wireless AP ───────────────────────────────────────────────
  'wireless-ap': [
    { afterSection: 'Key Concepts',      component: WifiBandComparison },
    { afterSection: '2.4 GHz Channels',  component: WifiChannelOverlap },
    { afterSection: 'AP Modes',          component: ApModes },
    { afterSection: 'CAPWAP Protocol',   component: CapwapJoinAnim },
  ],
  'wireless-ap-config': [
    { afterSection: 'Key Concepts',      component: WifiBandComparison },
    { afterSection: '2.4 GHz Channels',  component: WifiChannelOverlap },
    { afterSection: 'AP Modes',          component: ApModes },
    { afterSection: 'CAPWAP Protocol',   component: CapwapJoinAnim },
  ],
  // ── IPv6 ──────────────────────────────────────────────────────
  'ipv6': [
    { afterSection: 'Address Format',                   component: Ipv6AddressBreakdown },
    { afterSection: 'Address Types',                    component: Ipv6AddressTypes },
    { afterSection: 'NDP (Neighbor Discovery Protocol)', component: NdpAnimation },
  ],
  'ipv6-addressing': [
    { afterSection: 'Address Format',                   component: Ipv6AddressBreakdown },
    { afterSection: 'Address Types',                    component: Ipv6AddressTypes },
    { afterSection: 'NDP (Neighbor Discovery Protocol)', component: NdpAnimation },
  ],
  // ── MPLS ──────────────────────────────────────────────────────
  'mpls': [
    { afterSection: 'Why MPLS?',               component: MplsUseCases },
    { afterSection: 'MPLS Label Format (4 bytes)', component: MplsLabelFormat },
    { afterSection: 'Key Operations',           component: MplsOperationsAnim },
  ],
  'mpls-label-switching': [
    { afterSection: 'Why MPLS?',               component: MplsUseCases },
    { afterSection: 'MPLS Label Format (4 bytes)', component: MplsLabelFormat },
    { afterSection: 'Key Operations',           component: MplsOperationsAnim },
  ],
  // ── Network Tunneling ─────────────────────────────────────────
  'tunneling': [
    { afterSection: 'Common Tunnel Types', component: TunnelTypesComparison },
    { afterSection: 'Encapsulation',       component: TunnelEncapsulationAnim },
  ],
  'network-tunneling': [
    { afterSection: 'Common Tunnel Types', component: TunnelTypesComparison },
    { afterSection: 'Encapsulation',       component: TunnelEncapsulationAnim },
  ],
  // ── GRE Tunnels ───────────────────────────────────────────────
  'gre': [
    { afterSection: 'What Is GRE?',  component: TunnelEncapsulationAnim },
    { afterSection: 'GRE Header',    component: GreHeaderAnatomy },
    { afterSection: 'GRE vs IPsec',  component: TunnelTypesComparison },
  ],
  'gre-tunnels': [
    { afterSection: 'What Is GRE?',  component: TunnelEncapsulationAnim },
    { afterSection: 'GRE Header',    component: GreHeaderAnatomy },
    { afterSection: 'GRE vs IPsec',  component: TunnelTypesComparison },
  ],
  // ── BGP ───────────────────────────────────────────────────────
  'bgp': [
    { afterSection: 'eBGP vs iBGP',                    component: EbgpVsIbgp },
    { afterSection: 'Path Selection (Decision Process)', component: BgpPathSelection },
    { afterSection: 'BGP Message Types',               component: BgpMessageTypes },
  ],
  'bgp-peering': [
    { afterSection: 'eBGP vs iBGP',                    component: EbgpVsIbgp },
    { afterSection: 'Path Selection (Decision Process)', component: BgpPathSelection },
    { afterSection: 'BGP Message Types',               component: BgpMessageTypes },
  ],
  // ── Autonomous Systems ────────────────────────────────────────
  'autonomous-systems': [
    { afterSection: 'Internet Structure', component: InternetTierHierarchy },
    { afterSection: 'Peering Types',      component: PeeringTypesViz },
    { afterSection: 'ASN Ranges',         component: AsnRangeViz },
  ],
  'bgp-peering': [
    { afterSection: 'Internet Structure', component: InternetTierHierarchy },
    { afterSection: 'Peering Types',      component: PeeringTypesViz },
    { afterSection: 'ASN Ranges',         component: AsnRangeViz },
  ],
  // ── Firewalls ─────────────────────────────────────────────────
  'firewalls': [
    { afterSection: 'Firewall Types',              component: FirewallTypesComparison },
    { afterSection: 'Zone-Based Firewall (ZBF)',   component: ZbfTopology },
    { afterSection: 'Stateful Inspection',         component: StatefulInspectionAnim },
  ],
  'firewall-zones': [
    { afterSection: 'Firewall Types',              component: FirewallTypesComparison },
    { afterSection: 'Zone-Based Firewall (ZBF)',   component: ZbfTopology },
    { afterSection: 'Stateful Inspection',         component: StatefulInspectionAnim },
  ],
  'firewall': [
    { afterSection: 'Firewall Types',              component: FirewallTypesComparison },
    { afterSection: 'Zone-Based Firewall (ZBF)',   component: ZbfTopology },
    { afterSection: 'Stateful Inspection',         component: StatefulInspectionAnim },
  ],
  // ── SSH ───────────────────────────────────────────────────────
  'ssh': [
    { afterSection: 'SSH vs Telnet', component: SshVsTelnet },
    { afterSection: 'How SSH Works', component: SshHandshakeAnim },
  ],
  'ssh-secure-mgmt': [
    { afterSection: 'SSH vs Telnet', component: SshVsTelnet },
    { afterSection: 'How SSH Works', component: SshHandshakeAnim },
  ],
  // ── ACLs ─────────────────────────────────────────────────────
  'acls': [
    { afterSection: 'ACL Types',        component: AclTypesComparison },
    { afterSection: 'Processing Rules', component: AclProcessingAnim },
    { afterSection: 'Direction Logic',  component: AclDirectionViz },
  ],
  'acl-traffic-filtering': [
    { afterSection: 'ACL Types',        component: AclTypesComparison },
    { afterSection: 'Processing Rules', component: AclProcessingAnim },
    { afterSection: 'Direction Logic',  component: AclDirectionViz },
  ],
  // ── NAT / PAT ─────────────────────────────────────────────────
  'nat': [
    { afterSection: 'NAT Terminology', component: NatTerminology },
    { afterSection: 'NAT Types',       component: NatTypesComparison },
  ],
  'nat-configuration': [
    { afterSection: 'NAT Terminology', component: NatTerminology },
    { afterSection: 'NAT Types',       component: NatTypesComparison },
  ],
  'pat': [
    { afterSection: 'How PAT Works',   component: PatPortTracking },
    { afterSection: 'PAT vs NAT',      component: NatTypesComparison },
  ],
  'pat-overload': [
    { afterSection: 'How PAT Works',   component: PatPortTracking },
    { afterSection: 'PAT vs NAT',      component: NatTypesComparison },
  ],
  // ── DNS ──────────────────────────────────────────────────────
  'dns': [
    { afterSection: 'DNS Hierarchy',      component: DnsHierarchyTree },
    { afterSection: 'Record Types',       component: DnsRecordTypes },
    { afterSection: 'Resolution Process', component: DnsResolutionAnim },
  ],
  'dns-resolution': [
    { afterSection: 'DNS Hierarchy',      component: DnsHierarchyTree },
    { afterSection: 'Record Types',       component: DnsRecordTypes },
    { afterSection: 'Resolution Process', component: DnsResolutionAnim },
  ],
  // ── DHCP ─────────────────────────────────────────────────────
  'dhcp': [
    { afterSection: 'What Is DHCP?',    component: DhcpDoraDetailed },
    { afterSection: 'Key Concepts',     component: DhcpRelayAnim },
    { afterSection: 'Troubleshooting',  component: DhcpTroubleshoot },
  ],
  'dhcp-server-config': [
    { afterSection: 'What Is DHCP?',    component: DhcpDoraDetailed },
    { afterSection: 'Key Concepts',     component: DhcpRelayAnim },
    { afterSection: 'Troubleshooting',  component: DhcpTroubleshoot },
  ],
  // ── LACP ─────────────────────────────────────────────────────
  'lacp': [
    { afterSection: 'What Is LACP?',            component: LacpBundlingAnim },
    { afterSection: 'Modes',                    component: LacpModeMatrix },
    { afterSection: 'Load Balancing',           component: LacpLoadBalancing },
    { afterSection: 'Requirements for Bundling', component: LacpRequirements },
  ],
  'lacp-etherchannel': [
    { afterSection: 'What Is LACP?',            component: LacpBundlingAnim },
    { afterSection: 'Modes',                    component: LacpModeMatrix },
    { afterSection: 'Load Balancing',           component: LacpLoadBalancing },
    { afterSection: 'Requirements for Bundling', component: LacpRequirements },
  ],
  // ── STP ──────────────────────────────────────────────────────
  'stp': [
    { afterSection: 'The Problem STP Solves',   component: BroadcastStormAnim },
    { afterSection: 'Step 1: Root Bridge Election', component: RootBridgeElection },
    { afterSection: 'Step 2: Port Role Assignment', component: PortRoleAssignment },
    { afterSection: 'Step 3: Port States',       component: StpPortStates },
    { afterSection: 'RSTP Port Roles',           component: RstpComparison },
  ],
  // ── Subnetting ───────────────────────────────────────────────
  'subnetting': [
    { afterSection: 'IPv4 Address Structure',          component: SubnetBitBreakdown },
    { afterSection: 'Class C Subnetting Reference',    component: SubnetReferenceTable },
    { afterSection: 'How to Subnet (Step-by-Step)',    component: SubnetStepByStep },
    { afterSection: 'VLSM (Variable-Length Subnet Masking)', component: VlsmVisual },
  ],
  'ipv4-subnetting': [
    { afterSection: 'IPv4 Address Structure',          component: SubnetBitBreakdown },
    { afterSection: 'Class C Subnetting Reference',    component: SubnetReferenceTable },
    { afterSection: 'How to Subnet (Step-by-Step)',    component: SubnetStepByStep },
    { afterSection: 'VLSM (Variable-Length Subnet Masking)', component: VlsmVisual },
  ],
  // ── OSI Model ──────────────────────────────────────────────
  'osi-model': [
    { afterSection: 'The Seven Layers',              component: OsiLayerDeepDive },
    { afterSection: 'Encapsulation and Decapsulation', component: OsiEncapsulationInline },
    { afterSection: 'OSI vs TCP/IP',                 component: TcpIpVsOsi },
    { afterSection: 'Why OSI Matters for CCNA',      component: OsiTroubleshootingApproach },
  ],
  // ── Network Layer Architecture ─────────────────────────────
  // Two heading sets: migrate_netarch_redo (### Core Layer…)
  // and migrate_foundations_content (### The Cisco Three-Tier…)
  'network-layer-arch': [
    // netarch_redo content headings
    { afterSection: 'Core Layer (Top / Backbone)',       component: ThreeTierModel },
    { afterSection: 'Collapsed Core',                    component: TwoTierModel },
    // foundations_content headings (older content)
    { afterSection: 'The Cisco Three-Tier Hierarchical Model', component: ThreeTierModel },
    { afterSection: 'Two-Tier (Collapsed Core)',         component: TwoTierModel },
  ],
  // ── Network Types ───────────────────────────────────────────
  'network-types': [
    { afterSection: 'Network Types',          component: NetworkTypeExplorer },
    { afterSection: 'WAN — Wide Area Network', component: WanTechnologiesViz },
    { afterSection: 'Network Type Comparison', component: NetworkTypeComparisonTable },
  ],
  // ── Network Topologies ──────────────────────────────────────
  'network-topologies': [
    { afterSection: 'Bus Topology',                    component: BusTopologyDiagram },
    { afterSection: 'Ring Topology',                   component: RingTopologyDiagram },
    { afterSection: 'Star Topology',                   component: StarTopologyDiagram },
    { afterSection: 'Extended Star (Hierarchical Star)', component: ExtendedStarAndMesh },
    { afterSection: 'Mesh Topology',                   component: ExtendedStarAndMesh },
    { afterSection: 'Topology and Failure Impact',     component: TopologyFailureImpact },
  ],
  // ── Network Devices — one diagram per ### device section ───
  'network-devices': [
    { afterSection: 'Hub — Layer 1',                         component: HubFloodAnim },
    { afterSection: 'Switch — Layer 2',                      component: SwitchMacLearning },
    { afterSection: 'Router — Layer 3',                      component: RouterForwardingAnim },
    { afterSection: 'Firewall — Layer 3–7',                  component: FirewallZoneAnim },
    { afterSection: 'Wireless Access Point (AP) — Layer 2',  component: ApAssociationAnim },
    { afterSection: 'Device Layer Summary',                   component: DeviceExplorer },
  ],
  // ── Cables ──────────────────────────────────────────────────
  'cables-transmission': [
    { afterSection: 'Cable Selection Guide',       component: CablesComparisonInline },
  ],
  // ── Routing ─────────────────────────────────────────────────
  'routing-fundamentals': [
    { afterSection: 'The Routing Table',           component: RoutingTableWalkthrough },
    { afterSection: 'Longest Prefix Match',        component: RoutingTableWalkthrough },
  ],
  // ── How Internet Works ──────────────────────────────────────
  'how-internet-works': [
    { afterSection: 'End-to-End Summary',          component: BrowserRequestJourney },
  ],
  // ── VLANs — exact ## / ### headings from migrate_theory.sql ─
  'vlans': [
    { afterSection: 'Why VLANs Exist',             component: VlanWhyItMatters },
    { afterSection: 'VLAN Database',               component: VlanDatabaseViz },
    { afterSection: 'Trunk Ports',                 component: VlanTrunkAnimation },
    { afterSection: 'Inter-VLAN Routing',          component: InterVlanRoutingAnim },
  ],
  'vlan-roas': [
    { afterSection: 'Why VLANs Exist',             component: VlanWhyItMatters },
    { afterSection: 'VLAN Database',               component: VlanDatabaseViz },
    { afterSection: 'Trunk Ports',                 component: VlanTrunkAnimation },
    { afterSection: 'Inter-VLAN Routing',          component: InterVlanRoutingAnim },
  ],
  'vlan-svi': [
    { afterSection: 'Why VLANs Exist',             component: VlanWhyItMatters },
    { afterSection: 'VLAN Database',               component: VlanDatabaseViz },
  ],
  // ── OSPF — ### sub-headings under ## OSPF Concepts ─────────
  'ospf': [
    { afterSection: 'Neighbor States',  component: OspfAdjacencyWalkthrough },
    { afterSection: 'DR/BDR Election',  component: DrBdrElectionAnim },
    { afterSection: 'LSA Types',        component: LsaFloodingAnim },
    { afterSection: 'Cost Calculation', component: OspfSpfTree },
  ],
};
