-- ============================================================
-- MIGRATION: Rebuild Integration Lab Steps (v2)
-- Matches the theory/lab learning progression exactly
-- Phase 1: Subnetting + L2  →  Phase 2: SVIs
-- Phase 3: Services + NAT   →  Phase 4: Routing + GRE
-- Phase 5: Security          →  Phase 6: WAN (BGP/MPLS)
-- Phase 7: IPv6/Wireless/VPN →  Phase 8: Verification
-- ============================================================

-- Wipe existing steps and progress
DELETE FROM user_step_progress
WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');

DELETE FROM user_lab_progress
WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');

DELETE FROM command_history
WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');

DELETE FROM lab_steps
WHERE lab_id = (SELECT id FROM labs WHERE slug = 'full-enterprise-network');

-- ============================================================
-- PHASE 1: Subnetting & Layer 2 Fundamentals (Steps 1-5)
-- Foundation: addressing, VLANs, trunks, STP
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Phase 1: Plan the IP Addressing Scheme',
  E'Before configuring anything, plan the HQ addressing scheme.\n\nSubnet **10.0.0.0/24** into four **/26** subnets for the campus VLANs:\n\n| VLAN | Name | Subnet | Gateway | Usable Range |\n|------|------|--------|---------|-------------|\n| 10 | Corp | 10.0.0.0/26 | 10.0.0.1 | .2 - .62 |\n| 20 | Guest | 10.0.0.64/26 | 10.0.0.65 | .66 - .126 |\n| 30 | Mgmt | 10.0.0.128/26 | 10.0.0.129 | .130 - .190 |\n| 40 | Voice | 10.0.0.192/26 | 10.0.0.193 | .194 - .254 |\n\nOn **HQ-SW1**, enter global configuration mode to begin building the network.',
  'configure terminal',
  'A /26 borrows 2 bits from the host portion of a /24, creating 4 subnets with 62 usable hosts each. Block size = 256 - 192 = 64, so subnets start at .0, .64, .128, .192. Planning the scheme FIRST prevents IP conflicts and overlapping subnets down the line.',
  'HQ-SW1', ARRAY['configure terminal'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Phase 1: Create VLANs',
  E'On **HQ-SW1**, create all four campus VLANs:\n\n- VLAN 10 - **Corp**\n- VLAN 20 - **Guest**\n- VLAN 30 - **Mgmt**\n- VLAN 40 - **Voice**\n\nAlso create them on **HQ-SW2** (VLANs must exist on every switch that uses them).',
  'vlan 10 then name Corp, repeat for 20/30/40',
  'VLANs segment the broadcast domain. Without them, every host on the switch shares one broadcast domain. Each VLAN is its own isolated Layer 2 network.',
  'HQ-SW1', ARRAY['vlan 10', 'name Corp', 'vlan 20', 'name Guest', 'vlan 30', 'name Mgmt', 'vlan 40', 'name Voice'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Phase 1: Configure Trunk Links with LACP',
  E'Bundle the uplinks between **HQ-SW1** and **HQ-SW2** into an LACP EtherChannel.\n\nOn HQ-SW1, configure interfaces Gi0/1-2 as LACP active in channel-group 1.\nThen configure the Port-channel1 interface as a trunk allowing VLANs 10,20,30,40.',
  'interface range Gi0/1-2 then channel-group 1 mode active then interface Po1 then switchport mode trunk',
  'LACP bundles multiple physical links into one logical link, doubling bandwidth and providing failover. The trunk carries all VLAN traffic between switches.',
  'HQ-SW1', ARRAY['interface range GigabitEthernet0/1-2', 'channel-group 1 mode active', 'interface Port-channel1', 'switchport trunk encapsulation dot1q', 'switchport mode trunk'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Phase 1: Set STP Root Bridge',
  E'Set **HQ-SW1** as the STP root bridge for all VLANs to ensure predictable traffic paths.\n\nAlso enable PortFast on all access ports to eliminate the 30-second STP delay for end devices.',
  'spanning-tree vlan 10 priority 4096 (repeat for each VLAN) then spanning-tree portfast default',
  'Without explicit root bridge selection, the switch with the lowest MAC address wins. Setting priority 4096 on the distribution switch guarantees optimal forwarding paths. PortFast lets PCs come online immediately.',
  'HQ-SW1', ARRAY['spanning-tree vlan 10 priority 4096', 'spanning-tree vlan 20 priority 4096', 'spanning-tree vlan 30 priority 4096', 'spanning-tree vlan 40 priority 4096', 'spanning-tree portfast default'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Phase 1: Verify Layer 2',
  E'Verify the campus Layer 2 configuration:\n\n- Check VLANs exist: `show vlan brief`\n- Check EtherChannel is bundled: `show etherchannel summary`\n- Check STP root status: `show spanning-tree`',
  'show vlan brief then show etherchannel summary then show spanning-tree',
  'Always verify after each phase. VLANs should show active with correct names. EtherChannel should show Po1 with (P) flags on member ports. STP should show HQ-SW1 as root for all VLANs.',
  'HQ-SW1', ARRAY['show vlan brief', 'show etherchannel summary', 'show spanning-tree'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 2: Inter-VLAN Routing with SVIs (Steps 6-8)
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Phase 2: Enable L3 Routing on HQ-SW1',
  E'Enable IP routing on **HQ-SW1** so it can route between VLANs at wire speed.\n\nThen create SVIs for VLANs 10 and 20 using the /26 gateway IPs from your addressing plan:\n\n- VLAN 10: **10.0.0.1/26**\n- VLAN 20: **10.0.0.65/26**',
  'ip routing then interface vlan 10 then ip address 10.0.0.1 255.255.255.192 then no shutdown',
  'L3 switches route in hardware using ASICs. Each SVI acts as the default gateway for its VLAN. The /26 mask (255.255.255.192) matches the subnetting scheme from Phase 1.',
  'HQ-SW1', ARRAY['ip routing', 'interface vlan 10', 'ip address 10.0.0.1 255.255.255.192', 'no shutdown', 'interface vlan 20', 'ip address 10.0.0.65 255.255.255.192', 'no shutdown'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 7,
  'Phase 2: Create Remaining SVIs',
  E'Create SVIs for VLAN 30 (Mgmt) and VLAN 40 (Voice):\n\n- VLAN 30: **10.0.0.129/26**\n- VLAN 40: **10.0.0.193/26**',
  'interface vlan 30 then ip address 10.0.0.129 255.255.255.192 then repeat for vlan 40',
  'All four VLANs now have gateways. The L3 switch routes between them internally at line rate.',
  'HQ-SW1', ARRAY['interface vlan 30', 'ip address 10.0.0.129 255.255.255.192', 'no shutdown', 'interface vlan 40', 'ip address 10.0.0.193 255.255.255.192', 'no shutdown'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 8,
  'Phase 2: Verify Inter-VLAN Routing',
  E'Verify all SVIs are up and the routing table shows four /26 connected subnets.\n\nThen ping across VLANs to confirm routing works.',
  'show ip interface brief then show ip route then ping 10.0.0.1 then ping 10.0.0.65',
  'The routing table should show four C (connected) routes for the /26 subnets. If an SVI is down/down, check that the VLAN has at least one active port.',
  'HQ-SW1', ARRAY['show ip interface brief', 'show ip route', 'ping 10.0.0.1', 'ping 10.0.0.65'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 3: Network Services & NAT (Steps 9-11)
-- DHCP, DNS, then NAT/PAT before any external connectivity
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 9,
  'Phase 3: Configure DHCP Pools',
  E'On **HQ-R1**, create DHCP pools for VLANs 10 and 20 using the /26 subnets.\n\nExclude the gateway IPs and set the default-router and DNS server for each pool.\n\nExample for VLAN 10:\n- Pool name: CORP\n- Network: 10.0.0.0/26\n- Default router: 10.0.0.1\n- DNS: point to HQ-DNS',
  'ip dhcp pool CORP then network 10.0.0.0 255.255.255.192 then default-router 10.0.0.1 then dns-server',
  'DHCP automates IP assignment for end devices. Each pool must match a /26 subnet exactly. The default-router must be the SVI IP so hosts know where to send traffic for other subnets.',
  'HQ-R1', ARRAY['ip dhcp pool CORP', 'network 10.0.0.0 255.255.255.192', 'default-router 10.0.0.1', 'dns-server'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 10,
  'Phase 3: Configure DNS',
  E'Point **HQ-R1** to the DNS server for name resolution.\n\nSet the domain name to **corp.local** and configure the name server IP.',
  'ip domain-name corp.local then ip name-server',
  'DNS allows devices to use hostnames instead of memorising IP addresses. Every device on the network should have a DNS server configured.',
  'HQ-R1', ARRAY['configure terminal', 'ip domain-name corp.local', 'ip name-server 10.0.0.130'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 11,
  'Phase 3: Configure NAT/PAT for Internet Access',
  E'Configure PAT on **HQ-R1** so all internal /26 subnets share the single public IP for internet access.\n\n1. Create an ACL matching all internal networks (10.0.0.0/24)\n2. Configure NAT overload on the outside interface\n3. Mark inside and outside interfaces\n\nThis must be done before any external connectivity (BGP, VPN) can work — without NAT, private 10.x.x.x traffic is dropped by ISP routers.',
  'access-list 1 permit 10.0.0.0 0.0.0.255 then ip nat inside source list 1 interface Gi0/0 overload',
  'PAT maps thousands of internal hosts to one public IP by tracking source ports. Without NAT, your private addresses cannot reach the public internet. This is a prerequisite for Phase 6 (BGP/ISP connectivity) and Phase 7 (remote access VPN).',
  'HQ-R1', ARRAY['access-list 1 permit 10.0.0.0 0.0.0.255', 'ip nat inside source list 1 interface GigabitEthernet0/0 overload', 'interface GigabitEthernet0/0', 'ip nat outside', 'interface GigabitEthernet0/1', 'ip nat inside'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 4: Routing (Steps 12-14)
-- OSPF internal routing, GRE tunnel to Branch
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 12,
  'Phase 4: Enable OSPF Routing',
  E'Enable OSPF (process 1, area 0) on **HQ-R1** and advertise all internal /26 subnets.\n\nAlso advertise the link between HQ-R1 and HQ-SW1.',
  'router ospf 1 then router-id 1.1.1.1 then network 10.0.0.0 0.0.0.255 area 0',
  'OSPF builds a complete map of the network topology and calculates shortest paths using Dijkstra''s algorithm. Area 0 is the backbone. Using a broad network statement enables OSPF on all 10.0.0.x interfaces.',
  'HQ-R1', ARRAY['router ospf 1', 'router-id 1.1.1.1', 'network 10.0.0.0 0.0.0.255 area 0'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 13,
  'Phase 4: Build GRE Tunnel to Branch',
  E'Create a GRE tunnel from **HQ-R1** to **BR-R1** for the WAN connection.\n\nConfigure Tunnel0 with:\n- Source: HQ-R1 public interface\n- Destination: BR-R1 public IP (198.51.100.2)\n- Tunnel IP: **10.255.0.1/30** (a /30 point-to-point subnet)',
  'interface Tunnel0 then tunnel source then tunnel destination then ip address 10.255.0.1 255.255.255.252',
  'GRE creates a virtual point-to-point link over the internet. The /30 subnet provides exactly 2 usable IPs. GRE supports multicast, so we can run OSPF over it.',
  'HQ-R1', ARRAY['interface Tunnel0', 'tunnel source GigabitEthernet0/0', 'tunnel destination 198.51.100.2', 'ip address 10.255.0.1 255.255.255.252', 'no shutdown'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 14,
  'Phase 4: Run OSPF over GRE',
  E'Advertise the GRE tunnel network (10.255.0.0/30) into OSPF so HQ and Branch exchange routes dynamically.\n\nVerify the OSPF neighborship forms across the tunnel.',
  'network 10.255.0.0 0.0.0.3 area 0 then show ip ospf neighbor',
  'Once OSPF runs over the GRE tunnel, HQ automatically learns Branch subnets and vice versa. If the Branch adds a new subnet, OSPF advertises it without any manual route updates.',
  'HQ-R1', ARRAY['network 10.255.0.0 0.0.0.3 area 0', 'show ip ospf neighbor'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 5: Security (Steps 15-17)
-- ACLs first, then SSH, then firewalls (builds on each)
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 15,
  'Phase 5: Create ACLs — Restrict Guest VLAN',
  E'Write an extended ACL on **HQ-R1** that restricts the Guest VLAN (10.0.0.64/26):\n\n- **Deny** Guest traffic to all internal VLANs (Corp, Mgmt, Voice)\n- **Permit** Guest traffic to the internet\n\nACLs are the foundation of network security — firewalls, VPN policies, and route filtering all build on the same permit/deny logic.',
  'ip access-list extended GUEST-RESTRICT then deny ip 10.0.0.64 0.0.0.63 10.0.0.0 0.0.0.63 then permit ip any any',
  'ACLs are processed top-down. By denying Guest to Internal first, then permitting everything else, guests can reach the internet but cannot access corporate resources. The wildcard 0.0.0.63 matches the /26 subnet.',
  'HQ-R1', ARRAY['ip access-list extended GUEST-RESTRICT', 'deny ip 10.0.0.64 0.0.0.63 10.0.0.0 0.0.0.63', 'deny ip 10.0.0.64 0.0.0.63 10.0.0.128 0.0.0.63', 'permit ip any any'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 16,
  'Phase 5: Secure Management with SSH',
  E'Secure all management access on **HQ-R1**:\n\n1. Generate 2048-bit RSA keys\n2. Create a local admin user\n3. Restrict VTY lines to SSH only\n4. Set an exec timeout\n\nIn production you would combine SSH with an ACL restricting VTY access to the Mgmt VLAN only — defense-in-depth using the ACL skills from step 15.',
  'crypto key generate rsa modulus 2048 then username admin privilege 15 secret then line vty 0 4 then transport input ssh',
  'Telnet sends passwords in cleartext. SSH encrypts the entire session. RSA keys of at least 2048 bits are required for SSH version 2. Combining SSH with ACLs (restricting VTY access to the Mgmt VLAN) creates defense-in-depth.',
  'HQ-R1', ARRAY['crypto key generate rsa modulus 2048', 'username admin privilege 15 secret', 'line vty 0 4', 'transport input ssh', 'login local'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 17,
  'Phase 5: Configure Firewall Zones',
  E'On **HQ-FW1**, implement zone-based firewall policies:\n\n1. Create security zones: INSIDE, OUTSIDE, DMZ\n2. Create a zone-pair from INSIDE to OUTSIDE\n3. Apply an inspect policy that allows HTTP, HTTPS, and DNS outbound\n\nZone-based firewalls build on ACL concepts (Phase 5, step 15) but add stateful connection tracking.',
  'zone security INSIDE then zone-pair security IN-OUT then service-policy type inspect',
  'Zone-based firewalls deny all traffic between zones by default — the opposite of a router. The inspect keyword adds session awareness on top of the permit/deny logic you learned with ACLs, so return traffic for allowed sessions is automatically permitted.',
  'HQ-FW1', ARRAY['zone security INSIDE', 'zone security OUTSIDE', 'zone-pair security IN-OUT source INSIDE destination OUTSIDE', 'service-policy type inspect IN-OUT-POLICY'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 6: WAN & Internet (Steps 18-20)
-- BGP and MPLS — requires NAT (Phase 3) + security (Phase 5)
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 18,
  'Phase 6: Configure BGP Peering with ISP',
  E'Configure eBGP on **HQ-R1** (AS 65001) to peer with **ISP-R1** (AS 65000).\n\nAdvertise the enterprise public prefix to the ISP.\n\nNAT is already configured (Phase 3), so internal traffic can reach the internet. BGP adds dynamic route exchange so both sides know how to reach each other''s networks.',
  'router bgp 65001 then neighbor 198.51.100.1 remote-as 65000 then network',
  'BGP is the routing protocol of the internet. eBGP exchanges routes between autonomous systems. BGP requires NAT to already be working — without it, peers can exchange routes but internal hosts still cannot reach the internet.',
  'HQ-R1', ARRAY['router bgp 65001', 'neighbor 198.51.100.1 remote-as 65000', 'network 203.0.113.0 mask 255.255.255.0'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 19,
  'Phase 6: Enable MPLS',
  E'Enable MPLS on the WAN-facing interfaces of **HQ-R1** for label-switched forwarding.',
  'interface then mpls ip',
  'MPLS switches packets based on short labels instead of full IP lookups. It is essential for VPN services (L3VPN) and traffic engineering in service provider networks.',
  'HQ-R1', ARRAY['interface GigabitEthernet0/0', 'mpls ip'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 20,
  'Phase 6: Verify WAN & Internet',
  E'Verify the complete WAN and internet connectivity:\n\n- `show ip bgp` — should show ISP routes\n- `show mpls forwarding-table` — label bindings\n- `show ip nat translations` — active PAT mappings from Phase 3\n- `show ip ospf neighbor` — OSPF adjacency over GRE from Phase 4\n- `show access-lists` — ACL hit counts from Phase 5',
  'show ip bgp then show mpls forwarding-table then show ip nat translations',
  'This verification confirms the full data path: internal traffic is NAT''d (Phase 3), routed via OSPF/GRE to Branch (Phase 4), secured by ACLs and firewalls (Phase 5), and exchanged with the ISP via BGP (Phase 6). Each layer builds on the previous one.',
  'HQ-R1', ARRAY['show ip bgp', 'show mpls forwarding-table', 'show ip nat translations', 'show ip ospf neighbor'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 7: Advanced Services (Steps 21-24)
-- IPv6, wireless, VPN — capstone technologies
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 21,
  'Phase 7: Enable IPv6 Dual-Stack',
  E'Enable IPv6 alongside IPv4 on **HQ-R1**:\n\n1. Enable IPv6 routing globally\n2. Assign IPv6 addresses to internal interfaces\n3. Enable OSPFv3 for IPv6 route exchange\n\nIPv6 runs in parallel with your entire IPv4 infrastructure — the subnets, VLANs, NAT, and security from Phases 1-6 all continue working unchanged.',
  'ipv6 unicast-routing then ipv6 address 2001:DB8:ACAD:1::1/64 then ipv6 ospf 1 area 0',
  'Dual-stack runs IPv4 and IPv6 simultaneously on the same interfaces. OSPFv3 handles IPv6 routing independently from OSPFv2. Every technology you configured in Phases 1-6 remains functional — IPv6 is additive.',
  'HQ-R1', ARRAY['ipv6 unicast-routing', 'interface GigabitEthernet0/1', 'ipv6 address 2001:DB8:ACAD:1::1/64', 'ipv6 ospf 1 area 0'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 22,
  'Phase 7: Deploy Wireless — Register AP to WLC',
  E'Register **HQ-AP1** with the **HQ-WLC** (Wireless LAN Controller).\n\nCreate a WLAN named "CorpWiFi" mapped to VLAN 10 (Corp).\n\nThe AP bridges wireless clients onto the same VLAN infrastructure from Phase 1, using the same /26 subnets and SVI gateways from Phase 2. Wireless clients get IPs from the DHCP pools in Phase 3.',
  'wlan CorpWiFi then vlan 10',
  'Lightweight APs are managed centrally by a WLC via CAPWAP (UDP 5246/5247). Wireless clients join the same VLAN/subnet infrastructure as wired clients.',
  'HQ-WLC', ARRAY['wlan CorpWiFi 1 CorpWiFi', 'vlan 10', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 23,
  'Phase 7: Wireless Security — WPA3-Enterprise',
  E'Secure the CorpWiFi WLAN with WPA3-Enterprise and 802.1X RADIUS authentication.\n\nEnable Protected Management Frames (PMF) to prevent deauthentication attacks.\n\nThis builds on the security principles from Phase 5 — just as ACLs control wired traffic, 802.1X controls who can join the wireless network.',
  'security wpa3 then security dot1x then security pmf required',
  'WPA3-Enterprise provides per-user encryption keys via 802.1X. PMF (802.11w) protects management frames from spoofing.',
  'HQ-WLC', ARRAY['security wpa3', 'security dot1x', 'security pmf required'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 24,
  'Phase 7: Remote Access VPN',
  E'Configure an IPsec remote-access VPN on **HQ-FW1** for telecommuters:\n\n1. Create an ISAKMP policy with AES-256 encryption\n2. Define an IPsec transform set\n3. Create a dynamic crypto map\n\nThis is the capstone technology — it requires tunneling (Phase 4 GRE concepts), encryption, and the firewall infrastructure from Phase 5.',
  'crypto isakmp policy then encryption aes 256 then crypto ipsec transform-set then crypto dynamic-map',
  'Remote access VPN creates an encrypted tunnel from a laptop to the firewall. ISAKMP Phase 1 establishes a secure channel (similar to GRE in Phase 4), Phase 2 negotiates data encryption. The firewall zone policies from Phase 5 determine what the VPN user can access.',
  'HQ-FW1', ARRAY['crypto isakmp policy 10', 'encryption aes 256', 'crypto ipsec transform-set REMOTE-SET esp-aes 256 esp-sha256-hmac', 'crypto dynamic-map REMOTE-MAP 10'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- PHASE 8: End-to-End Verification (Step 25)
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 25,
  'Phase 8: End-to-End Verification',
  E'Verify the complete enterprise network.\n\nFrom **HQ-SW1** — Layer 2 and SVIs:\n- `show ip route` — four connected /26 routes\n- `show ip interface brief` — all SVIs up/up\n- Ping across VLANs: 10.0.0.1, 10.0.0.65, 10.0.0.129\n\nFrom **HQ-R1** — Services, routing, and WAN:\n- `show ip dhcp binding` — DHCP leases active\n- `show ip nat translations` — PAT mappings\n- `show ip ospf neighbor` — OSPF over GRE\n- `show access-lists` — ACL hit counts\n- `show ip ssh` — SSH version 2\n- `show ip bgp` — BGP routes from ISP\n\nFrom **HQ-FW1** — Security:\n- `show zone-pair security` — firewall policies\n- `show crypto isakmp sa` — VPN tunnel\n\nCongratulations — you built a complete enterprise network following the same logical progression as the individual labs:\nSubnetting, VLANs, STP, LACP, SVIs, DHCP, DNS, NAT, OSPF, GRE, ACLs, SSH, Firewalls, BGP, MPLS, IPv6, Wireless, VPN.',
  'Use show and ping commands across all devices',
  'Every technology builds on the previous one in the exact order you learned them. Subnetting provides addressing. VLANs segment it. STP and LACP protect the links. SVIs route between VLANs. DHCP, DNS, and NAT provide services and internet access. OSPF and GRE extend routing to Branch. ACLs, SSH, and firewalls secure it. BGP and MPLS connect to the ISP. IPv6 future-proofs addressing. Wireless extends to mobile users. VPN connects remote workers.',
  'HQ-SW1', ARRAY['show ip route', 'show ip interface brief', 'ping 10.0.0.1', 'ping 10.0.0.65', 'ping 10.0.0.129'], 'command', 25
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- Update lab metadata
-- ============================================================

UPDATE labs SET
  estimated_minutes = 150,
  description = E'This capstone lab integrates ALL networking topics into one realistic enterprise network, following the same logical progression as the individual theory and lab sections.\n\n'
    '**Phase 1** (Beginner): IPv4 subnetting /26, VLANs, LACP trunks, STP root bridge\n'
    '**Phase 2** (Beginner-Intermediate): L3 switch SVIs for inter-VLAN routing\n'
    '**Phase 3** (Intermediate): DHCP, DNS, NAT/PAT for internet access\n'
    '**Phase 4** (Intermediate): OSPF routing, GRE tunnel to Branch, OSPF over GRE\n'
    '**Phase 5** (Advanced): ACLs, SSH management security, zone-based firewalls\n'
    '**Phase 6** (Advanced): BGP peering with ISP, MPLS label switching, WAN verification\n'
    '**Phase 7** (Expert): IPv6 dual-stack, wireless deployment, WPA3-Enterprise, remote access VPN\n'
    '**Phase 8** (Expert): Full end-to-end verification across all technologies'
WHERE slug = 'full-enterprise-network';
