import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api';

const COMMAND_COLORS = {
  keywords: ['configure', 'terminal', 'interface', 'router', 'vlan', 'line', 'ip', 'ipv6',
    'switchport', 'spanning-tree', 'channel-group', 'crypto', 'zone', 'wlan', 'tunnel',
    'network', 'neighbor', 'mpls', 'no', 'shutdown', 'enable', 'end', 'exit'],
  values: ['access', 'trunk', 'mode', 'active', 'passive', 'area', 'priority', 'overload',
    'ssh', 'local', 'dot1q', 'ospf', 'bgp', 'rip', 'eigrp'],
  show: ['show', 'ping', 'traceroute', 'debug'],
};

// Command shortcut chips shown above the keyboard on mobile
const SHORTCUT_COMMANDS = [
  { label: 'conf t',            cmd: 'configure terminal' },
  { label: 'show ip int br',    cmd: 'show ip interface brief' },
  { label: 'show run',          cmd: 'show running-config' },
  { label: 'show ip route',     cmd: 'show ip route' },
  { label: 'show vlan br',      cmd: 'show vlan brief' },
  { label: 'show span-tree',    cmd: 'show spanning-tree' },
  { label: 'show ip ospf nbr',  cmd: 'show ip ospf neighbor' },
  { label: 'end',               cmd: 'end' },
  { label: 'exit',              cmd: 'exit' },
  { label: '?',                 cmd: '?' },
  { label: 'no shut',           cmd: 'no shutdown' },
  { label: 'show eth sum',      cmd: 'show etherchannel summary' },
  { label: 'show ip bgp',       cmd: 'show ip bgp' },
  { label: 'show ip nat',       cmd: 'show ip nat translations' },
  { label: 'show access-lists', cmd: 'show access-lists' },
  { label: 'ping',              cmd: 'ping ' },
];

function colorizeCommand(cmd) {
  const parts = cmd.split(/(\s+)/);
  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    if (COMMAND_COLORS.show.includes(lower))
      return <span key={i} style={{ color: '#ffab00' }}>{part}</span>;
    if (COMMAND_COLORS.keywords.includes(lower))
      return <span key={i} style={{ color: '#00e5ff' }}>{part}</span>;
    if (COMMAND_COLORS.values.includes(lower))
      return <span key={i} style={{ color: '#7c4dff' }}>{part}</span>;
    if (/^\d+(\.\d+)*$/.test(part) || /^\d+\.\d+\.\d+\.\d+$/.test(part))
      return <span key={i} style={{ color: '#00e676' }}>{part}</span>;
    return <span key={i}>{part}</span>;
  });
}

export default function TerminalEmulator({
  labSlug, deviceName, step, onStepComplete, completedSteps, userId,
}) {
  const [history, setHistory]           = useState([]);
  const [input, setInput]               = useState('');
  const [prompt, setPrompt]             = useState('');
  const [cmdHistory, setCmdHistory]     = useState([]);
  const [historyIdx, setHistoryIdx]     = useState(-1);
  const [enteredCommands, setEnteredCommands] = useState([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const inputRef  = useRef(null);
  const bodyRef   = useRef(null);
  const wrapRef   = useRef(null);

  // ── Device / session init ──────────────────────────────────
  useEffect(() => {
    if (!deviceName) return;
    const isQuiz = deviceName === 'QUIZ';
    setPrompt(isQuiz ? 'Answer>' : `${deviceName}#`);
    setHistory([
      { type: 'system', text: isQuiz ? '--- Interactive Quiz ---' : `--- Connected to ${deviceName} ---` },
      { type: 'system', text: isQuiz ? 'Type your answer and press Enter.' : 'Type Cisco IOS commands. Use "?" for help.' },
    ]);
    setEnteredCommands([]);
  }, [deviceName]);

  // ── Auto-scroll terminal body ──────────────────────────────
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history]);

  // ── Visual viewport listener (keyboard detection) ─────────
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const onResize = () => {
      // If viewport height drops significantly, keyboard is open
      const ratio = vv.height / window.innerHeight;
      setKeyboardVisible(ratio < 0.75);
    };

    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  // ── Scroll terminal into view when keyboard opens ─────────
  useEffect(() => {
    if (keyboardVisible && wrapRef.current) {
      setTimeout(() => {
        wrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [keyboardVisible]);

  // ── Command execution ──────────────────────────────────────
  const executeCommand = useCallback(async (command) => {
    if (!command.trim() || !deviceName) return;
    const trimmed = command.trim();
    setCmdHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    setHistory((prev) => [...prev, { type: 'input', prompt, text: trimmed }]);

    if (trimmed === '?' || trimmed === 'help') {
      setHistory((prev) => [...prev, {
        type: 'output',
        text: 'Available commands:\n'
          + '  configure terminal  Enter global configuration mode\n'
          + '  show ...            Display device information\n'
          + '  interface ...       Enter interface configuration\n'
          + '  router ...          Enter routing protocol config\n'
          + '  vlan ...            Create/enter VLAN config\n'
          + '  ping ...            Test connectivity\n'
          + '  traceroute ...      Trace packet path\n'
          + '  enable              Enter privileged EXEC mode\n'
          + '  end                 Return to privileged EXEC\n'
          + '  exit                Exit current mode',
      }]);
      return;
    }

    if (trimmed === 'clear') {
      setHistory([{ type: 'system', text: `--- ${deviceName} terminal cleared ---` }]);
      return;
    }

    try {
      const res = await api.executeCommand({
        lab_slug: labSlug, device_name: deviceName,
        command: trimmed, step_number: step?.step_number, user_id: userId,
      });

      if (res.output) {
        setHistory((prev) => [...prev, {
          type: res.output.includes('% Invalid') ? 'error' : 'output',
          text: res.output,
        }]);
      }
      if (res.prompt) setPrompt(res.prompt);

      const newEntered = [...enteredCommands, trimmed];
      setEnteredCommands(newEntered);

      if (step?.expected_commands && !(completedSteps && completedSteps.has(step.step_number))) {
        const expected = step.expected_commands.map((c) => c.toLowerCase());
        const matched  = expected.every((exp) =>
          newEntered.some((cmd) => cmd.toLowerCase().includes(exp) || exp.includes(cmd.toLowerCase()))
        );
        if (matched) {
          setHistory((prev) => [...prev, {
            type: 'success',
            text: `✓ Step ${step.step_number} completed! (+${step.points} points)`,
          }]);
          onStepComplete(step.step_number, step.points);
        }
      }
    } catch (err) {
      setHistory((prev) => [...prev, { type: 'error', text: `Error: ${err.message}` }]);
    }
  }, [deviceName, labSlug, step, prompt, enteredCommands, onStepComplete, userId, completedSteps]);

  // ── Keyboard handler ───────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = historyIdx < 0 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx >= 0) {
        const newIdx = historyIdx + 1;
        if (newIdx >= cmdHistory.length) { setHistoryIdx(-1); setInput(''); }
        else { setHistoryIdx(newIdx); setInput(cmdHistory[newIdx]); }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completions = [
        'configure terminal', 'show vlan brief', 'show ip interface brief',
        'show ip ospf neighbor', 'show ip bgp', 'show running-config',
        'show interfaces', 'show spanning-tree', 'show etherchannel summary',
        'show ip nat translations', 'show access-lists', 'show ip ssh',
        'show mpls forwarding-table', 'show interfaces tunnel 0',
        'show ipv6 interface brief', 'show ip dhcp binding', 'show crypto isakmp sa',
      ];
      const match = completions.find((c) => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  };

  // ── Shortcut chip tap ──────────────────────────────────────
  const handleShortcut = (cmd) => {
    if (cmd.endsWith(' ')) {
      // Commands like 'ping ' — insert into input and focus
      setInput(cmd);
      inputRef.current?.focus();
    } else {
      executeCommand(cmd);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="terminal-wrap" ref={wrapRef}>
      <div className="terminal" onClick={() => inputRef.current?.focus()}>
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="terminal-title">
            {deviceName ? `${deviceName} — Cisco IOS CLI` : 'Select a device'}
          </span>
        </div>

        <div className="terminal-body" ref={bodyRef}>
          {history.map((entry, i) => (
            <div key={i} className="terminal-line">
              {entry.type === 'input' && (
                <>
                  <span className="terminal-prompt">{entry.prompt} </span>
                  <span className="terminal-cmd">{colorizeCommand(entry.text)}</span>
                </>
              )}
              {entry.type === 'output'  && <span className="terminal-output">{entry.text}</span>}
              {entry.type === 'error'   && <span className="terminal-error">{entry.text}</span>}
              {entry.type === 'system'  && <span className="terminal-system">{entry.text}</span>}
              {entry.type === 'success' && <span className="terminal-success">{entry.text}</span>}
            </div>
          ))}
          <div className="terminal-input-line">
            <span className="terminal-prompt">{prompt} </span>
            <input
              ref={inputRef}
              className="terminal-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              disabled={!deviceName}
              placeholder={deviceName ? '' : 'Select a device from the topology...'}
            />
          </div>
        </div>
      </div>

      {/* Command shortcut bar — always rendered, hidden on desktop via CSS */}
      {deviceName && (
        <div className="cmd-shortcut-bar">
          {SHORTCUT_COMMANDS.map((s) => (
            <button
              key={s.cmd}
              className="cmd-shortcut-chip"
              onPointerDown={(e) => {
                e.preventDefault(); // prevent keyboard dismiss on iOS
                handleShortcut(s.cmd);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
