-- ============================================================
-- MIGRATION: Rebuild Integration Lab Steps
-- Deletes ALL existing steps and re-inserts in logical order
-- Beginner → Intermediate → Advanced → Expert
-- ============================================================

-- Wipe existing steps (progress will need to be reset)
DELETE FROM user_step_progress
WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');

DELETE FROM user_lab_progress
WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');

DELETE FROM command_history
WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');

DELETE FROM lab_steps
WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');

-- ============================================================
-- PHASE 1: Layer 2 Fundamentals (Beginner)
-- Build the campus LAN from scratch
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Phase 1: Plan the IP Addressing Scheme',
  E'Before configuring anything, plan the HQ addressing scheme.\n\nSubnet **10.0.0.0/24** into four **/26** subnets for the campus VLANs:\n\n| VLAN | Name | Subnet | Gateway | Usable Range |\n|------|------|--------|---------|-------------|\n| 10 | Corp | 10.0.0.0/26 | 10.0.0.1 | .2 – .62 |\n| 20 | Guest | 10.0.0.64/26 | 10.0.0.65 | .66 – .126 |\n| 30 | Mgmt | 10.0.0.128/26 | 10.0.0.129 | .130 – .190 |\n| 40 | Voice | 10.0.0.192/26 | 10.0.0.193 | .194 – .254 |\n\nOn **HQ-SW1**, enter global configuration mode to begin building the network.',
  'configure terminal',
  'A /26 borrows 2 bits from the host portion of a /24, creating 4 subnets with 62 usable hosts each. Block size = 256 − 192 = 64, so subnets start at .0, .64, .128, .192. Planning the scheme FIRST prevents IP conflicts and overlapping subnets down the line.',
  'HQ-SW1',
  ARRAY['configure terminal'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Phase 1: Create VLANs',
  E'On **HQ-SW1**, create all four campus VLANs:\n\n- VLAN 10 — **Corp**\n- VLAN 20 — **Guest**\n- VLAN 30 — **Mgmt**\n- VLAN 40 — **Voice**\n\nAlso create them on **HQ-SW2** (VLANs must exist on every switch that uses them).',
  'vlan 10 → name Corp, repeat for 20/30/40',
  'VLANs segment the broadcast domain. Without them, every host on the switch shares one broadcast domain — a security and performance nightmare. Each VLAN is its own isolated Layer 2 network.',
  'HQ-SW1',
  ARRAY['vlan 10', 'name Corp', 'vlan 20', 'name Guest', 'vlan 30', 'name Mgmt', 'vlan 40', 'name Voice'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Phase 1: Configure Trunk Links with LACP',
  E'Bundle the uplinks between **HQ-SW1** and **HQ-SW2** into an LACP EtherChannel.\n\nOn HQ-SW1, configure interfaces Gi0/1-2 as LACP active in channel-group 1.\nThen configure the Port-channel1 interface as a trunk allowing VLANs 10,20,30,40.',
  'interface range Gi0/1-2 → channel-group 1 mode active → interface Po1 → switchport mode trunk',
  'LACP bundles multiple physical links into one logical link, doubling bandwidth and providing failover. The trunk carries all VLAN traffic between switches. Both sides must be configured — the EtherChannel won''t form with a one-sided config.',
  'HQ-SW1',
  ARRAY['interface range GigabitEthernet0/1-2', 'channel-group 1 mode active', 'interface Port-channel1', 'switchport trunk encapsulation dot1q', 'switchport mode trunk'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Phase 1: Set STP Root Bridge',
  E'Set **HQ-SW1** as the STP root bridge for all VLANs to ensure predictable traffic paths.\n\nAlso enable PortFast on all access ports to eliminate the 30-second STP delay for end devices.',
  'spanning-tree vlan 10 priority 4096 (repeat for each VLAN) → spanning-tree portfast default',
  'Without explicit root bridge selection, the switch with the lowest MAC address wins — which might be a low-end access switch. Setting priority 4096 on the distribution switch guarantees optimal forwarding paths. PortFast lets PCs come online immediately instead of waiting through STP listening/learning states.',
  'HQ-SW1',
  ARRAY['spanning-tree vlan 10 priority 4096', 'spanning-tree vlan 20 priority 4096', 'spanning-tree vlan 30 priority 4096', 'spanning-tree vlan 40 priority 4096', 'spanning-tree portfast default'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Phase 1: Verify Layer 2',
  E'Verify the campus Layer 2 configuration:\n\n- Check VLANs exist: `show vlan brief`\n- Check EtherChannel is bundled: `show etherchannel summary`\n- Check STP root status: `show spanning-tree`',
  'show vlan brief → show etherchannel summary → show spanning-tree',
  'Always verify after each phase. VLANs should show active with correct names. EtherChannel should show Po1 with (P) flags on member ports. STP should show HQ-SW1 as root for all VLANs.',
  'HQ-SW1',
  ARRAY['show vlan brief', 'show etherchannel summary', 'show spanning-tree'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 2: Inter-VLAN Routing with SVIs (Beginner→Intermediate)
-- Enable L3 forwarding on the campus switch
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Phase 2: Enable L3 Routing on HQ-SW1',
  E'Enable IP routing on **HQ-SW1** so it can route between VLANs at wire speed.\n\nThen create SVIs for each VLAN using the /26 gateway IPs from your addressing plan:\n\n- VLAN 10: **10.0.0.1/26**\n- VLAN 20: **10.0.0.65/26**',
  'ip routing → interface vlan 10 → ip address 10.0.0.1 255.255.255.192 → no shutdown',
  'L3 switches route in hardware using ASICs — no external router needed, no trunk bottleneck. Each SVI acts as the default gateway for its VLAN. The /26 mask (255.255.255.192) matches the subnetting scheme from Phase 1.',
  'HQ-SW1',
  ARRAY['ip routing', 'interface vlan 10', 'ip address 10.0.0.1 255.255.255.192', 'no shutdown', 'interface vlan 20', 'ip address 10.0.0.65 255.255.255.192', 'no shutdown'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 7,
  'Phase 2: Create Remaining SVIs',
  E'Create SVIs for VLAN 30 (Mgmt) and VLAN 40 (Voice):\n\n- VLAN 30: **10.0.0.129/26**\n- VLAN 40: **10.0.0.193/26**',
  'interface vlan 30 → ip address 10.0.0.129 255.255.255.192 → repeat for vlan 40',
  'All four VLANs now have gateways. Hosts in VLAN 10 use 10.0.0.1, hosts in VLAN 20 use 10.0.0.65, and so on. The L3 switch routes between them internally — a packet from 10.0.0.10 to 10.0.0.70 never leaves the switch.',
  'HQ-SW1',
  ARRAY['interface vlan 30', 'ip address 10.0.0.129 255.255.255.192', 'no shutdown', 'interface vlan 40', 'ip address 10.0.0.193 255.255.255.192', 'no shutdown'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 8,
  'Phase 2: Verify Inter-VLAN Routing',
  E'Verify all SVIs are up and the routing table shows four /26 connected subnets.\n\nThen ping across VLANs to confirm routing works.',
  'show ip interface brief → show ip route → ping 10.0.0.1 → ping 10.0.0.65',
  'The routing table should show four C (connected) routes for the /26 subnets. If an SVI is down/down, check that the VLAN has at least one active port.',
  'HQ-SW1',
  ARRAY['show ip interface brief', 'show ip route', 'ping 10.0.0.1', 'ping 10.0.0.65'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 3: Network Services (Intermediate)
-- DHCP, DNS, and management access
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 9,
  'Phase 3: Configure DHCP Pools',
  E'On **HQ-R1**, create DHCP pools for VLANs 10 and 20 using the /26 subnets.\n\nExclude the gateway IPs and set the default-router and DNS server for each pool.\n\nExample for VLAN 10:\n- Pool name: CORP\n- Network: 10.0.0.0/26\n- Default router: 10.0.0.1\n- DNS: point to HQ-DNS',
  'ip dhcp pool CORP → network 10.0.0.0 255.255.255.192 → default-router 10.0.0.1 → dns-server',
  'DHCP automates IP assignment for end devices. Each pool must match a /26 subnet exactly. The default-router must be the SVI IP so hosts know where to send traffic for other subnets.',
  'HQ-R1',
  ARRAY['ip dhcp pool CORP', 'network 10.0.0.0 255.255.255.192', 'default-router 10.0.0.1', 'dns-server'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 10,
  'Phase 3: Configure DNS',
  E'Point **HQ-R1** to the DNS server for name resolution.\n\nSet the domain name to **corp.local** and configure the name server IP.',
  'ip domain-name corp.local → ip name-server',
  'DNS allows devices to use hostnames instead of memorising IP addresses. Every device on the network should have a DNS server configured — either via DHCP or statically.',
  'HQ-R1',
  ARRAY['configure terminal', 'ip domain-name corp.local', 'ip name-server 10.0.0.130'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 11,
  'Phase 3: Secure Management with SSH',
  E'Secure all management access on **HQ-R1**:\n\n1. Generate 2048-bit RSA keys\n2. Create a local admin user\n3. Restrict VTY lines to SSH only\n4. Set an exec timeout',
  'crypto key generate rsa modulus 2048 → username admin privilege 15 secret → line vty 0 4 → transport input ssh',
  'Telnet sends passwords in cleartext — SSH encrypts the entire session. In an enterprise, management access should ONLY use SSH. RSA keys of at least 2048 bits are required for SSH version 2.',
  'HQ-R1',
  ARRAY['crypto key generate rsa modulus 2048', 'username admin privilege 15 secret', 'line vty 0 4', 'transport input ssh', 'login local'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 4: Routing (Intermediate)
-- OSPF within the enterprise, GRE for WAN
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 12,
  'Phase 4: Enable OSPF Routing',
  E'Enable OSPF (process 1, area 0) on **HQ-R1** and advertise all internal /26 subnets.\n\nAlso advertise the link between HQ-R1 and HQ-SW1.',
  'router ospf 1 → router-id 1.1.1.1 → network 10.0.0.0 0.0.0.255 area 0',
  'OSPF builds a complete map of the network topology and calculates shortest paths using Dijkstra''s algorithm. Area 0 is the backbone — all other areas must connect to it. Using a broad network statement (10.0.0.0 0.0.0.255) enables OSPF on all 10.0.0.x interfaces.',
  'HQ-R1',
  ARRAY['router ospf 1', 'router-id 1.1.1.1', 'network 10.0.0.0 0.0.0.255 area 0'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 13,
  'Phase 4: Build GRE Tunnel to Branch',
  E'Create a GRE tunnel from **HQ-R1** to **BR-R1** for the WAN connection.\n\nConfigure Tunnel0 with:\n- Source: HQ-R1 public interface\n- Destination: BR-R1 public IP (198.51.100.2)\n- Tunnel IP: **10.255.0.1/30** (a /30 point-to-point subnet)',
  'interface Tunnel0 → tunnel source → tunnel destination → ip address 10.255.0.1 255.255.255.252',
  'GRE creates a virtual point-to-point link over the internet. The /30 subnet provides exactly 2 usable IPs — one per tunnel endpoint. GRE supports multicast, so we can run OSPF over it (IPsec alone cannot carry multicast).',
  'HQ-R1',
  ARRAY['interface Tunnel0', 'tunnel source GigabitEthernet0/0', 'tunnel destination 198.51.100.2', 'ip address 10.255.0.1 255.255.255.252', 'no shutdown'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 14,
  'Phase 4: Run OSPF over GRE',
  E'Advertise the GRE tunnel network (10.255.0.0/30) into OSPF so HQ and Branch exchange routes dynamically.\n\nVerify the OSPF neighborship forms across the tunnel.',
  'network 10.255.0.0 0.0.0.3 area 0 → show ip ospf neighbor',
  'Once OSPF runs over the GRE tunnel, HQ automatically learns Branch subnets and vice versa. If the Branch adds a new subnet, OSPF advertises it to HQ without any manual route updates.',
  'HQ-R1',
  ARRAY['network 10.255.0.0 0.0.0.3 area 0', 'show ip ospf neighbor'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 5: WAN & Internet (Advanced)
-- BGP, MPLS, and NAT/PAT
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 15,
  'Phase 5: Configure BGP Peering with ISP',
  E'Configure eBGP on **HQ-R1** (AS 65001) to peer with **ISP-R1** (AS 65000).\n\nAdvertise the enterprise public prefix to the ISP.',
  'router bgp 65001 → neighbor {ISP-IP} remote-as 65000 → network',
  'BGP is the routing protocol of the internet. eBGP exchanges routes between autonomous systems. The enterprise AS (65001) advertises its public prefix to the ISP, and the ISP provides a default route or full internet table back.',
  'HQ-R1',
  ARRAY['router bgp 65001', 'neighbor 198.51.100.1 remote-as 65000', 'network 203.0.113.0 mask 255.255.255.0'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 16,
  'Phase 5: Enable MPLS',
  E'Enable MPLS on the WAN-facing interfaces of **HQ-R1** for label-switched forwarding.\n\nMPLS adds a label between the L2 and L3 headers, enabling faster forwarding and traffic engineering in the service provider backbone.',
  'interface → mpls ip',
  'MPLS switches packets based on short labels instead of full IP lookups. While modern routers can do IP lookups at wire speed, MPLS is still essential for VPN services (L3VPN) and traffic engineering. Enabling it on WAN interfaces lets the PE routers exchange labels.',
  'HQ-R1',
  ARRAY['interface GigabitEthernet0/0', 'mpls ip'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 17,
  'Phase 5: Configure NAT/PAT for Internet Access',
  E'Configure PAT on **HQ-R1** so all internal /26 subnets share the single public IP for internet access.\n\n1. Create an ACL matching all internal networks\n2. Configure NAT overload on the outside interface\n3. Mark inside and outside interfaces',
  'access-list 1 permit 10.0.0.0 0.0.0.255 → ip nat inside source list 1 interface Gi0/0 overload',
  'PAT (NAT overload) maps thousands of internal hosts to one public IP by tracking source ports. Every outbound connection gets a unique port number. This is how most offices connect to the internet with a single public address.',
  'HQ-R1',
  ARRAY['access-list 1 permit 10.0.0.0 0.0.0.255', 'ip nat inside source list 1 interface GigabitEthernet0/0 overload', 'interface GigabitEthernet0/0', 'ip nat outside', 'interface GigabitEthernet0/1', 'ip nat inside'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 18,
  'Phase 5: Verify WAN & Internet',
  E'Verify the WAN and internet connectivity:\n\n- Check BGP table: `show ip bgp`\n- Check MPLS labels: `show mpls forwarding-table`\n- Check NAT translations: `show ip nat translations`',
  'show ip bgp → show mpls forwarding-table → show ip nat translations',
  'BGP table should show your prefix and the ISP routes. MPLS forwarding table shows label bindings. NAT translations table should show active PAT mappings.',
  'HQ-R1',
  ARRAY['show ip bgp', 'show mpls forwarding-table', 'show ip nat translations'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 6: Security (Advanced)
-- ACLs and firewall policies
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 19,
  'Phase 6: Create ACLs — Restrict Guest VLAN',
  E'Write an extended ACL on **HQ-R1** that restricts the Guest VLAN (10.0.0.64/26):\n\n- **Deny** Guest traffic to all internal VLANs (Corp, Mgmt, Voice)\n- **Permit** Guest traffic to the internet\n\nApply the ACL inbound on the Guest VLAN''s SVI.',
  'ip access-list extended GUEST-RESTRICT → deny ip 10.0.0.64 0.0.0.63 10.0.0.0 0.0.0.63 → permit ip any any',
  'ACLs are processed top-down — first match wins. By denying Guest→Internal first, then permitting everything else, guests can reach the internet but cannot access corporate resources. The wildcard 0.0.0.63 matches the /26 subnet.',
  'HQ-R1',
  ARRAY['ip access-list extended GUEST-RESTRICT', 'deny ip 10.0.0.64 0.0.0.63 10.0.0.0 0.0.0.63', 'deny ip 10.0.0.64 0.0.0.63 10.0.0.128 0.0.0.63', 'permit ip any any'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 20,
  'Phase 6: Configure Firewall Zones',
  E'On **HQ-FW1**, implement zone-based firewall policies:\n\n1. Create security zones: INSIDE, OUTSIDE, DMZ\n2. Create a zone-pair from INSIDE to OUTSIDE\n3. Apply an inspect policy that allows HTTP, HTTPS, and DNS outbound\n\nStateful inspection automatically allows return traffic.',
  'zone security INSIDE → zone-pair security IN-OUT → service-policy type inspect',
  'Zone-based firewalls deny all traffic between zones by default. You must explicitly create zone-pairs and apply policies to allow traffic. The inspect keyword enables stateful tracking — return traffic for allowed sessions is automatically permitted.',
  'HQ-FW1',
  ARRAY['zone security INSIDE', 'zone security OUTSIDE', 'zone-pair security IN-OUT source INSIDE destination OUTSIDE', 'service-policy type inspect IN-OUT-POLICY'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 7: Advanced Services (Advanced→Expert)
-- IPv6, wireless, VPN
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 21,
  'Phase 7: Enable IPv6 Dual-Stack',
  E'Enable IPv6 alongside IPv4 on **HQ-R1**:\n\n1. Enable IPv6 routing globally\n2. Assign IPv6 addresses to internal interfaces\n3. Enable OSPFv3 for IPv6 route exchange',
  'ipv6 unicast-routing → interface → ipv6 address 2001:DB8:ACAD:1::1/64 → ipv6 ospf 1 area 0',
  'Dual-stack runs IPv4 and IPv6 simultaneously on the same interfaces. This is the most common transition strategy. OSPFv3 handles IPv6 routing independently from OSPFv2 (which handles IPv4).',
  'HQ-R1',
  ARRAY['ipv6 unicast-routing', 'interface GigabitEthernet0/1', 'ipv6 address 2001:DB8:ACAD:1::1/64', 'ipv6 ospf 1 area 0'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 22,
  'Phase 7: Deploy Wireless — Register AP to WLC',
  E'Register **HQ-AP1** with the **HQ-WLC** (Wireless LAN Controller).\n\nCreate a WLAN named "CorpWiFi" mapped to VLAN 10 (Corp).',
  'wlan CorpWiFi → security → vlan 10',
  'Lightweight APs (LWAPs) are managed centrally by a WLC. The AP handles radio functions while the WLC handles configuration, roaming, security policies, and RF management. CAPWAP protocol (UDP 5246/5247) connects them.',
  'HQ-WLC',
  ARRAY['wlan CorpWiFi 1 CorpWiFi', 'vlan 10', 'no shutdown'],
  'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 23,
  'Phase 7: Wireless Security — WPA3-Enterprise',
  E'Secure the CorpWiFi WLAN with WPA3-Enterprise and 802.1X RADIUS authentication.\n\nEnable Protected Management Frames (PMF) to prevent deauthentication attacks.',
  'security wpa3 → security dot1x → security pmf required',
  'WPA3-Enterprise provides per-user encryption keys via 802.1X. RADIUS authenticates each user individually (unlike PSK where everyone shares one password). PMF (802.11w) protects management frames from spoofing — without it, an attacker can disconnect any client with a forged deauth frame.',
  'HQ-WLC',
  ARRAY['security wpa3', 'security dot1x', 'security pmf required'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 24,
  'Phase 7: Remote Access VPN',
  E'Configure an IPsec remote-access VPN on **HQ-FW1** for telecommuters:\n\n1. Create an ISAKMP policy with AES-256 encryption\n2. Define an IPsec transform set\n3. Create a dynamic crypto map',
  'crypto isakmp policy → encryption aes 256 → crypto ipsec transform-set → crypto dynamic-map',
  'Remote access VPN creates an encrypted tunnel from a remote worker''s laptop to the enterprise firewall. ISAKMP Phase 1 establishes a secure channel, Phase 2 negotiates the encryption for actual data. Split tunneling can optionally route only corporate traffic through the VPN.',
  'HQ-FW1',
  ARRAY['crypto isakmp policy 10', 'encryption aes 256', 'crypto ipsec transform-set REMOTE-SET esp-aes 256 esp-sha256-hmac', 'crypto dynamic-map REMOTE-MAP 10'],
  'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 8: End-to-End Verification (Expert)
-- Prove the entire network works together
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 25,
  'Phase 8: End-to-End Verification',
  E'Verify the complete enterprise network.\n\nFrom **HQ-SW1**, confirm inter-VLAN routing across all /26 subnets:\n- `show ip route` — four connected /26 routes\n- `show ip interface brief` — all SVIs up/up\n- Ping across VLANs: 10.0.0.1 → 10.0.0.65 → 10.0.0.129\n\nFrom **HQ-R1**, confirm WAN and services:\n- `show ip ospf neighbor` — OSPF adjacency with Branch over GRE\n- `show ip bgp` — BGP routes from ISP\n- `show ip nat translations` — active PAT mappings\n- `show crypto isakmp sa` — VPN tunnel status\n- `show ip ssh` — SSH version 2 enabled\n\nFrom **HQ-FW1**, confirm security:\n- `show zone-pair security` — firewall policies active\n\nCongratulations — you have built a complete multi-site enterprise network from scratch, covering subnetting, VLANs, STP, LACP, SVIs, OSPF, GRE, BGP, MPLS, NAT/PAT, ACLs, firewalls, SSH, IPv6, wireless, and VPN.',
  'Use show and ping commands across all devices',
  'This is the capstone — every technology you configured builds on the previous one. Subnetting provides the addressing. VLANs segment it. SVIs route between segments. OSPF distributes routes. GRE extends the network to the Branch. BGP connects to the internet. NAT/PAT provides internet access. ACLs and firewalls secure it. SSH protects management. Wireless extends the network to mobile users. VPN connects remote workers. Each layer depends on the ones below it.',
  'HQ-SW1',
  ARRAY['show ip route', 'show ip interface brief', 'ping 10.0.0.1', 'ping 10.0.0.65', 'ping 10.0.0.129'],
  'command', 25
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- Update lab metadata
-- ============================================================

UPDATE labs SET
  estimated_minutes = 150,
  description = E'This capstone lab integrates ALL networking topics into one realistic enterprise network, built in logical order from beginner to expert.\n\n'
    '**Phase 1** (Beginner): IPv4 subnetting, VLANs, trunks with LACP, STP root bridge\n'
    '**Phase 2** (Beginner→Intermediate): L3 switch SVIs for inter-VLAN routing\n'
    '**Phase 3** (Intermediate): DHCP, DNS, SSH management security\n'
    '**Phase 4** (Intermediate): OSPF routing, GRE tunnels, OSPF over GRE\n'
    '**Phase 5** (Advanced): BGP peering, MPLS, NAT/PAT\n'
    '**Phase 6** (Advanced): ACLs, zone-based firewalls\n'
    '**Phase 7** (Advanced→Expert): IPv6 dual-stack, wireless, WPA3, remote access VPN\n'
    '**Phase 8** (Expert): Full end-to-end verification'
WHERE slug = 'full-enterprise-network';
