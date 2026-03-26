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
    src: str
    dst: str
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
            return

        # spanning-tree vlan <id> priority <val>
        m = re.match(r"spanning-tree\s+vlan\s+(\d+)\s+priority\s+(\d+)", low)
        if m:
            state.stp_priority[int(m.group(1))] = int(m.group(2))
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
        # Determine which interface we're in via the scope key's context
        # We rely on the most recently entered interface command stored in state
        iface_name = getattr(state, '_current_iface', None)
        if not iface_name:
            return

        iface = state.ifaces.setdefault(iface_name, IfaceState(name=iface_name))

        # ip address <ip> <mask>
        m = re.match(r"ip\s+address\s+(\S+)\s+(\S+)", cmd, re.I)
        if m:
            iface.ip = m.group(1)
            iface.mask = m.group(2)
            iface.status = "up"
            iface.protocol = "up"
            # Auto-enable routing on L3 switches when SVIs are configured
            if iface_name.lower().startswith("vlan") or iface_name.lower().startswith("vl"):
                state.ip_routing = True
            return

        # ipv6 address
        m = re.match(r"ipv6\s+address\s+(\S+)", cmd, re.I)
        if m:
            addr = m.group(1)
            if addr not in iface.ipv6:
                iface.ipv6.append(addr)
            iface.status = "up"
            iface.protocol = "up"
            return

        # no shutdown
        if re.match(r"no\s+shutdown", low):
            iface.status = "up"
            iface.protocol = "up"
            return

        # shutdown
        if low == "shutdown":
            iface.status = "administratively down"
            iface.protocol = "down"
            return

        # switchport mode access/trunk
        m = re.match(r"switchport\s+mode\s+(access|trunk)", low)
        if m:
            iface.mode = m.group(1)
            return

        # switchport access vlan <id>
        m = re.match(r"switchport\s+access\s+vlan\s+(\d+)", low)
        if m:
            iface.access_vlan = int(m.group(1))
            vid = int(m.group(1))
            if vid not in state.vlans:
                state.vlans[vid] = VlanEntry(vid=vid, name=f"VLAN{vid:04d}")
            if _short_if(iface_name) not in state.vlans[vid].ports:
                state.vlans[vid].ports.append(_short_if(iface_name))
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
            iface.nat = m.group(1)
            return

        # mpls ip
        if low == "mpls ip":
            iface.mpls = True
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
            iface.portfast = True
            return

        # spanning-tree bpduguard enable
        if re.match(r"spanning-tree\s+bpduguard\s+enable", low):
            iface.bpduguard = True
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
    if m and current_mode in ("config",):
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
    cmd = command.strip().lower()

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

    return None  # not handled — caller uses canned output


# ── Show output formatters ─────────────────────────────────────

def _show_ip_int_brief(s: DeviceState) -> str:
    header = f"{'Interface':<30} {'IP-Address':<16} {'OK?':<5} {'Method':<8} {'Status':<22} Protocol"
    lines = [header]

    if not s.ifaces:
        lines.append("(no interfaces configured)")
        return "\n".join(lines)

    for name, iface in sorted(s.ifaces.items()):
        ip    = iface.ip or "unassigned"
        ok    = "YES" if iface.ip else "YES"
        meth  = "manual" if iface.ip else "unset"
        stat  = iface.status
        proto = iface.protocol
        lines.append(f"{_pad(name,30)} {_pad(ip,16)} {_pad(ok,5)} {_pad(meth,8)} {_pad(stat,22)} {proto}")

    return "\n".join(lines)


def _show_ip_route(s: DeviceState) -> str:
    lines = ["Codes: C - connected, S - static, O - OSPF, B - BGP, L - local"]

    has_default = False
    static = getattr(s, '_static_routes', [])
    for net, mask, nh in static:
        if net == "0.0.0.0":
            has_default = True

    if has_default:
        nh = next((r[2] for r in static if r[0] == "0.0.0.0"), "")
        lines.append(f"Gateway of last resort is {nh} to network 0.0.0.0\n")
    else:
        lines.append("Gateway of last resort is not set\n")

    # Connected routes from interfaces
    for name, iface in sorted(s.ifaces.items()):
        if iface.ip and iface.status == "up":
            net = _network_addr(iface.ip, iface.mask)
            cidr = _cidr(iface.mask)
            lines.append(f"C        {net}/{cidr} is directly connected, {name}")
            lines.append(f"L        {iface.ip}/{cidr} is directly connected, {name}")

    # Static routes
    for net, mask, nh in static:
        if net == "0.0.0.0":
            lines.append(f"S*   0.0.0.0/0 [1/0] via {nh}")
        else:
            cidr = _cidr(mask)
            lines.append(f"S        {net}/{cidr} [1/0] via {nh}")

    # OSPF routes (simulated neighbors based on configured networks)
    for pid, proc in s.ospf.items():
        for ospf_net in proc.networks:
            # Show OSPF-learned routes for adjacent networks
            lines.append(f"O        {ospf_net.network} is variably subnetted")

    if len(lines) <= 2:
        lines.append("(routing table empty — configure interfaces and routes)")

    return "\n".join(lines)


def _show_vlan_brief(s: DeviceState) -> str:
    header = f"{'VLAN':<5} {'Name':<33} {'Status':<9} Ports"
    sep    = f"{'----':<5} {'-'*32:<33} {'-------':<9} ------"
    lines  = [header, sep]

    # Always show VLAN 1
    vlan1  = s.vlans.get(1, VlanEntry(vid=1, name="default"))
    if vlan1.name == "VLAN0001":
        vlan1.name = "default"

    # Collect ports not yet in a specific VLAN
    all_assigned = set()
    for vid, v in s.vlans.items():
        if vid != 1:
            for p in v.ports:
                all_assigned.add(p)

    default_ports = [p for p in _get_access_ports(s) if p not in all_assigned]
    lines.append(f"{1:<5} {_pad('default',33)} {_pad('active',9)} {', '.join(default_ports[:6])}")

    for vid, v in sorted(s.vlans.items()):
        if vid == 1:
            continue
        ports_str = ", ".join(v.ports[:6])
        lines.append(f"{vid:<5} {_pad(v.name,33)} {_pad(v.status,9)} {ports_str}")

    # Standard reserved VLANs
    for vid, name in [(1002,"fddi-default"),(1003,"token-ring-default"),(1004,"fddinet-default"),(1005,"trnet-default")]:
        lines.append(f"{vid:<5} {_pad(name,33)} act/unsup")

    return "\n".join(lines)


def _get_access_ports(s: DeviceState) -> list:
    ports = []
    for name, iface in s.ifaces.items():
        if iface.mode == "access" or (not iface.mode and not iface.ip):
            ports.append(_short_if(name))
    return ports


def _show_spanning_tree(s: DeviceState) -> str:
    lines = []
    vlans = sorted(s.vlans.keys()) if s.vlans else [1]
    if not vlans:
        vlans = [1]

    default_pri = 32768

    for vid in vlans:
        pri = s.stp_priority.get(vid, default_pri + vid)
        is_root = pri < default_pri
        lines.append(f"VLAN{vid:04d}")
        lines.append(f"  Spanning tree enabled protocol ieee")
        lines.append(f"  Root ID    Priority    {pri}")
        lines.append(f"             Address     aabb.cc00.0100")
        if is_root:
            lines.append(f"             This bridge is the root")
        lines.append(f"  Bridge ID  Priority    {pri}  (priority {pri - vid} sys-id-ext {vid})")
        lines.append(f"             Address     aabb.cc00.0100")
        lines.append("")

        lines.append(f"Interface           Role Sts Cost      Prio.Nbr Type")
        lines.append(f"------------------- ---- --- --------- -------- ----")

        for name, iface in s.ifaces.items():
            if iface.mode == "trunk" or iface.mode == "access":
                role = "Desg" if is_root else "Root"
                sts  = "FWD"
                pf   = " P2p Edge" if iface.portfast else " P2p"
                lines.append(f"{_pad(_short_if(name),20)}{role} {sts}  19        128.1   {pf}")

        lines.append("")

    return "\n".join(lines)


def _show_etherchannel(s: DeviceState) -> str:
    if not s.po_members:
        return (
            "Flags:  D - down        P - bundled in port-channel\n"
            "        I - stand-alone s - suspended\n"
            "Number of channel-groups in use: 0\n"
            "Group  Port-channel  Protocol    Ports\n"
            "------+-------------+-----------+-------\n"
            "(none configured)"
        )

    lines = [
        "Flags:  D - down        P - bundled in port-channel",
        "        I - stand-alone s - suspended",
        f"Number of channel-groups in use: {len(s.po_members)}",
        "Group  Port-channel  Protocol    Ports",
        "------+-------------+-----------+-------",
    ]

    for po_num, members in sorted(s.po_members.items()):
        ports_str = "    ".join(f"{_short_if(m)}(P)" for m in members)
        lines.append(f"{po_num:<6} Po{po_num}(SU)         LACP      {ports_str}")

    return "\n".join(lines)


def _show_ospf_neighbor(s: DeviceState) -> str:
    header = "Neighbor ID     Pri   State           Dead Time   Address         Interface"
    lines  = [header]

    if not s.ospf:
        lines.append("(no OSPF neighbors — configure OSPF first)")
        return "\n".join(lines)

    # Simulate neighbors based on configured networks
    nbr_count = 0
    for pid, proc in s.ospf.items():
        for i, net in enumerate(proc.networks):
            # Derive a plausible neighbor IP from the network
            parts = net.network.split(".")
            if len(parts) == 4:
                parts[-1] = str(int(parts[-1]) + 2)
                nbr_ip = ".".join(parts)
                nbr_id = f"{i+2}.{i+2}.{i+2}.{i+2}"
                lines.append(
                    f"{_pad(nbr_id,16)}{1:<6}{'FULL/DR':<16}  00:00:3{i}    "
                    f"{_pad(nbr_ip,16)}GigabitEthernet0/{i}"
                )
                nbr_count += 1

    if nbr_count == 0:
        lines.append("(no adjacencies formed yet)")

    return "\n".join(lines)


def _show_ip_bgp(s: DeviceState) -> str:
    if not s.bgp:
        return "% BGP not configured"

    lines = [
        f"BGP table version is 1, local router ID is {s.bgp.asn}.{s.bgp.asn}.{s.bgp.asn}.{s.bgp.asn}",
        f"Status codes: s suppressed, d damped, h history, * valid, > best",
        f"   Network          Next Hop            Metric LocPrf Weight Path",
    ]

    for net, mask in s.bgp.prefixes:
        cidr = _cidr(mask)
        lines.append(f"*> {net}/{cidr}       0.0.0.0                  0         32768 i")

    for nbr_ip, remote_as in s.bgp.neighbors:
        lines.append(f"*> 0.0.0.0/0          {_pad(nbr_ip,20)}               0 {remote_as} i")

    if not s.bgp.prefixes and not s.bgp.neighbors:
        lines.append("(no BGP entries)")

    return "\n".join(lines)


def _show_bgp_summary(s: DeviceState) -> str:
    if not s.bgp:
        return "% BGP not configured"

    lines = [
        f"BGP router identifier {s.bgp.asn}.{s.bgp.asn}.{s.bgp.asn}.{s.bgp.asn}, local AS number {s.bgp.asn}",
        "BGP table version is 1",
        f"Neighbor        V    AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd",
    ]

    for nbr_ip, remote_as in s.bgp.neighbors:
        lines.append(f"{_pad(nbr_ip,16)}4 {remote_as:<6}      10      10        1    0    0 00:05:00        1")

    if not s.bgp.neighbors:
        lines.append("(no BGP neighbors configured)")

    return "\n".join(lines)


def _show_nat_translations(s: DeviceState) -> str:
    header = "Pro  Inside global          Inside local           Outside local          Outside global"
    lines  = [header]

    inside_if  = next((n for n, i in s.ifaces.items() if i.nat == "inside"), None)
    outside_if = next((n for n, i in s.ifaces.items() if i.nat == "outside"), None)

    for rule in s.nat_rules:
        if rule.kind == "static":
            lines.append(f"---  {_pad(rule.inside_global,22)}{_pad(rule.inside_local,23)}---                    ---")
        elif rule.kind == "overload":
            outside_ip = s.ifaces.get(rule.interface, IfaceState(name="")).ip or "203.0.113.1"
            # Simulate some dynamic entries
            lines.append(f"tcp  {outside_ip}:1024         10.0.1.10:80           8.8.8.8:443            8.8.8.8:443")
            lines.append(f"udp  {outside_ip}:1025         10.0.1.11:53           8.8.4.4:53             8.8.4.4:53")

    if not s.nat_rules:
        lines.append("(no NAT translations — configure NAT rules first)")

    return "\n".join(lines)


def _show_nat_statistics(s: DeviceState) -> str:
    inside_ifs  = [n for n, i in s.ifaces.items() if i.nat == "inside"]
    outside_ifs = [n for n, i in s.ifaces.items() if i.nat == "outside"]

    return (
        f"Total active translations: {len(s.nat_rules) * 2}\n"
        f"Peak translations: {len(s.nat_rules) * 3}\n"
        f"Outside interfaces:\n"
        + "\n".join(f"  {n}" for n in outside_ifs) + "\n"
        + "Inside interfaces:\n"
        + "\n".join(f"  {n}" for n in inside_ifs)
    )


def _show_dhcp_binding(s: DeviceState) -> str:
    if not s.dhcp_pools:
        return (
            "Bindings from all pools not associated with VRF:\n"
            "IP address       Client-ID              Lease expiration        Type\n"
            "(no DHCP pools configured)"
        )

    lines = [
        "Bindings from all pools not associated with VRF:",
        "IP address       Client-ID/              Lease expiration        Type",
        "                 Hardware address/",
        "                 User name",
    ]

    for pool in s.dhcp_pools.values():
        if pool.network and pool.mask:
            # Generate a couple of simulated leases
            parts = pool.network.split(".")
            for i in range(1, 3):
                parts[-1] = str(int(parts[-1]) + 10 + i)
                lease_ip = ".".join(parts)
                mac = f"0100.5079.6668.{i:02x}"
                lines.append(f"{_pad(lease_ip,17)}{_pad(mac,23)} Mar 26 2026 08:00 AM    Automatic")

    return "\n".join(lines)


def _show_dhcp_pool(s: DeviceState) -> str:
    if not s.dhcp_pools:
        return "(no DHCP pools configured)"

    lines = []
    for pool in s.dhcp_pools.values():
        lines.append(f"Pool {pool.name} :")
        lines.append(f" Utilization mark (high/low)    : 100 / 0")
        if pool.network:
            lines.append(f" Subnet size (first/next)       : 0 / 0")
            lines.append(f" Total addresses                : {2**(_count_host_bits(pool.mask))}")
            lines.append(f" Leased addresses               : 2")
            lines.append(f" Pending event                  : none")
            lines.append(f" 1 subnet is currently in the pool :")
            cidr = _cidr(pool.mask)
            lines.append(f" Current index        IP address range                    Leased addresses")
            lines.append(f" {pool.network.ljust(22)}{pool.network}/{cidr} - {_last_in_subnet(pool.network, pool.mask):<20}2")
        if pool.default_router:
            lines.append(f" Default router list    : {pool.default_router}")
        if pool.dns_server:
            lines.append(f" DNS server list        : {pool.dns_server}")
        lines.append("")

    return "\n".join(lines)


def _count_host_bits(mask: str) -> int:
    return 32 - _cidr(mask)

def _last_in_subnet(network: str, mask: str) -> str:
    try:
        parts = list(map(int, network.split('.')))
        mask_parts = list(map(int, mask.split('.')))
        last = [parts[i] | (~mask_parts[i] & 0xFF) for i in range(4)]
        last[-1] -= 1  # exclude broadcast
        return '.'.join(map(str, last))
    except Exception:
        return network


def _show_hosts(s: DeviceState) -> str:
    lines = [
        "Default domain is " + (s.domain_name or "(not set)"),
        "Name/address lookup uses domain service",
        "Name servers are: " + (", ".join(s.name_servers) or "(none)"),
        "",
        "Codes: UN - unknown, EX - expired, OK - OK, ?? - revalidate",
        "       temp - temporary, perm - permanent",
        "       NA - Not Applicable  None - Not defined",
        "",
        f"{'Host':<24} {'Flags':<8} {'Age':<5} {'Type':<5} Address(es)",
    ]

    for host, ip in s.host_table.items():
        lines.append(f"{_pad(host,24)} perm     0     IP    {ip}")

    if not s.host_table and not s.name_servers:
        lines.append("(no host entries)")

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
            lines.append("    (empty)")
        else:
            for e in entries:
                lines.append(f"    {e.seq} {e.action} {e.rest} (0 matches)")
        lines.append("")

    return "\n".join(lines)


def _show_ip_interface_detail(s: DeviceState, if_name: str) -> str:
    # Find matching interface
    iface = None
    for name, i in s.ifaces.items():
        if _short_if(name).lower() == if_name.lower() or name.lower() == if_name.lower():
            iface = i
            break
    if not iface:
        return f"% {if_name} not found or not configured"

    acl_in  = f"  Inbound  access list is {iface.acl_in}" if iface.acl_in else "  Inbound  access list is not set"
    acl_out = f"  Outbound access list is {iface.acl_out}" if iface.acl_out else "  Outbound access list is not set"

    return (
        f"{iface.name} is {iface.status}, line protocol is {iface.protocol}\n"
        f"  Internet address is {iface.ip}/{_cidr(iface.mask)}\n"
        f"  Broadcast address is 255.255.255.255\n"
        f"  MTU is 1500 bytes\n"
        f"{acl_in}\n"
        f"{acl_out}\n"
        f"  Proxy ARP is enabled\n"
        f"  NAT: {iface.nat or 'disabled'}"
    )


def _show_tunnel(s: DeviceState, tun_num: int) -> str:
    tun_name_variants = [f"Tunnel{tun_num}", f"tunnel{tun_num}"]
    iface = None
    for name, i in s.ifaces.items():
        if any(name.lower().startswith(v.lower()) for v in ["tunnel"]):
            if re.search(rf"tunnel\s*{tun_num}$", name, re.I):
                iface = i
                break
        if name.lower() == f"tunnel{tun_num}":
            iface = i
            break

    if not iface:
        return f"% Tunnel{tun_num} not configured"

    ip_str = f"{iface.ip}/{_cidr(iface.mask)}" if iface.ip else "unassigned"
    src    = iface.tun_src or "(not set)"
    dst    = iface.tun_dst or "(not set)"
    mode   = iface.tun_mode or "GRE/IP"

    return (
        f"Tunnel{tun_num} is {iface.status}, line protocol is {iface.protocol}\n"
        f"  Hardware is Tunnel\n"
        f"  Internet address is {ip_str}\n"
        f"  MTU 1476 bytes, BW 100 Kbit/sec, DLY 50000 usec\n"
        f"     reliability 255/255, txload 1/255, rxload 1/255\n"
        f"  Encapsulation {mode}\n"
        f"  Tunnel linestate evaluation up\n"
        f"  Tunnel source {src}, destination {dst}\n"
        f"  Tunnel protocol/transport {mode}"
    )


def _show_ipv6_brief(s: DeviceState) -> str:
    lines = []
    has_any = False
    for name, iface in sorted(s.ifaces.items()):
        if iface.ipv6:
            has_any = True
            status = f"[{iface.status[:2]}/{iface.protocol[:2]}]"
            lines.append(f"{name:<30} {status}")
            for addr in iface.ipv6:
                lines.append(f"    {addr}")
    if not has_any:
        lines.append("(no IPv6 addresses configured)")
    return "\n".join(lines)


def _show_ip_ssh(s: DeviceState) -> str:
    if s.ssh_enabled:
        domain = s.domain_name or "lab.local"
        return (
            f"SSH Enabled - version 2.0\n"
            f"Authentication timeout: 120 secs; Authentication retries: 3\n"
            f"Minimum expected Diffie Hellman key size : 2048 bits\n"
            f"IOS Keys in SECSH format(ssh-rsa, base64 encoded):\n"
            f"  ssh-rsa AAAAB3Nza...({domain})...AQAB"
        )
    return (
        "SSH Disabled - version 2.0\n"
        "Authentication timeout: 120 secs; Authentication retries: 3\n"
        "% Please create RSA keys (of at least 768 bits size) to enable SSH v2."
    )


def _show_mpls_forwarding(s: DeviceState) -> str:
    mpls_ifaces = [(n, i) for n, i in s.ifaces.items() if i.mpls]
    if not mpls_ifaces:
        return "(no MPLS-enabled interfaces — use 'mpls ip' under interface)"

    lines = [
        "Local      Outgoing   Prefix           Bytes Label   Outgoing",
        "Label      Label      or Tunnel Id     Switched      interface",
    ]
    for i, (name, iface) in enumerate(mpls_ifaces):
        label = 16 + i
        out   = 17 + i if i < len(mpls_ifaces) - 1 else "Pop Label"
        net   = _network_addr(iface.ip, iface.mask) + "/24" if iface.ip else "10.0.0.0/24"
        lines.append(f"{label:<11}{str(out):<11}{net:<17}0             {_short_if(name)}")

    return "\n".join(lines)


def _show_mpls_ldp(s: DeviceState) -> str:
    mpls_ifaces = [n for n, i in s.ifaces.items() if i.mpls]
    if not mpls_ifaces:
        return "(no LDP neighbors — enable MPLS on interfaces first)"

    lines = ["    Peer LDP Ident: 2.2.2.2:0; Local LDP Ident 1.1.1.1:0"]
    lines.append("        TCP connection: 2.2.2.2.646 - 1.1.1.1.49152")
    lines.append("        State: Oper; Msgs sent/rcvd: 14/13; Downstream")
    lines.append(f"        Up time: 00:05:00")
    lines.append(f"        LDP discovery sources:")
    for n in mpls_ifaces[:2]:
        lines.append(f"          {_short_if(n)}, Src IP addr: 10.0.0.2")
    lines.append("        Addresses bound to peer LDP Ident:")
    lines.append("          10.0.0.2    10.0.1.2")

    return "\n".join(lines)


def _show_crypto_isakmp(s: DeviceState) -> str:
    if not s.isakmp_policies:
        return "% No ISAKMP policies configured"

    lines = ["dst             src             state          conn-id status"]
    # Simulate an active SA if policies are configured
    lines.append("203.0.113.1     198.51.100.50   QM_IDLE           1001 ACTIVE")
    return "\n".join(lines)


def _show_zones(s: DeviceState) -> str:
    if not s.zones:
        return "(no security zones configured)"

    lines = []
    for name in s.zones:
        members = [_short_if(n) for n, i in s.ifaces.items() if i.zone == name]
        lines.append(f"  Security Zone Name: {name}")
        lines.append(f"  Number of interfaces in this zone: {len(members)}")
        for m in members:
            lines.append(f"    Interface: {m}")
        lines.append("")

    return "\n".join(lines)


def _show_zone_pairs(s: DeviceState) -> str:
    if not s.zone_pairs:
        return "(no zone-pairs configured)"

    lines = []
    for zp in s.zone_pairs:
        lines.append(f"Zone-pair name {zp.name}")
        lines.append(f"  Source-Zone {zp.src}  Destination-Zone {zp.dst}")
        lines.append(f"  service-policy inspect {zp.policy or '(none)'}")
        lines.append("")

    return "\n".join(lines)


def _show_dot11(s: DeviceState) -> str:
    if not s.ssids and not s.wlans:
        return "(no wireless SSIDs or WLANs configured)"

    lines = ["Association Table"]
    lines.append("-" * 60)
    if s.ssids:
        for ssid_name, info in s.ssids.items():
            lines.append(f"SSID: {ssid_name}   VLAN: {info.get('vlan','—')}")
    if s.wlans:
        for wid, w in s.wlans.items():
            enabled = "Enabled" if w.get("enabled") else "Disabled"
            lines.append(f"WLAN {wid}: {w.get('profile','')} ({enabled})  Security: {w.get('security','WPA2')}")
    return "\n".join(lines)


def _show_vlans_subif(s: DeviceState) -> str:
    """show vlans — for router-on-a-stick sub-interfaces"""
    subifs = {n: i for n, i in s.ifaces.items() if i.encap and "dot1Q" in i.encap}
    if not subifs:
        return "(no 802.1Q sub-interfaces configured)"

    lines = []
    for name, iface in sorted(subifs.items()):
        vid = re.search(r"dot1Q\s+(\d+)", iface.encap)
        vid = vid.group(1) if vid else "?"
        lines.append(f"Virtual LAN ID:  {vid} (IEEE 802.1Q Encapsulation)")
        lines.append(f"   vLAN Trunk Interface:   {name}")
        if iface.ip:
            lines.append(f"    Protocols Configured:   Address:        Received:       Transmitted:")
            lines.append(f"           IP              {iface.ip:<16}0               0")
        lines.append("")

    return "\n".join(lines)


def _show_route_summary(s: DeviceState) -> str:
    connected = sum(1 for i in s.ifaces.values() if i.ip and i.status == "up")
    static    = len(getattr(s, '_static_routes', []))
    ospf      = sum(len(p.networks) for p in s.ospf.values())
    bgp       = len(s.bgp.prefixes) if s.bgp else 0
    total     = connected * 2 + static + ospf + bgp

    return (
        f"IP routing table name is default (0x0)\n"
        f"IP routing table maximum-paths is 32\n"
        f"Route Source    Networks    Subnets     Replicates  Overhead  Memory (bytes)\n"
        f"connected       {connected:<12}{connected:<12}0           {connected*104}      {connected*104}\n"
        f"static          {static:<12}{static:<12}0           {static*104}        {static*104}\n"
        f"ospf 1          {ospf:<12}{ospf:<12}0           {ospf*104}        {ospf*104}\n"
        f"bgp             {bgp:<12}{bgp:<12}0           {bgp*104}          {bgp*104}\n"
        f"Total           {total:<12}{total:<12}0           {total*104}       {total*104}"
    )
