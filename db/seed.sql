-- ============================================================
-- SEED DATA: Topics
-- ============================================================

INSERT INTO topics (slug, name, description, icon, color, sort_order) VALUES
('vlans',               'VLANs',                    'Virtual Local Area Networks — segmenting broadcast domains',           'layers',       '#2563eb', 1),
('stp',                 'Spanning Tree Protocol',    'Loop prevention in Layer 2 networks',                                  'git-branch',   '#7c3aed', 2),
('ospf',                'OSPF',                     'Open Shortest Path First — link-state interior routing',                'route',        '#059669', 3),
('lacp',                'LACP / EtherChannel',      'Link Aggregation Control Protocol — port bundling',                     'combine',      '#d97706', 4),
('dhcp',                'DHCP',                     'Dynamic Host Configuration Protocol — automatic IP addressing',         'server',       '#dc2626', 5),
('dns',                 'DNS',                      'Domain Name System — name resolution',                                 'globe',        '#0891b2', 6),
('bgp',                 'BGP',                      'Border Gateway Protocol — inter-AS path-vector routing',                'network',      '#4f46e5', 7),
('mpls',                'MPLS',                     'Multiprotocol Label Switching — label-based forwarding',                'tag',          '#be185d', 8),
('tunneling',           'Network Tunneling',        'Encapsulation and overlay networks',                                   'tunnel',       '#65a30d', 9),
('gre',                 'GRE Tunnels',              'Generic Routing Encapsulation — point-to-point tunnels',                'arrow-right-left','#ea580c', 10),
('autonomous-systems',  'Autonomous Systems',       'AS numbers, peering, and internet structure',                           'building',     '#6366f1', 11),
('ipv6',                'IPv6',                     'Next-generation Internet Protocol addressing',                          'hash',         '#0d9488', 12),
('remote-access',       'Remote Access',            'VPN, remote desktop, and telecommuting technologies',                   'laptop',       '#7c2d12', 13),
('ssh',                 'SSH',                      'Secure Shell — encrypted remote management',                            'terminal',     '#1e3a5f', 14),
('acls',                'Access Control Lists',     'Packet filtering and traffic control',                                 'shield',       '#b91c1c', 15),
('nat',                 'NAT',                      'Network Address Translation — private-to-public mapping',               'repeat',       '#4338ca', 16),
('pat',                 'PAT',                      'Port Address Translation — many-to-one NAT with ports',                 'list',         '#7e22ce', 17),
('wireless-ap',         'Wireless Access Points',   'Wi-Fi APs, SSIDs, channels, and radio management',                     'wifi',         '#0284c7', 18),
('wireless-controller', 'Wireless Controllers',     'Centralized WLAN management with WLCs',                                'monitor',      '#0369a1', 19),
('wireless-security',   'Wireless Security',        'WPA2/WPA3, 802.1X, RADIUS, and wireless threats',                      'lock',         '#166534', 20),
('wireless-topology',   'Wireless Topology',        'Wireless network design, site surveys, and coverage',                   'radar',        '#854d0e', 21),
('firewalls',           'Firewalls',                'Stateful/stateless packet filtering, zones, and policies',              'flame',        '#991b1b', 22);

-- ============================================================
-- SEED DATA: Individual Topic Labs
-- ============================================================

-- 1. VLANs Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('vlan-fundamentals', 'VLAN Fundamentals', 'Segment a campus network into isolated broadcast domains',
 'Configure VLANs on switches, assign access ports, set up trunk links with 802.1Q encapsulation, and verify inter-VLAN isolation.',
 'beginner', 25, 1);

-- 2. STP Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('stp-loop-prevention', 'STP Loop Prevention', 'Prevent broadcast storms with Spanning Tree Protocol',
 'Observe STP root bridge election, manipulate bridge priorities, configure PortFast and BPDU Guard, and analyze port states.',
 'beginner', 30, 2);

-- 3. OSPF Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('ospf-single-area', 'OSPF Single-Area Routing', 'Build a converged OSPF network',
 'Enable OSPF on multiple routers, advertise networks, verify neighbor adjacencies, examine the LSDB, and trace shortest-path computation.',
 'intermediate', 35, 3);

-- 4. LACP Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('lacp-etherchannel', 'LACP EtherChannel Bundling', 'Aggregate parallel links for bandwidth and redundancy',
 'Bundle physical interfaces into a logical Port-Channel using LACP negotiation. Verify load balancing and failover behavior.',
 'intermediate', 25, 4);

-- 5. DHCP Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('dhcp-server-config', 'DHCP Server Configuration', 'Automate IP addressing with DHCP pools',
 'Configure a Cisco IOS DHCP server, define address pools, set default gateways and DNS servers, exclude reserved addresses, and verify leases.',
 'beginner', 20, 5);

-- 6. DNS Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('dns-resolution', 'DNS Name Resolution', 'Map hostnames to IP addresses',
 'Set up DNS server entries, configure clients to use DNS, test forward and reverse lookups, and troubleshoot resolution failures.',
 'beginner', 20, 6);

-- 7. BGP Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('bgp-peering', 'BGP Inter-AS Peering', 'Establish eBGP sessions between autonomous systems',
 'Configure eBGP neighbors, advertise prefixes, examine the BGP table, apply route-maps for path manipulation, and verify reachability.',
 'advanced', 40, 7);

-- 8. MPLS Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('mpls-label-switching', 'MPLS Label Switching', 'Forward packets using labels instead of IP lookups',
 'Enable MPLS on router interfaces, examine label assignment (LIB/LFIB), trace label-switched paths, and understand PHP behavior.',
 'advanced', 40, 8);

-- 9. Network Tunneling Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('network-tunneling', 'Network Tunneling Concepts', 'Encapsulate traffic across untrusted networks',
 'Compare tunneling protocols (GRE, IPsec, VXLAN), configure a basic tunnel, verify encapsulation headers, and test end-to-end connectivity.',
 'intermediate', 30, 9);

-- 10. GRE Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('gre-tunnels', 'GRE Tunnel Configuration', 'Build point-to-point GRE tunnels between sites',
 'Create Tunnel interfaces, assign tunnel source/destination, route traffic through the tunnel, and combine GRE with OSPF for dynamic routing over tunnels.',
 'intermediate', 30, 10);

-- 11. Autonomous Systems Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('autonomous-systems', 'Autonomous Systems & Internet Structure', 'Understand AS numbers and inter-domain routing',
 'Explore ASN assignment, configure iBGP within an AS, establish eBGP between ASes, and trace how prefixes propagate across the internet.',
 'advanced', 35, 11);

-- 12. IPv6 Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('ipv6-addressing', 'IPv6 Addressing & Connectivity', 'Transition from IPv4 to IPv6',
 'Configure IPv6 global unicast addresses, enable OSPFv3, set up dual-stack, test NDP/SLAAC, and establish IPv6 reachability.',
 'intermediate', 30, 12);

-- 13. Remote Access Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('remote-access-vpn', 'Remote Access VPN', 'Secure remote worker connectivity',
 'Configure site-to-site and remote-access VPN, set up IPsec parameters, define crypto maps, and verify encrypted tunnel establishment.',
 'advanced', 35, 13);

-- 14. SSH Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('ssh-secure-mgmt', 'SSH Secure Management', 'Replace Telnet with encrypted management access',
 'Generate RSA keys, configure VTY lines for SSH-only access, set up local authentication, and verify encrypted sessions.',
 'beginner', 20, 14);

-- 15. ACLs Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('acl-traffic-filtering', 'ACL Traffic Filtering', 'Control packet flow with access control lists',
 'Write standard and extended ACLs, apply them to interfaces, test permit/deny behavior, and troubleshoot unexpected filtering.',
 'intermediate', 30, 15);

-- 16. NAT Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('nat-configuration', 'NAT Configuration', 'Translate private addresses to public addresses',
 'Configure static NAT, dynamic NAT with pools, verify translation tables, and troubleshoot NAT traversal issues.',
 'intermediate', 25, 16);

-- 17. PAT Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('pat-overload', 'PAT (Overload) Configuration', 'Map many internal hosts to a single public IP',
 'Configure PAT using interface overload, verify port translations, understand how PAT differs from NAT, and test outbound connectivity.',
 'intermediate', 25, 17);

-- 18. Wireless AP Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('wireless-ap-config', 'Wireless Access Point Setup', 'Deploy and configure Wi-Fi access points',
 'Configure SSIDs, select channels and power levels, set up multiple BSSIDs, and verify client association.',
 'beginner', 25, 18);

-- 19. Wireless Controller Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('wireless-controller-mgmt', 'Wireless Controller Management', 'Centralize WLAN operations with a WLC',
 'Register lightweight APs to a WLC, create WLANs, configure interfaces and VLANs for wireless, and manage AP groups.',
 'intermediate', 30, 19);

-- 20. Wireless Security Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('wireless-security-config', 'Wireless Security Implementation', 'Secure Wi-Fi with WPA2/WPA3 and 802.1X',
 'Configure WPA2-Enterprise with RADIUS, set up 802.1X authentication, enable management frame protection, and test rogue AP detection.',
 'advanced', 35, 20);

-- 21. Wireless Topology Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('wireless-topology-design', 'Wireless Topology Design', 'Plan and deploy wireless coverage',
 'Perform a site survey simulation, place APs for optimal coverage, configure mesh vs autonomous modes, and validate roaming behavior.',
 'intermediate', 30, 21);

-- 22. Firewalls Lab
INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, sort_order) VALUES
('firewall-zones', 'Firewall Zone-Based Policies', 'Implement stateful firewalling between network zones',
 'Define security zones, create zone pairs, write class-maps and policy-maps, apply firewall policies, and test allowed/denied traffic.',
 'advanced', 35, 22);

-- ============================================================
-- 23. COMPREHENSIVE INTEGRATION LAB
-- ============================================================

INSERT INTO labs (slug, title, subtitle, description, difficulty, estimated_minutes, is_integration, sort_order) VALUES
('full-enterprise-network', 'Enterprise Network: Full Integration Lab',
 'Design, build, and secure a complete multi-site enterprise network from scratch',
 E'This capstone lab integrates ALL 22 networking topics into a single realistic enterprise scenario.\n\n'
 'You will build a multi-site corporate network with:\n'
 '• Campus LAN: VLANs, STP, LACP trunks, DHCP, DNS\n'
 '• Routing: OSPF within sites, BGP between the enterprise AS and an ISP\n'
 '• WAN: MPLS backbone, GRE tunnels, IPv6 dual-stack\n'
 '• Security: ACLs, NAT/PAT, firewalls, SSH management\n'
 '• Wireless: APs, WLC, WPA3-Enterprise, site-survey topology\n'
 '• Remote access: VPN for telecommuters\n\n'
 'Every step references skills from earlier labs, reinforcing your knowledge end-to-end.',
 'expert', 120, TRUE, 100);

-- ============================================================
-- Link labs to topics
-- ============================================================

INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'vlan-fundamentals'        AND t.slug = 'vlans';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'stp-loop-prevention'      AND t.slug = 'stp';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'ospf-single-area'         AND t.slug = 'ospf';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'lacp-etherchannel'        AND t.slug = 'lacp';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'dhcp-server-config'       AND t.slug = 'dhcp';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'dns-resolution'           AND t.slug = 'dns';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'bgp-peering'             AND t.slug = 'bgp';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'mpls-label-switching'     AND t.slug = 'mpls';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'network-tunneling'        AND t.slug = 'tunneling';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'gre-tunnels'             AND t.slug = 'gre';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'autonomous-systems'       AND t.slug = 'autonomous-systems';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'ipv6-addressing'          AND t.slug = 'ipv6';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'remote-access-vpn'        AND t.slug = 'remote-access';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'ssh-secure-mgmt'          AND t.slug = 'ssh';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'acl-traffic-filtering'    AND t.slug = 'acls';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'nat-configuration'        AND t.slug = 'nat';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'pat-overload'             AND t.slug = 'pat';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'wireless-ap-config'       AND t.slug = 'wireless-ap';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'wireless-controller-mgmt' AND t.slug = 'wireless-controller';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'wireless-security-config' AND t.slug = 'wireless-security';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'wireless-topology-design' AND t.slug = 'wireless-topology';
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l, topics t WHERE l.slug = 'firewall-zones'           AND t.slug = 'firewalls';

-- Integration lab links to ALL topics
INSERT INTO lab_topics (lab_id, topic_id)
SELECT l.id, t.id FROM labs l CROSS JOIN topics t WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- SEED DATA: Devices for VLAN Lab (example topology)
-- ============================================================

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties, initial_config)
SELECT l.id, 'SW1', 'switch', 'Cisco 2960', 200, 150, '{"ios":"15.2","ports":24}',
  E'hostname SW1\n!\ninterface range GigabitEthernet0/1-24\n shutdown\n!\nend'
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties, initial_config)
SELECT l.id, 'SW2', 'switch', 'Cisco 2960', 500, 150, '{"ios":"15.2","ports":24}',
  E'hostname SW2\n!\ninterface range GigabitEthernet0/1-24\n shutdown\n!\nend'
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'PC1', 'workstation', 'Desktop', 100, 350, '{"os":"Linux"}'
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'PC2', 'workstation', 'Desktop', 300, 350, '{"os":"Linux"}'
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'PC3', 'workstation', 'Desktop', 600, 350, '{"os":"Linux"}'
FROM labs l WHERE l.slug = 'vlan-fundamentals';

-- ============================================================
-- SEED DATA: Devices for Integration Lab
-- ============================================================

-- HQ Site
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'HQ-R1', 'router', 'Cisco ISR 4331', 300, 100, '{"ios":"16.9","site":"HQ"}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'HQ-SW1', 'l3_switch', 'Cisco 3850', 200, 250, '{"ios":"16.9","site":"HQ","ports":48}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'HQ-SW2', 'switch', 'Cisco 2960', 400, 250, '{"ios":"15.2","site":"HQ","ports":24}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'HQ-FW1', 'firewall', 'Cisco ASA 5516', 300, 50, '{"os":"9.14","site":"HQ"}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'HQ-WLC', 'wireless_controller', 'Cisco 5520 WLC', 100, 300, '{"site":"HQ"}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'HQ-AP1', 'wireless_ap', 'Cisco Aironet 3800', 50, 400, '{"site":"HQ","channel":1}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'HQ-DHCP', 'dhcp_server', 'Linux Server', 500, 350, '{"site":"HQ"}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'HQ-DNS', 'dns_server', 'Linux Server', 600, 350, '{"site":"HQ"}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- Branch Site
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'BR-R1', 'router', 'Cisco ISR 4221', 900, 100, '{"ios":"16.9","site":"Branch"}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'BR-SW1', 'switch', 'Cisco 2960', 900, 250, '{"ios":"15.2","site":"Branch","ports":24}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'BR-AP1', 'wireless_ap', 'Cisco Aironet 1830', 800, 350, '{"site":"Branch","channel":6}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ISP / Internet
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'ISP-R1', 'router', 'Cisco ISR 4451', 600, 50, '{"asn":65000,"site":"ISP"}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'INTERNET', 'cloud', 'Internet', 600, -50, '{}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- Remote Worker
INSERT INTO devices (lab_id, name, device_type, model, x_pos, y_pos, properties)
SELECT l.id, 'REMOTE-PC', 'workstation', 'Laptop', 800, 50, '{"site":"Remote","os":"Windows"}'
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- SEED DATA: Lab Steps (VLAN Lab — detailed example)
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 1,
  'Create VLAN 10 (Engineering)',
  E'On **SW1**, create VLAN 10 and name it "Engineering".\n\nEnter global configuration mode and use the `vlan` command.',
  'Use: vlan 10 → name Engineering',
  'VLANs partition a physical switch into separate broadcast domains. Each VLAN acts as its own independent LAN segment.',
  'SW1',
  ARRAY['configure terminal', 'vlan 10', 'name Engineering'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 2,
  'Create VLAN 20 (Sales)',
  E'Still on **SW1**, create VLAN 20 and name it "Sales".',
  'Use: vlan 20 → name Sales',
  'Multiple VLANs can coexist on the same switch, each isolated from the others at Layer 2.',
  'SW1',
  ARRAY['vlan 20', 'name Sales'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 3,
  'Assign PC1 port to VLAN 10',
  E'Assign interface **GigabitEthernet0/1** on SW1 to VLAN 10 as an access port.\n\nThis connects PC1 to the Engineering VLAN.',
  'Use: interface Gi0/1 → switchport mode access → switchport access vlan 10',
  'Access ports carry traffic for exactly one VLAN. The switch strips/adds the VLAN tag transparently.',
  'SW1',
  ARRAY['interface GigabitEthernet0/1', 'switchport mode access', 'switchport access vlan 10', 'no shutdown'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 4,
  'Assign PC2 port to VLAN 20',
  E'Assign interface **GigabitEthernet0/2** on SW1 to VLAN 20 (Sales).',
  'Same pattern as step 3, but use vlan 20 on Gi0/2',
  'PC1 (VLAN 10) and PC2 (VLAN 20) are now on different broadcast domains even though they share the same physical switch.',
  'SW1',
  ARRAY['interface GigabitEthernet0/2', 'switchport mode access', 'switchport access vlan 20', 'no shutdown'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 5,
  'Configure trunk link between SW1 and SW2',
  E'Configure **GigabitEthernet0/24** on SW1 as an 802.1Q trunk to carry all VLANs to SW2.',
  'Use: switchport mode trunk → switchport trunk encapsulation dot1q (if required)',
  'Trunk ports carry traffic for multiple VLANs simultaneously using 802.1Q tagging. Each frame gets a 4-byte VLAN tag inserted into the Ethernet header.',
  'SW1',
  ARRAY['interface GigabitEthernet0/24', 'switchport trunk encapsulation dot1q', 'switchport mode trunk', 'no shutdown'],
  'command',
  '{"require_all": true}',
  15
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 6,
  'Configure trunk on SW2',
  E'Configure the matching trunk port **GigabitEthernet0/24** on **SW2**.',
  'Mirror the trunk configuration from SW1',
  'Both ends of a trunk must agree on encapsulation. Mismatched trunk settings are a common cause of VLAN connectivity issues.',
  'SW2',
  ARRAY['configure terminal', 'interface GigabitEthernet0/24', 'switchport trunk encapsulation dot1q', 'switchport mode trunk', 'no shutdown'],
  'command',
  '{"require_all": true}',
  15
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 7,
  'Replicate VLANs on SW2',
  E'Create VLANs 10 and 20 on **SW2** with the same names.',
  'VLANs must exist on both switches for trunk traffic to be forwarded.',
  'VLAN databases are local to each switch (unless VTP is used). You must create matching VLANs on every switch that needs them.',
  'SW2',
  ARRAY['vlan 10', 'name Engineering', 'vlan 20', 'name Sales'],
  'command',
  '{"require_all": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, validation_rule, points)
SELECT l.id, 8,
  'Verify VLAN configuration',
  E'On **SW1**, verify your VLAN configuration using the `show vlan brief` command.\n\nConfirm that VLANs 10 and 20 appear with the correct port assignments.',
  'Use: show vlan brief',
  'The show vlan brief command displays all VLANs, their status, and assigned ports in a compact table.',
  'SW1',
  ARRAY['show vlan brief'],
  'command',
  '{"require_any": true}',
  10
FROM labs l WHERE l.slug = 'vlan-fundamentals';

-- ============================================================
-- SEED DATA: Integration Lab Steps (abbreviated — key milestones)
-- ============================================================

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 1, 'Phase 1: Campus VLANs',
  E'Create VLANs 10 (Corp), 20 (Guest), 30 (Mgmt), 40 (Voice) on **HQ-SW1** and **HQ-SW2**. Configure trunk links between switches using LACP port-channels.',
  'Start with vlan commands, then configure port-channel with channel-group … mode active',
  'HQ-SW1', ARRAY['vlan 10', 'vlan 20', 'vlan 30', 'vlan 40', 'channel-group 1 mode active'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 2, 'Phase 1: STP Root Bridge',
  E'Set **HQ-SW1** as the STP root bridge for all VLANs. Configure PortFast on access ports.',
  'spanning-tree vlan X priority 4096',
  'HQ-SW1', ARRAY['spanning-tree vlan 10 priority 4096', 'spanning-tree portfast'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 3, 'Phase 2: OSPF Routing',
  E'Enable OSPF (process 1, area 0) on **HQ-R1** for all internal networks. Advertise connected subnets.',
  'router ospf 1 → network X.X.X.X 0.0.0.255 area 0',
  'HQ-R1', ARRAY['router ospf 1', 'network', 'area 0'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 4, 'Phase 2: GRE Tunnel to Branch',
  E'Create a GRE tunnel (Tunnel0) from **HQ-R1** to **BR-R1**. Assign 10.255.0.1/30 to HQ side.',
  'interface Tunnel0 → tunnel source → tunnel destination → ip address',
  'HQ-R1', ARRAY['interface Tunnel0', 'tunnel source', 'tunnel destination', 'ip address 10.255.0.1 255.255.255.252'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 5, 'Phase 2: OSPF over GRE',
  E'Advertise the GRE tunnel network in OSPF so HQ and Branch can route dynamically over the tunnel.',
  'Add the tunnel subnet to OSPF',
  'HQ-R1', ARRAY['network 10.255.0.0 0.0.0.3 area 0'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 6, 'Phase 3: BGP to ISP',
  E'Configure eBGP on **HQ-R1** (AS 65001) peering with **ISP-R1** (AS 65000). Advertise your public prefix.',
  'router bgp 65001 → neighbor X.X.X.X remote-as 65000 → network',
  'HQ-R1', ARRAY['router bgp 65001', 'neighbor', 'remote-as 65000'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 7, 'Phase 3: MPLS Core Labels',
  E'Enable MPLS on the WAN-facing interfaces of **HQ-R1** and **BR-R1** for label-switched forwarding.',
  'mpls ip on the interface',
  'HQ-R1', ARRAY['mpls ip'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 8, 'Phase 4: IPv6 Dual-Stack',
  E'Enable IPv6 on **HQ-R1** internal interfaces. Configure dual-stack with both IPv4 and IPv6 addresses. Enable OSPFv3.',
  'ipv6 unicast-routing → ipv6 address → ipv6 ospf 1 area 0',
  'HQ-R1', ARRAY['ipv6 unicast-routing', 'ipv6 address', 'ipv6 ospf 1 area 0'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 9, 'Phase 4: DHCP & DNS Services',
  E'Configure DHCP pools on **HQ-DHCP** for VLANs 10 and 20. Point clients to **HQ-DNS** for name resolution.',
  'ip dhcp pool → network → default-router → dns-server',
  'HQ-R1', ARRAY['ip dhcp pool', 'network', 'default-router', 'dns-server'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 10, 'Phase 5: NAT/PAT for Internet',
  E'Configure PAT on **HQ-R1** so all internal hosts share the single public IP for internet access.',
  'ip nat inside source list … overload',
  'HQ-R1', ARRAY['ip nat inside', 'ip nat outside', 'ip nat inside source list', 'overload'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 11, 'Phase 5: ACLs — Restrict Guest VLAN',
  E'Write an extended ACL on **HQ-R1** that allows Guest VLAN (20) access to the internet only — deny all traffic to internal VLANs.',
  'ip access-list extended GUEST-RESTRICT → deny ip 10.0.20.0 … → permit ip any any',
  'HQ-R1', ARRAY['ip access-list extended', 'deny', 'permit'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 12, 'Phase 6: Firewall Zones',
  E'On **HQ-FW1**, define security zones (INSIDE, OUTSIDE, DMZ). Create zone-pairs and apply inspection policies.',
  'zone security → zone-pair security → service-policy type inspect',
  'HQ-FW1', ARRAY['zone security', 'zone-pair security', 'service-policy type inspect'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 13, 'Phase 6: SSH-Only Management',
  E'Secure all devices: generate RSA 2048-bit keys, restrict VTY lines to SSH only, set local authentication.',
  'crypto key generate rsa modulus 2048 → transport input ssh',
  'HQ-R1', ARRAY['crypto key generate rsa', 'transport input ssh', 'login local'], 'command', 10
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 14, 'Phase 7: Wireless Deployment',
  E'Register **HQ-AP1** to **HQ-WLC**. Create WLAN "CorpWiFi" on VLAN 10 with WPA3-Enterprise and RADIUS authentication.',
  'Configure WLAN SSID, security policy, and VLAN mapping on the WLC',
  'HQ-WLC', ARRAY['wlan CorpWiFi', 'security wpa3', 'vlan 10'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 15, 'Phase 8: Remote Access VPN',
  E'Configure an IPsec remote-access VPN on **HQ-FW1** so **REMOTE-PC** can securely connect to the corporate network.',
  'crypto isakmp policy → crypto ipsec transform-set → crypto dynamic-map',
  'HQ-FW1', ARRAY['crypto isakmp', 'crypto ipsec', 'crypto dynamic-map'], 'command', 15
FROM labs l WHERE l.slug = 'full-enterprise-network';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, target_device, expected_commands, validation_type, points)
SELECT l.id, 16, 'Phase 9: End-to-End Verification',
  E'Verify the entire network:\n• Ping between VLANs through the router\n• Traceroute from Branch to HQ over GRE\n• Verify BGP routes to ISP\n• Test DNS resolution\n• Confirm NAT translations\n• Verify SSH connectivity\n• Test wireless client association',
  'Use show and ping/traceroute commands on multiple devices',
  'HQ-R1', ARRAY['ping', 'traceroute', 'show ip bgp', 'show ip nat translations', 'show ip ospf neighbor'], 'command', 20
FROM labs l WHERE l.slug = 'full-enterprise-network';

-- ============================================================
-- SEED DATA: Default user
-- ============================================================

INSERT INTO users (username, display_name) VALUES ('student', 'Network Student');

-- ============================================================
-- SEED DATA: Achievements
-- ============================================================

INSERT INTO achievements (slug, name, description, icon) VALUES
('first-command',   'First Command',        'Entered your first CLI command',                    'terminal'),
('vlan-master',     'VLAN Master',          'Completed the VLAN fundamentals lab',               'layers'),
('routing-hero',    'Routing Hero',         'Completed OSPF and BGP labs',                       'route'),
('security-guru',   'Security Guru',        'Completed ACL, firewall, and SSH labs',             'shield'),
('wireless-wizard', 'Wireless Wizard',      'Completed all wireless labs',                       'wifi'),
('enterprise-architect', 'Enterprise Architect', 'Completed the full integration lab',           'building'),
('speed-demon',     'Speed Demon',          'Completed any lab in under half the estimated time','zap'),
('perfectionist',   'Perfectionist',        'Completed any lab with 100% score on first try',   'star');
