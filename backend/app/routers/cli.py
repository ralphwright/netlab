"""CLI simulation engine — validates commands and produces realistic IOS output."""

from __future__ import annotations
import re
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.routers.lab_state import parse_command, generate_show, reset_state
from app.routers.cmd_normalize import normalize, mode_ok

router = APIRouter()


# ── Pydantic models ──────────────────────────────────────────────

class CommandRequest(BaseModel):
    lab_slug: str
    device_name: str
    command: str = ""          # optional for reset-mode / validate-step endpoints
    step_number: Optional[int] = None
    user_id: Optional[str] = "student"


class CommandResponse(BaseModel):
    output: str
    is_valid: bool
    prompt: str
    step_completed: bool
    hint: Optional[str] = None
    normalized_command: Optional[str] = None   # canonical form for frontend matching
    current_mode: Optional[str] = None          # mode BEFORE this command executed


# ── Simulated IOS prompt state ───────────────────────────────────

DEVICE_MODES = {}  # "user_id:lab_slug:device_name" -> current mode string


def _mode_key(user_id: str, lab_slug: str, device_name: str) -> str:
    """Scoped key so state never bleeds between labs or users."""
    return f"{user_id or 'anon'}:{lab_slug or 'unknown'}:{device_name}"


def get_prompt(device_name: str, mode: str) -> str:
    # Quiz device gets a special prompt
    if device_name == "QUIZ":
        return "Answer>"

    prompts = {
        "user": f"{device_name}>",
        "privileged": f"{device_name}#",
        "config": f"{device_name}(config)#",
        "config-if": f"{device_name}(config-if)#",
        "config-router": f"{device_name}(config-router)#",
        "config-line": f"{device_name}(config-line)#",
        "config-vlan": f"{device_name}(config-vlan)#",
        "config-dhcp": f"{device_name}(dhcp-config)#",
        "config-acl": f"{device_name}(config-ext-nacl)#",
        "config-zone": f"{device_name}(config-sec-zone)#",
        "config-tunnel": f"{device_name}(config-if)#",
    }
    return prompts.get(mode, f"{device_name}#")


# ── Command output simulator ────────────────────────────────────

SHOW_OUTPUTS: dict[str, dict[str, str]] = {
    "show vlan brief": {
        "_default": (
            "VLAN Name                             Status    Ports\n"
            "---- -------------------------------- --------- ------\n"
            "1    default                          active    Gi0/3-23\n"
            "10   Engineering                      active    Gi0/1\n"
            "20   Sales                            active    Gi0/2\n"
            "1002 fddi-default                     act/unsup\n"
            "1003 token-ring-default               act/unsup\n"
        )
    },
    "show ip interface brief": {
        "_default": (
            "Interface              IP-Address      OK? Method Status                Protocol\n"
            "GigabitEthernet0/0     10.0.1.1        YES manual up                    up\n"
            "GigabitEthernet0/1     10.0.2.1        YES manual up                    up\n"
            "Serial0/0/0            unassigned      YES unset  administratively down down\n"
        ),
        "R1": (
            "Interface              IP-Address      OK? Method Status                Protocol\n"
            "GigabitEthernet0/0     unassigned      YES unset  up                    up\n"
            "GigabitEthernet0/0.10  10.0.10.1       YES manual up                    up\n"
            "GigabitEthernet0/0.20  10.0.20.1       YES manual up                    up\n"
            "GigabitEthernet0/1     unassigned      YES unset  administratively down down\n"
        ),
        "L3-SW1": (
            "Interface              IP-Address      OK? Method Status                Protocol\n"
            "Vlan10                 10.0.10.1       YES manual up                    up\n"
            "Vlan20                 10.0.20.1       YES manual up                    up\n"
            "Vlan30                 10.0.30.1       YES manual up                    up\n"
            "GigabitEthernet0/1     unassigned      YES unset  up                    up\n"
            "GigabitEthernet0/2     unassigned      YES unset  up                    up\n"
            "GigabitEthernet0/10    unassigned      YES unset  up                    up\n"
        ),
        "HQ-SW1": (
            "Interface              IP-Address      OK? Method Status                Protocol\n"
            "Vlan10                 10.0.0.1        YES manual up                    up\n"
            "Vlan20                 10.0.0.65       YES manual up                    up\n"
            "Vlan30                 10.0.0.129      YES manual up                    up\n"
            "Vlan40                 10.0.0.193      YES manual up                    up\n"
            "GigabitEthernet0/1     unassigned      YES unset  up                    up\n"
            "GigabitEthernet0/2     unassigned      YES unset  up                    up\n"
        )
    },
    "show vlans": {
        "_default": (
            "Virtual LAN ID:  10 (IEEE 802.1Q Encapsulation)\n"
            "   vLAN Trunk Interface:   GigabitEthernet0/0.10\n"
            "    Protocols Configured:   Address:        Received:       Transmitted:\n"
            "           IP              10.0.10.1               0               0\n"
            "\n"
            "Virtual LAN ID:  20 (IEEE 802.1Q Encapsulation)\n"
            "   vLAN Trunk Interface:   GigabitEthernet0/0.20\n"
            "    Protocols Configured:   Address:        Received:       Transmitted:\n"
            "           IP              10.0.20.1               0               0\n"
        )
    },
    "show ip route": {
        "_default": (
            "Codes: C - connected, S - static, O - OSPF, B - BGP\n"
            "Gateway of last resort is not set\n"
            "\n"
            "      10.0.0.0/8 is variably subnetted\n"
            "C        10.0.10.0/24 is directly connected, GigabitEthernet0/0.10\n"
            "C        10.0.20.0/24 is directly connected, GigabitEthernet0/0.20\n"
        ),
        "L3-SW1": (
            "Codes: C - connected, S - static, O - OSPF, B - BGP\n"
            "Gateway of last resort is not set\n"
            "\n"
            "      10.0.0.0/8 is variably subnetted, 6 subnets, 2 masks\n"
            "C        10.0.10.0/24 is directly connected, Vlan10\n"
            "L        10.0.10.1/32 is directly connected, Vlan10\n"
            "C        10.0.20.0/24 is directly connected, Vlan20\n"
            "L        10.0.20.1/32 is directly connected, Vlan20\n"
            "C        10.0.30.0/24 is directly connected, Vlan30\n"
            "L        10.0.30.1/32 is directly connected, Vlan30\n"
        ),
        "HQ-SW1": (
            "Codes: C - connected, S - static, O - OSPF, B - BGP\n"
            "Gateway of last resort is not set\n"
            "\n"
            "      10.0.0.0/8 is variably subnetted, 8 subnets, 2 masks\n"
            "C        10.0.0.0/26 is directly connected, Vlan10\n"
            "L        10.0.0.1/32 is directly connected, Vlan10\n"
            "C        10.0.0.64/26 is directly connected, Vlan20\n"
            "L        10.0.0.65/32 is directly connected, Vlan20\n"
            "C        10.0.0.128/26 is directly connected, Vlan30\n"
            "L        10.0.0.129/32 is directly connected, Vlan30\n"
            "C        10.0.0.192/26 is directly connected, Vlan40\n"
            "L        10.0.0.193/32 is directly connected, Vlan40\n"
        )
    },
    "show ip ospf neighbor": {
        "_default": (
            "Neighbor ID     Pri   State           Dead Time   Address         Interface\n"
            "2.2.2.2           1   FULL/DR         00:00:33    10.0.1.2        Gi0/0\n"
            "3.3.3.3           1   FULL/BDR        00:00:31    10.0.2.3        Gi0/1\n"
        )
    },
    "show ip bgp": {
        "_default": (
            "BGP table version is 4, local router ID is 1.1.1.1\n"
            "   Network          Next Hop            Metric LocPrf Weight Path\n"
            "*> 10.0.0.0/8       0.0.0.0                  0         32768 i\n"
            "*> 203.0.113.0/24   198.51.100.1                           0 65000 i\n"
        )
    },
    "show ip nat translations": {
        "_default": (
            "Pro Inside global      Inside local       Outside local      Outside global\n"
            "tcp 203.0.113.1:1024   10.0.1.10:80       198.51.100.50:443  198.51.100.50:443\n"
            "tcp 203.0.113.1:1025   10.0.1.11:80       198.51.100.51:80   198.51.100.51:80\n"
        )
    },
    "show spanning-tree": {
        "_default": (
            "VLAN0010\n"
            "  Spanning tree enabled protocol ieee\n"
            "  Root ID    Priority    4106\n"
            "             Address     aabb.cc00.0100\n"
            "             This bridge is the root\n"
            "  Bridge ID  Priority    4106  (priority 4096 sys-id-ext 10)\n"
            "             Address     aabb.cc00.0100\n"
        )
    },
    "show etherchannel summary": {
        "_default": (
            "Flags:  D - down        P - bundled in port-channel\n"
            "        I - stand-alone  s - suspended\n"
            "Number of channel-groups in use: 1\n"
            "Group  Port-channel  Protocol    Ports\n"
            "------+-------------+-----------+-------\n"
            "1      Po1(SU)          LACP      Gi0/1(P)    Gi0/2(P)\n"
        )
    },
    "show mpls forwarding-table": {
        "_default": (
            "Local      Outgoing   Prefix           Bytes Label   Outgoing\n"
            "Label      Label      or Tunnel Id     Switched      interface\n"
            "16         Pop Label  10.1.1.0/24      0             Gi0/0\n"
            "17         18         10.2.2.0/24      0             Gi0/1\n"
        )
    },
    "show interfaces tunnel 0": {
        "_default": (
            "Tunnel0 is up, line protocol is up\n"
            "  Internet address is 10.255.0.1/30\n"
            "  Tunnel source 203.0.113.1, destination 198.51.100.2\n"
            "  Tunnel protocol/transport GRE/IP\n"
        )
    },
    "show interfaces vlan": {
        "_default": (
            "Vlan10 is up, line protocol is up\n"
            "  Hardware is EtherSVI, address is aabb.cc00.0100\n"
            "  Internet address is 10.0.10.1/24\n"
            "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n"
            "     reliability 255/255, txload 1/255, rxload 1/255\n"
            "\n"
            "Vlan20 is up, line protocol is up\n"
            "  Hardware is EtherSVI, address is aabb.cc00.0100\n"
            "  Internet address is 10.0.20.1/24\n"
            "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n"
            "\n"
            "Vlan30 is up, line protocol is up\n"
            "  Hardware is EtherSVI, address is aabb.cc00.0100\n"
            "  Internet address is 10.0.30.1/24\n"
            "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n"
        ),
        "HQ-SW1": (
            "Vlan10 is up, line protocol is up\n"
            "  Hardware is EtherSVI, address is aabb.cc00.0200\n"
            "  Internet address is 10.0.0.1/26\n"
            "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n"
            "\n"
            "Vlan20 is up, line protocol is up\n"
            "  Hardware is EtherSVI, address is aabb.cc00.0200\n"
            "  Internet address is 10.0.0.65/26\n"
            "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n"
            "\n"
            "Vlan30 is up, line protocol is up\n"
            "  Hardware is EtherSVI, address is aabb.cc00.0200\n"
            "  Internet address is 10.0.0.129/26\n"
            "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n"
            "\n"
            "Vlan40 is up, line protocol is up\n"
            "  Hardware is EtherSVI, address is aabb.cc00.0200\n"
            "  Internet address is 10.0.0.193/26\n"
            "  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n"
        )
    },
    "show crypto isakmp sa": {
        "_default": (
            "dst             src             state          conn-id status\n"
            "203.0.113.1     198.51.100.50   QM_IDLE           1001 ACTIVE\n"
        )
    },
    "show ipv6 interface brief": {
        "_default": (
            "GigabitEthernet0/0     [up/up]\n"
            "    FE80::1\n"
            "    2001:DB8:ACAD:1::1\n"
            "GigabitEthernet0/1     [up/up]\n"
            "    FE80::1\n"
            "    2001:DB8:ACAD:2::1\n"
        )
    },
    "show ip dhcp binding": {
        "_default": (
            "Bindings from all pools not associated with VRF:\n"
            "IP address       Client-ID/              Lease expiration        Type\n"
            "                 Hardware address/\n"
            "                 User name\n"
            "10.0.10.100      0100.5079.6668.01       Mar 16 2026 08:00 AM    Automatic\n"
            "10.0.10.101      0100.5079.6668.02       Mar 16 2026 08:00 AM    Automatic\n"
        )
    },
    "show access-lists": {
        "_default": (
            "Extended IP access list GUEST-RESTRICT\n"
            "    10 deny ip 10.0.20.0 0.0.0.255 10.0.10.0 0.0.0.255\n"
            "    20 deny ip 10.0.20.0 0.0.0.255 10.0.30.0 0.0.0.255\n"
            "    30 permit ip any any (15 matches)\n"
        )
    },
    "show ip ssh": {
        "_default": (
            "SSH Enabled - version 2.0\n"
            "Authentication timeout: 120 secs; Authentication retries: 3\n"
            "Minimum expected Diffie Hellman key size : 2048 bits\n"
        )
    },
}



# ════════════════════════════════════════════════════════════════
# IOS ? HELP SYSTEM
# ════════════════════════════════════════════════════════════════

# Each leaf value is a one-line description string (matches real IOS phrasing).
# A dict value means "this keyword has sub-keywords" — recurse into it.
# The special key "_desc" on a dict node is the description for that keyword itself.

_SHOW_IP_TREE = {
    "access-lists": "IP access lists",
    "bgp":          {"_desc": "BGP information",
                     "summary": "Summary of BGP neighbor status",
                     "neighbors": "Detailed BGP neighbor information"},
    "dhcp":         {"_desc": "Show items in the DHCP database",
                     "binding": "DHCP address bindings",
                     "pool":    "DHCP pool statistics",
                     "excluded-addresses": "Excluded addresses"},
    "interface":    {"_desc": "IP interface status and configuration",
                     "brief": "Brief summary of IP status and configuration"},
    "nat":          {"_desc": "IP NAT information",
                     "translations": "Translation entries",
                     "statistics":   "Translation statistics"},
    "ospf":         {"_desc": "OSPF information",
                     "neighbor":     "Neighbor list",
                     "database":     "OSPF link state database",
                     "interface":    "OSPF interface information"},
    "route":        {"_desc": "IP routing table",
                     "summary": "Summary of all routes"},
    "ssh":          "Information on SSH",
}

_SHOW_TREE = {
    "access-lists":         "List access lists",
    "arp":                  "ARP table",
    "cdp":                  {"_desc": "CDP information",
                             "neighbors": "CDP neighbor entries"},
    "clock":                "Display the system clock",
    "crypto":               {"_desc": "Encryption module",
                             "isakmp": {"_desc": "ISAKMP information",
                                        "sa": "IKE Security Associations"},
                             "ipsec":  {"_desc": "IPsec information",
                                        "sa": "IPsec Security Associations"},
                             "key":    {"_desc": "Long term key operations",
                                        "mypubkey": {"_desc": "Public keys",
                                                     "rsa": "RSA public keys"}}},
    "dot11":                {"_desc": "IEEE 802.11 commands",
                             "associations": "Wireless client associations"},
    "etherchannel":         {"_desc": "EtherChannel information",
                             "summary": "One line summary per channel-group"},
    "flash:":               "display information about flash: file system",
    "history":              "Show the session command history",
    "hosts":                "Host name-to-address mapping table",
    "interfaces":           {"_desc": "Interface status and configuration",
                             "brief": "Brief summary of all interfaces",
                             "GigabitEthernet0/0": "GigabitEthernet0/0 status",
                             "GigabitEthernet0/1": "GigabitEthernet0/1 status",
                             "Serial0/0/0":        "Serial0/0/0 status",
                             "Tunnel0":            "Tunnel0 status",
                             "vlan":               "Vlan interface information"},
    "ip":                   {"_desc": "IP information", **_SHOW_IP_TREE},
    "ipv6":                 {"_desc": "IPv6 information",
                             "interface":  {"_desc": "IPv6 interface information",
                                            "brief": "Brief summary"},
                             "neighbors":  "IPv6 neighbor table",
                             "route":      "IPv6 routing table"},
    "logging":              "Show the contents of logging buffers",
    "mpls":                 {"_desc": "MPLS information",
                             "forwarding-table": "Show MPLS forwarding table",
                             "ldp":              {"_desc": "MPLS LDP information",
                                                  "neighbor": "LDP neighbor information"}},
    "ntp":                  {"_desc": "Network time protocol",
                             "status": "NTP status",
                             "associations": "NTP associations"},
    "processes":            "Active process statistics",
    "protocols":            "Active network routing protocols",
    "running-config":       "Current operating configuration",
    "spanning-tree":        "Spanning tree topology",
    "startup-config":       "Startup configuration",
    "users":                "Display information about terminal lines",
    "version":              "System hardware and software status",
    "vlan":                 {"_desc": "VTP VLAN information",
                             "brief": "VTP all VLAN status in brief"},
    "vlans":                "Virtual LAN information",
    "wlan":                 {"_desc": "WLAN information",
                             "summary": "WLAN summary"},
    "zone":                 {"_desc": "Zone information",
                             "security": "Zone security information"},
    "zone-pair":            {"_desc": "Zone pair information",
                             "security": "Zone pair security information"},
}

_PRIV_TREE = {
    "clear":            {"_desc": "Reset functions",
                         "ip":    {"_desc": "IP functions",
                                   "nat":       {"_desc": "NAT functions",
                                                 "translations": "Clear NAT translation table"},
                                   "ospf":      {"_desc": "OSPF functions",
                                                 "process": "Reset OSPF process"},
                                   "bgp":       {"_desc": "BGP functions",
                                                 "*": "Clear BGP peer connection"}},
                         "arp-cache":  "Delete all ARP table entries",
                         "counters":   "Clear interface counters"},
    "clock":            {"_desc": "Manage the system clock",
                         "set": "Set the time and date"},
    "configure":        {"_desc": "Enter configuration mode",
                         "terminal": "Configure from the terminal"},
    "copy":             {"_desc": "Copy from one file to another",
                         "running-config": {"_desc": "Copy from current system configuration",
                                            "startup-config": "Save running config to NVRAM",
                                            "tftp:": "Copy to TFTP server"},
                         "startup-config": {"_desc": "Copy from startup configuration",
                                            "running-config": "Load startup config into running"},
                         "tftp:": {"_desc": "Copy from TFTP",
                                   "running-config": "Copy from TFTP to running config"}},
    "debug":            {"_desc": "Debugging functions (may impact performance)",
                         "ip":   {"_desc": "IP debugging",
                                  "ospf": "OSPF debugging",
                                  "bgp":  "BGP debugging",
                                  "nat":  "NAT debugging"},
                         "all":  "Enable all debugging (caution)"},
    "disable":          "Turn off privileged commands",
    "exit":             "Exit to user EXEC mode",
    "no":               {"_desc": "Negate a command",
                         "debug": "Disable debugging"},
    "ping":             "Send echo messages",
    "reload":           "Halt and perform a cold restart",
    "show":             {"_desc": "Show running system information", **_SHOW_TREE},
    "ssh":              "Open a secure shell client connection",
    "telnet":           "Open a telnet connection",
    "terminal":         {"_desc": "Set terminal line parameters",
                         "length": "Set number of lines on a screen",
                         "width":  "Set width of the terminal screen"},
    "traceroute":       "Trace route to destination",
    "undebug":          {"_desc": "Disable debugging functions",
                         "all": "Disable all debugging"},
    "write":            {"_desc": "Write running configuration to memory, network, or terminal",
                         "memory":   "Write to NV memory",
                         "terminal": "Write to terminal",
                         "erase":    "Erase NV memory"},
}

_CONFIG_TREE = {
    "access-list":          "Add an access list entry",
    "banner":               {"_desc": "Define a login banner",
                             "motd": "Set Message of the Day banner"},
    "boot":                 {"_desc": "Boot commands",
                             "system": "Boot system file"},
    "clock":                {"_desc": "Configure time-of-day clock",
                             "timezone": "Configure time zone"},
    "crypto":               {"_desc": "Encryption module",
                             "isakmp":  {"_desc": "ISAKMP configuration",
                                         "policy": "ISAKMP policy configuration"},
                             "ipsec":   {"_desc": "IPsec configuration",
                                         "transform-set": "IPsec transform set"},
                             "key":     {"_desc": "Long term key operations",
                                         "generate": {"_desc": "Generate a key",
                                                      "rsa": "Generate RSA key pair"}},
                             "dynamic-map": "Specify a dynamic crypto map template",
                             "map":     "Enter a crypto map"},
    "do":                   "To run exec commands in config mode",
    "show":                 {"_desc": "Show running system information", **_SHOW_TREE},
    "dot11":                {"_desc": "IEEE 802.11 commands",
                             "ssid": "Configure an SSID"},
    "enable":               {"_desc": "Modify enable password parameters",
                             "secret": "Assign the privileged level secret"},
    "end":                  "Exit from configure mode",
    "exit":                 "Exit from configure mode",
    "hostname":             "Set system's network name",
    "interface":            {"_desc": "Select an interface to configure",
                             "GigabitEthernet": "GigabitEthernet IEEE 802.3",
                             "FastEthernet":    "FastEthernet IEEE 802.3",
                             "Serial":          "Serial",
                             "Loopback":        "Loopback interface",
                             "Port-channel":    "Ethernet Channel of interfaces",
                             "Tunnel":          "Tunnel interface",
                             "Vlan":            "Catalyst VLANs"},
    "ip":                   {"_desc": "Global IP configuration commands",
                             "access-list":  {"_desc": "Named access list",
                                              "extended": "Extended access list",
                                              "standard": "Standard access list"},
                             "dhcp":         {"_desc": "Configure DHCP server",
                                              "excluded-address": "Prevent server from assigning these addresses",
                                              "pool":             "Configure DHCP address pool"},
                             "domain-name":  "Define the default domain name",
                             "host":         "Add an entry to the IP hostname table",
                             "name-server":  "Specify address of name server to use",
                             "nat":          {"_desc": "NAT configuration commands",
                                              "inside":  {"_desc": "Inside address translation",
                                                          "source": "Source address translation"}},
                             "route":        "Establish static routes",
                             "routing":      "Enable IP routing",
                             "ssh":          {"_desc": "Configure SSH",
                                              "version": "Specify protocol version to be supported"}},
    "ipv6":                 {"_desc": "Global IPv6 configuration commands",
                             "unicast-routing": "Enable IPv6 unicast routing"},
    "line":                 {"_desc": "Configure a terminal line",
                             "console": "Primary terminal line",
                             "vty":     "Virtual terminal"},
    "logging":              "Modify message logging facilities",
    "mpls":                 {"_desc": "MPLS configuration",
                             "ip": "Enable MPLS forwarding"},
    "no":                   "Negate a command or set its defaults",
    "ntp":                  {"_desc": "Configure NTP",
                             "server": "Configure an NTP server"},
    "radius":               {"_desc": "RADIUS server configuration",
                             "server": "Configure a RADIUS server"},
    "router":               {"_desc": "Enable a routing process",
                             "bgp":   "Border Gateway Protocol (BGP)",
                             "eigrp": "Enhanced Interior Gateway Routing Protocol (EIGRP)",
                             "ospf":  "Open Shortest Path First (OSPF)",
                             "rip":   "Routing Information Protocol (RIP)"},
    "service":              {"_desc": "Modify use of network based services",
                             "password-encryption": "Encrypt system passwords",
                             "timestamps":          "Timestamp debug/log messages"},
    "snmp-server":          "Modify SNMP parameters",
    "spanning-tree":        {"_desc": "Spanning Tree Subsystem",
                             "mode":           {"_desc": "Spanning tree operating mode",
                                                "pvst":    "Per-VLAN spanning tree mode",
                                                "rapid-pvst": "Per-VLAN rapid spanning tree"},
                             "portfast":       {"_desc": "Spanning tree portfast options",
                                                "default": "Enable portfast by default on all access ports"},
                             "vlan":           "VLAN Switch Spanning Tree"},
    "username":             "Establish User Name Authentication",
    "vlan":                 "VLAN commands",
    "wlan":                 "Wireless LAN configuration",
    "zone":                 {"_desc": "Zone configuration",
                             "security": "Security zone"},
    "zone-pair":            {"_desc": "Zone pair configuration",
                             "security": "Security zone pair"},
}

_CONFIG_IF_TREE = {
    "channel-group":        "Etherchannel/port bundling function",
    "description":          "Interface specific description",
    "do":                   "To run exec commands in config mode",
    "show":                 {"_desc": "Show running system information", **_SHOW_TREE},
    "duplex":               {"_desc": "Configure duplex operation",
                             "auto":  "Auto duplex",
                             "full":  "Force full duplex",
                             "half":  "Force half-duplex"},
    "encapsulation":        {"_desc": "Set encapsulation type for an interface",
                             "dot1q": "IEEE 802.1Q Virtual LAN"},
    "end":                  "Exit from configure mode",
    "exit":                 "Exit from current mode",
    "ip":                   {"_desc": "Interface Internet Protocol config commands",
                             "access-group": "Specify access control for packets",
                             "address":      "Set the IP address of an interface",
                             "helper-address": "Specify a destination address for UDP broadcasts",
                             "nat":          {"_desc": "NAT interface commands",
                                              "inside":  "NAT inside interface",
                                              "outside": "NAT outside interface"},
                             "ospf":         {"_desc": "OSPF interface commands",
                                              "cost":      "Interface cost",
                                              "priority":  "Router priority",
                                              "area":      "Enable OSPF on this interface"}},
    "ipv6":                 {"_desc": "IPv6 interface subcommands",
                             "address":  "Configure IPv6 address on interface",
                             "ospf":     "IPv6 OSPF interface parameters"},
    "mpls":                 {"_desc": "MPLS interface commands",
                             "ip": "Enable MPLS on this interface"},
    "no":                   "Negate a command or set its defaults",
    "shutdown":             "Shutdown the selected interface",
    "no shutdown":          "Enable the selected interface",
    "spanning-tree":        {"_desc": "Spanning Tree Subsystem",
                             "bpduguard": {"_desc": "Don't accept BPDUs on this interface",
                                           "enable": "Enable BPDU guard for this interface"},
                             "portfast":  "Portfast options for the interface"},
    "speed":                {"_desc": "Configure speed operation",
                             "auto": "Enable AUTO speed configuration",
                             "10":   "Force 10 Mbps operation",
                             "100":  "Force 100 Mbps operation",
                             "1000": "Force 1000 Mbps operation"},
    "switchport":           {"_desc": "Set switching mode characteristics",
                             "access":  {"_desc": "Set access mode characteristics of the interface",
                                         "vlan": "Set VLAN when interface is in access mode"},
                             "mode":    {"_desc": "Set trunking mode of the interface",
                                         "access": "Set trunking mode to ACCESS unconditionally",
                                         "trunk":  "Set trunking mode to TRUNK unconditionally",
                                         "dynamic": {"_desc": "Set trunking mode to dynamically negotiate",
                                                     "auto":    "Set mode to dynamically negotiate",
                                                     "desirable": "Set mode to dynamically negotiate"}},
                             "nonegotiate":        "Device will not engage in negotiation protocol on this interface",
                             "trunk":   {"_desc": "Set trunking characteristics of the interface",
                                         "allowed": {"_desc": "Set allowed VLAN characteristics",
                                                     "vlan": "Set allowed VLANs on the trunk link"},
                                         "encapsulation": "Set encapsulation type for trunk",
                                         "native": {"_desc": "Set trunking native characteristics",
                                                    "vlan": "Set native VLAN when interface is in trunking mode"}}},
    "tunnel":               {"_desc": "Protocol-over-Protocol tunneling",
                             "destination": "Set the destination of the tunnel",
                             "mode":        {"_desc": "Tunnel encapsulation method",
                                             "gre":  {"_desc": "Generic Route Encapsulation Protocol",
                                                      "ip": "GRE over IP"}},
                             "source":      "Set the source of the tunnel"},
    "zone-member":          {"_desc": "Zone membership for the interface",
                             "security": "Zone security membership"},
}

_CONFIG_ROUTER_TREE = {
    "area":          {"_desc": "OSPF area parameters",
                      "authentication":  "Enable authentication",
                      "stub":            "Settings for configuring the area as a stub"},
    "auto-summary":  "Enable automatic network number summarization",
    "default-information": {"_desc": "Control distribution of default information",
                            "originate": "Distribute a default route"},
    "do":            "To run exec commands in config mode",
    "end":           "Exit from configure mode",
    "exit":          "Exit from routing protocol configuration mode",
    "neighbor":      "Specify a neighbor router",
    "network":       "Enable routing on an IP network",
    "no":            "Negate a command or set its defaults",
    "passive-interface": "Suppress routing updates on an interface",
    "redistribute":  "Redistribute information from another routing protocol",
    "remote-as":     "Specify the remote AS number",
    "router-id":     "Router-id for this OSPF process",
    "timers":        "Adjust routing timers",
    "update-source": "Source of routing updates",
}

_CONFIG_VLAN_TREE = {
    "do":    "To run exec commands in config mode",
    "end":   "Exit from configure mode",
    "exit":  "Exit from current mode",
    "name":  "Ascii name of the VLAN",
    "no":    "Negate a command or set its defaults",
    "state": {"_desc": "Operational state of the VLAN",
              "active":   "VLAN active state",
              "suspend":  "VLAN suspend state"},
}

_CONFIG_LINE_TREE = {
    "access-class":     "Filter connections based on an IP access list",
    "do":               "To run exec commands in config mode",
    "end":              "Exit from configure mode",
    "exec-timeout":     "Set the EXEC timeout",
    "exit":             "Exit from current mode",
    "login":            {"_desc": "Enable password checking",
                         "local": "Local password checking"},
    "logging":          {"_desc": "Modify message logging facilities",
                         "synchronous": "Synchronize unsolicited messages"},
    "no":               "Negate a command or set its defaults",
    "password":         "Set a password",
    "transport":        {"_desc": "Define transport protocols for line",
                         "input":  {"_desc": "Define which protocols to use when connecting to the terminal server",
                                    "ssh":    "TCP/IP SSH protocol",
                                    "telnet": "TCP/IP Telnet protocol",
                                    "all":    "All protocols",
                                    "none":   "No protocols"}},
}

_CONFIG_DHCP_TREE = {
    "default-router":   "Default routers",
    "dns-server":       "DNS servers",
    "do":               "To run exec commands in config mode",
    "domain-name":      "Domain name",
    "end":              "Exit from configure mode",
    "exit":             "Exit from current mode",
    "lease":            {"_desc": "Address lease time",
                         "infinite": "Infinite lease time"},
    "network":          "Network number and mask",
    "no":               "Negate a command or set its defaults",
}

_CONFIG_ACL_TREE = {
    "deny":   "Specify packets to reject",
    "do":     "To run exec commands in config mode",
    "end":    "Exit from configure mode",
    "exit":   "Exit from current mode",
    "no":     "Negate a command or set its defaults",
    "permit": "Specify packets to forward",
    "remark": "Access list entry comment",
}

_HELP_TREES = {
    "user":           {"enable": "Turn on privileged commands",
                       "exit":   "Exit to lower level",
                       "ping":   "Send echo messages",
                       "show":   _SHOW_TREE,
                       "?":      "Help"},
    "privileged":     _PRIV_TREE,
    "config":         _CONFIG_TREE,
    "config-if":      _CONFIG_IF_TREE,
    "config-router":  _CONFIG_ROUTER_TREE,
    "config-vlan":    _CONFIG_VLAN_TREE,
    "config-line":    _CONFIG_LINE_TREE,
    "config-dhcp":    _CONFIG_DHCP_TREE,
    "config-acl":     _CONFIG_ACL_TREE,
    "config-zone":    {"do": "To run exec commands in config mode",
                       "end": "Exit from configure mode",
                       "exit": "Exit from current mode",
                       "no":  "Negate a command",
                       "service-policy": {"_desc": "Configure zone-pair service policy",
                                          "type": {"_desc": "Policy type",
                                                   "inspect": "Inspect policy"}}},
    # Tunnel interface uses same sub-mode commands as config-if
    "config-tunnel":  _CONFIG_IF_TREE,
}


def _format_help(items: dict, prefix: str = "") -> str:
    """Format a dict of {keyword: desc_or_subtree} like real IOS help output."""
    lines = []
    col_width = max((len(k) for k in items if k != "_desc"), default=10) + 2
    for kw, val in sorted(items.items()):
        if kw == "_desc":
            continue
        if isinstance(val, dict):
            desc = val.get("_desc", kw)
        else:
            desc = val
        lines.append(f"  {kw:<{col_width}}{desc}")
    lines.append("  <cr>")
    return "\n".join(lines)


def _resolve_help(tokens: list[str], tree: dict) -> str:
    """
    Walk token list into the tree and return formatted help for whatever
    level the user has reached.
    """
    node = tree
    for i, tok in enumerate(tokens):
        if not isinstance(node, dict):
            return "  % No help available."
        tl = tok.lower()
        # Exact match
        if tl in node:
            child = node[tl]
            if isinstance(child, dict):
                node = child
            else:
                # leaf — next token would be <cr>
                return "  <cr>"
        else:
            # Prefix match — collect all matching keys
            matches = {k: v for k, v in node.items()
                       if k != "_desc" and k.startswith(tl)}
            if not matches:
                return f"  % Unrecognized command '{tok}'. Type ? for help."
            if len(matches) == 1:
                k = list(matches.keys())[0]
                child = matches[k]
                if isinstance(child, dict):
                    node = child
                else:
                    return "  <cr>"
            else:
                return _format_help(matches)
    return _format_help({k: v for k, v in node.items() if k != "_desc"})


def _help_output(raw_input: str, mode: str) -> str:
    """
    Produce IOS-style ? help output for the given raw input and mode.

    raw_input is whatever the user typed, including the trailing ? (or just ?)
    mode is the current IOS mode string (e.g. "privileged", "config-if")
    """
    tree = _HELP_TREES.get(mode, _HELP_TREES.get("privileged", {}))

    stripped = raw_input.strip()

    # Case 1 — bare "?"
    if stripped == "?":
        return _format_help({k: v for k, v in tree.items() if k != "_desc"})

    # Case 2 — "command ?" (trailing space before ?) or "command?"
    # Detect which case
    has_space_before_q = re.search(r"\s\?$", stripped)
    if has_space_before_q:
        # Subcommand help — everything before the "?"
        prefix_part = stripped[:-1].rstrip()
    else:
        # Prefix completion — everything before the trailing "?"
        prefix_part = stripped[:-1].rstrip()

    if not prefix_part:
        return _format_help({k: v for k, v in tree.items() if k != "_desc"})

    tokens = prefix_part.split()

    # If no space before ?, we want prefix matches on the last token
    if not has_space_before_q and tokens:
        last = tokens[-1].lower()
        parent_tokens = tokens[:-1]
        # Walk to the parent node
        node = tree
        for tok in parent_tokens:
            if not isinstance(node, dict):
                break
            tl = tok.lower()
            if tl in node:
                child = node[tl]
                node = child if isinstance(child, dict) else {}
            else:
                matches = {k: v for k, v in node.items()
                           if k != "_desc" and k.startswith(tl)}
                if len(matches) == 1:
                    k = list(matches.keys())[0]
                    child = matches[k]
                    node = child if isinstance(child, dict) else {}
                else:
                    node = matches
        if isinstance(node, dict):
            prefix_matches = {k: v for k, v in node.items()
                              if k != "_desc" and k.startswith(last)}
            if prefix_matches:
                return _format_help(prefix_matches)
            return f"  % Unrecognized command '\'{last}\'\'. Type ? for help."
        return "  <cr>"

    # Space before ? — show subcommands for whatever we have so far
    return _resolve_help(tokens, tree)



# ── IOS error message helpers ─────────────────────────────────────

def _caret_error(command: str, bad_token: str | None = None) -> str:
    """
    Produce a real IOS-style "Invalid input detected at ^ marker" error.
    Places the ^ under the first unrecognised token in the command.

    R1(config-if)# ip nat insidr
                            ^
    % Invalid input detected at '^' marker.
    """
    cmd = command.strip()
    if bad_token and bad_token in cmd:
        pos = cmd.index(bad_token)
        caret_line = " " * pos + "^"
    else:
        # Point to the last token
        tokens = cmd.split()
        if tokens:
            # Find last token position
            pos = cmd.rfind(tokens[-1])
            caret_line = " " * pos + "^"
        else:
            caret_line = "^"
    return f"{caret_line}\n% Invalid input detected at '^' marker."


def _incomplete_error() -> str:
    """% Incomplete command."""
    return "% Incomplete command."


def _ambiguous_error(partial: str) -> str:
    """% Ambiguous command: "sh"."""
    return f'% Ambiguous command:  \"{partial}\"'

def simulate_output(command: str, device_name: str, mode_key: str = "") -> tuple[str, str]:
    """Return (output_text, new_mode)."""
    # Strip 'do ' prefix — allows exec commands from any config mode
    raw = command.strip()
    do_prefix = re.match(r"^do\s+(.+)$", raw, re.I)
    is_do = bool(do_prefix)
    if do_prefix:
        raw = do_prefix.group(1).strip()

    cmd_orig = raw  # preserve case for ? help
    cmd = raw.lower()

    key = mode_key or device_name  # fallback for direct calls
    current_mode = DEVICE_MODES.get(key, "privileged")

    # Quiz mode — just echo the answer back, no IOS simulation
    if device_name == "QUIZ":
        return (f"  → {command.strip()}", "quiz")

    # ── ? HELP — handle before any other processing ─────────────
    help_raw = raw if is_do else cmd_orig
    if help_raw.strip().endswith("?") or help_raw.strip() == "?":
        return (_help_output(help_raw.strip(), current_mode), current_mode)

    # ── Universal commands — always allowed regardless of mode ──
    # end — always jumps to privileged EXEC from any config depth (like Ctrl-Z)
    if cmd == "end" and current_mode.startswith("config"):
        DEVICE_MODES[key] = "privileged"
        return ("", "privileged")

    # exit — goes up exactly one level
    if cmd == "exit" and current_mode.startswith("config"):
        new = "config" if current_mode != "config" else "privileged"
        DEVICE_MODES[key] = new
        return ("", new)

    if cmd == "exit":
        return ("", "user")

    if cmd in ("enable", "en"):
        DEVICE_MODES[key] = "privileged"
        return ("", "privileged")

    # ── Mode enforcement ─────────────────────────────────────────
    # Commands in exec mode only (privileged / user)
    EXEC_ONLY = re.compile(
        r"^(show|ping|traceroute|debug|undebug|clear|copy|reload|"
        r"write|telnet|ssh|configure)\b", re.I
    )
    # Commands that require global config mode or deeper
    CONFIG_ONLY = re.compile(
        r"^(interface|router\s|vlan\s|spanning-tree|channel-group|"
        r"ip\s+routing|ip\s+route|ip\s+dhcp|ip\s+access-list|ip\s+nat\s+inside\s+source|"
        r"access-list|hostname|ip\s+domain|ip\s+name-server|ip\s+host|"
        r"zone\s+security|zone-pair|crypto\s+key|crypto\s+isakmp|crypto\s+ipsec|"
        r"crypto\s+dynamic-map|username|line\s+|ipv6\s+unicast-routing|"
        r"dot11\s+ssid|wlan|radius\s+server|no\s+ip\s+routing)\b", re.I
    )
    # Commands that require interface sub-mode
    IF_ONLY = re.compile(
        r"^(ip\s+address|no\s+shutdown|shutdown|switchport|encapsulation|"
        r"channel-group|spanning-tree\s+portf|spanning-tree\s+bpdu|"
        r"ip\s+nat\s+(inside|outside)$|mpls\s+ip|tunnel\s+(source|destination|mode)|"
        r"ip\s+access-group|zone-member|ipv6\s+address|ipv6\s+ospf)\b", re.I
    )

    in_exec   = current_mode in ("privileged", "user")
    in_config = current_mode == "config"
    in_if     = current_mode == "config-if"
    in_submode = current_mode.startswith("config-") and not in_if

    # Block exec-only commands in config modes (unless prefixed with 'do')
    if not is_do and not in_exec and EXEC_ONLY.match(cmd):
        if re.match(r"^configure\b", cmd):
            return (
                _caret_error(raw, "configure") + "\n"
                "  % You are already in configuration mode.\n"
                "  Use \'end\' or \'Ctrl-Z\' to return to privileged EXEC.",
                current_mode,
            )
        return (
            _caret_error(raw, raw.split()[0]) + "\n"
            "  % This command is only available in privileged EXEC mode.\n"
            "  Use \'do\' prefix to run it from config mode (e.g. \'do show ip int br\')",
            current_mode,
        )

    # Block config-only commands in exec mode
    if in_exec and CONFIG_ONLY.match(cmd):
        return (
            _caret_error(raw, raw.split()[0]) + "\n"
            "  % Command only available in global configuration mode.\n"
            "  Use \'configure terminal\' to enter config mode.",
            current_mode,
        )

    # Block interface-only commands outside of config-if
    if not in_if and IF_ONLY.match(cmd):
        return (
            _caret_error(raw, raw.split()[0]) + "\n"
            "  % Command only available in interface configuration mode.\n"
            "  Use \'interface <type><slot/port>\' to enter interface config.",
            current_mode,
        )

    # Mode transitions
    if cmd in ("configure terminal", "conf t"):
        DEVICE_MODES[key] = "config"
        return ("Enter configuration commands, one per line.  End with CNTL/Z.", "config")

    # Interface commands
    if re.match(r"interface\s+", cmd):
        DEVICE_MODES[key] = "config-if"
        return ("", "config-if")

    # Router config
    if re.match(r"router\s+(ospf|bgp|eigrp|rip)", cmd):
        DEVICE_MODES[key] = "config-router"
        return ("", "config-router")

    # VLAN config
    if re.match(r"vlan\s+\d+", cmd) and current_mode == "config":
        DEVICE_MODES[key] = "config-vlan"
        return ("", "config-vlan")

    # Line config
    if re.match(r"line\s+(vty|con)", cmd):
        DEVICE_MODES[key] = "config-line"
        return ("", "config-line")

    # DHCP pool
    if re.match(r"ip dhcp pool", cmd):
        DEVICE_MODES[key] = "config-dhcp"
        return ("", "config-dhcp")

    # ACL
    if re.match(r"ip access-list", cmd):
        DEVICE_MODES[key] = "config-acl"
        return ("", "config-acl")

    # Zone security
    if re.match(r"zone security", cmd):
        DEVICE_MODES[key] = "config-zone"
        return ("", "config-zone")

    # ── Quiz device — accept any answer, return acknowledgement ──
    if device_name == "QUIZ":
        return (f"You answered: {command}", "quiz")

    # Show commands
    for show_cmd, outputs in SHOW_OUTPUTS.items():
        if cmd.startswith(show_cmd.lower()):
            output = outputs.get(device_name, outputs.get("_default", ""))
            return (output, current_mode)

    # Ping
    if cmd.startswith("ping "):
        target = cmd.split()[-1]
        return (
            f"Type escape sequence to abort.\n"
            f"Sending 5, 100-byte ICMP Echos to {target}, timeout is 2 seconds:\n"
            f"!!!!!\n"
            f"Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms",
            current_mode,
        )

    # Traceroute
    if cmd.startswith("traceroute "):
        target = cmd.split()[-1]
        return (
            f"Type escape sequence to abort.\n"
            f"Tracing the route to {target}\n"
            f"  1 10.0.1.1 1 msec 1 msec 1 msec\n"
            f"  2 10.255.0.2 4 msec 3 msec 4 msec\n"
            f"  3 {target} 6 msec 5 msec 6 msec",
            current_mode,
        )

    # write memory / write / copy running-config startup-config
    if cmd in ("write memory", "write", "wr") or re.match(r"copy\s+running-config\s+startup-config", cmd):
        return (
            "Building configuration...\n[OK]",
            current_mode,
        )

    # copy running-config tftp / other copy variants
    if re.match(r"copy\s+running-config\s+", cmd):
        dest = cmd.split()[-1]
        return (
            "Address or name of remote host []? \n"
            "Destination filename [running-config]? \n"
            "!!\n"
            f"{abs(hash(dest)) % 2000 + 500} bytes copied in 1.234 secs (408 bytes/sec)",
            current_mode,
        )

    # Generic config commands — accept silently
    config_patterns = [
        r"hostname\s+", r"name\s+", r"switchport\s+", r"no\s+shutdown",
        r"shutdown", r"ip\s+address", r"ipv6\s+(address|unicast-routing|ospf)",
        r"network\s+", r"neighbor\s+", r"remote-as\s+", r"channel-group",
        r"spanning-tree", r"mpls\s+ip", r"tunnel\s+(source|destination|mode)",
        r"crypto\s+", r"transport\s+input", r"login\s+", r"password\s+",
        r"username\s+", r"ip\s+nat\s+", r"ip\s+dhcp", r"dns-server",
        r"default-router", r"permit\s+", r"deny\s+", r"zone", r"service-policy",
        r"class-map", r"policy-map", r"wlan\s+", r"security\s+", r"description\s+",
        r"encapsulation\s+", r"overload", r"ip\s+route\s+", r"no\s+",
        r"banner\s+", r"enable\s+secret", r"service\s+", r"logging\s+",
        r"ntp\s+", r"snmp-server", r"access-class", r"exec-timeout",
        r"ip\s+routing", r"ip\s+domain",
    ]
    for pat in config_patterns:
        if re.match(pat, cmd):
            return ("", current_mode)

    # Unrecognized command — produce caret error pointing at bad token
    tokens = cmd.split()
    if tokens:
        # Check if it looks like a recognised command with wrong/missing args
        # (first token known but rest is garbage → incomplete/invalid)
        known_starts = (
            "show", "ip", "no", "interface", "router", "vlan", "line",
            "spanning-tree", "channel-group", "switchport", "hostname",
            "username", "crypto", "access-list", "permit", "deny",
            "network", "neighbor", "tunnel", "mpls", "description",
            "encapsulation", "shutdown", "duplex", "speed", "ntp",
            "logging", "service", "banner", "enable", "snmp-server",
        )
        first = tokens[0].lower()
        if first in known_starts and len(tokens) > 1:
            # Known verb, unknown argument
            bad = tokens[1]
            pos = raw.find(bad)
            caret = " " * pos + "^"
            return (
                f"{caret}\n% Invalid input detected at \'^\' marker.",
                current_mode,
            )
        elif first in known_starts:
            # Known verb with no argument — incomplete
            return (_incomplete_error(), current_mode)
        else:
            # Completely unknown first token
            caret = "^"
            return (
                f"{caret}\n% Invalid input detected at \'^\' marker.",
                current_mode,
            )
    return (_caret_error(raw), current_mode)


# ── API endpoint ─────────────────────────────────────────────────

async def _replay_history(scope_key: str, device_name: str, user_id: str,
                          lab_slug: str, db) -> None:
    """
    Replay command history from the DB into DeviceState so that show commands
    reflect previously configured interfaces even after a server restart.
    Runs only once per scope_key (guarded by a sentinel in LAB_STATES).
    """
    from app.routers.lab_state import LAB_STATES, get_state

    # Mark as replayed immediately to prevent re-entrant calls
    state = get_state(scope_key, device_name)
    if getattr(state, '_replayed', False):
        return
    state._replayed = True

    try:
        result = await db.execute(text("""
            SELECT ch.device_name, ch.command
            FROM command_history ch
            JOIN users u ON u.id = ch.user_id
            JOIN labs  l ON l.id = ch.lab_id
            WHERE u.username = :user AND l.slug = :slug
            ORDER BY ch.entered_at
        """), {"user": user_id, "slug": lab_slug})

        rows = result.mappings().all()
        if not rows:
            return

        # Replay each command through normalize + parse_command
        # Use a temporary mode tracker so we don't touch DEVICE_MODES
        replay_modes: dict[str, str] = {}

        for row in rows:
            dev  = row["device_name"]
            cmd  = row["command"]
            rkey = _mode_key(user_id, lab_slug, dev)
            rstate = get_state(rkey, dev)
            rstate._replayed = True  # mark all devices as replayed

            norm = normalize(cmd)
            mode = replay_modes.get(rkey, "privileged")

            # Update mode tracker based on command
            lcmd = norm.lower().strip()
            if re.match(r"^do\s+", lcmd):
                pass  # do prefix — mode unchanged
            elif lcmd in ("configure terminal", "conf t"):
                replay_modes[rkey] = "config"
            elif lcmd.startswith("interface "):
                replay_modes[rkey] = "config-if"
            elif re.match(r"^router\s+(ospf|bgp|eigrp|rip)", lcmd):
                replay_modes[rkey] = "config-router"
            elif re.match(r"^vlan\s+\d+", lcmd):
                replay_modes[rkey] = "config-vlan"
            elif re.match(r"^line\s+(vty|con)", lcmd):
                replay_modes[rkey] = "config-line"
            elif re.match(r"^ip\s+dhcp\s+pool", lcmd):
                replay_modes[rkey] = "config-dhcp"
            elif re.match(r"^ip\s+access-list", lcmd):
                replay_modes[rkey] = "config-acl"
            elif re.match(r"^zone\s+security", lcmd):
                replay_modes[rkey] = "config-zone"
            elif lcmd == "end":
                replay_modes[rkey] = "privileged"
            elif lcmd == "exit":
                m = replay_modes.get(rkey, "privileged")
                replay_modes[rkey] = "config" if m.startswith("config-") else "privileged"

            parse_command(rkey, dev, norm, mode)

        # Flush replayed modes into DEVICE_MODES so ? help and mode
        # enforcement reflect the correct mode after a server restart.
        for rkey, final_mode in replay_modes.items():
            DEVICE_MODES[rkey] = final_mode

    except Exception as e:
        import logging
        logging.getLogger("netlab").warning(f"[replay] Failed to replay history: {e}")


@router.post("/execute", response_model=CommandResponse)
async def execute_command(req: CommandRequest, db: AsyncSession = Depends(get_db)):
    """Execute a CLI command against a simulated device and validate against lab step."""
    key = _mode_key(req.user_id or "anon", req.lab_slug, req.device_name)

    # Lazily replay command history on first use after a server restart.
    # We capture the current DEVICE_MODES entry BEFORE replay — if reset-mode
    # already ran and set "privileged", we restore that value after replay so
    # replayed history cannot override an explicit mode reset.
    from app.routers.lab_state import get_state as _get_state
    _st = _get_state(key, req.device_name)
    mode_before_replay = DEVICE_MODES.get(key)  # None if never set
    if not getattr(_st, '_replayed', False):
        await _replay_history(
            key, req.device_name,
            req.user_id or "anon", req.lab_slug, db
        )
        # If the mode was explicitly set before replay (e.g. by reset-mode),
        # restore it so history replay doesn't override the intentional reset.
        if mode_before_replay is not None:
            DEVICE_MODES[key] = mode_before_replay

    pre_mode = DEVICE_MODES.get(key, "privileged")

    # Normalize the raw command to canonical IOS form before everything else
    normalized_cmd = normalize(req.command)

    # Use normalized command for simulation so abbreviations work correctly
    output, new_mode = simulate_output(normalized_cmd, req.device_name, mode_key=key)
    prompt = get_prompt(req.device_name, new_mode)
    is_valid = not any(e in output for e in ("% Invalid", "% Incomplete", "% Ambiguous", "% Unknown", "% Error"))
    step_completed = False
    hint = None

    # ? help commands must never trigger state changes, step completion,
    # or config updates — return immediately after producing help output.
    if normalized_cmd.strip().endswith("?") or normalized_cmd.strip() == "?":
        return CommandResponse(
            output=output, is_valid=True, prompt=prompt,
            step_completed=False, hint=None,
            normalized_command=normalized_cmd, current_mode=pre_mode,
        )

    # Update live config state with the normalized command
    parse_command(key, req.device_name, normalized_cmd, pre_mode)

    # Dynamic show output from live state
    dynamic = generate_show(key, req.device_name, normalized_cmd)
    if dynamic is not None:
        output = dynamic

    # If a step_number is provided, check if command matches expected
    if req.step_number and req.lab_slug:
        result = await db.execute(text("""
            SELECT ls.expected_commands, ls.hint, ls.explanation
            FROM lab_steps ls
            JOIN labs l ON l.id = ls.lab_id
            WHERE l.slug = :slug AND ls.step_number = :step
        """), {"slug": req.lab_slug, "step": req.step_number})
        step_row = result.mappings().first()

        if step_row and step_row["expected_commands"]:
            cmd_lower = req.command.strip().lower()
            expected = [c.lower() for c in step_row["expected_commands"]]
            # Check if any expected command is a prefix match
            if any(cmd_lower.startswith(e) or e.startswith(cmd_lower) for e in expected):
                is_valid = True
            hint = step_row["hint"]

    # Log command — auto-create user if needed
    user_id_val = req.user_id or "student"
    await db.execute(text("""
        INSERT INTO users (username, display_name)
        VALUES (:user, :user)
        ON CONFLICT (username) DO NOTHING
    """), {"user": user_id_val})
    await db.execute(text("""
        INSERT INTO command_history (user_id, lab_id, device_name, command, output, is_valid)
        SELECT u.id, l.id, :device, :command, :output, :valid
        FROM users u, labs l
        WHERE u.username = :user AND l.slug = :slug
    """), {
        "device": req.device_name,
        "command": req.command,
        "output": output,
        "valid": is_valid,
        "user": user_id_val,
        "slug": req.lab_slug,
    })
    await db.commit()

    return CommandResponse(
        output=output,
        is_valid=is_valid,
        prompt=prompt,
        step_completed=step_completed,
        hint=hint,
        normalized_command=normalized_cmd,
        current_mode=pre_mode,
    )


@router.post("/validate-step")
async def validate_step(req: CommandRequest, db: AsyncSession = Depends(get_db)):
    """Check if all expected commands for a step have been entered."""
    result = await db.execute(text("""
        SELECT ls.expected_commands, ls.explanation, ls.points
        FROM lab_steps ls
        JOIN labs l ON l.id = ls.lab_id
        WHERE l.slug = :slug AND ls.step_number = :step
    """), {"slug": req.lab_slug, "step": req.step_number})
    step_row = result.mappings().first()

    if not step_row:
        return {"completed": False, "message": "Step not found"}

    # Get all commands entered for this step's device
    history = await db.execute(text("""
        SELECT command FROM command_history ch
        JOIN users u ON u.id = ch.user_id
        JOIN labs l ON l.id = ch.lab_id
        WHERE u.username = :user AND l.slug = :slug AND ch.device_name = :device
        ORDER BY ch.entered_at
    """), {
        "user": req.user_id or "unknown",
        "slug": req.lab_slug,
        "device": req.device_name,
    })
    entered = [r["command"].strip().lower() for r in history.mappings().all()]
    expected = [c.lower() for c in (step_row["expected_commands"] or [])]

    matched = all(
        any(e in cmd or cmd in e for cmd in entered)
        for e in expected
    )

    return {
        "completed": matched,
        "points": step_row["points"] if matched else 0,
        "explanation": step_row["explanation"] if matched else None,
        "expected_remaining": [
            e for e in expected
            if not any(e in cmd or cmd in e for cmd in entered)
        ],
    }


@router.post("/reset-mode")
async def reset_device_mode(req: CommandRequest, db: AsyncSession = Depends(get_db)):
    """
    Reset a device's CLI mode to privileged exec.
    Also runs command history replay here (eagerly) so that DeviceState is
    rebuilt for show commands, but the final mode is always forced to
    privileged — preventing lazy replay on the first user command from
    overwriting the reset with a stale "config" or "config-if" mode.
    """
    key = _mode_key(req.user_id or "anon", req.lab_slug, req.device_name)

    # Run replay now (builds DeviceState for show commands) if not done yet
    from app.routers.lab_state import get_state as _get_state
    _st = _get_state(key, req.device_name)
    if not getattr(_st, "_replayed", False):
        await _replay_history(
            key, req.device_name,
            req.user_id or "anon", req.lab_slug, db
        )

    # Force mode to privileged AFTER replay so replay cannot override it
    DEVICE_MODES[key] = "privileged"
    return {"status": "ok", "prompt": get_prompt(req.device_name, "privileged")}
