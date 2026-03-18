-- ============================================================
-- MIGRATION: SVI / Layer 3 Switch Inter-VLAN Routing
-- Adds L3 switch device + 8 new steps (15–22) to vlan-fundamentals
-- Safe to run multiple times (NOT EXISTS guards)
-- ============================================================

-- ── Add L3 switch device ─────────────────────────────────────

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'L3-SW1', 'l3_switch', 'Cisco 3850', 350, 150, '{"ios":"16.9","ports":48}'
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'L3-SW1');

-- Add a server on VLAN 30 to give the SVI section its own traffic to route
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'SRV1', 'server', 'Linux Server', 350, 350, '{"os":"Linux"}'
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'SRV1');

-- ── Step 15: Enable IP routing on the L3 switch ──────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 15,
  'Enable IP routing on L3 switch',
  E'On **L3-SW1**, enable Layer 3 routing globally.\n\nBy default, Cisco L3 switches operate as Layer 2 switches. You must explicitly enable IP routing to use SVIs for inter-VLAN routing.',
  'ip routing',
  'The `ip routing` command enables the CEF (Cisco Express Forwarding) hardware on the switch to make routing decisions. Without this, the switch ignores all Layer 3 traffic between VLANs even if SVIs are configured.',
  'L3-SW1',
  ARRAY['configure terminal', 'ip routing'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 15);

-- ── Step 16: Create VLANs on the L3 switch ───────────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 16,
  'Create VLANs on L3 switch',
  E'On **L3-SW1**, create VLAN 10 (Engineering), VLAN 20 (Sales), and VLAN 30 (Servers).\n\nThe L3 switch needs the same VLANs as the access switches, plus a new VLAN 30 for the server farm.',
  'vlan 10 → name Engineering, vlan 20 → name Sales, vlan 30 → name Servers',
  'Even on an L3 switch, VLANs must be created in the VLAN database before SVIs can come up. An SVI for a VLAN that doesn''t exist (or has no active ports) will stay in down/down state.',
  'L3-SW1',
  ARRAY['vlan 10', 'name Engineering', 'vlan 20', 'name Sales', 'vlan 30', 'name Servers'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 16);

-- ── Step 17: Create SVI for VLAN 10 ─────────────────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 17,
  'Create SVI for VLAN 10',
  E'On **L3-SW1**, create the SVI (Switch Virtual Interface) for VLAN 10.\n\nAssign IP address **10.0.10.1/24** — this becomes the default gateway for all Engineering hosts.\n\nMake sure to bring the interface up with `no shutdown`.',
  'interface vlan 10 → ip address 10.0.10.1 255.255.255.0 → no shutdown',
  'An SVI is a virtual Layer 3 interface associated with a VLAN. Unlike Router-on-a-Stick where traffic leaves the switch, travels to the router, and comes back, an SVI routes traffic internally within the switch ASIC at wire speed. This is dramatically faster — line-rate forwarding with no external bottleneck.',
  'L3-SW1',
  ARRAY['interface vlan 10', 'ip address 10.0.10.1 255.255.255.0', 'no shutdown'],
  'command',
  '{"require_all": true}',
  15
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 17);

-- ── Step 18: Create SVI for VLAN 20 ─────────────────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 18,
  'Create SVI for VLAN 20',
  E'Create the SVI for VLAN 20 (Sales) with IP address **10.0.20.1/24**.',
  'interface vlan 20 → ip address 10.0.20.1 255.255.255.0 → no shutdown',
  'Each VLAN that needs to participate in routing gets its own SVI. The SVI IP is the default gateway for hosts in that VLAN. You can have dozens of SVIs on a single L3 switch — each one routes to every other SVI without any external links.',
  'L3-SW1',
  ARRAY['interface vlan 20', 'ip address 10.0.20.1 255.255.255.0', 'no shutdown'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 18);

-- ── Step 19: Create SVI for VLAN 30 (Servers) ───────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 19,
  'Create SVI for VLAN 30 (Servers)',
  E'Create the SVI for VLAN 30 (Servers) with IP address **10.0.30.1/24**.\n\nThis allows Engineering and Sales hosts to reach servers on VLAN 30 through the L3 switch.',
  'interface vlan 30 → ip address 10.0.30.1 255.255.255.0 → no shutdown',
  'In a real network, you would likely apply ACLs to the VLAN 30 SVI to restrict which VLANs can access the servers and on which ports. For example, you might allow HTTP/HTTPS from VLAN 10 and 20 but deny SSH from VLAN 20.',
  'L3-SW1',
  ARRAY['interface vlan 30', 'ip address 10.0.30.1 255.255.255.0', 'no shutdown'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 19);

-- ── Step 20: Assign a port to VLAN 30 ───────────────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 20,
  'Assign server port to VLAN 30',
  E'On **L3-SW1**, assign interface **GigabitEthernet0/10** as an access port in VLAN 30 for the server **SRV1**.\n\nThis gives the SVI at least one active port so it comes up.',
  'interface Gi0/10 → switchport mode access → switchport access vlan 30 → no shutdown',
  'An SVI will only come up (show line protocol up) if the VLAN has at least one physical port in the up/up state — either an access port in that VLAN or a trunk port that allows that VLAN. If all ports in a VLAN are down, the SVI goes down too.',
  'L3-SW1',
  ARRAY['interface GigabitEthernet0/10', 'switchport mode access', 'switchport access vlan 30', 'no shutdown'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 20);

-- ── Step 21: Verify SVIs and routing table ───────────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 21,
  'Verify SVIs and routing table',
  E'On **L3-SW1**, verify all three SVIs are up and check the routing table.\n\nUse `show ip interface brief` to confirm VLAN interfaces show **up/up** with correct IPs.\n\nThen use `show ip route` to see the connected routes for each VLAN subnet.',
  'show ip interface brief → show ip route',
  'The routing table should show three directly connected (C) routes — one for each SVI subnet. Because `ip routing` is enabled, the switch automatically adds connected routes for every up/up SVI. Packets arriving on one SVI destined for another SVI''s subnet are routed internally in hardware.',
  'L3-SW1',
  ARRAY['show ip interface brief', 'show ip route'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 21);

-- ── Step 22: Test inter-VLAN routing via SVI ─────────────────

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 22,
  'Test inter-VLAN routing via SVI',
  E'From **L3-SW1**, test connectivity across all three VLANs.\n\nPing the VLAN 10 gateway (10.0.10.1), VLAN 20 gateway (10.0.20.1), and VLAN 30 gateway (10.0.30.1).\n\nThen ping a cross-VLAN address to confirm routing works: from VLAN 10''s perspective, try reaching 10.0.30.1 (the server VLAN).\n\nIn production you would test from actual hosts, but pinging the SVI IPs confirms the L3 forwarding path is functional.',
  'ping 10.0.10.1 → ping 10.0.20.1 → ping 10.0.30.1',
  'Unlike Router-on-a-Stick where inter-VLAN traffic traverses a physical trunk link twice (switch → router → switch), SVI routing happens entirely inside the switch''s forwarding ASIC. A packet from VLAN 10 to VLAN 30 is received on an access port, the destination IP is looked up in the CEF table, and the packet is switched to a VLAN 30 port — all in hardware at line rate, typically under 1 microsecond.',
  'L3-SW1',
  ARRAY['ping 10.0.10.1', 'ping 10.0.20.1', 'ping 10.0.30.1'],
  'command',
  '{"require_all": true}',
  15
FROM labs l WHERE l.slug = 'vlan-fundamentals'
AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 22);

-- ── Update lab metadata ──────────────────────────────────────

UPDATE labs SET
  description = 'Configure VLANs on switches, assign access ports, set up trunk links with 802.1Q encapsulation, configure Router-on-a-Stick with sub-interfaces for inter-VLAN routing, then build the same inter-VLAN routing using Layer 3 switch SVIs. Compare both approaches and verify end-to-end connectivity.',
  estimated_minutes = 55
WHERE slug = 'vlan-fundamentals';
