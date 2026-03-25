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

function DiagramShell({ title, onReplay, children }) {
  return (
    <div style={BASE.wrap}>
      <div style={BASE.header}>
        <span>{title}</span>
        {onReplay && <button style={BASE.btn} onClick={onReplay}>↺ Replay</button>}
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
  const [phase, setPhase] = useState('idle'); // idle | down | up

  useEffect(() => {
    if (phase === 'idle') return;
    if (step < OSI_LAYERS.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 450);
      return () => clearTimeout(t);
    }
  }, [step, phase]);

  function replay() { setStep(0); setPhase('idle'); setTimeout(() => setPhase('down'), 50); }
  useEffect(() => { setTimeout(() => setPhase('down'), 600); }, []);

  const activeDown = phase === 'down' ? step : 7;

  return (
    <DiagramShell title="OSI MODEL — ENCAPSULATION / DECAPSULATION" onReplay={replay}>
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
  // Steps: 0=idle, 1=frame leaves PC, 2=switch tags, 3=trunk, 4=switch strips, 5=arrives
  useEffect(() => {
    if (step === 0) { const t = setTimeout(() => setStep(1), 700); return () => clearTimeout(t); }
    if (step < 5)   { const t = setTimeout(() => setStep((s) => s + 1), 900); return () => clearTimeout(t); }
  }, [step]);

  function replay() { setStep(0); }

  const frameColors = { bg: '#7c4dff', border: '#b39ddb' };

  return (
    <DiagramShell title="VLAN — 802.1Q FRAME TAGGING ON TRUNK LINK" onReplay={replay}>
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
  useEffect(() => {
    const t = setTimeout(() => setStep(0), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step >= 0 && step < DORA_STEPS.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 1200);
      return () => clearTimeout(t);
    }
  }, [step]);

  function replay() { setStep(-1); setTimeout(() => setStep(0), 300); }

  return (
    <DiagramShell title="DHCP — DORA SEQUENCE (Discover → Offer → Request → Acknowledge)" onReplay={replay}>
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
    if (stateIdx >= OSPF_STATES.length - 1) return;
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
  }, [stateIdx]);

  function replay() { setStateIdx(0); setPackets([]); }

  const color = (i) => i <= stateIdx ? '#00e5ff' : 'var(--border-default)';

  return (
    <DiagramShell title="OSPF — NEIGHBOR ADJACENCY STATE MACHINE" onReplay={replay}>
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
  useEffect(() => {
    if (phase < STP_PHASES.length - 1) {
      const t = setTimeout(() => setPhase((p) => p + 1), 1100);
      return () => clearTimeout(t);
    }
  }, [phase]);
  function replay() { setPhase(0); }

  const sw1color = phase >= 1 ? '#ffab00' : '#7c4dff';
  const blockedColor = phase >= 3 ? '#ff1744' : '#00e676';
  const blockedDash = phase >= 3 ? '6,4' : 'none';

  return (
    <DiagramShell title="STP — SPANNING TREE CONVERGENCE" onReplay={replay}>
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
  useEffect(() => { const t = setTimeout(() => setStep(0), 500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (step >= 0 && step < DNS_HOPS.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 950);
      return () => clearTimeout(t);
    }
  }, [step]);
  function replay() { setStep(-1); setTimeout(() => setStep(0), 300); }

  const nodeColor = (name) => {
    if (name === 'Client')   return '#00e5ff';
    if (name === 'Resolver') return '#7c4dff';
    if (name === 'Root NS')  return '#ffab00';
    if (name === 'TLD NS')   return '#e040fb';
    return '#00e676';
  };

  return (
    <DiagramShell title="DNS — RECURSIVE RESOLUTION (www.example.com)" onReplay={replay}>
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

  const TRANSLATIONS = [
    { inside_local: '10.0.1.10:1234', inside_global: '203.0.113.5:1234', outside: '8.8.8.8:53', proto: 'UDP' },
    { inside_local: '10.0.1.11:5678', inside_global: '203.0.113.5:5678', outside: '142.250.4.46:443', proto: 'TCP' },
    { inside_local: '10.0.1.12:9999', inside_global: '203.0.113.5:9999', outside: '13.32.0.10:80', proto: 'TCP' },
  ];

  useEffect(() => {
    if (step < TRANSLATIONS.length) {
      const t = setTimeout(() => {
        setEntries((prev) => [...prev, TRANSLATIONS[step]]);
        setStep((s) => s + 1);
      }, 900);
      return () => clearTimeout(t);
    }
  }, [step]);

  function replay() { setEntries([]); setStep(0); }

  return (
    <DiagramShell title="NAT/PAT — TRANSLATION TABLE (Inside Local → Inside Global)" onReplay={replay}>
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
  useEffect(() => {
    if (step < 4) { const t = setTimeout(() => setStep((s) => s + 1), 950); return () => clearTimeout(t); }
  }, [step]);
  function replay() { setStep(0); }

  return (
    <DiagramShell title="GRE TUNNEL — PACKET ENCAPSULATION" onReplay={replay}>
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
  useEffect(() => {
    if (step < 4) { const t = setTimeout(() => setStep((s) => s + 1), 900); return () => clearTimeout(t); }
  }, [step]);
  function replay() { setStep(0); }

  return (
    <DiagramShell title="LACP — PORT CHANNEL BONDING (802.3ad)" onReplay={replay}>
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
  useEffect(() => {
    if (step < 4) { const t = setTimeout(() => setStep((s) => s + 1), 900); return () => clearTimeout(t); }
  }, [step]);
  function replay() { setStep(0); }

  const subnets = [
    { net: '10.0.0.0/26',   range: '10.0.0.1 – 10.0.0.62',   hosts: 62,  color: '#00e5ff' },
    { net: '10.0.0.64/26',  range: '10.0.0.65 – 10.0.0.126', hosts: 62,  color: '#7c4dff' },
    { net: '10.0.0.128/26', range: '10.0.0.129 – 10.0.0.190', hosts: 62, color: '#e040fb' },
    { net: '10.0.0.192/26', range: '10.0.0.193 – 10.0.0.254', hosts: 62, color: '#ffab00' },
  ];

  return (
    <DiagramShell title="SUBNETTING — DIVIDING 10.0.0.0/24 INTO /26 SUBNETS" onReplay={replay}>
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

  useEffect(() => {
    if (step < NET_TYPES.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 380);
      return () => clearTimeout(t);
    }
  }, [step]);

  function replay() { setStep(0); setActive(null); }

  const info = active !== null ? NET_TYPES[active] : NET_TYPES[Math.min(step - 1, NET_TYPES.length - 1)];

  return (
    <DiagramShell title="NETWORK TYPES — GEOGRAPHIC SCOPE" onReplay={replay}>
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

  const pkt = TEST_PACKETS[packetIdx];

  useEffect(() => {
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
  }, [packetIdx]);

  return (
    <DiagramShell title="ROUTING — LONGEST PREFIX MATCH LOOKUP">
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
  useEffect(() => { const t = setTimeout(() => setStep(0), 500); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (step >= 0 && step < INTERNET_STEPS.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 800);
      return () => clearTimeout(t);
    }
  }, [step]);
  function replay() { setStep(-1); setTimeout(() => setStep(0), 300); }

  return (
    <DiagramShell title="HOW THE INTERNET WORKS — END-TO-END BROWSER REQUEST" onReplay={replay}>
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
