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
    command: str
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


def simulate_output(command: str, device_name: str, mode_key: str = "") -> tuple[str, str]:
    """Return (output_text, new_mode)."""
    cmd = command.strip().lower()

    # Quiz mode — just echo the answer back, no IOS simulation
    if device_name == "QUIZ":
        return (f"  → {command.strip()}", "quiz")

    key = mode_key or device_name  # fallback for direct calls
    current_mode = DEVICE_MODES.get(key, "privileged")

    # Mode transitions
    if cmd in ("enable", "en"):
        DEVICE_MODES[key] = "privileged"
        return ("", "privileged")

    if cmd in ("configure terminal", "conf t"):
        DEVICE_MODES[key] = "config"
        return ("Enter configuration commands, one per line.  End with CNTL/Z.", "config")

    if cmd in ("end", "exit") and current_mode.startswith("config"):
        new = "config" if current_mode != "config" else "privileged"
        DEVICE_MODES[key] = new
        return ("", new)

    if cmd == "exit":
        return ("", "user")

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

    # Unrecognized
    return (
        f"% Invalid input detected at '^' marker.\n"
        f"% Type 'help' for available commands.",
        current_mode,
    )


# ── API endpoint ─────────────────────────────────────────────────

@router.post("/execute", response_model=CommandResponse)
async def execute_command(req: CommandRequest, db: AsyncSession = Depends(get_db)):
    """Execute a CLI command against a simulated device and validate against lab step."""
    key      = _mode_key(req.user_id or "anon", req.lab_slug, req.device_name)
    pre_mode = DEVICE_MODES.get(key, "privileged")

    # Normalize the raw command to canonical IOS form before everything else
    normalized_cmd = normalize(req.command)

    # Use normalized command for simulation so abbreviations work correctly
    output, new_mode = simulate_output(normalized_cmd, req.device_name, mode_key=key)
    prompt = get_prompt(req.device_name, new_mode)
    is_valid = "% Invalid" not in output
    step_completed = False
    hint = None

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
async def reset_device_mode(req: CommandRequest):
    """
    Reset a device's CLI mode to privileged exec.
    Called by the frontend when the terminal connects to a device
    so stale mode state from a previous session doesn't bleed through.
    """
    key = _mode_key(req.user_id or "anon", req.lab_slug, req.device_name)
    DEVICE_MODES[key] = "privileged"
    return {"status": "ok", "prompt": get_prompt(req.device_name, "privileged")}
