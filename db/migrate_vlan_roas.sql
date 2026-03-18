-- ============================================================
-- MIGRATION: Router-on-a-Stick & Inter-VLAN Routing
-- Adds router device + 6 new lab steps to vlan-fundamentals
-- Updates VLAN theory content with expanded sections
-- Safe to run multiple times (NOT EXISTS guards)
-- ============================================================

-- ── Add router device to VLAN lab ────────────────────────────

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'R1', 'router', 'Cisco ISR 4321', 350, 50, '{"ios":"16.9"}'
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'R1');

-- ── Add Inter-VLAN Routing lab steps (9–14) ──────────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 9,
  'Connect router to switch trunk',
  E'On **SW1**, configure **GigabitEthernet0/23** as a trunk port connecting to **R1**.\n\nThis link will carry tagged VLAN traffic to the router for inter-VLAN routing.',
  'switchport trunk encapsulation dot1q → switchport mode trunk',
  'The router-on-a-stick design uses a single physical link between the switch and router. The switch side must be a trunk so both VLAN 10 and VLAN 20 traffic reaches the router.',
  'SW1',
  ARRAY['interface GigabitEthernet0/23', 'switchport trunk encapsulation dot1q', 'switchport mode trunk', 'no shutdown'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 9);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 10,
  'Create sub-interface for VLAN 10',
  E'On **R1**, create sub-interface **GigabitEthernet0/0.10** for VLAN 10.\n\nSet the encapsulation to 802.1Q with VLAN 10 and assign IP address **10.0.10.1/24** as the default gateway for the Engineering VLAN.',
  'interface Gi0/0.10 → encapsulation dot1Q 10 → ip address 10.0.10.1 255.255.255.0',
  'Sub-interfaces are virtual divisions of a physical interface. Each sub-interface handles traffic for one VLAN. The encapsulation dot1Q command tells the router which VLAN tag to expect and add on this sub-interface.',
  'R1',
  ARRAY['configure terminal', 'interface GigabitEthernet0/0.10', 'encapsulation dot1Q 10', 'ip address 10.0.10.1 255.255.255.0'],
  'command',
  '{"require_all": true}',
  15
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 10);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 11,
  'Create sub-interface for VLAN 20',
  E'On **R1**, create sub-interface **GigabitEthernet0/0.20** for VLAN 20.\n\nSet encapsulation to 802.1Q VLAN 20 and assign IP **10.0.20.1/24** as the default gateway for the Sales VLAN.',
  'interface Gi0/0.20 → encapsulation dot1Q 20 → ip address 10.0.20.1 255.255.255.0',
  'Each VLAN gets its own sub-interface with its own IP subnet. The router uses these IPs as the default gateway for hosts in each VLAN. When a host in VLAN 10 wants to reach VLAN 20, the packet goes to 10.0.10.1 (its gateway), the router routes it to 10.0.20.0/24, and sends it back down the trunk tagged with VLAN 20.',
  'R1',
  ARRAY['interface GigabitEthernet0/0.20', 'encapsulation dot1Q 20', 'ip address 10.0.20.1 255.255.255.0'],
  'command',
  '{"require_all": true}',
  15
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 11);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 12,
  'Enable the physical interface',
  E'Bring up the physical interface **GigabitEthernet0/0** on **R1**.\n\nThe sub-interfaces won''t work unless the parent physical interface is up.',
  'interface GigabitEthernet0/0 → no shutdown',
  'Sub-interfaces inherit the up/down state of their parent physical interface. A common mistake is configuring sub-interfaces but forgetting to bring up the parent — everything stays down.',
  'R1',
  ARRAY['interface GigabitEthernet0/0', 'no shutdown'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 12);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 13,
  'Verify sub-interfaces',
  E'On **R1**, verify that both sub-interfaces are up and have the correct IP addresses.\n\nUse `show ip interface brief` to see all interfaces and their status.',
  'show ip interface brief',
  'Both Gi0/0.10 and Gi0/0.20 should show "up/up" with their assigned IPs. If they show "down/down", check that the parent interface Gi0/0 is enabled and the trunk link to SW1 is active.',
  'R1',
  ARRAY['show ip interface brief'],
  'command',
  '{"require_any": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 13);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 14,
  'Test inter-VLAN connectivity',
  E'From **R1**, ping both VLAN gateways and test that traffic can route between VLANs.\n\nPing 10.0.10.1 (VLAN 10 gateway) and 10.0.20.1 (VLAN 20 gateway) to confirm both sub-interfaces are reachable.\n\nIn a real network, you would also ping from PC1 (VLAN 10) to PC2 (VLAN 20) to verify end-to-end inter-VLAN routing.',
  'ping 10.0.10.1 then ping 10.0.20.1',
  'If both pings succeed, inter-VLAN routing is working. Traffic from VLAN 10 hosts destined for VLAN 20 will: (1) leave the host to its gateway 10.0.10.1, (2) arrive at R1 via the trunk on sub-interface Gi0/0.10, (3) R1 routes to 10.0.20.0/24 via Gi0/0.20, (4) R1 sends the frame back down the trunk tagged with VLAN 20, (5) SW1 delivers it to the VLAN 20 access port.',
  'R1',
  ARRAY['ping 10.0.10.1', 'ping 10.0.20.1'],
  'command',
  '{"require_all": true}',
  15
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 14);

-- ── Update VLAN theory content ───────────────────────────────
-- Replace the existing theory with expanded version including RoaS and Inter-VLAN

UPDATE topic_content SET
theory_md = E'## What Are VLANs?\n\nA **Virtual LAN (VLAN)** is a logical partition of a Layer 2 network. VLANs divide a single physical switch into multiple **isolated broadcast domains**, so devices in different VLANs cannot communicate directly — even if they share the same switch.\n\n## Why VLANs Exist\n\nWithout VLANs, every device on a switch receives every broadcast frame. In a 500-device campus, this means:\n- **Broadcast storms** consume bandwidth\n- **Security** is nonexistent — any device can sniff all traffic\n- **Performance** degrades as the network grows\n\nVLANs solve all three: each VLAN is its own broadcast domain.\n\n## How VLANs Work\n\n### Access Ports\nAn **access port** belongs to exactly one VLAN. The switch strips the VLAN tag from outgoing frames and adds it to incoming frames. End devices (PCs, printers) never see the VLAN tag.\n\n### Trunk Ports\nA **trunk port** carries traffic for multiple VLANs simultaneously using **802.1Q tagging**. Each Ethernet frame gets a 4-byte tag inserted between the source MAC and EtherType fields:\n\n```\n| Dest MAC | Src MAC | 802.1Q Tag (4B) | EtherType | Payload | FCS |\n                     |TPID|PCP|DEI|VID|\n```\n\n- **TPID**: 0x8100 (identifies 802.1Q)\n- **VID**: 12-bit VLAN ID (1–4094)\n- **PCP**: 3-bit priority (for QoS)\n\n### Native VLAN\nThe **native VLAN** is sent untagged on trunk ports. Both sides must agree on the native VLAN — mismatches cause connectivity issues and security vulnerabilities (VLAN hopping).\n\n### VLAN Database\nVLANs are stored locally on each switch. **VTP (VLAN Trunking Protocol)** can synchronize VLAN databases across switches, but many networks disable it to prevent accidental VLAN deletions.\n\n## Inter-VLAN Routing\n\nVLANs isolate traffic at Layer 2 — but most networks need hosts in different VLANs to communicate (e.g., Engineering needs to reach the file server on the Server VLAN). This requires **inter-VLAN routing**: a Layer 3 device that routes packets between VLAN subnets.\n\nThere are three main approaches:\n\n### 1. Router-on-a-Stick (RoaS)\n\nA single router interface connects to the switch via a **trunk link**. The router creates **sub-interfaces** — one per VLAN — each with its own IP address (the default gateway for that VLAN).\n\n```\n           Trunk (802.1Q)\n[SW1] ════════════════════ [R1]\n                            ├── Gi0/0.10  →  10.0.10.1/24 (VLAN 10)\n                            ├── Gi0/0.20  →  10.0.20.1/24 (VLAN 20)\n                            └── Gi0/0.30  →  10.0.30.1/24 (VLAN 30)\n```\n\n**How it works step-by-step:**\n1. PC1 (VLAN 10, IP 10.0.10.100) wants to reach PC2 (VLAN 20, IP 10.0.20.100)\n2. PC1 sends the packet to its default gateway: 10.0.10.1 (R1 sub-interface Gi0/0.10)\n3. The switch sends the frame on the trunk link tagged with VLAN 10\n4. R1 receives it on Gi0/0.10, strips the tag, and routes the packet\n5. R1 looks up 10.0.20.0/24 → matches Gi0/0.20\n6. R1 sends the packet out Gi0/0.20, which tags it with VLAN 20\n7. The switch receives the VLAN 20-tagged frame and delivers it to PC2''s access port\n\n**Advantages:**\n- Simple — only one physical link needed\n- Works with any Layer 3 router\n- Easy to add more VLANs (just add sub-interfaces)\n\n**Disadvantages:**\n- The single trunk link is a bandwidth bottleneck\n- All inter-VLAN traffic competes for one link\n- Not suitable for high-traffic environments\n\n### 2. Layer 3 Switch (SVI)\n\nA **Layer 3 switch** creates virtual interfaces called **SVIs (Switch Virtual Interfaces)** for each VLAN. Routing happens in hardware at wire speed — no external router needed.\n\n```\nSwitch(config)# interface vlan 10\nSwitch(config-if)# ip address 10.0.10.1 255.255.255.0\nSwitch(config)# interface vlan 20\nSwitch(config-if)# ip address 10.0.20.1 255.255.255.0\nSwitch(config)# ip routing\n```\n\n**Advantages:**\n- Wire-speed routing (hardware ASICs)\n- No trunk bottleneck\n- Simpler topology (fewer devices)\n\n**Disadvantages:**\n- L3 switches cost more than L2 switches\n- Requires `ip routing` to be enabled\n\n### 3. Dedicated Router per VLAN (Legacy)\n\nEach VLAN gets its own physical router interface. This wastes ports and is rarely used today.\n\n## Choosing the Right Approach\n\n| Scenario | Best Approach |\n|----------|---------------|\n| Small office, < 50 users | Router-on-a-Stick |\n| Medium campus, 50–500 users | L3 Switch with SVIs |\n| Data center | L3 Switch / fabric routing |\n| Branch with existing router | Router-on-a-Stick |\n\n## VLAN Ranges\n\n| Range | Use |\n|-------|-----|\n| 1 | Default VLAN (cannot be deleted) |\n| 2–1001 | Normal range (stored in vlan.dat) |\n| 1002–1005 | Legacy (FDDI/Token Ring) |\n| 1006–4094 | Extended range (requires VTP transparent mode) |',

practical_md = E'## When to Use VLANs\n\n- **Department segmentation**: Engineering, Sales, HR on separate VLANs\n- **Guest isolation**: Visitors get internet-only VLAN\n- **Voice VLANs**: Separate VLAN for IP phones (QoS priority)\n- **IoT/OT separation**: Keep cameras, sensors off the corporate VLAN\n\n## Essential IOS Commands\n\n### VLAN Creation & Port Assignment\n\n```\n! Create a VLAN\nSwitch(config)# vlan 10\nSwitch(config-vlan)# name Engineering\n\n! Assign an access port\nSwitch(config)# interface GigabitEthernet0/1\nSwitch(config-if)# switchport mode access\nSwitch(config-if)# switchport access vlan 10\nSwitch(config-if)# no shutdown\n\n! Configure a trunk port\nSwitch(config)# interface GigabitEthernet0/24\nSwitch(config-if)# switchport trunk encapsulation dot1q\nSwitch(config-if)# switchport mode trunk\nSwitch(config-if)# switchport trunk allowed vlan 10,20,30\n```\n\n### Router-on-a-Stick Configuration\n\n```\n! Step 1: Configure trunk on the switch side\nSwitch(config)# interface GigabitEthernet0/23\nSwitch(config-if)# switchport trunk encapsulation dot1q\nSwitch(config-if)# switchport mode trunk\nSwitch(config-if)# no shutdown\n\n! Step 2: Create sub-interfaces on the router\nRouter(config)# interface GigabitEthernet0/0.10\nRouter(config-subif)# encapsulation dot1Q 10\nRouter(config-subif)# ip address 10.0.10.1 255.255.255.0\n\nRouter(config)# interface GigabitEthernet0/0.20\nRouter(config-subif)# encapsulation dot1Q 20\nRouter(config-subif)# ip address 10.0.20.1 255.255.255.0\n\n! Step 3: Bring up the physical interface\nRouter(config)# interface GigabitEthernet0/0\nRouter(config-if)# no shutdown\n\n! Step 4: Verify\nRouter# show ip interface brief\nRouter# show vlans        (shows sub-interface VLAN mapping)\n```\n\n### Layer 3 Switch (SVI) Configuration\n\n```\n! Enable L3 routing\nSwitch(config)# ip routing\n\n! Create SVIs\nSwitch(config)# interface vlan 10\nSwitch(config-if)# ip address 10.0.10.1 255.255.255.0\nSwitch(config-if)# no shutdown\n\nSwitch(config)# interface vlan 20\nSwitch(config-if)# ip address 10.0.20.1 255.255.255.0\nSwitch(config-if)# no shutdown\n\n! Verify\nSwitch# show ip route\nSwitch# show interfaces vlan 10\n```\n\n### Verify Inter-VLAN Routing\n\n```\n! From a host in VLAN 10, ping a host in VLAN 20\nPC1> ping 10.0.20.100\n\n! Check the routing table\nRouter# show ip route\n\n! Verify sub-interfaces\nRouter# show ip interface brief\n\n! Check trunk status\nSwitch# show interfaces trunk\n```\n\n## Troubleshooting Checklist\n\n### VLANs\n1. Does the VLAN exist on **both** switches? (`show vlan brief`)\n2. Is the trunk link actually trunking? (`show interfaces trunk`)\n3. Is the VLAN **allowed** on the trunk? (`switchport trunk allowed vlan`)\n4. Do both trunk ends agree on **native VLAN**?\n5. Is the port in the right mode? (`show interfaces switchport`)\n\n### Router-on-a-Stick\n1. Is the physical interface **up**? (most common mistake)\n2. Does each sub-interface have `encapsulation dot1Q {vlan-id}`?\n3. Does the VLAN ID in `encapsulation dot1Q` match the actual VLAN?\n4. Is the switch port connecting to the router set to **trunk mode**?\n5. Are the sub-interface IPs on the **correct subnets**?\n6. Do hosts have the **correct default gateway** (the sub-interface IP)?\n\n### Layer 3 Switch SVIs\n1. Is `ip routing` enabled globally?\n2. Is the SVI in **up/up** state? (requires at least one active port in that VLAN)\n3. Are the SVI IPs correct?\n\n## Design Best Practices\n\n- Keep VLAN scope to a single distribution layer (avoid stretched VLANs)\n- Use VLAN 1 for nothing — change the native VLAN to an unused ID\n- Document your VLAN numbering scheme (e.g., 10x = floor 1, 20x = floor 2)\n- Prune trunk links to carry only necessary VLANs\n- Use **L3 switches with SVIs** for inter-VLAN routing in production (wire-speed)\n- Reserve **Router-on-a-Stick** for small branches or lab environments\n- Always assign each VLAN a **unique IP subnet** (don''t overlap)\n- Set the sub-interface IP as the DHCP pool''s default-router for that VLAN',

key_commands = '["vlan {id}", "name {name}", "switchport mode access", "switchport access vlan {id}", "switchport mode trunk", "switchport trunk encapsulation dot1q", "switchport trunk allowed vlan {list}", "interface Gi0/0.{vlan}", "encapsulation dot1Q {vlan}", "ip address {gateway} {mask}", "ip routing", "interface vlan {id}", "show vlan brief", "show interfaces trunk", "show ip interface brief", "show ip route"]',

common_mistakes = '["Forgetting to create the VLAN on the remote switch", "Native VLAN mismatch between trunk endpoints", "Not allowing the VLAN on the trunk", "Leaving ports in VLAN 1 (security risk)", "Router-on-a-Stick: forgetting to enable the physical parent interface (no shutdown)", "Sub-interface VLAN ID does not match the actual VLAN number", "Switch port facing the router is in access mode instead of trunk mode", "Hosts configured with wrong default gateway (must match sub-interface IP)", "L3 switch: forgetting to enable ip routing globally", "SVI shows down/down because no ports are active in that VLAN"]'

WHERE topic_id = (SELECT id FROM topics WHERE slug = 'vlans');

-- ── Update lab description and estimated time ────────────────

UPDATE labs SET
  description = 'Configure VLANs on switches, assign access ports, set up trunk links with 802.1Q encapsulation, configure Router-on-a-Stick for inter-VLAN routing, and verify end-to-end connectivity between VLANs.',
  estimated_minutes = 40
WHERE slug = 'vlan-fundamentals';
