-- ==========================================================
-- MIGRATION: Rebuild labs with prerequisite setup steps
-- Generated SQL using proven INSERT...SELECT pattern
-- ==========================================================

-- stp-loop-prevention (7 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'stp-loop-prevention');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'stp-loop-prevention');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'stp-loop-prevention');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Create VLANs on SW1',
  E'Before configuring STP, create the VLANs it will protect.\n\nOn **SW1**, create VLAN 10 (Engineering) and VLAN 20 (Sales).',
  'vlan 10, name Engineering, vlan 20, name Sales',
  'STP runs per-VLAN (PVST+). Without VLANs, there is only one STP instance for default VLAN 1.',
  'SW1', ARRAY['configure terminal', 'vlan 10', 'name Engineering', 'vlan 20', 'name Sales'], 'command', 10
FROM labs l WHERE l.slug = 'stp-loop-prevention';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Setup: Configure trunk between switches',
  E'Configure Gi0/24 on SW1 as a trunk to SW2 so VLAN traffic flows between switches.\n\nTrunk links carry multiple VLANs and STP must manage loops on each.',
  'switchport trunk encapsulation dot1q, switchport mode trunk',
  'Trunk links are where STP matters most. Redundant trunks create the loops STP prevents.',
  'SW1', ARRAY['interface GigabitEthernet0/24', 'switchport trunk encapsulation dot1q', 'switchport mode trunk'], 'command', 10
FROM labs l WHERE l.slug = 'stp-loop-prevention';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Verify default STP state',
  E'On **SW1**, check the current spanning-tree status for VLAN 10.\n\nObserve which switch was elected root bridge by default.',
  'show spanning-tree vlan 10',
  'STP elects a root bridge based on the lowest bridge ID (priority + MAC). Without configuration, the election is essentially random.',
  'SW1', ARRAY['show spanning-tree'], 'command', 10
FROM labs l WHERE l.slug = 'stp-loop-prevention';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Set SW1 as root bridge',
  E'Configure **SW1** with priority 4096 to force it as root bridge for all VLANs.',
  'spanning-tree vlan 10 priority 4096',
  'Lower priority = more likely to become root. Default is 32768. Setting 4096 guarantees SW1 wins.',
  'SW1', ARRAY['configure terminal', 'spanning-tree vlan 10 priority 4096', 'spanning-tree vlan 20 priority 4096'], 'command', 15
FROM labs l WHERE l.slug = 'stp-loop-prevention';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Enable PortFast on access ports',
  E'On **SW2**, enable PortFast on Gi0/1 to skip listening/learning states for end devices.',
  'spanning-tree portfast on the interface',
  'PortFast transitions access ports to forwarding immediately. Only use on end-device ports, never switch-to-switch.',
  'SW2', ARRAY['configure terminal', 'interface GigabitEthernet0/1', 'spanning-tree portfast'], 'command', 10
FROM labs l WHERE l.slug = 'stp-loop-prevention';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Enable BPDU Guard',
  E'On **SW2** Gi0/1, enable BPDU Guard to shut down the port if a switch is accidentally connected.',
  'spanning-tree bpduguard enable',
  'If someone plugs a rogue switch into an access port, BPDUs arrive and the port is errdisabled.',
  'SW2', ARRAY['spanning-tree bpduguard enable'], 'command', 10
FROM labs l WHERE l.slug = 'stp-loop-prevention';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 7,
  'Verify STP topology',
  E'Check spanning-tree on **SW3** to verify port roles (Root, Designated, Blocking).\n\nSW1 should be root. SW3 should have one root port and may have a blocking port.',
  'show spanning-tree',
  'Non-root switches have root ports (best path toward root) and may have blocking ports to prevent loops.',
  'SW3', ARRAY['show spanning-tree'], 'command', 10
FROM labs l WHERE l.slug = 'stp-loop-prevention';

-- lacp-etherchannel (7 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'lacp-etherchannel');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'lacp-etherchannel');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'lacp-etherchannel');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Create VLANs',
  E'On **SW1**, create VLAN 10 (Corp) and VLAN 20 (Guest).\n\nThe EtherChannel trunk you build will carry these VLANs.',
  'vlan 10, name Corp, vlan 20, name Guest',
  'EtherChannels are most useful on trunk links carrying multiple VLANs.',
  'SW1', ARRAY['configure terminal', 'vlan 10', 'name Corp', 'vlan 20', 'name Guest'], 'command', 10
FROM labs l WHERE l.slug = 'lacp-etherchannel';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Setup: Create matching VLANs on SW2',
  E'Create the same VLANs on **SW2** so both switches agree on the VLAN database.',
  'vlan 10, name Corp, vlan 20, name Guest',
  'VLANs must exist on both switches for trunk traffic to flow.',
  'SW2', ARRAY['configure terminal', 'vlan 10', 'name Corp', 'vlan 20', 'name Guest'], 'command', 10
FROM labs l WHERE l.slug = 'lacp-etherchannel';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Select interfaces for bundling',
  E'On **SW1**, enter interface range Gi0/1-2 to configure both ports.',
  'interface range GigabitEthernet0/1-2',
  'EtherChannel bundles multiple physical links into one logical link.',
  'SW1', ARRAY['configure terminal', 'interface range GigabitEthernet0/1-2'], 'command', 10
FROM labs l WHERE l.slug = 'lacp-etherchannel';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Configure LACP active mode',
  E'Set channel-group 1 with LACP active mode on **SW1**.',
  'channel-group 1 mode active',
  'LACP active mode initiates negotiation. Both sides can be active.',
  'SW1', ARRAY['channel-group 1 mode active'], 'command', 15
FROM labs l WHERE l.slug = 'lacp-etherchannel';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Configure SW2 matching LACP',
  E'On **SW2**, configure the same interface range with channel-group 1 mode active.',
  'Same commands as SW1',
  'Both ends must use the same channel-group number and compatible LACP modes.',
  'SW2', ARRAY['configure terminal', 'interface range GigabitEthernet0/1-2', 'channel-group 1 mode active'], 'command', 15
FROM labs l WHERE l.slug = 'lacp-etherchannel';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Configure trunk on Port-channel',
  E'Configure Port-channel1 as a trunk carrying VLANs 10 and 20.',
  'interface Port-channel1, switchport mode trunk',
  'Configure the Port-channel interface, not the members. Settings are inherited.',
  'SW1', ARRAY['interface Port-channel1', 'switchport trunk encapsulation dot1q', 'switchport mode trunk'], 'command', 10
FROM labs l WHERE l.slug = 'lacp-etherchannel';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 7,
  'Verify EtherChannel',
  E'Verify the EtherChannel is up and bundled.',
  'show etherchannel summary',
  'Look for (P) flags indicating bundled ports. (I) means individual.',
  'SW1', ARRAY['show etherchannel summary'], 'command', 10
FROM labs l WHERE l.slug = 'lacp-etherchannel';

-- ospf-single-area (7 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ospf-single-area');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ospf-single-area');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ospf-single-area');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Assign subnet IPs to R1',
  E'Before OSPF can advertise routes, each router needs IP addresses.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 and bring it up.',
  'interface Gi0/0, ip address 10.0.1.1 255.255.255.0, no shutdown',
  'OSPF advertises connected subnets. Without IPs on interfaces, there is nothing to advertise.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'ospf-single-area';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Setup: Assign subnet IPs to R2',
  E'On **R2**, assign **10.0.1.2/24** to Gi0/0 and **10.0.2.1/24** to Gi0/1.',
  'Same pattern as R1',
  'The subnetting ensures no overlap: 10.0.1.0/24 is the shared link, 10.0.2.0/24 is R2 LAN.',
  'R2', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.2 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'ospf-single-area';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Enable OSPF on R1',
  E'Enter OSPF configuration on **R1** with process ID 1 and advertise 10.0.1.0/24 in area 0.',
  'router ospf 1, network 10.0.1.0 0.0.0.255 area 0',
  'OSPF process IDs are locally significant. The network command uses wildcard masks. Area 0 is the backbone.',
  'R1', ARRAY['router ospf 1', 'network 10.0.1.0 0.0.0.255 area 0'], 'command', 10
FROM labs l WHERE l.slug = 'ospf-single-area';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Configure OSPF on R2',
  E'Enable OSPF on **R2** and advertise 10.0.2.0/24 in area 0.',
  'router ospf 1, network area 0',
  'All routers in the same area exchange LSAs to build identical LSDBs.',
  'R2', ARRAY['configure terminal', 'router ospf 1', 'network 10.0.2.0 0.0.0.255 area 0'], 'command', 10
FROM labs l WHERE l.slug = 'ospf-single-area';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Configure OSPF on R3',
  E'Enable OSPF on **R3** and advertise 10.0.3.0/24 in area 0.',
  'Same pattern as R1 and R2',
  'Once all routers are in the same area, OSPF calculates shortest paths via Dijkstra.',
  'R3', ARRAY['configure terminal', 'router ospf 1', 'network 10.0.3.0 0.0.0.255 area 0'], 'command', 10
FROM labs l WHERE l.slug = 'ospf-single-area';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify OSPF neighbors',
  E'On **R1**, verify OSPF neighbor adjacencies have formed.',
  'show ip ospf neighbor',
  'FULL state means adjacency is complete and LSDBs are synchronized.',
  'R1', ARRAY['show ip ospf neighbor'], 'command', 10
FROM labs l WHERE l.slug = 'ospf-single-area';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 7,
  'Verify routing table',
  E'Check R1 routing table to see OSPF-learned routes (marked with O).',
  'show ip route',
  'You should see O routes for R2 and R3 subnets alongside C (connected) routes.',
  'R1', ARRAY['show ip route'], 'command', 10
FROM labs l WHERE l.slug = 'ospf-single-area';

-- dhcp-server-config (6 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dhcp-server-config');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dhcp-server-config');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dhcp-server-config');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure router gateway IP',
  E'On **R1**, assign **10.0.1.1/24** to Gi0/0. This will be the default gateway for DHCP clients.',
  'interface Gi0/0, ip address 10.0.1.1 255.255.255.0, no shutdown',
  'The router interface IP becomes the default-router in the DHCP pool.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'dhcp-server-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Exclude reserved addresses',
  E'Exclude addresses 10.0.1.1 through 10.0.1.10 from the DHCP pool.',
  'ip dhcp excluded-address 10.0.1.1 10.0.1.10',
  'Excluding prevents DHCP from assigning IPs reserved for routers or servers.',
  'R1', ARRAY['ip dhcp excluded-address 10.0.1.1 10.0.1.10'], 'command', 10
FROM labs l WHERE l.slug = 'dhcp-server-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Create DHCP pool',
  E'Create a pool named "LAN" with network 10.0.1.0/24.',
  'ip dhcp pool LAN, network 10.0.1.0 255.255.255.0',
  'The pool network must match the subnet on the router interface.',
  'R1', ARRAY['ip dhcp pool LAN', 'network 10.0.1.0 255.255.255.0'], 'command', 10
FROM labs l WHERE l.slug = 'dhcp-server-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Set default gateway and DNS',
  E'In the pool, set default-router to 10.0.1.1 and dns-server to 8.8.8.8.',
  'default-router 10.0.1.1, dns-server 8.8.8.8',
  'DHCP options tell clients which gateway and DNS to use.',
  'R1', ARRAY['default-router 10.0.1.1', 'dns-server 8.8.8.8'], 'command', 10
FROM labs l WHERE l.slug = 'dhcp-server-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify DHCP bindings',
  E'Check active DHCP leases.',
  'show ip dhcp binding',
  'Shows which IPs have been leased, to which MAC, and when they expire.',
  'R1', ARRAY['show ip dhcp binding'], 'command', 10
FROM labs l WHERE l.slug = 'dhcp-server-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify DHCP pool stats',
  E'Check pool utilization.',
  'show ip dhcp pool',
  'Shows total addresses, leased count, and configured options.',
  'R1', ARRAY['show ip dhcp pool'], 'command', 10
FROM labs l WHERE l.slug = 'dhcp-server-config';

-- dns-resolution (6 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dns-resolution');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dns-resolution');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dns-resolution');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure router interface',
  E'DNS needs IP connectivity.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 so the router can reach the DNS server.',
  'interface Gi0/0, ip address, no shutdown',
  'DNS queries travel over IP. The router must have a valid IP on the same subnet as the DNS server.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'dns-resolution';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Enable DNS lookup',
  E'Enable DNS name resolution on **R1**.',
  'ip domain-lookup',
  'This enables the router to send DNS queries to a configured name server.',
  'R1', ARRAY['ip domain-lookup'], 'command', 10
FROM labs l WHERE l.slug = 'dns-resolution';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Set DNS server',
  E'Point **R1** to the DNS server at 10.0.1.100.',
  'ip name-server 10.0.1.100',
  'The name-server tells the router where to send DNS queries.',
  'R1', ARRAY['ip name-server 10.0.1.100'], 'command', 10
FROM labs l WHERE l.slug = 'dns-resolution';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Set domain name',
  E'Configure the default domain name as **lab.local**.',
  'ip domain-name lab.local',
  'The domain name is appended to unqualified hostnames automatically.',
  'R1', ARRAY['ip domain-name lab.local'], 'command', 10
FROM labs l WHERE l.slug = 'dns-resolution';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Create a static host entry',
  E'Add a static mapping: **server1** resolves to 10.0.1.100.',
  'ip host server1 10.0.1.100',
  'Static entries are resolved locally without querying the DNS server.',
  'R1', ARRAY['ip host server1 10.0.1.100'], 'command', 10
FROM labs l WHERE l.slug = 'dns-resolution';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify DNS',
  E'Verify DNS configuration and entries.',
  'show hosts',
  'Shows both static and cached DNS entries.',
  'R1', ARRAY['show hosts'], 'command', 10
FROM labs l WHERE l.slug = 'dns-resolution';

-- nat-configuration (6 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'nat-configuration');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'nat-configuration');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'nat-configuration');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure inside and outside subnets',
  E'NAT translates between private and public networks.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 (inside) and **203.0.113.1/24** to Gi0/1 (outside).',
  'ip address on each interface, no shutdown',
  'The inside interface connects to your private network, outside connects to the ISP.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 203.0.113.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'nat-configuration';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Mark inside interface',
  E'Mark Gi0/0 as the NAT inside interface.',
  'ip nat inside',
  'Inside interfaces face the private network.',
  'R1', ARRAY['interface GigabitEthernet0/0', 'ip nat inside'], 'command', 10
FROM labs l WHERE l.slug = 'nat-configuration';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Mark outside interface',
  E'Mark Gi0/1 as the NAT outside interface.',
  'ip nat outside',
  'NAT translates addresses as packets cross the boundary.',
  'R1', ARRAY['interface GigabitEthernet0/1', 'ip nat outside'], 'command', 10
FROM labs l WHERE l.slug = 'nat-configuration';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Configure static NAT',
  E'Create a static NAT: inside 10.0.1.100 to outside 203.0.113.100.',
  'ip nat inside source static 10.0.1.100 203.0.113.100',
  'Static NAT creates a permanent 1:1 mapping for servers.',
  'R1', ARRAY['ip nat inside source static 10.0.1.100 203.0.113.100'], 'command', 15
FROM labs l WHERE l.slug = 'nat-configuration';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify NAT translations',
  E'Check the translation table.',
  'show ip nat translations',
  'Shows mappings between inside local and inside global addresses.',
  'R1', ARRAY['show ip nat translations'], 'command', 10
FROM labs l WHERE l.slug = 'nat-configuration';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify NAT statistics',
  E'Check hit counts and active translations.',
  'show ip nat statistics',
  'Shows packet counts and which interfaces are inside/outside.',
  'R1', ARRAY['show ip nat statistics'], 'command', 10
FROM labs l WHERE l.slug = 'nat-configuration';

-- pat-overload (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'pat-overload');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'pat-overload');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'pat-overload');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure interfaces and NAT directions',
  E'On **R1**, set up inside (10.0.1.1/24 on Gi0/0) and outside (Gi0/1).\n\nMark Gi0/0 as NAT inside and Gi0/1 as NAT outside.',
  'ip address, ip nat inside/outside',
  'PAT builds on NAT. You need inside/outside defined first.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'ip nat inside', 'no shutdown', 'interface GigabitEthernet0/1', 'ip nat outside', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'pat-overload';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Create ACL for NAT traffic',
  E'Create access-list 1 permitting 10.0.1.0/24.',
  'access-list 1 permit 10.0.1.0 0.0.0.255',
  'The ACL defines which addresses are eligible for translation.',
  'R1', ARRAY['access-list 1 permit 10.0.1.0 0.0.0.255'], 'command', 10
FROM labs l WHERE l.slug = 'pat-overload';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Configure PAT overload',
  E'Configure PAT using the outside interface with **overload**.',
  'ip nat inside source list 1 interface Gi0/1 overload',
  'The overload keyword maps many hosts to one IP via port numbers.',
  'R1', ARRAY['ip nat inside source list 1 interface GigabitEthernet0/1 overload'], 'command', 15
FROM labs l WHERE l.slug = 'pat-overload';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Verify PAT translations',
  E'Check the translation table for port mappings.',
  'show ip nat translations',
  'PAT entries show different source ports mapped to one outside IP.',
  'R1', ARRAY['show ip nat translations'], 'command', 10
FROM labs l WHERE l.slug = 'pat-overload';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify NAT statistics',
  E'Confirm PAT is working.',
  'show ip nat statistics',
  'The hits counter shows translated packets.',
  'R1', ARRAY['show ip nat statistics'], 'command', 10
FROM labs l WHERE l.slug = 'pat-overload';

-- acl-traffic-filtering (7 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'acl-traffic-filtering');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'acl-traffic-filtering');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'acl-traffic-filtering');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure subnets',
  E'ACLs filter traffic between subnets.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 (LAN) and **10.0.2.1/24** to Gi0/1 (Servers).',
  'ip address on each interface',
  'ACLs match on source/destination IPs. Without subnets, there is no traffic to filter.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 10.0.2.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'acl-traffic-filtering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Setup: Verify connectivity',
  E'Verify both subnets are up before adding filters.',
  'show ip interface brief',
  'Verify without filtering first. If it breaks after the ACL, you know the cause.',
  'R1', ARRAY['show ip interface brief'], 'command', 5
FROM labs l WHERE l.slug = 'acl-traffic-filtering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Create named extended ACL',
  E'Create an extended ACL named **BLOCK-TELNET**.',
  'ip access-list extended BLOCK-TELNET',
  'Named ACLs are easier to manage than numbered ones.',
  'R1', ARRAY['ip access-list extended BLOCK-TELNET'], 'command', 10
FROM labs l WHERE l.slug = 'acl-traffic-filtering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Add deny and permit rules',
  E'Deny TCP port 23 (Telnet), then permit all other traffic.',
  'deny tcp any any eq 23, permit ip any any',
  'ACLs are top-down. The explicit permit at the end is critical.',
  'R1', ARRAY['deny tcp any any eq 23', 'permit ip any any'], 'command', 15
FROM labs l WHERE l.slug = 'acl-traffic-filtering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Apply ACL to interface',
  E'Apply BLOCK-TELNET inbound on Gi0/0.',
  'ip access-group BLOCK-TELNET in',
  'Extended ACLs should be placed close to the source.',
  'R1', ARRAY['interface GigabitEthernet0/0', 'ip access-group BLOCK-TELNET in'], 'command', 10
FROM labs l WHERE l.slug = 'acl-traffic-filtering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify ACL',
  E'Check ACL configuration and hit counts.',
  'show access-lists',
  'Match counts verify the ACL is working.',
  'R1', ARRAY['show access-lists'], 'command', 10
FROM labs l WHERE l.slug = 'acl-traffic-filtering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 7,
  'Verify interface ACL',
  E'Confirm ACL is applied to the correct interface.',
  'show ip interface GigabitEthernet0/0',
  'Should show Inbound access list is BLOCK-TELNET.',
  'R1', ARRAY['show ip interface GigabitEthernet0/0'], 'command', 10
FROM labs l WHERE l.slug = 'acl-traffic-filtering';

-- ssh-secure-mgmt (6 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ssh-secure-mgmt');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ssh-secure-mgmt');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ssh-secure-mgmt');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure management IP',
  E'SSH needs IP connectivity.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0.',
  'interface Gi0/0, ip address, no shutdown',
  'Without an IP, no one can SSH into the router.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'ssh-secure-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Set hostname and domain',
  E'Set hostname and domain name for RSA key generation.',
  'hostname R1, ip domain-name lab.local',
  'RSA keys use the FQDN as part of the key identity.',
  'R1', ARRAY['hostname R1', 'ip domain-name lab.local'], 'command', 10
FROM labs l WHERE l.slug = 'ssh-secure-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Generate RSA keys',
  E'Generate 2048-bit RSA keys.',
  'crypto key generate rsa modulus 2048',
  '2048 bits is minimum recommended for SSH version 2.',
  'R1', ARRAY['crypto key generate rsa modulus 2048'], 'command', 10
FROM labs l WHERE l.slug = 'ssh-secure-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Create local user',
  E'Create admin account with privilege 15.',
  'username admin privilege 15 secret',
  'Local authentication stores credentials on the router.',
  'R1', ARRAY['username admin privilege 15 secret'], 'command', 10
FROM labs l WHERE l.slug = 'ssh-secure-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Restrict VTY to SSH only',
  E'Configure VTY lines 0-4 for SSH only with local auth.',
  'line vty 0 4, transport input ssh, login local',
  'This blocks insecure Telnet access.',
  'R1', ARRAY['line vty 0 4', 'transport input ssh', 'login local'], 'command', 15
FROM labs l WHERE l.slug = 'ssh-secure-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify SSH',
  E'Verify SSH is enabled.',
  'show ip ssh',
  'Should show SSH version 2.0 enabled.',
  'R1', ARRAY['show ip ssh'], 'command', 10
FROM labs l WHERE l.slug = 'ssh-secure-mgmt';

-- firewall-zones (6 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'firewall-zones');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'firewall-zones');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'firewall-zones');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure inside and outside subnets',
  E'On **FW1**, assign **10.0.1.1/24** to Gi0/0 (INSIDE) and **203.0.113.1/24** to Gi0/1 (OUTSIDE).',
  'ip address on each interface',
  'The firewall sits between trusted and untrusted networks.',
  'FW1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 203.0.113.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'firewall-zones';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Create security zones',
  E'Create INSIDE and OUTSIDE security zones.',
  'zone security INSIDE, zone security OUTSIDE',
  'Zones group interfaces by trust level. All inter-zone traffic is denied by default.',
  'FW1', ARRAY['zone security INSIDE', 'zone security OUTSIDE'], 'command', 10
FROM labs l WHERE l.slug = 'firewall-zones';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Assign interfaces to zones',
  E'Assign Gi0/0 to INSIDE and Gi0/1 to OUTSIDE.',
  'zone-member security on each interface',
  'Once joined, all traffic is subject to zone policies.',
  'FW1', ARRAY['interface GigabitEthernet0/0', 'zone-member security INSIDE', 'interface GigabitEthernet0/1', 'zone-member security OUTSIDE'], 'command', 10
FROM labs l WHERE l.slug = 'firewall-zones';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Create zone pair',
  E'Create a zone-pair from INSIDE to OUTSIDE.',
  'zone-pair security IN-OUT source INSIDE destination OUTSIDE',
  'Zone pairs define which direction traffic can flow.',
  'FW1', ARRAY['zone-pair security IN-OUT source INSIDE destination OUTSIDE'], 'command', 15
FROM labs l WHERE l.slug = 'firewall-zones';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Apply inspection policy',
  E'Apply a service-policy inspecting HTTP, HTTPS, and DNS.',
  'service-policy type inspect IN-OUT-POLICY',
  'Stateful inspection allows return traffic automatically.',
  'FW1', ARRAY['service-policy type inspect IN-OUT-POLICY'], 'command', 15
FROM labs l WHERE l.slug = 'firewall-zones';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify firewall zones',
  E'Verify zone config and active policies.',
  'show zone security, show zone-pair security',
  'Check interfaces are in correct zones and policies are applied.',
  'FW1', ARRAY['show zone security', 'show zone-pair security'], 'command', 10
FROM labs l WHERE l.slug = 'firewall-zones';

-- bgp-peering (6 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'bgp-peering');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'bgp-peering');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'bgp-peering');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure link subnet',
  E'BGP peers must be IP-reachable.\n\nOn **R1**, assign **10.0.0.1/30** to Gi0/0 and create Loopback0 with **192.168.1.1/24**.',
  'ip address on Gi0/0 and Loopback0',
  'The /30 gives 2 usable IPs for the point-to-point link. The loopback is the prefix to advertise.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.0.1 255.255.255.252', 'no shutdown', 'interface Loopback0', 'ip address 192.168.1.1 255.255.255.0'], 'command', 10
FROM labs l WHERE l.slug = 'bgp-peering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Start BGP process',
  E'On **R1**, start BGP with AS 65001.',
  'router bgp 65001',
  'Private ASNs are 64512-65534.',
  'R1', ARRAY['router bgp 65001'], 'command', 10
FROM labs l WHERE l.slug = 'bgp-peering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Configure eBGP neighbor',
  E'Add ISP (10.0.0.2) as eBGP neighbor in AS 65000.',
  'neighbor 10.0.0.2 remote-as 65000',
  'eBGP peers are in different ASes. BGP uses TCP port 179.',
  'R1', ARRAY['neighbor 10.0.0.2 remote-as 65000'], 'command', 15
FROM labs l WHERE l.slug = 'bgp-peering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Advertise your prefix',
  E'Advertise 192.168.1.0/24 into BGP.',
  'network 192.168.1.0 mask 255.255.255.0',
  'BGP network command requires an exact match in the routing table.',
  'R1', ARRAY['network 192.168.1.0 mask 255.255.255.0'], 'command', 10
FROM labs l WHERE l.slug = 'bgp-peering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify BGP neighbor',
  E'Check BGP neighbor status.',
  'show ip bgp summary',
  'State/PfxRcd should show a number, not Active or Idle.',
  'R1', ARRAY['show ip bgp summary'], 'command', 10
FROM labs l WHERE l.slug = 'bgp-peering';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify BGP table',
  E'Check BGP routing table.',
  'show ip bgp',
  'The > symbol indicates best path. * means valid.',
  'R1', ARRAY['show ip bgp'], 'command', 10
FROM labs l WHERE l.slug = 'bgp-peering';

-- network-tunneling (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-tunneling');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-tunneling');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-tunneling');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure transport IPs',
  E'Tunnels need routable endpoints.\n\nOn **R1**, assign **203.0.113.1/24** to Gi0/0.',
  'ip address 203.0.113.1 255.255.255.0',
  'Tunnel endpoints must be reachable over the transport network.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 203.0.113.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'network-tunneling';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Create tunnel interface',
  E'Create Tunnel0 on **R1**.',
  'interface Tunnel0',
  'Tunnel interfaces encapsulate packets inside another protocol.',
  'R1', ARRAY['interface Tunnel0'], 'command', 10
FROM labs l WHERE l.slug = 'network-tunneling';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Set tunnel source and destination',
  E'Set source to Gi0/0 and destination to 203.0.113.2.',
  'tunnel source, tunnel destination',
  'The outer header uses these for delivery across the transport network.',
  'R1', ARRAY['tunnel source GigabitEthernet0/0', 'tunnel destination 203.0.113.2'], 'command', 15
FROM labs l WHERE l.slug = 'network-tunneling';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Assign tunnel IP',
  E'Assign **10.255.0.1/30** to Tunnel0.',
  'ip address 10.255.0.1 255.255.255.252',
  'The tunnel IP is for the overlay network, separate from transport IPs.',
  'R1', ARRAY['ip address 10.255.0.1 255.255.255.252'], 'command', 10
FROM labs l WHERE l.slug = 'network-tunneling';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify tunnel',
  E'Check tunnel status.',
  'show interfaces tunnel 0',
  'Should show up/up when source and destination are reachable.',
  'R1', ARRAY['show interfaces tunnel 0'], 'command', 10
FROM labs l WHERE l.slug = 'network-tunneling';

-- gre-tunnels (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'gre-tunnels');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'gre-tunnels');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'gre-tunnels');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure transport IPs',
  E'On **R1**, assign **198.51.100.1/24** to Gi0/0.',
  'ip address 198.51.100.1 255.255.255.0',
  'GRE endpoints must be reachable via the underlying network.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 198.51.100.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'gre-tunnels';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Create GRE tunnel',
  E'Create Tunnel0 with GRE mode.',
  'interface Tunnel0, tunnel mode gre ip',
  'GRE supports multicast so you can run OSPF over it.',
  'R1', ARRAY['interface Tunnel0', 'tunnel mode gre ip'], 'command', 10
FROM labs l WHERE l.slug = 'gre-tunnels';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Configure tunnel endpoints',
  E'Set source Gi0/0, destination 198.51.100.2, IP 10.255.0.1/30.',
  'tunnel source, tunnel destination, ip address',
  'GRE adds 24-byte overhead per packet.',
  'R1', ARRAY['tunnel source GigabitEthernet0/0', 'tunnel destination 198.51.100.2', 'ip address 10.255.0.1 255.255.255.252'], 'command', 15
FROM labs l WHERE l.slug = 'gre-tunnels';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Verify tunnel status',
  E'Check tunnel interface status.',
  'show interfaces tunnel 0',
  'Should show Tunnel protocol/transport GRE/IP.',
  'R1', ARRAY['show interfaces tunnel 0'], 'command', 10
FROM labs l WHERE l.slug = 'gre-tunnels';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Test overlay connectivity',
  E'Ping across the GRE tunnel.',
  'ping 10.255.0.2',
  'Success means packets are encapsulated, transported, and decapsulated correctly.',
  'R1', ARRAY['ping 10.255.0.2'], 'command', 10
FROM labs l WHERE l.slug = 'gre-tunnels';

-- autonomous-systems (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'autonomous-systems');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'autonomous-systems');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'autonomous-systems');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure inter-router links',
  E'On **R1**, assign **10.0.0.1/30** to Gi0/0 (link to R2) and **10.1.0.2/30** to Gi0/1 (link to ISP).',
  'ip address on each interface',
  'BGP peers must be IP-reachable. /30 subnets for point-to-point links.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.0.1 255.255.255.252', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 10.1.0.2 255.255.255.252', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'autonomous-systems';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Configure iBGP within AS',
  E'On **R1**, set up iBGP peering with R2 (both AS 65001).',
  'router bgp 65001, neighbor 10.0.0.2 remote-as 65001',
  'iBGP peers share the same AS number.',
  'R1', ARRAY['router bgp 65001', 'neighbor 10.0.0.2 remote-as 65001'], 'command', 15
FROM labs l WHERE l.slug = 'autonomous-systems';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Configure eBGP to ISP',
  E'Add eBGP peering with ISP (AS 65000).',
  'neighbor 10.1.0.1 remote-as 65000',
  'eBGP peers are in different ASes. AS path is prepended at boundaries.',
  'R1', ARRAY['neighbor 10.1.0.1 remote-as 65000'], 'command', 15
FROM labs l WHERE l.slug = 'autonomous-systems';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Verify BGP summary',
  E'Check BGP neighbor status.',
  'show ip bgp summary',
  'Both iBGP and eBGP peers appear in the same table.',
  'R1', ARRAY['show ip bgp summary'], 'command', 10
FROM labs l WHERE l.slug = 'autonomous-systems';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Examine AS path',
  E'Check BGP table for AS path attributes.',
  'show ip bgp',
  'ISP routes show the ISP AS in the path. iBGP routes show empty path.',
  'R1', ARRAY['show ip bgp'], 'command', 10
FROM labs l WHERE l.slug = 'autonomous-systems';

-- mpls-label-switching (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'mpls-label-switching');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'mpls-label-switching');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'mpls-label-switching');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure OSPF as IGP',
  E'MPLS requires an underlying IGP.\n\nOn **PE1**, configure OSPF on Gi0/0.',
  'router ospf 1, network area 0',
  'MPLS LDP uses the IGP to discover neighbors and distribute labels.',
  'PE1', ARRAY['configure terminal', 'router ospf 1', 'network 10.0.0.0 0.0.0.255 area 0'], 'command', 10
FROM labs l WHERE l.slug = 'mpls-label-switching';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Enable MPLS on PE1',
  E'Enable MPLS on Gi0/0 of **PE1**.',
  'mpls ip under the interface',
  'This activates LDP on the link.',
  'PE1', ARRAY['interface GigabitEthernet0/0', 'mpls ip'], 'command', 10
FROM labs l WHERE l.slug = 'mpls-label-switching';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Enable MPLS on P1',
  E'Enable MPLS on both interfaces of **P1**.',
  'mpls ip on each interface',
  'Core routers switch packets based on labels.',
  'P1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'mpls ip', 'interface GigabitEthernet0/1', 'mpls ip'], 'command', 15
FROM labs l WHERE l.slug = 'mpls-label-switching';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Verify LDP neighbors',
  E'Check LDP sessions on **PE1**.',
  'show mpls ldp neighbor',
  'Session state should be Oper (operational).',
  'PE1', ARRAY['show mpls ldp neighbor'], 'command', 10
FROM labs l WHERE l.slug = 'mpls-label-switching';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify MPLS forwarding table',
  E'Examine the LFIB on PE1.',
  'show mpls forwarding-table',
  'Shows local labels, outgoing labels, and next-hop interfaces.',
  'PE1', ARRAY['show mpls forwarding-table'], 'command', 10
FROM labs l WHERE l.slug = 'mpls-label-switching';

-- ipv6-addressing (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ipv6-addressing');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ipv6-addressing');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ipv6-addressing');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure IPv4 first',
  E'IPv6 runs alongside IPv4 (dual-stack).\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 to show both protocols coexist.',
  'ip address 10.0.1.1 255.255.255.0',
  'Dual-stack means both IPv4 and IPv6 are active simultaneously.',
  'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'ipv6-addressing';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Enable IPv6 routing',
  E'Enable IPv6 unicast routing globally on **R1**.',
  'ipv6 unicast-routing',
  'IPv6 routing is disabled by default on Cisco routers.',
  'R1', ARRAY['ipv6 unicast-routing'], 'command', 10
FROM labs l WHERE l.slug = 'ipv6-addressing';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Configure IPv6 address',
  E'Assign **2001:DB8:1::1/64** to Gi0/0.',
  'ipv6 address 2001:DB8:1::1/64',
  'The /64 is standard for LAN subnets. A link-local address is auto-generated.',
  'R1', ARRAY['interface GigabitEthernet0/0', 'ipv6 address 2001:DB8:1::1/64'], 'command', 10
FROM labs l WHERE l.slug = 'ipv6-addressing';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Verify IPv6 interfaces',
  E'Check IPv6 addresses on all interfaces.',
  'show ipv6 interface brief',
  'Should show both global and link-local addresses. IPv4 is still there too.',
  'R1', ARRAY['show ipv6 interface brief'], 'command', 10
FROM labs l WHERE l.slug = 'ipv6-addressing';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify IPv6 neighbors',
  E'Check IPv6 neighbor discovery table.',
  'show ipv6 neighbors',
  'NDP replaces ARP in IPv6, mapping IPv6 to MAC addresses.',
  'R1', ARRAY['show ipv6 neighbors'], 'command', 10
FROM labs l WHERE l.slug = 'ipv6-addressing';

-- wireless-ap-config (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-ap-config');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-ap-config');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-ap-config');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Enter configuration mode',
  E'Wireless APs bridge clients onto VLANs.\n\nOn **AP1**, enter global configuration mode.',
  'configure terminal',
  'The AP connects to a switch port in VLAN 10. It bridges wireless clients onto that VLAN.',
  'AP1', ARRAY['configure terminal'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-ap-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Set SSID name',
  E'Configure the SSID as **CorpWiFi**.',
  'dot11 ssid CorpWiFi',
  'The SSID is the network name clients see when scanning.',
  'AP1', ARRAY['dot11 ssid CorpWiFi'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-ap-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Set authentication mode',
  E'Configure WPA2 authentication.',
  'authentication open, authentication key-management wpa version 2',
  'WPA2 with PSK for small deployments. Enterprise uses 802.1X.',
  'AP1', ARRAY['authentication open', 'authentication key-management wpa version 2'], 'command', 15
FROM labs l WHERE l.slug = 'wireless-ap-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Assign VLAN to SSID',
  E'Map CorpWiFi to VLAN 10.',
  'vlan 10',
  'Wireless clients join the same VLAN and subnet as wired Corp users.',
  'AP1', ARRAY['vlan 10'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-ap-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify wireless config',
  E'Check wireless configuration.',
  'show dot11 associations',
  'Shows connected clients, signal strength, and VLAN assignment.',
  'AP1', ARRAY['show dot11 associations'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-ap-config';

-- wireless-controller-mgmt (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-controller-mgmt');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-controller-mgmt');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-controller-mgmt');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Enter configuration mode',
  E'The WLC manages APs that bridge clients onto VLANs.\n\nOn **WLC1**, enter configuration mode.',
  'configure terminal',
  'You configure SSID and VLAN mapping once on the WLC and it pushes to all APs.',
  'WLC1', ARRAY['configure terminal'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-controller-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Create WLAN on WLC',
  E'Create WLAN **CorpWiFi** with ID 1.',
  'wlan CorpWiFi 1 CorpWiFi',
  'WLANs define SSID, security, and VLAN mapping.',
  'WLC1', ARRAY['wlan CorpWiFi 1 CorpWiFi'], 'command', 15
FROM labs l WHERE l.slug = 'wireless-controller-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Assign VLAN interface',
  E'Map the WLAN to VLAN 10.',
  'interface vlan 10',
  'Wireless clients on CorpWiFi get the same subnet as wired VLAN 10.',
  'WLC1', ARRAY['interface vlan 10'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-controller-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Enable the WLAN',
  E'Enable the WLAN so APs broadcast the SSID.',
  'no shutdown',
  'WLANs are disabled by default. Configure security before enabling.',
  'WLC1', ARRAY['no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-controller-mgmt';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify AP registration',
  E'Check that APs registered with the WLC.',
  'show ap summary',
  'Shows AP name, model, IP, and client count.',
  'WLC1', ARRAY['show ap summary'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-controller-mgmt';

-- wireless-security-config (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-security-config');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-security-config');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-security-config');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Create WLAN to secure',
  E'On **WLC1**, create WLAN **SecureWiFi** and enable it.',
  'wlan SecureWiFi 1 SecureWiFi, no shutdown',
  'Security is applied to existing WLANs, like ACLs on interfaces.',
  'WLC1', ARRAY['configure terminal', 'wlan SecureWiFi 1 SecureWiFi', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-security-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Configure WPA3-Enterprise',
  E'Set WPA3 with 802.1X authentication.',
  'security wpa3, security dot1x',
  'WPA3-Enterprise gives per-user encryption via 802.1X.',
  'WLC1', ARRAY['security wpa3', 'security dot1x'], 'command', 15
FROM labs l WHERE l.slug = 'wireless-security-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Add RADIUS server',
  E'Configure RADIUS server at 10.0.1.200.',
  'radius server, address ipv4, key',
  '802.1X delegates auth to RADIUS. Shared secret must match.',
  'WLC1', ARRAY['radius server RADIUS-SRV', 'address ipv4 10.0.1.200', 'key radiussecret'], 'command', 15
FROM labs l WHERE l.slug = 'wireless-security-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Enable PMF',
  E'Enable Protected Management Frames (802.11w).',
  'security pmf required',
  'Prevents deauthentication attacks by protecting management frames.',
  'WLC1', ARRAY['security pmf required'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-security-config';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify wireless security',
  E'Check WLAN security config.',
  'show wlan summary',
  'Verify WPA3, 802.1X, and PMF are all active.',
  'WLC1', ARRAY['show wlan summary'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-security-config';

-- wireless-topology-design (5 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-topology-design');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-topology-design');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-topology-design');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure SSID on AP1',
  E'All APs broadcast the same SSID for seamless roaming.\n\nOn **AP1**, set SSID **CorpWiFi**.',
  'dot11 ssid CorpWiFi',
  'Same SSID across APs enables seamless roaming.',
  'AP1', ARRAY['configure terminal', 'dot11 ssid CorpWiFi'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-topology-design';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Set AP1 channel',
  E'Set AP1 2.4GHz radio to **channel 1**.',
  'channel 1',
  'Only channels 1, 6, 11 are non-overlapping in 2.4GHz.',
  'AP1', ARRAY['interface dot11Radio0', 'channel 1'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-topology-design';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Set AP2 channel',
  E'Set AP2 to **channel 6** to avoid interference.',
  'channel 6',
  'Adjacent APs must use non-overlapping channels.',
  'AP2', ARRAY['configure terminal', 'interface dot11Radio0', 'channel 6'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-topology-design';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Set AP3 channel',
  E'Set AP3 to **channel 11** completing the 1/6/11 plan.',
  'channel 11',
  'The 1/6/11 plan gives each AP a clean frequency band.',
  'AP3', ARRAY['configure terminal', 'interface dot11Radio0', 'channel 11'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-topology-design';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Verify channel plan',
  E'Review channel assignments across all APs.',
  'show dot11 associations',
  'Proper channel plan ensures no co-channel interference.',
  'AP1', ARRAY['show dot11 associations'], 'command', 10
FROM labs l WHERE l.slug = 'wireless-topology-design';

-- remote-access-vpn (6 steps)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'remote-access-vpn');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'remote-access-vpn');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'remote-access-vpn');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 1,
  'Setup: Configure firewall interfaces',
  E'VPN terminates on the firewall.\n\nOn **FW1**, assign **203.0.113.1/24** (outside) and **10.0.1.1/24** (inside).',
  'ip address on both interfaces',
  'VPN clients connect to the outside IP and access the inside network.',
  'FW1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 203.0.113.1 255.255.255.0', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 'command', 10
FROM labs l WHERE l.slug = 'remote-access-vpn';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 2,
  'Setup: Create ACL for VPN traffic',
  E'Define which subnets VPN users can access.',
  'access-list for VPN interesting traffic',
  'Same ACL concept from security lab, applied to VPN split tunneling.',
  'FW1', ARRAY['access-list 100 permit ip 10.0.1.0 0.0.0.255 10.0.100.0 0.0.0.255'], 'command', 10
FROM labs l WHERE l.slug = 'remote-access-vpn';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 3,
  'Configure ISAKMP policy',
  E'Create ISAKMP policy with AES-256.',
  'crypto isakmp policy 10, encryption aes 256',
  'ISAKMP Phase 1 establishes a secure channel, like GRE establishes a tunnel.',
  'FW1', ARRAY['crypto isakmp policy 10', 'encryption aes 256'], 'command', 15
FROM labs l WHERE l.slug = 'remote-access-vpn';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 4,
  'Create transform set',
  E'Define IPsec transform set with ESP AES and SHA.',
  'crypto ipsec transform-set MYSET esp-aes esp-sha-hmac',
  'Transform sets define how data packets are encrypted.',
  'FW1', ARRAY['crypto ipsec transform-set MYSET esp-aes esp-sha-hmac'], 'command', 15
FROM labs l WHERE l.slug = 'remote-access-vpn';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 5,
  'Create dynamic crypto map',
  E'Create dynamic map for remote clients.',
  'crypto dynamic-map REMOTE-MAP 10',
  'Dynamic maps accept connections from unknown IPs.',
  'FW1', ARRAY['crypto dynamic-map REMOTE-MAP 10'], 'command', 10
FROM labs l WHERE l.slug = 'remote-access-vpn';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, 6,
  'Verify VPN status',
  E'Check ISAKMP security associations.',
  'show crypto isakmp sa',
  'QM_IDLE means Phase 1 is complete and tunnel is active.',
  'FW1', ARRAY['show crypto isakmp sa'], 'command', 10
FROM labs l WHERE l.slug = 'remote-access-vpn';
