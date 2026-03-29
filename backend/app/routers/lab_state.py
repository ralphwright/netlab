"""
lab_state.py — Stateful IOS configuration tracker

Tracks per-user-per-lab-per-device config state so that show commands
return output reflecting what has actually been configured, not canned strings.

Architecture:
  LAB_STATES: dict[scope_key, DeviceState]
  parse_command(scope_key, device_name, command, current_mode) -> None
  generate_show(scope_key, device_name, command) -> str | None
    Returns None if the command is not handled (caller falls back to canned output)
"""

from __future__ import annotations
import re
from dataclasses import dataclass, field
from typing import Optional

# ── Helpers ────────────────────────────────────────────────────

def _cidr(mask: str) -> int:
    """255.255.255.192 -> 26"""
    if not mask:
        return 0
    if mask.isdigit():
        return int(mask)
    try:
        return sum(bin(int(o)).count('1') for o in mask.split('.'))
    except Exception:
        return 0

def _mask_to_cidr_str(mask: str) -> str:
    n = _cidr(mask)
    return f"/{n}" if n else ""

def _network_addr(ip: str, mask: str) -> str:
    """Return network address string for an IP/mask pair."""
    try:
        ip_parts = list(map(int, ip.split('.')))
        mask_parts = list(map(int, mask.split('.')))
        net = [ip_parts[i] & mask_parts[i] for i in range(4)]
        return '.'.join(map(str, net))
    except Exception:
        return ip

def _short_if(name: str) -> str:
    """GigabitEthernet0/0 -> Gi0/0, Serial0/0/0 -> Se0/0/0, etc."""
    abbrevs = [
        (r"GigabitEthernet", "Gi"),
        (r"FastEthernet",    "Fa"),
        (r"TenGigabitEthernet", "Te"),
        (r"Serial",          "Se"),
        (r"Loopback",        "Lo"),
        (r"Port-channel",    "Po"),
        (r"Tunnel",          "Tu"),
        (r"Vlan",            "Vl"),
        (r"dot11Radio",      "do"),
    ]
    s = name
    for full, short in abbrevs:
        s = re.sub(full, short, s, flags=re.IGNORECASE)
    return s

def _pad(s: str, width: int) -> str:
    return s[:width].ljust(width)

# ── Data classes ───────────────────────────────────────────────

@dataclass
class IfaceState:
    name: str
    ip: str = ""
    mask: str = ""
    ipv6: list = field(default_factory=list)      # ["2001:DB8:1::1/64", ...]
    status: str = "administratively down"
    protocol: str = "down"
    mode: str = ""          # access | trunk | routed | (blank)
    access_vlan: int = 1
    trunk_allowed: str = "all"
    nat: str = ""           # inside | outside
    mpls: bool = False
    zone: str = ""
    encap: str = ""         # "dot1Q 10"
    channel_group: int = 0
    portfast: bool = False
    bpduguard: bool = False
    acl_in: str = ""
    acl_out: str = ""
    description: str = ""
    vlan_id: int = 0        # for subinterfaces e.g. Gi0/0.10
    # Tunnel fields
    tun_src: str = ""
    tun_dst: str = ""
    tun_mode: str = "gre ip"
    # OSPF
    ospf_area: int = -1

@dataclass
class VlanEntry:
    vid: int
    name: str = ""
    status: str = "active"
    ports: list = field(default_factory=list)

@dataclass
class OspfNetwork:
    network: str
    wildcard: str
    area: int

@dataclass
class OspfProc:
    pid: int
    router_id: str = ""
    networks: list = field(default_factory=list)  # [OspfNetwork]

@dataclass
class BgpProc:
    asn: int
    neighbors: list = field(default_factory=list)  # [(ip, remote_as)]
    prefixes: list = field(default_factory=list)   # [(network, mask)]

@dataclass
class DhcpPool:
    name: str
    network: str = ""
    mask: str = ""
    default_router: str = ""
    dns_server: str = ""

@dataclass
class AclEntry:
    seq: int
    action: str    # permit | deny
    rest: str      # everything after action

@dataclass
class NatRule:
    kind: str      # static | dynamic | overload
    inside_local: str = ""
    inside_global: str = ""
    acl: str = ""
    interface: str = ""
    overload: bool = False

@dataclass
class ZonePair:
    name: str
    src_zone: str = ""
    dst_zone: str = ""
    policy: str = ""

@dataclass
class DeviceState:
    name: str
    hostname: str = ""
    ip_routing: bool = False
    ipv6_routing: bool = False
    ssh_enabled: bool = False
    domain_name: str = ""
    name_servers: list = field(default_factory=list)
    host_table: dict = field(default_factory=dict)    # hostname -> ip
    ifaces: dict = field(default_factory=dict)        # name -> IfaceState
    vlans: dict = field(default_factory=dict)         # vid -> VlanEntry
    ospf: dict = field(default_factory=dict)          # pid -> OspfProc
    bgp: Optional[BgpProc] = None
    dhcp_pools: dict = field(default_factory=dict)
    dhcp_excluded: list = field(default_factory=list) # [(start, end)]
    acls: dict = field(default_factory=dict)          # name -> [AclEntry]
    nat_rules: list = field(default_factory=list)
    stp_priority: dict = field(default_factory=dict)  # vlan_id -> priority
    stp_portfast_default: bool = False
    po_members: dict = field(default_factory=dict)    # po_num -> [iface_names]
    zones: dict = field(default_factory=dict)         # name -> zone
    zone_pairs: list = field(default_factory=list)    # [ZonePair]
    isakmp_policies: list = field(default_factory=list)
    crypto_maps: list = field(default_factory=list)
    ssids: dict = field(default_factory=dict)         # ssid_name -> {}
    wlans: dict = field(default_factory=dict)         # wlan_id -> {}
    dot11_radios: dict = field(default_factory=dict)  # iface -> {channel}
    wlan_ssids: list = field(default_factory=list)    # configured SSID names


# ── Global state store ─────────────────────────────────────────
# key = "user_id:lab_slug:device_name"
LAB_STATES: dict[str, DeviceState] = {}


def get_state(scope_key: str, device_name: str) -> DeviceState:
    if scope_key not in LAB_STATES:
        LAB_STATES[scope_key] = DeviceState(name=device_name)
    return LAB_STATES[scope_key]


def reset_state(scope_key: str) -> None:
    LAB_STATES.pop(scope_key, None)


# ── Command parser ─────────────────────────────────────────────

def _expand_iface_range(raw: str) -> list[str]:
    """
    Expand an interface range spec to a list of interface names.

    Handles:
      GigabitEthernet0/1               → ['GigabitEthernet0/1']
      GigabitEthernet0/1-4             → ['GigabitEthernet0/1', ..., 'GigabitEthernet0/4']
      Gi0/1-4                          → ['GigabitEthernet0/1', ..., 'GigabitEthernet0/4']
      GigabitEthernet0/1-4, Fa0/1-2   → combined list
    """
    from app.routers.cmd_normalize import _expand_interface
    names: list[str] = []
    # Split on comma for multi-range syntax
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    for part in parts:
        # Match: <prefix><slot>/<start>-<end>  (with optional spaces around dash)
        range_m = re.match(r"(.*?)(\d+)/(\d+)\s*-\s*(\d+)$", part)
        if range_m:
            prefix, slot, start, end = range_m.groups()
            # Normalise the interface prefix abbreviation
            sample = _expand_interface(prefix.strip() + slot + "/" + start)
            # Extract the canonical prefix (everything up to the last digit group)
            pfx_m = re.match(r"(.*?)(\d+)/(\d+)$", sample)
            if pfx_m:
                canon_pfx = pfx_m.group(1)
                canon_slot = pfx_m.group(2)
                for port in range(int(start), int(end) + 1):
                    names.append(f"{canon_pfx}{canon_slot}/{port}")
            else:
                names.append(sample)
        else:
            # Single interface — just expand any abbreviation
            names.append(_expand_interface(part))
    return names if names else [raw]


def parse_command(scope_key: str, device_name: str, command: str, current_mode: str) -> None:
    """
    Parse a validated IOS command and update DeviceState.
    current_mode comes from DEVICE_MODES in cli.py.
    """
    if device_name == "QUIZ":
        return

    state = get_state(scope_key, device_name)
    cmd = command.strip()
    low = cmd.lower()

    # ── Global config commands ─────────────────────────────────
    if current_mode in ("config", "privileged"):

        # ip routing
        if low == "ip routing":
            state.ip_routing = True
            return

        # ipv6 unicast-routing
        if low == "ipv6 unicast-routing":
            state.ipv6_routing = True
            return

        # hostname
        m = re.match(r"hostname\s+(\S+)", cmd, re.I)
        if m:
            state.hostname = m.group(1)
            return

        # ip domain-name / ip domain name
        m = re.match(r"ip\s+domain[-\s]name\s+(\S+)", cmd, re.I)
        if m:
            state.domain_name = m.group(1)
            return

        # ip name-server
        m = re.match(r"ip\s+name-server\s+(\S+)", cmd, re.I)
        if m:
            if m.group(1) not in state.name_servers:
                state.name_servers.append(m.group(1))
            return

        # ip host <name> <ip>
        m = re.match(r"ip\s+host\s+(\S+)\s+(\S+)", cmd, re.I)
        if m:
            state.host_table[m.group(1)] = m.group(2)
            return

        # ip domain-lookup (enable DNS)
        if re.match(r"ip\s+domain-lookup", low):
            return

        # crypto key generate rsa — enables SSH
        if re.match(r"crypto\s+key\s+generate\s+rsa", low):
            state.ssh_enabled = True
            return

        # ip route <network> <mask> <nexthop>
        m = re.match(r"ip\s+route\s+(\S+)\s+(\S+)\s+(\S+)", cmd, re.I)
        if m:
            net, mask, nh = m.group(1), m.group(2), m.group(3)
            route = (net, mask, nh)
            if route not in getattr(state, '_static_routes', []):
                if not hasattr(state, '_static_routes'):
                    state._static_routes = []
                state._static_routes.append(route)
            return

        # vlan <id>
        m = re.match(r"vlan\s+(\d+)$", low)
        if m:
            vid = int(m.group(1))
            if vid not in state.vlans:
                state.vlans[vid] = VlanEntry(vid=vid, name=f"VLAN{vid:04d}")
            state._current_vlan = vid   # track for 'name' command in config-vlan mode
            return

        # spanning-tree vlan <id> priority <val>
        m = re.match(r"spanning-tree\s+vlan\s+(\d+)\s+priority\s+(\d+)", low)
        if m:
            state.stp_priority[int(m.group(1))] = int(m.group(2))
            return

        # username <name> [privilege <p>] secret/password <pw>
        m_user = re.match(r"username\s+(\S+)", cmd, re.I)
        if m_user:
            if not hasattr(state, '_usernames'):
                state._usernames = {}
            state._usernames[m_user.group(1)] = "cisco"
            return

                # spanning-tree portfast default
        if re.match(r"spanning-tree\s+portfast\s+default", low):
            state.stp_portfast_default = True
            return

        # ip dhcp excluded-address
        m = re.match(r"ip\s+dhcp\s+excluded-address\s+(\S+)(?:\s+(\S+))?", cmd, re.I)
        if m:
            state.dhcp_excluded.append((m.group(1), m.group(2) or m.group(1)))
            return

        # ip access-list extended/standard <name>
        m = re.match(r"ip\s+access-list\s+(?:extended|standard)\s+(\S+)", cmd, re.I)
        if m:
            name = m.group(1)
            if name not in state.acls:
                state.acls[name] = []
            return

        # access-list <number> permit/deny ...
        m = re.match(r"access-list\s+(\d+)\s+(permit|deny)\s+(.+)", cmd, re.I)
        if m:
            num, action, rest = m.group(1), m.group(2), m.group(3)
            if num not in state.acls:
                state.acls[num] = []
            state.acls[num].append(AclEntry(
                seq=len(state.acls[num]) * 10 + 10,
                action=action.lower(),
                rest=rest,
            ))
            return

        # ip nat inside source static <local> <global>
        m = re.match(r"ip\s+nat\s+inside\s+source\s+static\s+(\S+)\s+(\S+)", cmd, re.I)
        if m:
            state.nat_rules.append(NatRule(
                kind="static",
                inside_local=m.group(1),
                inside_global=m.group(2),
            ))
            return

        # ip nat inside source list <acl> interface <if> [overload]
        m = re.match(r"ip\s+nat\s+inside\s+source\s+list\s+(\S+)\s+interface\s+(\S+)", cmd, re.I)
        if m:
            state.nat_rules.append(NatRule(
                kind="overload",
                acl=m.group(1),
                interface=m.group(2),
                overload="overload" in low,
            ))
            return

        # zone security <name>
        m = re.match(r"zone\s+security\s+(\S+)", cmd, re.I)
        if m:
            state.zones[m.group(1)] = {}
            return

        # zone-pair security <name> source <src> destination <dst>
        m = re.match(r"zone-pair\s+security\s+(\S+)\s+source\s+(\S+)\s+destination\s+(\S+)", cmd, re.I)
        if m:
            state.zone_pairs.append(ZonePair(
                name=m.group(1), src=m.group(2), dst=m.group(3)
            ))
            return

        # crypto isakmp policy <num>
        if re.match(r"crypto\s+isakmp\s+policy\s+\d+", low):
            state.isakmp_policies.append({})
            return

        # wlan <name> <id> <profile> (WLC syntax)
        m = re.match(r"wlan\s+(\S+)\s+(\d+)\s+(\S+)", cmd, re.I)
        if m:
            state.wlans[int(m.group(2))] = {"name": m.group(1), "profile": m.group(3), "enabled": False}
            return

        # dot11 ssid <name>
        m = re.match(r"dot11\s+ssid\s+(\S+)", cmd, re.I)
        if m:
            state.ssids[m.group(1)] = {}
            return

    # ── Interface-level commands ───────────────────────────────
    if current_mode in ("config-if",):
        # Determine which interface(s) we're in.
        # _current_iface_range is set by "interface range" and contains all
        # interfaces that subsequent commands should apply to.
        iface_name = getattr(state, '_current_iface', None)
        if not iface_name:
            return
        iface_range = getattr(state, '_current_iface_range', [iface_name])
        if not iface_range:
            iface_range = [iface_name]

        def _apply(fn):
            """Apply fn(iface) to every interface in the current range."""
            for _n in iface_range:
                _if = state.ifaces.setdefault(_n, IfaceState(name=_n))
                fn(_if)

        # Use first interface for single-value reads; all for writes
        iface = state.ifaces.setdefault(iface_name, IfaceState(name=iface_name))

        # Loopback interfaces are always up/up when created (no physical layer)
        if iface_name.lower().startswith("loop") or iface_name.lower().startswith("lo"):
            iface.status = "up"
            iface.protocol = "up"

        # description <text>
        m_desc = re.match(r"description\s+(.+)", cmd, re.I)
        if m_desc:
            _v = m_desc.group(1).strip()
            _apply(lambda i: setattr(i, 'description', _v))
            return

        # ip address <ip> <mask>
        m = re.match(r"ip\s+address\s+(\S+)\s+(\S+)", cmd, re.I)
        if m:
            iface.ip = m.group(1)
            iface.mask = m.group(2)
            # Do NOT auto-bring up — requires explicit 'no shutdown'
            # Exception: SVIs (Vlan interfaces) and Loopbacks come up automatically
            iface_lower = iface_name.lower()
            if iface_lower.startswith("vlan") or iface_lower.startswith("vl") or iface_lower.startswith("loop") or iface_lower.startswith("lo"):
                iface.status = "up"
                iface.protocol = "up"
                if iface_lower.startswith("vlan") or iface_lower.startswith("vl"):
                    state.ip_routing = True
            return

        # ipv6 address
        m = re.match(r"ipv6\s+address\s+(\S+)", cmd, re.I)
        if m:
            addr = m.group(1)
            if addr not in iface.ipv6:
                iface.ipv6.append(addr)
            iface_lower = iface_name.lower()
            if iface_lower.startswith("loop") or iface_lower.startswith("lo"):
                iface.status = "up"
                iface.protocol = "up"
            return

        # no shutdown
        if re.match(r"no\s+shutdown", low):
            _apply(lambda i: (setattr(i, "status", "up"), setattr(i, "protocol", "up")))
            return

        # shutdown
        if low == "shutdown":
            _apply(lambda i: (setattr(i, "status", "administratively down"), setattr(i, "protocol", "down")))
            return

        # switchport mode access/trunk
        m = re.match(r"switchport\s+mode\s+(access|trunk)", low)
        if m:
            _v = m.group(1)
            _apply(lambda i: setattr(i, "mode", _v))
            return

        # switchport access vlan <id>
        m = re.match(r"switchport\s+access\s+vlan\s+(\d+)", low)
        if m:
            vid = int(m.group(1))
            if vid not in state.vlans:
                state.vlans[vid] = VlanEntry(vid=vid, name=f"VLAN{vid:04d}")
            for _n in iface_range:
                _if = state.ifaces.setdefault(_n, IfaceState(name=_n))
                _if.access_vlan = vid
                if _short_if(_n) not in state.vlans[vid].ports:
                    state.vlans[vid].ports.append(_short_if(_n))
            return

        # switchport trunk encapsulation dot1q
        if re.match(r"switchport\s+trunk\s+encapsulation", low):
            iface.encap = "802.1Q"
            return

        # switchport trunk allowed vlan <vlans>
        m = re.match(r"switchport\s+trunk\s+allowed\s+vlan\s+(\S+)", low)
        if m:
            iface.trunk_allowed = m.group(1)
            return

        # encapsulation dot1Q <vlan>
        m = re.match(r"encapsulation\s+dot1q\s+(\d+)", cmd, re.I)
        if m:
            iface.encap = f"dot1Q {m.group(1)}"
            vid = int(m.group(1))
            if vid not in state.vlans:
                state.vlans[vid] = VlanEntry(vid=vid, name=f"VLAN{vid:04d}")
            return

        # ip nat inside/outside
        m = re.match(r"ip\s+nat\s+(inside|outside)", low)
        if m:
            _v = m.group(1)
            _apply(lambda i: setattr(i, "nat", _v))
            return

        # mpls ip
        if low == "mpls ip":
            _apply(lambda i: setattr(i, "mpls", True))
            return

        # channel-group <n> mode <mode>
        m = re.match(r"channel-group\s+(\d+)\s+mode\s+\S+", low)
        if m:
            po = int(m.group(1))
            iface.channel_group = po
            members = state.po_members.setdefault(po, [])
            if iface_name not in members:
                members.append(iface_name)
            return

        # spanning-tree portfast
        if re.match(r"spanning-tree\s+portfast", low):
            _apply(lambda i: setattr(i, "portfast", True))
            return

        # spanning-tree bpduguard enable
        if re.match(r"spanning-tree\s+bpduguard\s+enable", low):
            _apply(lambda i: setattr(i, "bpduguard", True))
            return

        # ip access-group <acl> in/out
        m = re.match(r"ip\s+access-group\s+(\S+)\s+(in|out)", cmd, re.I)
        if m:
            if m.group(2).lower() == "in":
                iface.acl_in = m.group(1)
            else:
                iface.acl_out = m.group(1)
            return

        # zone-member security <zone>
        m = re.match(r"zone-member\s+security\s+(\S+)", cmd, re.I)
        if m:
            iface.zone = m.group(1)
            return

        # tunnel source / destination / mode / ip
        m = re.match(r"tunnel\s+source\s+(\S+)", cmd, re.I)
        if m:
            iface.tun_src = m.group(1)
            return
        m = re.match(r"tunnel\s+destination\s+(\S+)", cmd, re.I)
        if m:
            iface.tun_dst = m.group(1)
            iface.status = "up"
            iface.protocol = "up"
            return
        if re.match(r"tunnel\s+mode\s+gre", low):
            iface.tun_mode = "GRE/IP"
            return

        # dot11Radio channel <n>
        m = re.match(r"channel\s+(\d+)", low)
        if m:
            state.dot11_radios[iface_name] = {"channel": int(m.group(1))}
            return

    # ── Interface range — track current interface ──────────────
    # We handle the "interface <name>" command specially since it sets context
    m = re.match(r"interface(?:\s+range)?\s+(.+)", cmd, re.I)
    if m and current_mode in ("config", "config-if"):
        raw = m.group(1).strip()
        # Handle "range GigabitEthernet0/1-2" -> expand to both interfaces
        range_m = re.match(r"(\D+)(\d+)/(\d+)-(\d+)", raw)
        if range_m:
            base, slot, start, end = range_m.groups()
            names = [f"{base.strip()}{slot}/{i}" for i in range(int(start), int(end)+1)]
            state._current_iface = names[0]  # track first for channel-group
            state._current_iface_range = names
            for n in names:
                state.ifaces.setdefault(n, IfaceState(name=n))
        else:
            state._current_iface = raw
            state._current_iface_range = [raw]
            state.ifaces.setdefault(raw, IfaceState(name=raw))
        return

    # ── OSPF commands ──────────────────────────────────────────
    if current_mode in ("config-router",):
        pid = getattr(state, '_current_ospf_pid', 1)
        proc = state.ospf.setdefault(pid, OspfProc(pid=pid))

        # router-id
        m = re.match(r"router-id\s+(\S+)", cmd, re.I)
        if m:
            proc.router_id = m.group(1)
            return

        # network <net> <wild> area <area>
        m = re.match(r"network\s+(\S+)\s+(\S+)\s+area\s+(\S+)", cmd, re.I)
        if m:
            proc.networks.append(OspfNetwork(
                network=m.group(1), wildcard=m.group(2), area=int(m.group(3))
            ))
            return

    # Track ospf process id when entering router ospf
    m = re.match(r"router\s+ospf\s+(\d+)", cmd, re.I)
    if m and current_mode == "config":
        state._current_ospf_pid = int(m.group(1))
        return

    # ── BGP commands ───────────────────────────────────────────
    m = re.match(r"router\s+bgp\s+(\d+)", cmd, re.I)
    if m and current_mode == "config":
        asn = int(m.group(1))
        if not state.bgp:
            state.bgp = BgpProc(asn=asn)
        state._current_bgp_asn = asn
        return

    if current_mode == "config-router" and state.bgp:
        # neighbor <ip> remote-as <asn>
        m = re.match(r"neighbor\s+(\S+)\s+remote-as\s+(\d+)", cmd, re.I)
        if m:
            nbr = (m.group(1), int(m.group(2)))
            if nbr not in state.bgp.neighbors:
                state.bgp.neighbors.append(nbr)
            return

        # network <prefix> mask <mask>
        m = re.match(r"network\s+(\S+)(?:\s+mask\s+(\S+))?", cmd, re.I)
        if m:
            pfx = (m.group(1), m.group(2) or "255.255.255.0")
            if pfx not in state.bgp.prefixes:
                state.bgp.prefixes.append(pfx)
            return

    # ── VLAN name command ──────────────────────────────────────
    if current_mode == "config-vlan":
        vid = getattr(state, '_current_vlan', None)
        m = re.match(r"name\s+(.+)", cmd, re.I)
        if m and vid and vid in state.vlans:
            state.vlans[vid].name = m.group(1).strip()
            return

    m = re.match(r"vlan\s+(\d+)$", low)
    if m and current_mode == "config":
        vid = int(m.group(1))
        state._current_vlan = vid
        if vid not in state.vlans:
            state.vlans[vid] = VlanEntry(vid=vid, name=f"VLAN{vid:04d}")
        return

    # ── DHCP pool commands ─────────────────────────────────────
    m = re.match(r"ip\s+dhcp\s+pool\s+(\S+)", cmd, re.I)
    if m and current_mode == "config":
        name = m.group(1)
        state._current_dhcp_pool = name
        state.dhcp_pools.setdefault(name, DhcpPool(name=name))
        return

    if current_mode == "config-dhcp":
        pool_name = getattr(state, '_current_dhcp_pool', None)
        if pool_name and pool_name in state.dhcp_pools:
            pool = state.dhcp_pools[pool_name]
            m = re.match(r"network\s+(\S+)\s+(\S+)", cmd, re.I)
            if m:
                pool.network = m.group(1)
                pool.mask = m.group(2)
                return
            m = re.match(r"default-router\s+(\S+)", cmd, re.I)
            if m:
                pool.default_router = m.group(1)
                return
            m = re.match(r"dns-server\s+(\S+)", cmd, re.I)
            if m:
                pool.dns_server = m.group(1)
                return

    # ── ACL entry commands ─────────────────────────────────────
    if current_mode == "config-acl":
        acl_name = getattr(state, '_current_acl', None)
        m = re.match(r"(permit|deny)\s+(.+)", cmd, re.I)
        if m and acl_name:
            entries = state.acls.setdefault(acl_name, [])
            entries.append(AclEntry(
                seq=len(entries) * 10 + 10,
                action=m.group(1).lower(),
                rest=m.group(2),
            ))
            return

    m = re.match(r"ip\s+access-list\s+(?:extended|standard)\s+(\S+)", cmd, re.I)
    if m and current_mode == "config":
        state._current_acl = m.group(1)
        state.acls.setdefault(m.group(1), [])
        return

    # ── WLAN / WLC commands ────────────────────────────────────
    if current_mode == "config":
        m = re.match(r"wlan\s+(\S+)\s+(\d+)\s+(\S+)", cmd, re.I)
        if m:
            wid = int(m.group(2))
            state.wlans[wid] = {"name": m.group(1), "profile": m.group(3), "enabled": False}
            state._current_wlan = wid
            return

    # WLAN sub-commands (no-shutdown enables it)
    if current_mode in ("config",):
        wid = getattr(state, '_current_wlan', None)
        if wid and wid in state.wlans:
            if low == "no shutdown":
                state.wlans[wid]["enabled"] = True
                return
            m = re.match(r"vlan\s+(\d+)", low)
            if m:
                state.wlans[wid]["vlan"] = int(m.group(1))
                return
            if re.match(r"security\s+wpa", low):
                state.wlans[wid]["security"] = "WPA3"
                return

    # ── Wireless AP (dot11) ────────────────────────────────────
    if current_mode in ("config",):
        m = re.match(r"dot11\s+ssid\s+(\S+)", cmd, re.I)
        if m:
            ssid = m.group(1)
            state.ssids[ssid] = state.ssids.get(ssid, {})
            state._current_ssid = ssid
            return

    if current_mode in ("config",) and getattr(state, '_current_ssid', None):
        ssid = state._current_ssid
        if re.match(r"vlan\s+\d+", low):
            m = re.match(r"vlan\s+(\d+)", low)
            if m:
                state.ssids[ssid]["vlan"] = int(m.group(1))
            return
        if re.match(r"authentication", low):
            state.ssids[ssid]["auth"] = cmd.strip()
            return


# ── Show command generator ─────────────────────────────────────

def generate_show(scope_key: str, device_name: str, command: str) -> str | None:
    """
    Generate dynamic show output. Returns None if not handled.
    """
    if device_name == "QUIZ":
        return None

    state = get_state(scope_key, device_name)
    # Strip 'do ' prefix so 'do show ip route' works from config modes
    import re as _re
    do_m = _re.match(r"^do\s+(.+)$", command.strip(), _re.I)
    cmd = (do_m.group(1) if do_m else command).strip().lower()

    # ── show ip interface brief ────────────────────────────────
    if re.match(r"show\s+ip\s+interface\s+brief$", cmd):
        return _show_ip_int_brief(state)

    # ── show ip route ──────────────────────────────────────────
    if re.match(r"show\s+ip\s+route$", cmd):
        return _show_ip_route(state)

    # ── show vlan brief ────────────────────────────────────────
    if re.match(r"show\s+vlan\s+brief$", cmd):
        return _show_vlan_brief(state)

    # ── show spanning-tree ─────────────────────────────────────
    if re.match(r"show\s+spanning-tree$", cmd):
        return _show_spanning_tree(state)

    # ── show etherchannel summary ──────────────────────────────
    if re.match(r"show\s+etherchannel\s+summary$", cmd):
        return _show_etherchannel(state)

    # ── show ip ospf neighbor ──────────────────────────────────
    if re.match(r"show\s+ip\s+ospf\s+neighbor$", cmd):
        return _show_ospf_neighbor(state)

    # ── show ip bgp ────────────────────────────────────────────
    if re.match(r"show\s+ip\s+bgp$", cmd):
        return _show_ip_bgp(state)

    # ── show ip bgp summary ────────────────────────────────────
    if re.match(r"show\s+ip\s+bgp\s+summary$", cmd):
        return _show_bgp_summary(state)

    # ── show ip nat translations ───────────────────────────────
    if re.match(r"show\s+ip\s+nat\s+translations$", cmd):
        return _show_nat_translations(state)

    # ── show ip nat statistics ─────────────────────────────────
    if re.match(r"show\s+ip\s+nat\s+statistics$", cmd):
        return _show_nat_statistics(state)

    # ── show ip dhcp binding ───────────────────────────────────
    if re.match(r"show\s+ip\s+dhcp\s+binding$", cmd):
        return _show_dhcp_binding(state)

    # ── show ip dhcp pool ──────────────────────────────────────
    if re.match(r"show\s+ip\s+dhcp\s+pool$", cmd):
        return _show_dhcp_pool(state)

    # ── show hosts ─────────────────────────────────────────────
    if re.match(r"show\s+hosts$", cmd):
        return _show_hosts(state)

    # ── show access-lists ──────────────────────────────────────
    if re.match(r"show\s+access-lists$", cmd):
        return _show_acls(state)

    # ── show ip interface <if> ─────────────────────────────────
    m = re.match(r"show\s+ip\s+interface\s+(\S+)$", cmd)
    if m:
        return _show_ip_interface_detail(state, m.group(1))

    # ── show interfaces tunnel 0 ───────────────────────────────
    m = re.match(r"show\s+interfaces?\s+tunnel\s*(\d+)$", cmd)
    if m:
        return _show_tunnel(state, int(m.group(1)))

    # ── show ipv6 interface brief ──────────────────────────────
    if re.match(r"show\s+ipv6\s+interface\s+brief$", cmd):
        return _show_ipv6_brief(state)

    # ── show ip ssh ────────────────────────────────────────────
    if re.match(r"show\s+ip\s+ssh$", cmd):
        return _show_ip_ssh(state)

    # ── show mpls forwarding-table ─────────────────────────────
    if re.match(r"show\s+mpls\s+forwarding-table$", cmd):
        return _show_mpls_forwarding(state)

    # ── show mpls ldp neighbor ─────────────────────────────────
    if re.match(r"show\s+mpls\s+ldp\s+neighbor$", cmd):
        return _show_mpls_ldp(state)

    # ── show crypto isakmp sa ──────────────────────────────────
    if re.match(r"show\s+crypto\s+isakmp\s+sa$", cmd):
        return _show_crypto_isakmp(state)

    # ── show zone security ─────────────────────────────────────
    if re.match(r"show\s+zone\s+security$", cmd):
        return _show_zones(state)

    # ── show zone-pair security ────────────────────────────────
    if re.match(r"show\s+zone-pair\s+security$", cmd):
        return _show_zone_pairs(state)

    # ── show dot11 associations ────────────────────────────────
    if re.match(r"show\s+dot11\s+associations$", cmd):
        return _show_dot11(state)

    # ── show vlans (subinterface) ──────────────────────────────
    if re.match(r"show\s+vlans$", cmd):
        return _show_vlans_subif(state)

    # ── show ip route summary ──────────────────────────────────
    if re.match(r"show\s+ip\s+route\s+summary$", cmd):
        return _show_route_summary(state)

    # ── show running-config ────────────────────────────────────────
    if re.match(r"show\s+running-config$", cmd):
        return _show_running_config(state)

    # ── show interfaces (all or specific) ─────────────────────────
    m2 = re.match(r"show\s+interfaces?\s+(\S+(?:\s+\S+)*)$", cmd)
    if m2 and "tunnel" not in cmd:
        return _show_interfaces_detail(state, m2.group(1))
    if re.match(r"show\s+interfaces?$", cmd):
        return _show_interfaces_detail(state)

    # ── show version ──────────────────────────────────────────
    if re.match(r"show\s+version$", cmd):
        return _show_version(state, device_name)

    return None  # not handled — caller uses canned output


# ── Show output formatters ─────────────────────────────────────
# Column widths and spacing match real Cisco IOS output exactly.

def _show_ip_int_brief(s: DeviceState) -> str:
    # Real IOS: Interface col=23, IP-Address col=16, OK?=4, Method=8, Status=22, Protocol
    HDR = f"{'Interface':<23}{'IP-Address':<16}{'OK?':<4}{'Method':<8}{'Status':<22}Protocol"
    lines = [HDR]
    if not s.ifaces:
        return HDR + "\n(no interfaces configured)"
    for name, iface in sorted(s.ifaces.items()):
        ip   = iface.ip or "unassigned"
        ok   = "YES"
        meth = "manual" if iface.ip else "unset"
        stat = iface.status
        prot = iface.protocol
        lines.append(f"{name:<23}{ip:<16}{ok:<4}{meth:<8}{stat:<22}{prot}")
    return "\n".join(lines)


def _show_interfaces_detail(s: DeviceState, if_name: str | None = None) -> str:
    """show interfaces [name] — full IOS-style output."""
    ifaces = {}
    if if_name:
        for n, i in s.ifaces.items():
            if n.lower() == if_name.lower() or _short_if(n).lower() == if_name.lower():
                ifaces[n] = i
        if not ifaces:
            return f"% {if_name} not found"
    else:
        ifaces = s.ifaces

    lines = []
    for name, iface in sorted(ifaces.items()):
        speed_str = "1000Mb/s" if "Giga" in name else "100Mb/s"
        bw_kbps   = 1000000    if "Giga" in name else 100000
        ip_line   = (f"  Internet address is {iface.ip}/{_cidr(iface.mask)}"
                     if iface.ip else "  Internet address is not set")
        nat_line  = (f"  IP access group {iface.acl_in} in" if iface.acl_in else "")
        lines += [
            f"{name} is {iface.status}, line protocol is {iface.protocol}",
            f"  Hardware is iGbE, address is aabb.cc00.{abs(hash(name)) % 0xFFFF:04x}"
            f" (bia aabb.cc00.{abs(hash(name)) % 0xFFFF:04x})",
        ]
        if ip_line:
            lines.append(ip_line)
        lines += [
            f"  MTU 1500 bytes, BW {bw_kbps} Kbit/sec, DLY 10 usec,",
            f"     reliability 255/255, txload 1/255, rxload 1/255",
            f"  Encapsulation ARPA, loopback not set",
            f"  Keepalive set (10 sec)",
            f"  Full Duplex, {speed_str}, media type is RJ45",
            f"  output flow-control is off, input flow-control is off",
            f"  ARP type: ARPA, ARP Timeout 04:00:00",
            f"  Last input 00:00:01, output 00:00:00, output hang never",
            f"  Last clearing of \"show interface\" counters never",
            f"  Input queue: 0/75/0/0 (size/max/drops/flushes); Total output drops: 0",
            f"  Queueing strategy: fifo",
            f"  Output queue: 0/40 (size/max)",
            f"  5 minute input rate 0 bits/sec, 0 packets/sec",
            f"  5 minute output rate 0 bits/sec, 0 packets/sec",
            f"     0 packets input, 0 bytes, 0 no buffer",
            f"     0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored",
            f"     0 packets output, 0 bytes, 0 underruns",
            f"",
        ]
    return "\n".join(lines)


def _show_ip_route(s: DeviceState) -> str:
    lines = ["Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP",
             "       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area",
             "       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2",
             "       E1 - OSPF external type 1, E2 - OSPF external type 2",
             "       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2",
             "       ia - IS-IS inter area, * - candidate default, U - per-user static route",
             "       o - ODR, P - periodic downloaded static route, H - NHRP, l - LISP",
             "       a - application route",
             "       + - replicated route, % - next hop override, p - overrides from PfR",
             ""]

    has_default = False
    static = getattr(s, '_static_routes', [])
    for net, mask, nh in static:
        if net == "0.0.0.0":
            has_default = True

    if has_default:
        gw = next((r[2] for r in static if r[0] == "0.0.0.0"), "")
        lines.append(f"Gateway of last resort is {gw} to network 0.0.0.0")
    else:
        lines.append("Gateway of last resort is not set")
    lines.append("")

    # Group connected routes by major network
    if s.ifaces:
        # Find unique /8 or /16 major networks to print variably subnetted lines
        majors: dict[str, list] = {}
        for name, iface in sorted(s.ifaces.items()):
            if iface.ip and iface.status == "up":
                cidr  = _cidr(iface.mask)
                net   = _network_addr(iface.ip, iface.mask)
                major = iface.ip.split(".")[0] + ".0.0.0"
                if major not in majors:
                    majors[major] = []
                majors[major].append((name, iface, net, cidr))

        for major, entries in sorted(majors.items()):
            subnet_count = len(entries) * 2  # C + L for each
            masks_used   = len(set(cidr for _, _, _, cidr in entries))
            if subnet_count > 1:
                lines.append(f"      {major}/8 is variably subnetted, {subnet_count} subnets, {masks_used} masks")
            for name, iface, net, cidr in sorted(entries, key=lambda x: x[2]):
                lines.append(f"C        {net}/{cidr} is directly connected, {name}")
                lines.append(f"L        {iface.ip}/32 is directly connected, {name}")

    # Static routes
    for net, mask, nh in static:
        if net == "0.0.0.0":
            lines.append(f"S*       0.0.0.0/0 [1/0] via {nh}")
        else:
            cidr = _cidr(mask)
            lines.append(f"S        {net}/{cidr} [1/0] via {nh}")

    # OSPF
    for pid, proc in s.ospf.items():
        for ospf_net in proc.networks:
            lines.append(f"O        {ospf_net.network} [110/2] via 10.0.0.2, 00:01:00, GigabitEthernet0/0")

    if not s.ifaces and not static and not s.ospf:
        lines.append("(routing table is empty — configure interfaces and routes)")

    return "\n".join(lines)


def _show_version(s: DeviceState, device_name: str) -> str:
    """Generate realistic show version output based on device name."""
    hostname = s.hostname or device_name
    # Guess device type from name
    name_upper = device_name.upper()
    is_switch = any(x in name_upper for x in ('SW', 'SWITCH', 'CAT', 'CS'))

    if is_switch:
        model        = "WS-C2960X-24TS-L"
        platform     = "C2960X"
        ios_image    = "C2960X-UNIVERSALK9-M"
        ios_ver      = "15.2(7)E6"
        rom_ver      = "12.2(53r)SEY3"
        sys_uptime   = "1 week, 2 days, 4 hours, 17 minutes"
        reload_cause = "power-on"
        ram_mb       = 512
        flash_mb     = 128
        ports        = "24 FastEthernet, 2 GigabitEthernet"
        serial       = f"FCW{abs(hash(device_name)) % 10000:04d}A{abs(hash(device_name+'-s')) % 100:02d}Z"
    else:
        model        = "CISCO2911/K9"
        platform     = "2911"
        ios_image    = "C2900-UNIVERSALK9-M"
        ios_ver      = "15.7(3)M8"
        rom_ver      = "15.0(1r)M16"
        sys_uptime   = "3 days, 7 hours, 42 minutes"
        reload_cause = "power-on"
        ram_mb       = 512
        flash_mb     = 256
        ports        = "3 GigabitEthernet"
        serial       = f"FTX{abs(hash(device_name)) % 10000:04d}B{abs(hash(device_name+'-r')) % 100:02d}W"

    # Build interface list from configured ifaces
    iface_count = len(s.ifaces)
    iface_line = f"{iface_count} interface(s)" if iface_count else ports

    return (
        f"Cisco IOS Software, {platform} Software ({ios_image}), Version {ios_ver}, RELEASE SOFTWARE (fc3)\n"
        f"Technical Support: http://www.cisco.com/techsupport\n"
        f"Copyright (c) 1986-2022 by Cisco Systems, Inc.\n"
        f"Compiled Mon 27-Jun-22 12:25 by prod_rel_team\n"
        f"\n"
        f"ROM: Bootstrap program is {platform} boot loader\n"
        f"BOOTLDR: {platform} Boot Loader (C{platform}-HBOOT-M) Version {rom_ver}\n"
        f"\n"
        f"{hostname} uptime is {sys_uptime}\n"
        f"System returned to ROM by {reload_cause}\n"
        f"\n"
        f"System image file is \"flash:{ios_image}.bin\"\n"
        f"\n"
        f"Last reload type: Normal Reload\n"
        f"\n"
        f"cisco {model} (revision 1.0) with {ram_mb}K/{ram_mb // 4}K bytes of memory.\n"
        f"Processor board ID {serial}\n"
        f"\n"
        f"{ports}\n"
        f"{flash_mb}K bytes of non-volatile configuration memory.\n"
        f"{flash_mb * 1024}K bytes of ATA System CompactFlash 0 (Read/Write)\n"
        f"\n"
        f"Configuration register is 0x2102\n"
        f"\n"
        f"License Information for \'slot 0\':\n"
        f"  License Level: ipservices\n"
        f"  License Type: Permanent\n"
        f"  Next reload license Level: ipservices\n"
    )


def _show_route_summary(s: DeviceState) -> str:
    connected = sum(1 for i in s.ifaces.values() if i.ip and i.status == "up") * 2
    static    = len(getattr(s, '_static_routes', []))
    total     = connected + static
    return (
        "IP routing table summary\n"
        "Route Source    Networks    Subnets   Overhead   Memory (bytes)\n"
        f"{'connected':<16}{0:<12}{connected:<10}{connected*56:<11}{connected*212}\n"
        f"{'static':<16}{0:<12}{static:<10}{static*56:<11}{static*212}\n"
        f"{'Total':<16}{0:<12}{total:<10}{total*56:<11}{total*212}\n"
    )


def _show_vlan_brief(s: DeviceState) -> str:
    HDR = f"{'VLAN':<5} {'Name':<32} {'Status':<9} Ports"
    SEP = f"{'----':<5} {'-'*32:<32} {'-------':<9} {'------'}"
    lines = [HDR, SEP]

    all_assigned: set[str] = set()
    for vid, v in s.vlans.items():
        if vid != 1:
            all_assigned.update(v.ports)

    default_ports = ", ".join(p for p in _get_access_ports(s) if p not in all_assigned)
    lines.append(f"{'1':<5} {'default':<32} {'active':<9} {default_ports}")

    for vid, v in sorted(s.vlans.items()):
        if vid == 1:
            continue
        name     = v.name or f"VLAN{vid:04d}"
        ports_s  = ", ".join(v.ports[:8])
        lines.append(f"{vid:<5} {name:<32} {v.status:<9} {ports_s}")

    for vid, name in [(1002,"fddi-default"),(1003,"token-ring-default"),
                      (1004,"fddinet-default"),(1005,"trnet-default")]:
        lines.append(f"{vid:<5} {name:<32} act/unsup")

    return "\n".join(lines)


def _show_spanning_tree(s: DeviceState) -> str:
    lines = []
    vlans = sorted(s.vlans.keys()) if s.vlans else [1]

    for vid in vlans:
        pri      = s.stp_priority.get(vid, 32768 + vid)
        base_pri = s.stp_priority.get(vid, 32768)
        is_root  = base_pri < 32768
        mac_hex  = f"aabb.cc{abs(hash(str(vid))) % 0xFF:02x}.0100"

        lines += [
            f"VLAN{vid:04d}",
            f"  Spanning tree enabled protocol rstp",
            f"  Root ID    Priority    {pri}",
            f"             Address     {mac_hex}",
        ]
        if is_root:
            lines.append("             This bridge is the root")
        else:
            lines += [
                f"             Cost        4",
                f"             Port        1 (GigabitEthernet0/1)",
                f"             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec",
            ]
        lines += [
            f"",
            f"  Bridge ID  Priority    {pri}  (priority {base_pri} sys-id-ext {vid})",
            f"             Address     {mac_hex}",
            f"             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec",
            f"             Aging Time  300 sec",
            f"",
            f"Interface           Role Sts Cost      Prio.Nbr Type",
            f"------------------- ---- --- --------- -------- --------------------------------",
        ]

        for name, iface in sorted(s.ifaces.items()):
            if iface.mode in ("trunk", "access") or not iface.ip:
                role  = "Desg" if is_root else "Root"
                sts   = "FWD"
                cost  = 4 if "Giga" in name else 19
                ptype = "P2p Edge" if iface.portfast else "P2p"
                sif   = _short_if(name)
                lines.append(f"{sif:<20}{role:<5}{sts:<4}{cost:<10}128.1    {ptype}")
        lines.append("")

    return "\n".join(lines)


def _show_etherchannel(s: DeviceState) -> str:
    hdr = [
        "Flags:  D - down        P - bundled in port-channel",
        "        I - stand-alone s - suspended",
        "        H - Hot-standby (LACP only)",
        "        R - Layer3      S - Layer2",
        "        U - in use      N - not in use, no aggregation",
        "        f - failed to allocate aggregator",
        "",
        "        M - not in use, minimum links not met",
        "        m - not in use, port not aggregated due to minimum links not met",
        "        u - unsuitable for bundling",
        "        w - waiting to be aggregated",
        "        d - default port",
        "        A - formed by Auto LAG",
        "",
        f"Number of channel-groups in use: {len(s.po_members)}",
        "Number of aggregators:           " + str(len(s.po_members)),
        "",
        "Group  Port-channel  Protocol    Ports",
        "------+-------------+-----------+---------------------------------------",
    ]
    if not s.po_members:
        return "\n".join(hdr) + "\n(none)"
    lines = list(hdr)
    for po_num, members in sorted(s.po_members.items()):
        ports_s = "  ".join(f"{_short_if(m)}(P)" for m in sorted(members))
        lines.append(f"{po_num:<7}Po{po_num}(SU)          LACP      {ports_s}")
    return "\n".join(lines)


def _show_ospf_neighbor(s: DeviceState) -> str:
    # Real IOS column widths
    HDR = f"{'Neighbor ID':<16}{'Pri':<6}{'State':<14}{'Dead Time':<12}{'Address':<16}Interface"
    lines = [HDR]

    if not s.ospf:
        return HDR + "\n(no OSPF process configured)"

    nbr_count = 0
    for pid, proc in s.ospf.items():
        for i, net in enumerate(proc.networks):
            parts = net.network.split(".")
            if len(parts) == 4:
                parts_n = parts[:]
                parts_n[-1] = str(min(int(parts_n[-1]) + 2, 254))
                nbr_ip  = ".".join(parts_n)
                nbr_id  = f"{i+2}.{i+2}.{i+2}.{i+2}"
                state   = "FULL/DR" if i == 0 else "FULL/BDR" if i == 1 else "FULL/  -"
                dead    = f"00:00:3{i}"
                iface   = f"GigabitEthernet0/{i}"
                lines.append(f"{nbr_id:<16}{1:<6}{state:<14}{dead:<12}{nbr_ip:<16}{iface}")
                nbr_count += 1

    if nbr_count == 0:
        lines.append("(no OSPF adjacencies formed — check network statements and interface config)")
    return "\n".join(lines)


def _show_ip_bgp(s: DeviceState) -> str:
    if not s.bgp:
        return "% BGP not configured (use: router bgp <asn>)"

    router_id = f"1.1.1.1"
    lines = [
        f"BGP table version is 3, local router ID is {router_id}",
        "Status codes: s suppressed, d damped, h history, * valid, > best, i - internal,",
        "              r RIB-failure, S Stale, m multipath, b backup-path, f RT-Filter,",
        "              x best-external, a additional-path, c RIB-compressed,",
        "              t secondary path, L long-lived-stale,",
        "Origin codes: i - IGP, e - EGP, ? - incomplete",
        "RPKI validation codes: V valid, I invalid, N Not found",
        "",
        f"     {'Network':<20}{'Next Hop':<20}{'Metric':<7}{'LocPrf':<8}{'Weight':<7} Path",
    ]

    for net, mask in s.bgp.prefixes:
        cidr = _cidr(mask)
        lines.append(f" *>  {net}/{cidr:<16}{'0.0.0.0':<20}{'0':<7}{'':8}{'32768':<7} i")

    for nbr_ip, remote_as in s.bgp.neighbors:
        lines.append(f" *>  {'0.0.0.0/0':<20}{nbr_ip:<20}{'0':<7}{'':8}{'0':<7} {remote_as} i")

    if not s.bgp.prefixes and not s.bgp.neighbors:
        lines.append(" (BGP table is empty — configure network statements or neighbors)")

    return "\n".join(lines)


def _show_bgp_summary(s: DeviceState) -> str:
    if not s.bgp:
        return "% BGP not configured"
    lines = [
        f"BGP router identifier 1.1.1.1, local AS number {s.bgp.asn}",
        "BGP table version is 3, main routing table version 3",
        f"{len(s.bgp.prefixes)} network entries using {len(s.bgp.prefixes) * 136} bytes of memory",
        f"{len(s.bgp.prefixes)} path entries using {len(s.bgp.prefixes) * 96} bytes of memory",
        "1 BGP rib-entries using 24 bytes of memory",
        "0 BGP attribute entries using 0 bytes of memory",
        "0 BGP AS-PATH entries using 0 bytes of memory",
        "0 BGP community entries using 0 bytes of memory",
        "0 BGP extended community entries using 0 bytes of memory",
        "0 BGP pmsi tunnel attribute entries using 0 bytes of memory",
        "Neighbor        V           AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd",
    ]
    for nbr_ip, remote_as in s.bgp.neighbors:
        lines.append(
            f"{nbr_ip:<16}4{remote_as:>13}     100     100        3    0    0 01:00:00        1"
        )
    if not s.bgp.neighbors:
        lines.append("(no BGP neighbors configured — use: neighbor <ip> remote-as <asn>)")
    return "\n".join(lines)


def _show_nat_translations(s: DeviceState) -> str:
    HDR = "Pro Inside global          Inside local           Outside local          Outside global"
    lines = [HDR]

    for rule in s.nat_rules:
        if rule.kind == "static":
            lines.append(
                f"--- {rule.inside_global:<27}{rule.inside_local:<23}---                    ---"
            )
        elif rule.kind == "overload":
            outside_ip = (s.ifaces.get(rule.interface, IfaceState(name="")).ip
                          or "203.0.113.1")
            lines += [
                f"tcp {outside_ip}:1025        {' ':>20}10.0.1.10:1025         8.8.8.8:443            8.8.8.8:443",
                f"udp {outside_ip}:1026        {' ':>20}10.0.1.11:53           8.8.4.4:53             8.8.4.4:53",
            ]

    if not s.nat_rules:
        lines.append(
            "--- ---                    ---                    ---                    ---"
            "\n(no NAT translations — configure NAT inside/outside and translation rules)"
        )
    return "\n".join(lines)


def _show_nat_statistics(s: DeviceState) -> str:
    inside_ifs  = [n for n, i in s.ifaces.items() if i.nat == "inside"]
    outside_ifs = [n for n, i in s.ifaces.items() if i.nat == "outside"]
    hits = len(s.nat_rules) * 12
    return (
        f"Total active translations: {len(s.nat_rules) * 2} (0 static, {len(s.nat_rules) * 2} dynamic; {len(s.nat_rules)} extended)\n"
        f"Peak translations: {hits}, occurred 00:01:00 ago\n"
        f"Outside interfaces:\n"
        + ("\n".join(f"  {n}" for n in outside_ifs) or "  (none)") + "\n"
        + "Inside interfaces:\n"
        + ("\n".join(f"  {n}" for n in inside_ifs) or "  (none)") + "\n"
        + f"Hits: {hits}  Misses: 0\n"
        + "CEF Translated packets: 0, CEF Punted packets: 0\n"
        + "Expired translations: 0\n"
        + "Dynamic mappings:\n"
        + ("\n".join(
            f"-- Inside Source\n"
            f"[Id: 1] access-list {r.acl} interface {r.interface} overload\n"
            f" refcount 2"
            for r in s.nat_rules if r.kind == "overload"
          ) or " (none)")
    )


def _show_dhcp_binding(s: DeviceState) -> str:
    HDR  = (
        "Bindings from all pools not associated with VRF:\n"
        f"{'IP address':<17}{'Client-ID/':<24}{'Lease expiration':<24}{'Type':<12}State      Interface\n"
        f"{'':<17}{'Hardware address/':<24}\n"
        f"{'':<17}{'User name'}"
    )
    if not s.dhcp_pools:
        return HDR + "\n(no DHCP pools configured — use: ip dhcp pool <name>)"

    lines = [HDR]
    for pool in s.dhcp_pools.values():
        if pool.network and pool.mask:
            parts = pool.network.split(".")
            for i in range(1, 3):
                parts_l    = parts[:]
                parts_l[-1] = str(int(parts_l[-1]) + 10 + i)
                lease_ip   = ".".join(parts_l)
                mac        = f"0100.5079.6668.{i:02x}"
                lines.append(
                    f"{lease_ip:<17}{mac:<24}{'Mar 28 2026 08:00 AM':<24}{'Automatic':<12}Active"
                )
    return "\n".join(lines)


def _show_dhcp_pool(s: DeviceState) -> str:
    if not s.dhcp_pools:
        return "% DHCP is not running.\n(no pools configured — use: ip dhcp pool <name>)"
    lines = []
    for pool in s.dhcp_pools.values():
        total = 2 ** _count_host_bits(pool.mask) - 2 if pool.mask else 0
        cidr  = _cidr(pool.mask) if pool.mask else 0
        last  = _last_in_subnet(pool.network, pool.mask) if pool.network and pool.mask else ""
        lines += [
            f"Pool {pool.name} :",
            f" Utilization mark (high/low)    : 100 / 0",
            f" Subnet size (first/next)       : 0 / 0",
            f" Total addresses                : {total}",
            f" Leased addresses               : 2",
            f" Excluded addresses             : 1",
            f" Pending event                  : none",
            f" 1 subnet is currently in the pool :",
            f" Current index        IP address range                    Leased/Excluded/Total",
        ]
        if pool.network:
            lines.append(
                f" {pool.network:<22}{pool.network}/{cidr} - {last:<20}2    / 1     / {total}"
            )
        if pool.default_router:
            lines.append(f" Default router list   : {pool.default_router}")
        if pool.dns_server:
            lines.append(f" DNS server list       : {pool.dns_server}")
        lines.append("")
    return "\n".join(lines)


def _show_hosts(s: DeviceState) -> str:
    lines = [
        "Default domain is " + (s.domain_name or "not set"),
        "Name/address lookup uses domain service",
        "Name servers are: " + (", ".join(s.name_servers) if s.name_servers else "255.255.255.255"),
        "",
        "Codes: UN - unknown, EX - expired, OK - OK, ?? - revalidate",
        "       temp - temporary, perm - permanent",
        "       NA - Not Applicable  None - Not defined",
        "",
        f"Host                      Flags      Age Type   Address(es)",
    ]
    for host, ip in sorted(s.host_table.items()):
        lines.append(f"{host:<26}perm       0    IP     {ip}")
    if not s.host_table and not s.name_servers:
        lines.append("(no static host entries)")
    return "\n".join(lines)


def _show_acls(s: DeviceState) -> str:
    if not s.acls:
        return "(no access lists configured)"
    lines = []
    for name, entries in sorted(s.acls.items()):
        is_num = name.isdigit()
        kind   = "Standard" if (is_num and int(name) <= 99) else "Extended"
        if is_num:
            lines.append(f"{kind} IP access list {name}")
        else:
            lines.append(f"Extended IP access list {name}")
        if not entries:
            lines.append("    (empty — add permit/deny statements)")
        else:
            for e in entries:
                lines.append(f"    {e.seq} {e.action} {e.rest} ({e.seq} matches)")
        lines.append("")
    return "\n".join(lines).rstrip()


def _show_ip_interface_detail(s: DeviceState, if_name: str) -> str:
    iface = None
    for name, i in s.ifaces.items():
        if (_short_if(name).lower() == if_name.lower()
                or name.lower() == if_name.lower()):
            iface = i
            break
    if not iface:
        return f"% {if_name}: no such interface — check 'show ip interface brief'"

    acl_in  = iface.acl_in  or "not set"
    acl_out = iface.acl_out or "not set"
    mask    = f"/{_cidr(iface.mask)}" if iface.mask else ""
    return (
        f"{iface.name} is {iface.status}, line protocol is {iface.protocol}\n"
        f"  Internet address is {iface.ip or 'not set'}{mask}\n"
        f"  Broadcast address is 255.255.255.255\n"
        f"  Address determined by setup command\n"
        f"  MTU is 1500 bytes\n"
        f"  Helper address is not set\n"
        f"  Directed broadcast forwarding is disabled\n"
        f"  Outgoing Common access list is not set\n"
        f"  Outgoing access list is {acl_out}\n"
        f"  Inbound  Common access list is not set\n"
        f"  Inbound  access list is {acl_in}\n"
        f"  Proxy ARP is enabled\n"
        f"  Local Proxy ARP is disabled\n"
        f"  Security level is default\n"
        f"  Split horizon is enabled\n"
        f"  ICMP redirects are always sent\n"
        f"  ICMP unreachables are always sent\n"
        f"  ICMP mask replies are never sent\n"
        f"  IP fast switching is enabled\n"
        f"  IP Flow switching is disabled\n"
        f"  IP CEF switching is enabled\n"
        f"  IP CEF switching turbo vector\n"
        f"  IP Null turbo vector\n"
        f"  IP multicast fast switching is enabled\n"
        f"  Router Discovery is disabled\n"
        f"  IP output packet accounting is disabled\n"
        f"  IP access violation accounting is disabled\n"
        f"  TCP/IP header compression is disabled\n"
        f"  RTP/IP header compression is disabled\n"
        f"  Probe proxy name replies are disabled\n"
        f"  Policy routing is disabled\n"
        f"  Network address translation is {iface.nat or 'disabled'}\n"
        f"  BGP Policy Mapping is disabled\n"
        f"  Input features: MCI Check\n"
        f"  IPv4 WCCP Redirect outbound is disabled\n"
        f"  IPv4 WCCP Redirect inbound is disabled\n"
        f"  IPv4 WCCP Redirect exclude is disabled"
    )


def _show_tunnel(s: DeviceState, tun_num: int) -> str:
    key = f"Tunnel{tun_num}"
    iface = s.ifaces.get(key)
    if not iface:
        return f"% Tunnel{tun_num} not configured"
    src  = getattr(s, '_tunnel_source', {}).get(tun_num, "not set")
    dst  = getattr(s, '_tunnel_dest',   {}).get(tun_num, "not set")
    mode = getattr(s, '_tunnel_mode',   {}).get(tun_num, "gre ip")
    return (
        f"Tunnel{tun_num} is {iface.status}, line protocol is {iface.protocol}\n"
        f"  Hardware is Tunnel\n"
        + (f"  Internet address is {iface.ip}/{_cidr(iface.mask)}\n" if iface.ip else "") +
        f"  MTU 17916 bytes, BW 100 Kbit/sec, DLY 50000 usec,\n"
        f"     reliability 255/255, txload 1/255, rxload 1/255\n"
        f"  Encapsulation {mode.upper()}, loopback not set\n"
        f"  Keepalive not set\n"
        f"  Tunnel linestate evaluation up\n"
        f"  Tunnel source {src}, destination {dst}\n"
        f"  Tunnel Subblocks:\n"
        f"      src-track:\n"
        f"         Tunnel{tun_num} source tracking subblock associated with 0\n"
        f"  Tunnel protocol/transport GRE/IP\n"
        f"    Key disabled, sequencing disabled\n"
        f"    Checksumming of packets disabled\n"
        f"  Tunnel TTL 255, Fast tunneling enabled\n"
        f"  Tunnel transport MTU 1476 bytes\n"
        f"  Tunnel transmit bandwidth 8000 (kbps)\n"
        f"  Tunnel receive  bandwidth 8000 (kbps)\n"
        f"  Last input never, output never, output hang never"
    )


def _show_ipv6_brief(s: DeviceState) -> str:
    lines = []
    for name, iface in sorted(s.ifaces.items()):
        stat = f"[{iface.status}/{iface.protocol}]"
        lines.append(f"{name:<30}{stat}")
        if iface.ipv6:
            lines.append(f"    {iface.ipv6}")
        # Always show link-local
        ll_suffix = f"{abs(hash(name)) % 0xFFFF:04x}"
        lines.append(f"    FE80::{ll_suffix}")
    if not s.ifaces:
        return "(no interfaces configured)"
    return "\n".join(lines)


def _show_ip_ssh(s: DeviceState) -> str:
    if not s.ssh_enabled:
        return (
            "SSH Disabled - version 2.0\n"
            "Please create RSA keys (of at least 768 bits size) to enable SSH v2.\n"
            "(Hint: crypto key generate rsa modulus 2048)"
        )
    return (
        "SSH Enabled - version 2.0\n"
        "Authentication methods: publickey,keyboard-interactive,password\n"
        "Authentication Publickey Algorithms:x509v3-ssh-rsa,ecdsa-sha2-nistp256,\n"
        "                                    ecdsa-sha2-nistp384,ecdsa-sha2-nistp521,\n"
        "                                    rsa-sha2-256,rsa-sha2-512,ssh-rsa,ssh-dss\n"
        "Hostkey Algorithms:rsa-sha2-512,rsa-sha2-256,ssh-rsa\n"
        "Encryption Algorithms:aes128-ctr,aes192-ctr,aes256-ctr\n"
        "MAC Algorithms:hmac-sha2-256,hmac-sha2-512,hmac-sha1\n"
        "KEX Algorithms:diffie-hellman-group-exchange-sha256\n"
        "Authentication timeout: 120 secs; Authentication retries: 3\n"
        "Minimum expected Diffie Hellman key size : 2048 bits\n"
        f"IOS Keys in SECSH format(ssh-rsa, base64 encoded): {s.hostname or 'Router'}\n"
        "  ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAgQCnVUoQN7tZ3DcK"
    )


def _show_mpls_forwarding(s: DeviceState) -> str:
    if not s.mpls_interfaces:
        return (
            "Local      Outgoing   Prefix           Bytes Label   Outgoing   Next Hop\n"
            "Label      Label      or Tunnel Id     Switched      interface\n"
            "(MPLS not enabled on any interface — use: mpls ip on each interface)"
        )
    lines = [
        "Local      Outgoing   Prefix           Bytes Label   Outgoing   Next Hop",
        "Label      Label      or Tunnel Id     Switched      interface",
    ]
    label = 16
    for name in sorted(s.mpls_interfaces):
        iface = s.ifaces.get(name)
        if iface and iface.ip:
            net  = _network_addr(iface.ip, iface.mask)
            cidr = _cidr(iface.mask)
            lines.append(
                f"{label:<11}{'Pop Label':<11}{net}/{cidr:<17}{'0':<14}{_short_if(name):<11}point2point"
            )
            label += 1
    return "\n".join(lines)


def _show_mpls_ldp(s: DeviceState) -> str:
    if not s.mpls_interfaces:
        return "% LDP is not enabled\n(enable MPLS with: mpls ip on each interface)"
    lines = [
        "    Peer LDP Ident: 2.2.2.2:0; Local LDP Ident 1.1.1.1:0",
        "        TCP connection: 2.2.2.2.646 - 1.1.1.1.37416",
        "        State: Oper; Msgs sent/rcvd: 20/20; Downstream",
        "        Up time: 00:05:00",
        "        LDP discovery sources:",
        "          GigabitEthernet0/0, Src IP addr: 10.0.0.2",
        "        Addresses bound to peer LDP Ident:",
        "          10.0.0.2        10.0.1.2",
    ]
    return "\n".join(lines)


def _show_crypto_isakmp(s: DeviceState) -> str:
    lines = ["IPv4 Crypto ISAKMP SA",
             "dst             src             state          conn-id status"]
    if not s.ifaces:
        lines.append("(no ISAKMP SAs — configure crypto map and apply to interface)")
    else:
        # Show simulated SA if crypto configured
        outside = next((i.ip for i in s.ifaces.values() if i.nat == "outside"), None)
        if outside:
            lines.append(f"{outside:<16}198.51.100.1    QM_IDLE           1001 ACTIVE")
        else:
            lines.append("(no active ISAKMP SAs)")
    return "\n".join(lines)


def _show_zones(s: DeviceState) -> str:
    if not s.zones:
        return "% No security zones configured\n(use: zone security <name>)"
    lines = []
    for zname, ifaces in sorted(s.zones.items()):
        lines += [
            f"  Security Zone Name: {zname}",
            f"    Number of interfaces in this zone: {len(ifaces)}",
        ]
        for i in ifaces:
            lines.append(f"      Zone Member: {i}")
        lines.append("")
    return "\n".join(lines)


def _show_zone_pairs(s: DeviceState) -> str:
    if not s.zone_pairs:
        return "% No zone-pairs configured\n(use: zone-pair security <name> source <z> destination <z>)"
    lines = []
    for zp_name, zp in s.zone_pairs.items():
        policy = zp.policy or "(none)"
        lines += [
            f"Zone-pair name {zp_name}",
            f"    Source-Zone {zp.src_zone}  Destination-Zone {zp.dst_zone}",
            f"    service-policy inspect {policy}",
            "",
        ]
    return "\n".join(lines)


def _show_dot11(s: DeviceState) -> str:
    lines = [
        "SSID              [BSSID]                   IP address  Device  Name",
        "                  [ETH-ADDR]",
    ]
    if not s.wlan_ssids:
        lines.append("(no WLAN SSIDs configured — use: dot11 ssid <name>)")
    else:
        for ssid in s.wlan_ssids:
            lines.append(f"{ssid:<18}[aabb.cc00.0001]            10.0.0.100  Client  wlan-client-1")
    return "\n".join(lines)


def _show_vlans_subif(s: DeviceState) -> str:
    lines = []
    for name, iface in sorted(s.ifaces.items()):
        if "." in name and iface.vlan_id:
            lines += [
                f"Virtual LAN ID:  {iface.vlan_id} (IEEE 802.1Q Encapsulation)",
                f"   vLAN Trunk Interface:   {name}",
                f"   Protocols Configured:   Address:        Received:       Transmitted:",
                f"          {'IP':<16}{(iface.ip or 'unassigned'):<16}{'0':<16}{'0'}",
                "",
            ]
    if not lines:
        return "(no 802.1Q subinterfaces configured — use: interface Gi0/0.<vlan>)"
    return "\n".join(lines)


def _show_running_config(s: DeviceState) -> str:
    """Generate a realistic show running-config output from device state."""
    lines = [
        "Building configuration...",
        "",
        "Current configuration : 1024 bytes",
        "!",
        "! Last configuration change at 08:00:00 UTC Fri Mar 28 2026",
        "!",
        "version 15.7",
        "service timestamps debug datetime msec",
        "service timestamps log datetime msec",
        "no service password-encryption",
        "!",
        f"hostname {s.hostname or 'Router'}",
        "!",
        "boot-start-marker",
        "boot-end-marker",
        "!",
    ]

    # Usernames
    for user, pw in getattr(s, '_usernames', {}).items():
        lines.append(f"username {user} privilege 15 secret 5 $1$XXXX$fakehash")
    if hasattr(s, '_usernames') and s._usernames:
        lines.append("!")

    # Domain name (global)
    if s.domain_name:
        lines.append(f"ip domain-name {s.domain_name}")
        lines.append("!")

    # Interfaces
    lines.append("!")
    for name, iface in sorted(s.ifaces.items()):
        lines.append(f"interface {name}")
        if iface.description:
            lines.append(f" description {iface.description}")
        if iface.ip:
            lines.append(f" ip address {iface.ip} {iface.mask or '255.255.255.0'}")
        else:
            lines.append(" no ip address")
        if iface.ipv6:
            lines.append(f" ipv6 address {iface.ipv6}")
        if iface.vlan_id and "." not in name:
            lines.append(f" encapsulation dot1Q {iface.vlan_id}")
        if iface.mode == "access":
            vid = iface.access_vlan or 1
            lines.append(" switchport mode access")
            lines.append(f" switchport access vlan {vid}")
        elif iface.mode == "trunk":
            lines.append(" switchport trunk encapsulation dot1q")
            lines.append(" switchport mode trunk")
        if iface.portfast:
            lines.append(" spanning-tree portfast")
        if iface.bpduguard:
            lines.append(" spanning-tree bpduguard enable")
        if iface.acl_in:
            lines.append(f" ip access-group {iface.acl_in} in")
        if iface.acl_out:
            lines.append(f" ip access-group {iface.acl_out} out")
        if iface.nat:
            lines.append(f" ip nat {iface.nat}")
        if iface.zone:
            lines.append(f" zone-member security {iface.zone}")
        if iface.channel_group:
            lines.append(f" channel-group {iface.channel_group} mode active")
        if iface.mpls:
            lines.append(" mpls ip")
        if iface.status == "administratively down":
            lines.append(" shutdown")
        else:
            lines.append(" no shutdown")
        lines.append("!")

    # IP routing
    if s.ip_routing:
        lines.append("ip routing")
        lines.append("!")

    # Static routes
    for net, mask, nh in getattr(s, '_static_routes', []):
        lines.append(f"ip route {net} {mask} {nh}")
    if getattr(s, '_static_routes', []):
        lines.append("!")

    # DHCP exclusions + pools
    for pool in s.dhcp_pools.values():
        if pool.network:
            excl_end = ".".join(pool.network.split(".")[:-1] + [str(int(pool.network.split(".")[-1]) + 9)])
            lines.append(f"ip dhcp excluded-address {pool.network} {excl_end}")
    for pool in s.dhcp_pools.values():
        lines.append(f"ip dhcp pool {pool.name}")
        if pool.network:
            lines.append(f" network {pool.network} {pool.mask or '255.255.255.0'}")
        if pool.default_router:
            lines.append(f" default-router {pool.default_router}")
        if pool.dns_server:
            lines.append(f" dns-server {pool.dns_server}")
        lines.append("!")

    # NAT
    for rule in s.nat_rules:
        if rule.kind == "overload":
            lines.append(f"ip nat inside source list {rule.acl} interface {rule.interface} overload")
    if s.nat_rules:
        lines.append("!")

    # ACLs
    for aname, entries in sorted(s.acls.items()):
        is_num = aname.isdigit()
        kind   = "standard" if (is_num and int(aname) <= 99) else "extended"
        if is_num:
            for e in entries:
                lines.append(f"access-list {aname} {e.action} {e.rest}")
        else:
            lines.append(f"ip access-list {kind} {aname}")
            for e in entries:
                lines.append(f" {e.seq} {e.action} {e.rest}")
    if s.acls:
        lines.append("!")

    # OSPF
    for pid, proc in s.ospf.items():
        lines.append(f"router ospf {pid}")
        if proc.router_id:
            lines.append(f" router-id {proc.router_id}")
        for net in proc.networks:
            lines.append(f" network {net.network} {net.wildcard} area {net.area}")
        lines.append("!")

    # BGP
    if s.bgp:
        lines.append(f"router bgp {s.bgp.asn}")
        lines.append(" bgp log-neighbor-changes")
        for nbr_ip, remote_as in s.bgp.neighbors:
            lines.append(f" neighbor {nbr_ip} remote-as {remote_as}")
        for net, mask in s.bgp.prefixes:
            lines.append(f" network {net} mask {mask}")
        lines.append("!")

    # VLANs
    for vid, v in sorted(s.vlans.items()):
        if vid == 1:
            continue
        lines.append(f"vlan {vid}")
        if v.name and v.name != f"VLAN{vid:04d}":
            lines.append(f" name {v.name}")
        lines.append("!")

    # SSH / Line config
    if s.ssh_enabled:
        if not s.domain_name:
            lines += ["ip domain-name lab.local", "!"]
        lines += ["ip ssh version 2", "!"]
    lines += [
        "line con 0",
        " logging synchronous",
        "!",
        "line vty 0 4",
    ]
    if s.ssh_enabled:
        lines += [" transport input ssh", " login local"]
    else:
        lines += [" transport input none"]
    lines += ["!", "end"]

    return "\n".join(lines)


def _get_access_ports(s: DeviceState) -> list:
    return [_short_if(n) for n, i in s.ifaces.items()
            if i.mode == "access" or (not i.mode and not i.ip)]
    # ── Interface / interface range — track current interface ────
    m = re.match(r"interface(?:\s+range)?\s+(.+)", cmd, re.I)
    if m and current_mode in ("config", "config-if"):
        raw = m.group(1).strip()
        names = _expand_iface_range(raw)
        state._current_iface       = names[0]
        state._current_iface_range = names
        for n in names:
            state.ifaces.setdefault(n, IfaceState(name=n))
        return

