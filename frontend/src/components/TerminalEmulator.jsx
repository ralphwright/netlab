import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api';

// ── Client-side IOS command normalization ─────────────────────
// Mirrors the backend normalize() function for offline matching.
// Full normalization happens on the backend; this covers the most
// common abbreviations so step validation feels instant.
const ALIAS_MAP = [
  [/^conf(?:ig(?:ure?)?)?\s+t(?:erm(?:inal)?)?$/i,        'configure terminal'],
  [/^conf(?:ig(?:ure?)?)?$/i,                               'configure terminal'],
  [/^no\s+shu(?:t(?:down)?)?$/i,                           'no shutdown'],
  [/^shu(?:t(?:down)?)?$/i,                                'shutdown'],
  [/^ena(?:ble)?$/i,                                        'enable'],
  [/^en(?:d)?$/i,                                           'end'],
  [/^ex(?:it)?$/i,                                          'exit'],
  [/^wr(?:ite)?(?:\s+mem(?:ory)?)?$/i,                     'write memory'],
  [/^sh(?:ow)?\s+ip\s+int(?:erface)?\s+br(?:ief)?$/i,     'show ip interface brief'],
  [/^sh(?:ow)?\s+ip\s+ro(?:ute)?$/i,                      'show ip route'],
  [/^sh(?:ow)?\s+ip\s+ospf\s+nei(?:ghbor)?$/i,            'show ip ospf neighbor'],
  [/^sh(?:ow)?\s+ip\s+bgp$/i,                             'show ip bgp'],
  [/^sh(?:ow)?\s+ip\s+bgp\s+sum(?:mary)?$/i,              'show ip bgp summary'],
  [/^sh(?:ow)?\s+ip\s+nat\s+tr(?:anslations?)?$/i,        'show ip nat translations'],
  [/^sh(?:ow)?\s+ip\s+nat\s+st(?:atistics?)?$/i,          'show ip nat statistics'],
  [/^sh(?:ow)?\s+ip\s+dh(?:cp)?\s+bi(?:nding)?$/i,       'show ip dhcp binding'],
  [/^sh(?:ow)?\s+ip\s+dh(?:cp)?\s+po(?:ol)?$/i,          'show ip dhcp pool'],
  [/^sh(?:ow)?\s+ip\s+ssh$/i,                             'show ip ssh'],
  [/^sh(?:ow)?\s+vlan\s+br(?:ief)?$/i,                   'show vlan brief'],
  [/^sh(?:ow)?\s+sp(?:anning)?(?:-tree)?$/i,              'show spanning-tree'],
  [/^sh(?:ow)?\s+eth(?:erchannel)?\s+sum(?:mary)?$/i,     'show etherchannel summary'],
  [/^sh(?:ow)?\s+acc(?:ess)?(?:-lists?)?$/i,              'show access-lists'],
  [/^sh(?:ow)?\s+ho(?:sts?)?$/i,                          'show hosts'],
  [/^sh(?:ow)?\s+run(?:ning)?(?:-config)?$/i,             'show running-config'],
  [/^sh(?:ow)?\s+ipv6\s+int(?:erface)?\s+br(?:ief)?$/i,  'show ipv6 interface brief'],
  [/^sh(?:ow)?\s+mpls\s+forw(?:arding)?(?:-table)?$/i,   'show mpls forwarding-table'],
  [/^span(?:ning)?(?:-tree)?\s+portf(?:ast)?$/i,          'spanning-tree portfast'],
  [/^span(?:ning)?(?:-tree)?\s+bpdu(?:guard)?\s+en(?:able)?$/i, 'spanning-tree bpduguard enable'],
  [/^sw(?:itch)?p(?:ort)?\s+mo(?:de)?\s+ac(?:cess)?$/i,  'switchport mode access'],
  [/^sw(?:itch)?p(?:ort)?\s+mo(?:de)?\s+tr(?:unk)?$/i,   'switchport mode trunk'],
  [/^log(?:in)?\s+loc(?:al)?$/i,                          'login local'],
  [/^ip\s+add(?:ress)?\s+/i,                              null], // handled inline below
];

// Interface name expansion
function expandIfName(name) {
  return name
    .replace(/^[Gg][Ii](\d[\d/]*)/, 'GigabitEthernet$1')
    .replace(/^[Gg](\d[\d/]*)/, 'GigabitEthernet$1')
    .replace(/^[Ff][Aa](\d[\d/]*)/, 'FastEthernet$1')
    .replace(/^[Ff](\d[\d/]*)/, 'FastEthernet$1')
    .replace(/^[Ss][Ee](\d[\d/]*)/, 'Serial$1')
    .replace(/^[Ss](\d[\d/]*)/, 'Serial$1')
    .replace(/^[Ll][Oo](\d+)/,      'Loopback$1')
    .replace(/^[Ll](\d+)/,          'Loopback$1')
    .replace(/^[Pp][Oo](\d+)/,      'Port-channel$1')
    .replace(/^[Tt][Uu](\d+)/,      'Tunnel$1')
    .replace(/^[Tt](\d+)/,          'Tunnel$1')
    .replace(/^[Vv][Ll](\d+)/,      'Vlan$1');
}

function normalizeCmd(cmd) {
  if (!cmd) return cmd;
  const t = cmd.trim();

  // Handle 'do <cmd>' — normalize sub-command, keep 'do' prefix
  const doM = t.match(/^do\s+(.+)$/i);
  if (doM) return `do ${normalizeCmd(doM[1])}`;

  // Whole-command aliases
  for (const [re, replacement] of ALIAS_MAP) {
    if (replacement && re.test(t)) {
      return t.replace(re, replacement);
    }
  }

  // interface [range] <name>
  const ifM = t.match(/^(?:int(?:erface)?)(\s+range)?\s+(.+)$/i);
  if (ifM) {
    const range = ifM[1] ? ' range' : '';
    return `interface${range} ${expandIfName(ifM[2])}`;
  }

  // ip add -> ip address
  const ipAddM = t.match(/^ip\s+add(?:ress)?\s+(.+)$/i);
  if (ipAddM) return `ip address ${ipAddM[1]}`;

  // no <sub>
  const noM = t.match(/^no\s+(.+)$/i);
  if (noM) return `no ${normalizeCmd(noM[1])}`;

  // router (abbrev)
  const routerM = t.match(/^rou?t?e?r?\s+(.+)$/i);
  if (routerM && !t.toLowerCase().startsWith('route ') && !t.toLowerCase().startsWith('router ')) {
    return `router ${routerM[1]}`;
  }

  return t;
}

// Mode requirements — which prompt modes allow a command to count
const MODE_RULES = [
  [/^configure terminal$/i,                          ['privileged']],
  [/^show\b/i,                                       ['privileged','config','config-if','config-router','config-vlan','config-dhcp','config-line','config-acl','config-zone']],
  [/^(ping|traceroute)\b/i,                          ['privileged']],
  [/^interface\b/i,                                  ['config', 'config-if']],
  [/^router\b/i,                                     ['config']],
  [/^vlan\s+\d+$/i,                                 ['config']],
  [/^ip\s+routing$/i,                               ['config']],
  [/^ip\s+route\b/i,                                ['config']],
  [/^ip\s+dhcp\s+(pool|exclu)/i,                    ['config']],
  [/^ip\s+access-list\b/i,                          ['config']],
  [/^ip\s+nat\s+inside\s+source/i,                  ['config']],
  [/^access-list\b/i,                               ['config']],
  [/^spanning-tree\s+vlan\b/i,                      ['config']],
  [/^spanning-tree\s+portfast\s+default/i,           ['config']],
  [/^zone\s+security\b/i,                           ['config']],
  [/^zone-pair\b/i,                                 ['config']],
  [/^crypto\b/i,                                    ['config']],
  [/^username\b/i,                                  ['config']],
  [/^line\b/i,                                      ['config']],
  [/^ipv6\s+unicast-routing\b/i,                    ['config']],
  [/^ip\s+address\b/i,                              ['config-if']],
  [/^no\s+shutdown$/i,                              ['config-if']],
  [/^shutdown$/i,                                   ['config-if']],
  [/^switchport\b/i,                                ['config-if']],
  [/^encapsulation\b/i,                             ['config-if']],
  [/^channel-group\b/i,                             ['config-if']],
  [/^spanning-tree\s+portf/i,                       ['config-if']],
  [/^spanning-tree\s+bpdu/i,                        ['config-if']],
  [/^ip\s+nat\s+(inside|outside)$/i,               ['config-if']],
  [/^mpls\s+ip$/i,                                  ['config-if']],
  [/^tunnel\s+(source|dest|mode)/i,                 ['config-if']],
  [/^ip\s+access-group\b/i,                         ['config-if']],
  [/^zone-member\b/i,                               ['config-if']],
  [/^ipv6\s+address\b/i,                            ['config-if']],
  [/^ipv6\s+ospf\b/i,                               ['config-if']],
  [/^network\b/i,                                   ['config-router','config-dhcp']],
  [/^neighbor\b/i,                                  ['config-router']],
  [/^router-id\b/i,                                 ['config-router']],
  [/^name\b/i,                                      ['config-vlan']],
  [/^default-router\b/i,                            ['config-dhcp']],
  [/^dns-server\b/i,                                ['config-dhcp']],
  [/^transport\s+input\b/i,                         ['config-line']],
  [/^login\s+local$/i,                              ['config-line']],
  [/^(permit|deny)\b/i,                             ['config-acl']],
  [/^service-policy\s+type\s+inspect\b/i,           ['config-zone']],
];

function modeOk(cmd, currentMode) {
  const c = cmd.trim().toLowerCase();
  // 'do <cmd>' is valid in any config mode
  if (/^do\s+/.test(c)) return true;
  for (const [re, modes] of MODE_RULES) {
    if (re.test(c)) return modes.includes(currentMode);
  }
  return true; // unrecognised command — don't block
}

// ── Command matching: sequential subsequence ──────────────────
// Checks whether expected commands appear as an IN-ORDER subsequence
// of entered {cmd, mode} pairs, with mode validation.
function matchesSequential(expected, entered) {
  let ei = 0; // pointer into expected
  for (const { cmd, mode } of entered) {
    if (ei >= expected.length) break;
    const norm    = normalizeCmd(cmd).toLowerCase();
    const expNorm = normalizeCmd(expected[ei]).toLowerCase();
    // Match if either is a substring of the other (handles partial expected cmds)
    const textMatch = norm.includes(expNorm) || expNorm.includes(norm);
    // If the user used 'do <cmd>', treat the effective mode as privileged for
    // the purpose of mode validation — 'do' is specifically for running exec
    // commands from config modes
    const effectiveMode = /^do\s+/i.test(cmd) ? 'privileged' : mode;
    const modeMatch = modeOk(expNorm, effectiveMode);
    if (textMatch && modeMatch) ei++;
  }
  return ei >= expected.length;
}

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
  const [cliReady, setCliReady]          = useState(false); // true once reset-mode confirms
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

    // Reset backend mode to privileged and wait for confirmation before
    // allowing input — ensures backend and frontend mode agree from the start.
    if (!isQuiz && labSlug && userId) {
      setCliReady(false);
      api.resetDeviceMode({ lab_slug: labSlug, device_name: deviceName, user_id: userId })
        .then(res => {
          if (res?.prompt) setPrompt(res.prompt);
          setCliReady(true);
        })
        .catch(() => setCliReady(true)); // fail open — still allow use
    } else {
      setCliReady(true);
    }
  }, [deviceName, labSlug, userId]);

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

    // ? and 'help' are forwarded to the backend which returns
    // mode-aware IOS-style help output (do not intercept here)

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
          type: ['% Invalid', '% Incomplete', '% Ambiguous', '% Unknown', '% Error'].some(e => res.output.includes(e)) ? 'error' : 'output',
          text: res.output,
        }]);
      }
      if (res.prompt) setPrompt(res.prompt);

      // Store cmd with the mode it was entered in (from backend response)
      const newEntered = [...enteredCommands, {
        cmd:  trimmed,
        mode: res.current_mode || 'privileged',
      }];
      setEnteredCommands(newEntered);

      if (step?.expected_commands && !(completedSteps && completedSteps.has(step.step_number))) {
        const matched = matchesSequential(step.expected_commands, newEntered);
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
              disabled={!deviceName || !cliReady}
              placeholder={!deviceName ? 'Select a device from the topology...' : !cliReady ? 'Connecting…' : ''}
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
