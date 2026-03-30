"""
cmd_normalize.py — IOS command alias expansion and mode validation

Two public functions:
  normalize(cmd: str) -> str
    Expands common IOS abbreviations to their canonical long form so that
    'conf t', 'int Gi0/0', 'no shut', 'sh ip int br' etc. all match the
    expected_commands stored in the DB.

  required_modes(cmd: str) -> list[str]
    Returns the set of IOS prompt modes in which this command is valid.
    Used to gate step completion — a command typed in the wrong mode
    does not count toward progress.
"""

from __future__ import annotations
import re

# ── Interface name normalisation ───────────────────────────────
# Maps short prefixes to canonical IOS names
_IF_EXPANSIONS = [
    (r"^gi(\d[\d/]*)",     r"GigabitEthernet\1"),
    (r"^g(\d[\d/]*)",      r"GigabitEthernet\1"),
    (r"^fa(\d[\d/]*)",     r"FastEthernet\1"),
    (r"^f(\d[\d/]*)",      r"FastEthernet\1"),
    (r"^te(\d[\d/]*)",     r"TenGigabitEthernet\1"),
    (r"^se(\d[\d/]*)",     r"Serial\1"),
    (r"^s(\d[\d/]*)",      r"Serial\1"),
    (r"^lo(\d+)",          r"Loopback\1"),
    (r"^l(\d+)",           r"Loopback\1"),
    (r"^po(\d+)",          r"Port-channel\1"),
    (r"^tu(\d+)",          r"Tunnel\1"),
    (r"^t(\d+)",           r"Tunnel\1"),
    (r"^vl(\d+)",          r"Vlan\1"),
    (r"^do(\d+)",          r"dot11Radio\1"),
]

def _expand_interface(token: str) -> str:
    """'gi0/0' -> 'GigabitEthernet0/0', 'Gi0/1' -> 'GigabitEthernet0/1' etc."""
    t = token.strip()
    tl = t.lower()
    # Already fully spelled out — just fix capitalisation
    full = {
        "gigabitethernet": "GigabitEthernet",
        "fastethernet":    "FastEthernet",
        "tengigabitethernet": "TenGigabitEthernet",
        "serial":          "Serial",
        "loopback":        "Loopback",
        "port-channel":    "Port-channel",
        "tunnel":          "Tunnel",
        "vlan":            "Vlan",
        "dot11radio":      "dot11Radio",
    }
    for prefix, canonical in full.items():
        if tl.startswith(prefix):
            return canonical + t[len(prefix):]
    # Try short-form expansions
    for pattern, replacement in _IF_EXPANSIONS:
        m = re.match(pattern, tl)
        if m:
            return re.sub(pattern, replacement, tl, flags=re.I)
    return t  # unchanged


# ── Whole-command alias table ──────────────────────────────────
# Each entry: (pattern, canonical_replacement)
# Pattern is matched against the entire command (lowercased, stripped).
# Earlier entries take priority.
_ALIASES: list[tuple[re.Pattern, str]] = []

def _add(pattern: str, replacement: str) -> None:
    _ALIASES.append((re.compile(pattern, re.IGNORECASE), replacement))

# configure terminal
_add(r"^conf(?:ig(?:ure?)?)?\s+t(?:erm(?:inal)?)?$",    "configure terminal")
_add(r"^conf(?:ig(?:ure?)?)?$",                           "configure terminal")

# end / exit
_add(r"^en(?:d)?$",                                       "end")
_add(r"^ex(?:it)?$",                                      "exit")

# enable
_add(r"^ena(?:ble)?$",                                    "enable")

# no shutdown
_add(r"^no\s+shu(?:t(?:down)?)?$",                       "no shutdown")

# shutdown
_add(r"^shu(?:t(?:down)?)?$",                             "shutdown")

# ip routing
_add(r"^ip\s+rout(?:ing)?$",                              "ip routing")

# ip domain-lookup
_add(r"^ip\s+domain[-\s]loo(?:kup)?$",                   "ip domain-lookup")

# spanning-tree portfast
_add(r"^span(?:ning)?(?:-tree)?\s+portf(?:ast)?$",       "spanning-tree portfast")
_add(r"^span(?:ning)?(?:-tree)?\s+portf(?:ast)?\s+def(?:ault)?$",
     "spanning-tree portfast default")
_add(r"^span(?:ning)?(?:-tree)?\s+bpdu(?:guard)?\s+en(?:able)?$",
     "spanning-tree bpduguard enable")

# switchport abbreviations
_add(r"^sw(?:itch)?p(?:ort)?\s+mo(?:de)?\s+ac(?:cess)?$",       "switchport mode access")
_add(r"^sw(?:itch)?p(?:ort)?\s+mo(?:de)?\s+tr(?:unk)?$",        "switchport mode trunk")
_add(r"^sw(?:itch)?p(?:ort)?\s+tr(?:unk)?\s+en(?:cap)?\s+dot1q$",
     "switchport trunk encapsulation dot1q")
_add(r"^sw(?:itch)?p(?:ort)?\s+ac(?:cess)?\s+vl(?:an)?\s+(\d+)$",
     r"switchport access vlan \1")

# mpls ip
_add(r"^mpls\s+ip$", "mpls ip")

# login local
_add(r"^log(?:in)?\s+loc(?:al)?$", "login local")

# write memory / write
_add(r"^wr(?:ite)?(?:\s+mem(?:ory)?)?$", "write memory")

# show commands — expand common abbreviations
_add(r"^sh(?:ow)?\s+ip\s+int(?:erface)?\s+br(?:ief)?$",
     "show ip interface brief")
_add(r"^sh(?:ow)?\s+ip\s+ro(?:ute)?$",
     "show ip route")
_add(r"^sh(?:ow)?\s+ip\s+ro(?:ute)?\s+sum(?:mary)?$",
     "show ip route summary")
_add(r"^sh(?:ow)?\s+ip\s+ospf\s+nei(?:ghbor)?$",
     "show ip ospf neighbor")
_add(r"^sh(?:ow)?\s+ip\s+bgp$",
     "show ip bgp")
_add(r"^sh(?:ow)?\s+ip\s+bgp\s+sum(?:mary)?$",
     "show ip bgp summary")
_add(r"^sh(?:ow)?\s+ip\s+nat\s+tr(?:anslations?)?$",
     "show ip nat translations")
_add(r"^sh(?:ow)?\s+ip\s+nat\s+st(?:atistics?)?$",
     "show ip nat statistics")
_add(r"^sh(?:ow)?\s+ip\s+dh(?:cp)?\s+bi(?:nding)?$",
     "show ip dhcp binding")
_add(r"^sh(?:ow)?\s+ip\s+dh(?:cp)?\s+po(?:ol)?$",
     "show ip dhcp pool")
_add(r"^sh(?:ow)?\s+ip\s+ssh$",
     "show ip ssh")
_add(r"^sh(?:ow)?\s+ip\s+int(?:erface)?\s+(\S+)$",
     r"show ip interface \1")
_add(r"^sh(?:ow)?\s+cdp\s+nei(?:gh(?:bors?)?)?(?:\s+det(?:ail)?)?$",
     "show cdp neighbors")
_add(r"^sh(?:ow)?\s+ip\s+bgp\s+nei(?:gh(?:bors?)?)?$",
     "show ip bgp neighbors")
_add(r"^sh(?:ow)?\s+cl(?:ock)?(?:\s+det(?:ail)?)?$",
     "show clock")
_add(r"^sh(?:ow)?\s+proc(?:esses?)?(?:\s+cpu)?$",
     "show processes cpu")
_add(r"^sh(?:ow)?\s+mem(?:ory)?$",
     "show memory")
_add(r"^sh(?:ow)?\s+ver(?:sion)?$",
     "show version")
_add(r"^sh(?:ow)?\s+vlan\s+br(?:ief)?$",
     "show vlan brief")
_add(r"^sh(?:ow)?\s+vlan(?:s)?$",
     "show vlans")
_add(r"^sh(?:ow)?\s+sp(?:anning)?(?:-tree)?$",
     "show spanning-tree")
_add(r"^sh(?:ow)?\s+eth(?:er)?(?:chan(?:nel)?)?\s+sum(?:mary)?$",
     "show etherchannel summary")
_add(r"^sh(?:ow)?\s+int(?:erfaces?)?\s+tu(?:nnel)?\s*(\d+)$",
     r"show interfaces tunnel \1")
_add(r"^sh(?:ow)?\s+ipv6\s+int(?:erface)?\s+br(?:ief)?$",
     "show ipv6 interface brief")
_add(r"^sh(?:ow)?\s+ipv6\s+nei(?:ghbors?)?$",
     "show ipv6 neighbors")
_add(r"^sh(?:ow)?\s+mpls\s+forw(?:arding)?(?:-table)?$",
     "show mpls forwarding-table")
_add(r"^sh(?:ow)?\s+mpls\s+ldp\s+nei(?:ghbor)?$",
     "show mpls ldp neighbor")
_add(r"^sh(?:ow)?\s+cry(?:pto)?\s+isa(?:kmp)?\s+sa$",
     "show crypto isakmp sa")
_add(r"^sh(?:ow)?\s+zone\s+sec(?:urity)?$",
     "show zone security")
_add(r"^sh(?:ow)?\s+zone-pair\s+sec(?:urity)?$",
     "show zone-pair security")
_add(r"^sh(?:ow)?\s+acc(?:ess)?(?:-list(?:s)?)?$",
     "show access-lists")
_add(r"^sh(?:ow)?\s+hi(?:st(?:ory)?)?$",
     "show history")
_add(r"^sh(?:ow)?\s+ho(?:sts?)?$",
     "show hosts")
_add(r"^sh(?:ow)?\s+run(?:ning)?(?:-config)?$",
     "show running-config")
_add(r"^sh(?:ow)?\s+dot11\s+ass(?:oc(?:iation)?s?)?$",
     "show dot11 associations")
_add(r"^sh(?:ow)?\s+sta(?:ndby)?\s+br(?:ief)?$",
     "show standby brief")
_add(r"^sh(?:ow)?\s+sta(?:ndby)?$",
     "show standby")
_add(r"^sh(?:ow)?\s+wlan\s+sum(?:mary)?$",
     "show wlan summary")
_add(r"^sh(?:ow)?\s+ap\s+sum(?:mary)?$",
     "show ap summary")


def normalize(cmd: str) -> str:
    """
    Expand IOS abbreviations in a command to canonical long form.

    Examples:
        'conf t'                  -> 'configure terminal'
        'int gi0/0'               -> 'interface GigabitEthernet0/0'
        'no shut'                 -> 'no shutdown'
        'sh ip int br'            -> 'show ip interface brief'
        'do sh ip int br'         -> 'do show ip interface brief'
        'ip add 10.0.1.1 255.0'   -> 'ip address 10.0.1.1 255.0'
    """
    if not cmd:
        return cmd

    stripped = cmd.strip()

    # Handle 'do <command>' — normalize the sub-command, keep 'do' prefix
    do_m = re.match(r"^do\s+(.+)$", stripped, re.I)
    if do_m:
        return f"do {normalize(do_m.group(1))}"

    # Try whole-command alias table first
    for pattern, replacement in _ALIASES:
        m = pattern.match(stripped)
        if m:
            # Handle back-references in replacement (e.g. \1 for group)
            try:
                result = pattern.sub(replacement, stripped)
                return result
            except Exception:
                return replacement

    # Tokenise and expand token by token
    tokens = stripped.split()
    if not tokens:
        return stripped

    out = []
    i = 0

    # ── interface [range] <name> ────────────────────────────
    if tokens[0].lower() in ("int", "interface"):
        out.append("interface")
        i = 1
        # optional 'range'
        if i < len(tokens) and tokens[i].lower() in ("ra", "ran", "rang", "range"):
            out.append("range")
            i += 1
        # interface name(s) — may be "GigabitEthernet0/1-2"
        if i < len(tokens):
            rest = " ".join(tokens[i:])
            # Handle "range Gi0/1 - 2" or "Gi0/1-2"
            out.append(_expand_if_rest(rest))
        return " ".join(out)

    # ── router <protocol> ───────────────────────────────────
    if tokens[0].lower() in ("ro", "rou", "rout", "route", "router") and len(tokens) > 1:
        out.append("router")
        out.extend(tokens[1:])
        return " ".join(out)

    # ── spanning-tree ───────────────────────────────────────
    if tokens[0].lower().startswith("span"):
        out.append("spanning-tree")
        out.extend(tokens[1:])
        return " ".join(out)

    # ── ip address abbreviation: 'ip add ...' ───────────────
    if (tokens[0].lower() == "ip" and len(tokens) > 1
            and tokens[1].lower().startswith("add") and tokens[1].lower() != "address"):
        out.append("ip")
        out.append("address")
        out.extend(tokens[2:])
        return " ".join(out)

    # ── ip route abbreviation ────────────────────────────────
    if (tokens[0].lower() == "ip" and len(tokens) > 1
            and tokens[1].lower().startswith("rou") and tokens[1].lower() not in ("route", "routing", "router")):
        out.append("ip")
        out.append("route")
        out.extend(tokens[2:])
        return " ".join(out)

    # ── no <something> ───────────────────────────────────────
    if tokens[0].lower() == "no" and len(tokens) > 1:
        sub = normalize(" ".join(tokens[1:]))
        return f"no {sub}"

    # ── channel-group ────────────────────────────────────────
    if tokens[0].lower().startswith("chan"):
        out.append("channel-group")
        out.extend(tokens[1:])
        return " ".join(out)

    # Fallback — return as-is with minor whitespace normalisation
    return " ".join(tokens)


def _expand_if_rest(rest: str) -> str:
    """
    Expand interface name(s) in 'rest'.
    Handles both single interfaces and range syntax like 'Gi0/1-2'.
    """
    rest = rest.strip()
    # Range like "GigabitEthernet0/1-2" or "Gi0/1-2"
    rm = re.match(r"(\S+)(\d+)/(\d+)-(\d+)$", rest)
    if rm:
        base = _expand_interface(rm.group(1) + rm.group(2) + "/" + rm.group(3))
        # Strip the numeric suffix to get just the prefix
        prefix_m = re.match(r"(.*\D)(\d+/\d+)$", base)
        if prefix_m:
            return f"{prefix_m.group(1)}{rm.group(2)}/{rm.group(3)}-{rm.group(4)}"
    # Single interface
    return _expand_interface(rest)


# ── Mode requirements ──────────────────────────────────────────

# Map command prefixes (lowercased) to the modes in which they are valid.
# A command is accepted for step-completion only if the current mode is
# in the allowed set. Use "*" as a wildcard meaning any mode is fine.
_MODE_RULES: list[tuple[re.Pattern, list[str]]] = []

def _mode_rule(pattern: str, modes: list[str]) -> None:
    _MODE_RULES.append((re.compile(pattern, re.IGNORECASE), modes))

# 'do <cmd>' is valid in any config mode (executes as if in privileged exec)
_mode_rule(r"^do\b",                         ["config", "config-if", "config-router",
                                               "config-vlan", "config-dhcp", "config-line",
                                               "config-acl", "config-zone", "config-tunnel"])

# Exec-only commands
_mode_rule(r"^configure terminal$",          ["privileged"])
_mode_rule(r"^enable$",                      ["user"])
_mode_rule(r"^show\b",                       ["privileged", "config", "config-if",
                                               "config-router", "config-vlan",
                                               "config-dhcp", "config-line",
                                               "config-acl", "config-zone",
                                               "config-tunnel"])
_mode_rule(r"^ping\b",                       ["privileged"])
_mode_rule(r"^traceroute\b",                 ["privileged"])
_mode_rule(r"^write\b",                      ["privileged"])

# Global config commands
_mode_rule(r"^interface\b",                  ["config", "config-if"])
_mode_rule(r"^router\b",                     ["config"])
_mode_rule(r"^vlan\s+\d+$",                 ["config"])
_mode_rule(r"^ip\s+routing$",               ["config"])
_mode_rule(r"^ip\s+route\b",               ["config"])
_mode_rule(r"^ip\s+dhcp\s+(pool|exclu)",   ["config"])
_mode_rule(r"^ip\s+access-list\b",         ["config"])
_mode_rule(r"^ip\s+nat\s+inside\s+source", ["config"])
_mode_rule(r"^access-list\b",              ["config"])
_mode_rule(r"^hostname\b",                 ["config"])
_mode_rule(r"^ip\s+domain",               ["config"])
_mode_rule(r"^ip\s+name-server\b",        ["config"])
_mode_rule(r"^ip\s+host\b",              ["config"])
_mode_rule(r"^spanning-tree\s+vlan\b",   ["config"])
_mode_rule(r"^spanning-tree\s+portfast\s+default", ["config"])
_mode_rule(r"^zone\s+security\b",        ["config"])
_mode_rule(r"^zone-pair\s+security\b",   ["config"])
_mode_rule(r"^crypto\s+key\b",           ["config"])
_mode_rule(r"^crypto\s+isakmp\b",        ["config"])
_mode_rule(r"^crypto\s+ipsec\b",         ["config"])
_mode_rule(r"^crypto\s+dynamic-map\b",   ["config"])
_mode_rule(r"^username\b",               ["config"])
_mode_rule(r"^line\b",                   ["config"])
_mode_rule(r"^ipv6\s+unicast-routing\b", ["config"])
_mode_rule(r"^dot11\s+ssid\b",          ["config"])
_mode_rule(r"^wlan\b",                  ["config"])
_mode_rule(r"^radius\s+server\b",       ["config"])

# Interface-level commands
_IF_MODES = ["config-if"]
_mode_rule(r"^ip\s+address\b",          _IF_MODES)
_mode_rule(r"^no\s+shutdown$",          _IF_MODES)
_mode_rule(r"^shutdown$",               _IF_MODES)
_mode_rule(r"^switchport\b",            _IF_MODES)
_mode_rule(r"^encapsulation\b",         _IF_MODES)
_mode_rule(r"^channel-group\b",         _IF_MODES)
_mode_rule(r"^spanning-tree\s+portf",   _IF_MODES)
_mode_rule(r"^spanning-tree\s+bpdu",    _IF_MODES)
_mode_rule(r"^ip\s+nat\s+(inside|outside)$", _IF_MODES)
_mode_rule(r"^mpls\s+ip$",             _IF_MODES)
_mode_rule(r"^tunnel\s+(source|dest|mode)", _IF_MODES)
_mode_rule(r"^ip\s+access-group\b",    _IF_MODES)
_mode_rule(r"^zone-member\b",          _IF_MODES)
_mode_rule(r"^ipv6\s+address\b",       _IF_MODES)
_mode_rule(r"^ipv6\s+ospf\b",         _IF_MODES)

# Router sub-mode commands
_mode_rule(r"^network\b",              ["config-router", "config-dhcp"])
_mode_rule(r"^neighbor\b",             ["config-router"])
_mode_rule(r"^router-id\b",           ["config-router"])
_mode_rule(r"^remote-as\b",           ["config-router"])

# VLAN sub-mode
_mode_rule(r"^name\b",                ["config-vlan"])

# DHCP pool sub-mode
_mode_rule(r"^default-router\b",      ["config-dhcp"])
_mode_rule(r"^dns-server\b",         ["config-dhcp"])

# Line sub-mode
_mode_rule(r"^transport\s+input\b",   ["config-line"])
_mode_rule(r"^login\s+local$",        ["config-line"])
_mode_rule(r"^exec-timeout\b",        ["config-line"])

# ACL sub-mode
_mode_rule(r"^(permit|deny)\b",       ["config-acl"])

# Zone sub-mode
_mode_rule(r"^service-policy\s+type\s+inspect\b", ["config-zone"])

# Commands valid in multiple / any context
_mode_rule(r"^(end|exit)$",           ["*"])
_mode_rule(r"^no\b",                  ["*"])


def required_modes(cmd: str) -> list[str]:
    """
    Return the list of IOS modes in which 'cmd' is valid.
    Returns ['*'] if any mode is acceptable.
    Returns [] if the command is not recognised (treat as always valid
    to avoid over-blocking).
    """
    c = cmd.strip().lower()
    for pattern, modes in _MODE_RULES:
        if pattern.match(c):
            return modes
    return ["*"]   # unrecognised → do not block


def mode_ok(cmd: str, current_mode: str) -> bool:
    """Return True if 'cmd' may be entered in 'current_mode'."""
    modes = required_modes(cmd)
    if "*" in modes:
        return True
    return current_mode in modes
