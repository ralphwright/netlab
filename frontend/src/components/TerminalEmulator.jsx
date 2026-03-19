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

function colorizeCommand(cmd) {
  const parts = cmd.split(/(\s+)/);
  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    if (COMMAND_COLORS.show.includes(lower)) {
      return <span key={i} style={{ color: '#ffab00' }}>{part}</span>;
    }
    if (COMMAND_COLORS.keywords.includes(lower)) {
      return <span key={i} style={{ color: '#00e5ff' }}>{part}</span>;
    }
    if (COMMAND_COLORS.values.includes(lower)) {
      return <span key={i} style={{ color: '#7c4dff' }}>{part}</span>;
    }
    if (/^\d+(\.\d+)*$/.test(part) || /^\d+\.\d+\.\d+\.\d+$/.test(part)) {
      return <span key={i} style={{ color: '#00e676' }}>{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function TerminalEmulator({ labSlug, deviceName, step, onStepComplete, completedSteps, userId }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [prompt, setPrompt] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [enteredCommands, setEnteredCommands] = useState([]);
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (deviceName) {
      setPrompt(`${deviceName}#`);
      setHistory([
        { type: 'system', text: `--- Connected to ${deviceName} ---` },
        { type: 'system', text: 'Type Cisco IOS commands. Use "?" for help.' },
      ]);
      setEnteredCommands([]);
    }
  }, [deviceName]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  const executeCommand = useCallback(async (command) => {
    if (!command.trim() || !deviceName) return;

    const trimmed = command.trim();
    setCmdHistory((prev) => [...prev, trimmed]);
    setHistoryIdx(-1);

    // Add command to history display
    setHistory((prev) => [
      ...prev,
      { type: 'input', prompt, text: trimmed },
    ]);

    // Handle local-only commands
    if (trimmed === '?' || trimmed === 'help') {
      setHistory((prev) => [
        ...prev,
        {
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
        },
      ]);
      return;
    }

    if (trimmed === 'clear') {
      setHistory([
        { type: 'system', text: `--- ${deviceName} terminal cleared ---` },
      ]);
      return;
    }

    try {
      const res = await api.executeCommand({
        lab_slug: labSlug,
        device_name: deviceName,
        command: trimmed,
        step_number: step?.step_number,
        user_id: userId,
      });

      if (res.output) {
        setHistory((prev) => [
          ...prev,
          {
            type: res.output.includes('% Invalid') ? 'error' : 'output',
            text: res.output,
          },
        ]);
      }

      if (res.prompt) {
        setPrompt(res.prompt);
      }

      // Track entered commands for step validation
      const newEntered = [...enteredCommands, trimmed];
      setEnteredCommands(newEntered);

      // Check if step is now complete (skip if already completed from saved progress)
      if (step?.expected_commands && !(completedSteps && completedSteps.has(step.step_number))) {
        const expected = step.expected_commands.map((c) => c.toLowerCase());
        const matched = expected.every((exp) =>
          newEntered.some((cmd) => cmd.toLowerCase().includes(exp) || exp.includes(cmd.toLowerCase()))
        );
        if (matched) {
          setHistory((prev) => [
            ...prev,
            {
              type: 'success',
              text: `✓ Step ${step.step_number} completed! (+${step.points} points)`,
            },
          ]);
          onStepComplete(step.step_number, step.points);
        }
      }
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        { type: 'error', text: `Error: ${err.message}` },
      ]);
    }
  }, [deviceName, labSlug, step, prompt, enteredCommands, onStepComplete, userId]);

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
        if (newIdx >= cmdHistory.length) {
          setHistoryIdx(-1);
          setInput('');
        } else {
          setHistoryIdx(newIdx);
          setInput(cmdHistory[newIdx]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for common commands
      const completions = [
        'configure terminal', 'show vlan brief', 'show ip interface brief',
        'show ip ospf neighbor', 'show ip bgp', 'show running-config',
        'show interfaces', 'show spanning-tree', 'show etherchannel summary',
        'show ip nat translations', 'show access-lists', 'show ip ssh',
        'show mpls forwarding-table', 'show interfaces tunnel 0',
        'show ipv6 interface brief', 'show ip dhcp binding',
        'show crypto isakmp sa',
      ];
      const match = completions.find((c) => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  };

  return (
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
          <div key={i} className="terminal-line" style={{ marginBottom: 2 }}>
            {entry.type === 'input' && (
              <>
                <span className="terminal-prompt">{entry.prompt} </span>
                <span>{colorizeCommand(entry.text)}</span>
              </>
            )}
            {entry.type === 'output' && (
              <span className="terminal-output">{entry.text}</span>
            )}
            {entry.type === 'error' && (
              <span className="terminal-error">{entry.text}</span>
            )}
            {entry.type === 'system' && (
              <span className="terminal-system">{entry.text}</span>
            )}
            {entry.type === 'success' && (
              <span className="terminal-success">{entry.text}</span>
            )}
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
            disabled={!deviceName}
            placeholder={deviceName ? '' : 'Select a device from the topology...'}
          />
        </div>
      </div>
    </div>
  );
}
