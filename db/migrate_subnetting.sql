-- ============================================================
-- MIGRATION: IPv4 Subnetting (Class C focus) + Integration SVI
-- Safe to run multiple times
-- ============================================================

-- 1. Topic
INSERT INTO topics (slug, name, description, icon, color, sort_order)
VALUES ('ipv4-subnetting', 'IPv4 Subnetting', 'Divide networks into smaller subnets using CIDR and subnet masks', 'calculator', '#0ea5e9', 0)
ON CONFLICT (slug) DO NOTHING;

-- 2. Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order)
VALUES ('ipv4-subnetting-lab', 'IPv4 Subnetting — Class C', 'Design and implement a subnetted Class C network from scratch',
'Plan subnet addressing for a multi-department office using 192.168.1.0/24. Calculate subnet masks, usable host ranges, and broadcast addresses. Configure devices with correct IPs and verify connectivity between subnets.',
'beginner', 35, 0)
ON CONFLICT (slug) DO NOTHING;

-- Link lab to topic
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'ipv4-subnetting-lab' AND t.slug = 'ipv4-subnetting'
AND NOT EXISTS (SELECT 1 FROM lab_topics lt WHERE lt.lab_id = l.id AND lt.topic_id = t.id);

-- Link subnetting to integration lab
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'full-enterprise-network' AND t.slug = 'ipv4-subnetting'
AND NOT EXISTS (SELECT 1 FROM lab_topics lt WHERE lt.lab_id = l.id AND lt.topic_id = t.id);

-- 3. Devices
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'R1', 'router', 'Cisco ISR 4321', 350, 50, '{"ios":"16.9"}' FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'R1');
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'SW1', 'switch', 'Cisco 2960', 200, 200, '{"ports":24}' FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'SW1');
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'SW2', 'switch', 'Cisco 2960', 500, 200, '{"ports":24}' FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'SW2');
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'PC1', 'workstation', 'Desktop', 100, 350, '{}' FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'PC1');
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'PC2', 'workstation', 'Desktop', 350, 350, '{}' FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'PC2');
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'PC3', 'workstation', 'Desktop', 600, 350, '{}' FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM devices d WHERE d.lab_id = l.id AND d.name = 'PC3');

-- 4. Lab steps (8 steps)
INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1, 'Plan the subnet scheme',
E'You have **192.168.1.0/24** for three departments:\n- **Engineering**: 50 hosts → /26 (62 usable) → 192.168.1.0/26\n- **Sales**: 25 hosts → /27 (30 usable) → 192.168.1.64/27\n- **Management**: 10 hosts → /28 (14 usable) → 192.168.1.96/28\n\nOn **R1**, check the current state with `show ip interface brief`.',
'show ip interface brief',
'Subnetting starts with requirements. Count hosts per department, find the smallest subnet that fits, and allocate sequentially. /26 borrows 2 bits from /24 → 4 subnets of 62 hosts. /27 borrows 3 bits → 32-host blocks. /28 borrows 4 bits → 16-host blocks.',
'R1', ARRAY['show ip interface brief'], 'command', 10
FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 1);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2, 'Configure Engineering subnet (/26)',
E'On **R1**, configure **Gi0/0** with the first usable IP in the Engineering subnet.\n\nSubnet: **192.168.1.0/26**\n- Network: 192.168.1.0\n- First usable: 192.168.1.1\n- Last usable: 192.168.1.62\n- Broadcast: 192.168.1.63\n- Mask: 255.255.255.192\n\nAssign **192.168.1.1/26**.',
'ip address 192.168.1.1 255.255.255.192',
'Mask 255.255.255.192 = /26. Binary: 11111111.11111111.11111111.11000000. The last 6 bits are host bits → 2^6 - 2 = 62 usable addresses. The .192 tells the router where the network/host boundary falls.',
'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 192.168.1.1 255.255.255.192', 'no shutdown'], 'command', 15
FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 2);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3, 'Configure Sales subnet (/27)',
E'Configure **Gi0/1** for the Sales subnet.\n\nSubnet: **192.168.1.64/27**\n- Network: 192.168.1.64\n- First usable: 192.168.1.65\n- Last usable: 192.168.1.94\n- Broadcast: 192.168.1.95\n- Mask: 255.255.255.224\n\nAssign **192.168.1.65/27**.',
'ip address 192.168.1.65 255.255.255.224',
'Sales starts at .64 because Engineering uses .0 through .63. A /27 (255.255.255.224) creates 32-address blocks. Block size = 256 - 224 = 32.',
'R1', ARRAY['interface GigabitEthernet0/1', 'ip address 192.168.1.65 255.255.255.224', 'no shutdown'], 'command', 15
FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 3);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4, 'Configure Management subnet (/28)',
E'Configure **Gi0/2** for the Management subnet.\n\nSubnet: **192.168.1.96/28**\n- Network: 192.168.1.96\n- First usable: 192.168.1.97\n- Last usable: 192.168.1.110\n- Broadcast: 192.168.1.111\n- Mask: 255.255.255.240\n\nAssign **192.168.1.97/28**.',
'ip address 192.168.1.97 255.255.255.240',
'/28 borrows 4 bits → 2^4 - 2 = 14 usable addresses. Mask 255.255.255.240 = 11110000 in the last octet. Block size = 256 - 240 = 16. Management starts after Sales broadcast (.95) at .96.',
'R1', ARRAY['interface GigabitEthernet0/2', 'ip address 192.168.1.97 255.255.255.240', 'no shutdown'], 'command', 15
FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 4);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5, 'Verify the routing table',
E'On **R1**, verify all three subnets appear as connected routes.\n\nExpected:\n- C  192.168.1.0/26 via Gi0/0\n- C  192.168.1.64/27 via Gi0/1\n- C  192.168.1.96/28 via Gi0/2',
'show ip route',
'Connected routes appear automatically when an interface has an IP and is up/up. The router now knows how to reach all three subnets directly.',
'R1', ARRAY['show ip route'], 'command', 10
FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 5);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6, 'Test cross-subnet connectivity',
E'From **R1**, ping each subnet gateway to verify connectivity.\n\nPing 192.168.1.1, 192.168.1.65, and 192.168.1.97.',
'ping 192.168.1.1 then ping 192.168.1.65 then ping 192.168.1.97',
'R1 has interfaces on all three subnets so it routes between them. In production, PC1 (Engineering) uses 192.168.1.1 as gateway, PC2 (Sales) uses .65, management hosts use .97.',
'R1', ARRAY['ping 192.168.1.1', 'ping 192.168.1.65', 'ping 192.168.1.97'], 'command', 10
FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 6);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 7, 'Configure a /30 WAN link',
E'Configure a point-to-point WAN link using the smallest usable subnet.\n\nSubnet: **192.168.1.112/30**\n- R1 side: 192.168.1.113\n- Remote: 192.168.1.114\n- Mask: 255.255.255.252\n\nConfigure **Serial0/0/0** on R1.',
'ip address 192.168.1.113 255.255.255.252',
'/30 is the smallest usable subnet: 4 addresses, 2 usable. Standard for point-to-point WAN links. Block size = 256 - 252 = 4.',
'R1', ARRAY['interface Serial0/0/0', 'ip address 192.168.1.113 255.255.255.252', 'no shutdown'], 'command', 15
FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 7);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 8, 'Verify complete addressing',
E'Review the full configuration.\n\nYour 192.168.1.0/24 is now divided into:\n- .0/26 — Engineering (62 hosts)\n- .64/27 — Sales (30 hosts)\n- .96/28 — Management (14 hosts)\n- .112/30 — WAN (2 hosts)\n- .116–.255 — future growth\n\nUse `show ip interface brief` to confirm all interfaces.',
'show ip interface brief',
'VLSM lets you use different-sized subnets from one parent network. Allocate largest first, then progressively smaller. No address space is wasted.',
'R1', ARRAY['show ip interface brief'], 'command', 10
FROM labs l WHERE l.slug = 'ipv4-subnetting-lab' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 8);

-- 5. Theory content
INSERT INTO topic_content (topic_id, osi_layer, rfc_references, theory_md, practical_md, diagram_type, diagram_data, key_commands, common_mistakes)
SELECT t.id, 'Layer 3 — Network', ARRAY['RFC 791', 'RFC 1878', 'RFC 4632 (CIDR)'],
E'## IPv4 Subnetting\n\nSubnetting divides a single IP network into smaller segments called **subnets**. Each subnet has its own network address, usable host range, and broadcast address.\n\n## Why Subnet?\n\n- **Efficient address use**: Don''t waste a /24 (254 hosts) on a 10-person department\n- **Broadcast control**: Smaller subnets = smaller broadcast domains\n- **Security**: Separate departments for access control\n- **Organization**: Logical grouping matches organizational structure\n\n## IPv4 Address Structure\n\nAn IPv4 address is 32 bits written as four octets:\n\n```\n192.168.1.100 = 11000000.10101000.00000001.01100100\n```\n\nThe **subnet mask** determines which bits are network vs host:\n\n```\n255.255.255.0   = 11111111.11111111.11111111.00000000 = /24\n255.255.255.192 = 11111111.11111111.11111111.11000000 = /26\n255.255.255.224 = 11111111.11111111.11111111.11100000 = /27\n255.255.255.240 = 11111111.11111111.11111111.11110000 = /28\n```\n\n## Class C Subnetting Reference\n\nStarting from a /24 (256 addresses):\n\n| CIDR | Mask | Subnets | Hosts/Subnet | Block Size |\n|------|------|---------|-------------|------------|\n| /24 | 255.255.255.0 | 1 | 254 | 256 |\n| /25 | 255.255.255.128 | 2 | 126 | 128 |\n| /26 | 255.255.255.192 | 4 | 62 | 64 |\n| /27 | 255.255.255.224 | 8 | 30 | 32 |\n| /28 | 255.255.255.240 | 16 | 14 | 16 |\n| /29 | 255.255.255.248 | 32 | 6 | 8 |\n| /30 | 255.255.255.252 | 64 | 2 | 4 |\n\n## How to Subnet (Step-by-Step)\n\n### Step 1: Determine requirements\nHow many hosts per subnet?\n\n### Step 2: Find the mask\n**Usable hosts = 2^(host bits) - 2**\n\n- 50 hosts → 2^6 = 64 - 2 = 62 ✓ → /26\n- 25 hosts → 2^5 = 32 - 2 = 30 ✓ → /27\n- 10 hosts → 2^4 = 16 - 2 = 14 ✓ → /28\n\n### Step 3: Calculate block size\n**Block size = 256 - mask last octet**\n\n- /26: 256 - 192 = 64 → subnets at .0, .64, .128, .192\n- /27: 256 - 224 = 32 → subnets at .0, .32, .64, .96...\n- /28: 256 - 240 = 16 → subnets at .0, .16, .32, .48...\n\n### Step 4: Map each subnet\n\n```\n192.168.1.0/26:\n  Network:   192.168.1.0\n  First:     192.168.1.1\n  Last:      192.168.1.62\n  Broadcast: 192.168.1.63\n\n192.168.1.64/26:\n  Network:   192.168.1.64\n  First:     192.168.1.65\n  Last:      192.168.1.126\n  Broadcast: 192.168.1.127\n```\n\n## VLSM (Variable-Length Subnet Masking)\n\nVLSM uses **different subnet sizes** within one network:\n\n```\n192.168.1.0/24 split into:\n+-- 192.168.1.0/26    (62 hosts) Engineering\n+-- 192.168.1.64/27   (30 hosts) Sales\n+-- 192.168.1.96/28   (14 hosts) Management\n+-- 192.168.1.112/30  (2 hosts)  WAN link\n+-- 192.168.1.116-255            unallocated\n```\n\n**Rule**: Allocate largest subnets first.\n\n## Key Formulas\n\n- **Subnets** = 2^(borrowed bits)\n- **Hosts** = 2^(host bits) - 2\n- **Block size** = 256 - mask last octet\n- **Broadcast** = next network - 1\n- **Network**: all host bits = 0\n- **Broadcast**: all host bits = 1\n\n## Special Addresses\n\n| Address | Purpose |\n|---------|--------|\n| x.x.x.0 (in a /24) | Network address — not assignable |\n| x.x.x.255 (in a /24) | Broadcast address — not assignable |\n| 10.0.0.0/8 | Private (RFC 1918) |\n| 172.16.0.0/12 | Private (RFC 1918) |\n| 192.168.0.0/16 | Private (RFC 1918) |\n| 169.254.0.0/16 | APIPA (link-local) |\n| 127.0.0.0/8 | Loopback |',

E'## Subnetting Cheat Sheet\n\n### Quick Lookup\n\n| Need X hosts | Mask | CIDR | Block |\n|-------------|------|------|-------|\n| 1-2 | 255.255.255.252 | /30 | 4 |\n| 3-6 | 255.255.255.248 | /29 | 8 |\n| 7-14 | 255.255.255.240 | /28 | 16 |\n| 15-30 | 255.255.255.224 | /27 | 32 |\n| 31-62 | 255.255.255.192 | /26 | 64 |\n| 63-126 | 255.255.255.128 | /25 | 128 |\n| 127-254 | 255.255.255.0 | /24 | 256 |\n\n### Configuring Subnets on Cisco IOS\n\n```\nRouter(config)# interface GigabitEthernet0/0\nRouter(config-if)# ip address 192.168.1.1 255.255.255.192\nRouter(config-if)# no shutdown\n\nRouter# show ip interface brief\nRouter# show ip route\n```\n\n### DHCP Pool with Subnets\n\n```\nRouter(config)# ip dhcp pool ENGINEERING\nRouter(dhcp-config)# network 192.168.1.0 255.255.255.192\nRouter(dhcp-config)# default-router 192.168.1.1\nRouter(dhcp-config)# dns-server 8.8.8.8\nRouter(config)# ip dhcp excluded-address 192.168.1.1 192.168.1.5\n```\n\n### OSPF with Wildcard Masks\n\n```\n! Wildcard = inverse of subnet mask\nRouter(config-router)# network 192.168.1.0 0.0.0.63 area 0\nRouter(config-router)# network 192.168.1.64 0.0.0.31 area 0\nRouter(config-router)# network 192.168.1.96 0.0.0.15 area 0\n```\n\n### ACLs with Subnet Awareness\n\n```\n! Permit only Engineering subnet\naccess-list 10 permit 192.168.1.0 0.0.0.63\n! Deny Sales, permit rest\naccess-list 110 deny ip 192.168.1.64 0.0.0.31 any\naccess-list 110 permit ip any any\n```\n\n### Worked Example\n\n**Problem**: Subnet 10.0.0.0/24 into 4 equal subnets.\n\n1. 4 subnets → borrow 2 bits → /26\n2. Block = 256 - 192 = 64\n3. Result:\n   - 10.0.0.0/26 (hosts .1-.62)\n   - 10.0.0.64/26 (hosts .65-.126)\n   - 10.0.0.128/26 (hosts .129-.190)\n   - 10.0.0.192/26 (hosts .193-.254)\n\n### Troubleshooting\n\n1. **Can''t ping across subnets?** Check default gateways\n2. **Overlapping subnets?** Verify no ranges overlap\n3. **DHCP wrong IPs?** Pool network must match interface subnet\n4. **OSPF not advertising?** Wildcard mask must match subnet\n5. **ACL too broad?** Wildcard mask may cover more hosts than intended',

'subnet-map', '{}',
'["ip address {ip} {mask}", "show ip route", "show ip interface brief", "ip dhcp pool {name}", "network {ip} {mask}", "access-list {num} permit {net} {wildcard}"]',
'["Using the network or broadcast address as a host IP", "Overlapping subnets on different interfaces", "Forgetting to subtract 2 for network + broadcast", "Wrong wildcard mask in OSPF/ACL (wildcard != subnet mask)", "Assigning a gateway IP outside the subnet", "Not allocating largest subnets first with VLSM"]'
FROM topics t WHERE t.slug = 'ipv4-subnetting' AND NOT EXISTS (SELECT 1 FROM topic_content tc WHERE tc.topic_id = t.id);

-- 6. Integration lab: subnetting + SVI steps (17-21)

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 17, 'Phase 1B: Subnet the HQ Address Space',
E'HQ uses **10.0.0.0/16**. Subnet for the four VLANs:\n- VLAN 10 (Corp): 10.0.10.0/24 (254 hosts)\n- VLAN 20 (Guest): 10.0.20.0/24 (254 hosts)\n- VLAN 30 (Mgmt): 10.0.30.0/28 (14 hosts)\n- VLAN 40 (Voice): 10.0.40.0/24 (254 hosts)\n\nConfigure **Gi0/0** on **HQ-R1** with the Corp gateway: **10.0.10.1/24**.',
'interface Gi0/0 → ip address 10.0.10.1 255.255.255.0',
'Using /24 for user VLANs gives 254 hosts each. The management VLAN uses /28 — only 14 IPs needed for switches, APs, and WLC. This is VLSM: match subnet size to requirements.',
'HQ-R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.10.1 255.255.255.0', 'no shutdown'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 17);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 18, 'Phase 1B: WAN Point-to-Point /30',
E'Configure the HQ-to-ISP link using a /30 subnet.\n\nSubnet: **203.0.113.0/30**\n- HQ-R1: 203.0.113.1\n- ISP-R1: 203.0.113.2\n\nConfigure **Gi0/2** on HQ-R1 with **203.0.113.1/30**.',
'ip address 203.0.113.1 255.255.255.252',
'Point-to-point links need only 2 usable IPs. A /30 (4 addresses, 2 usable) is the most efficient. Using a /24 would waste 252 addresses.',
'HQ-R1', ARRAY['interface GigabitEthernet0/2', 'ip address 203.0.113.1 255.255.255.252', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 18);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 19, 'Phase 1C: Enable L3 Routing on HQ-SW1',
E'**HQ-SW1** is a Cisco 3850 L3 switch. Enable IP routing so it handles inter-VLAN routing via SVIs, offloading HQ-R1 to focus on WAN/internet.',
'ip routing',
'In modern campus design, the L3 switch handles inter-VLAN routing at wire speed. The router handles WAN, VPN, NAT, and internet. This "collapsed core" design gives the best performance.',
'HQ-SW1', ARRAY['configure terminal', 'ip routing'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 19);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 20, 'Phase 1C: Create SVIs for All VLANs',
E'On **HQ-SW1**, create SVIs for all four VLANs using the subnets from Phase 1B:\n\n- VLAN 10: **10.0.10.1/24**\n- VLAN 20: **10.0.20.1/24**\n- VLAN 30: **10.0.30.1/28** (note the /28)\n- VLAN 40: **10.0.40.1/24**',
'interface vlan 10 → ip address → no shutdown, repeat for each',
'Each SVI is the default gateway for its VLAN. The /28 on VLAN 30 limits it to 14 IPs — appropriate for management devices only. All inter-VLAN routing happens in the switch ASIC at wire speed.',
'HQ-SW1', ARRAY['interface vlan 10', 'ip address 10.0.10.1 255.255.255.0', 'no shutdown', 'interface vlan 20', 'ip address 10.0.20.1 255.255.255.0', 'interface vlan 30', 'ip address 10.0.30.1 255.255.255.240', 'interface vlan 40', 'ip address 10.0.40.1 255.255.255.0'], 'command', 20
FROM labs l WHERE l.slug = 'full-enterprise-network' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 20);

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 21, 'Phase 1C: Verify SVI Routing',
E'On **HQ-SW1**, verify all SVIs are up and the routing table shows connected routes.\n\nCheck `show ip interface brief` — all VLAN interfaces up/up.\nCheck `show ip route` — connected routes for each subnet.\nPing across VLANs to confirm wire-speed routing.',
'show ip interface brief → show ip route → ping',
'With SVIs, inter-VLAN traffic stays inside the switch fabric. A VLAN 10 host pinging VLAN 20: access port → VLAN 10 → SVI 10 → L3 lookup → SVI 20 → VLAN 20 → access port. All in hardware, under 1 microsecond.',
'HQ-SW1', ARRAY['show ip interface brief', 'show ip route', 'ping 10.0.10.1', 'ping 10.0.20.1'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network' AND NOT EXISTS (SELECT 1 FROM lab_steps ls WHERE ls.lab_id = l.id AND ls.step_number = 21);

-- Update integration lab time
UPDATE labs SET estimated_minutes = 140 WHERE slug = 'full-enterprise-network';
