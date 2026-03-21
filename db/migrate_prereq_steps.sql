-- ============================================================
-- MIGRATION: Add prerequisite setup steps to all labs
-- Each lab starts with 2-3 "set the stage" steps from earlier
-- topics, then proceeds with the main topic steps.
-- Deletes and rebuilds steps for all labs EXCEPT:
--   vlan-fundamentals (22 steps, already comprehensive)
--   ipv4-subnetting-lab (foundation, no prereqs)
--   full-enterprise-network (capstone, already rebuilt)
-- ============================================================

-- ============================================================
-- STP Lab (was 5 steps → now 7)
-- Setup: Create VLANs + assign ports, THEN apply STP
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'stp-loop-prevention');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'stp-loop-prevention');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'stp-loop-prevention');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Create VLANs on SW1', E'Before configuring STP, create the VLANs it will protect.\n\nOn **SW1**, create VLAN 10 (Engineering) and VLAN 20 (Sales).', 'vlan 10 → name Engineering → vlan 20 → name Sales', 'STP runs per-VLAN (PVST+). Without VLANs, there is only one STP instance for the default VLAN 1.', 'SW1', ARRAY['configure terminal', 'vlan 10', 'name Engineering', 'vlan 20', 'name Sales'], 10),
(2, 'Setup: Configure trunk between switches', E'Configure **GigabitEthernet0/24** on SW1 as a trunk to SW2 so VLAN traffic flows between switches.\n\nTrunk links carry multiple VLANs — STP must manage loops on each.', 'switchport trunk encapsulation dot1q → switchport mode trunk', 'Trunk links are where STP matters most — redundant trunks between switches create the loops STP prevents.', 'SW1', ARRAY['interface GigabitEthernet0/24', 'switchport trunk encapsulation dot1q', 'switchport mode trunk'], 10),
(3, 'Verify default STP state', E'On **SW1**, check the current spanning-tree status for VLAN 10.\n\nObserve which switch was elected root bridge by default.', 'show spanning-tree vlan 10', 'STP elects a root bridge based on the lowest bridge ID (priority + MAC). Without explicit configuration, the election is essentially random.', 'SW1', ARRAY['show spanning-tree'], 10),
(4, 'Set SW1 as root bridge', E'Configure **SW1** with priority 4096 to force it as the root bridge for all VLANs.\n\nThis overrides the default election.', 'spanning-tree vlan 10 priority 4096', 'Lower priority = more likely to become root. Default is 32768. Setting 4096 guarantees SW1 wins the election over any switch with default priority.', 'SW1', ARRAY['configure terminal', 'spanning-tree vlan 10 priority 4096', 'spanning-tree vlan 20 priority 4096'], 15),
(5, 'Enable PortFast on access ports', E'On **SW2**, enable PortFast on interface Gi0/1 to skip the listening/learning states for end devices.', 'spanning-tree portfast on the interface', 'PortFast immediately transitions access ports to forwarding. Without it, PCs wait 30 seconds to get network access after plugging in. Only use PortFast on ports connected to end devices — never on switch-to-switch links.', 'SW2', ARRAY['configure terminal', 'interface GigabitEthernet0/1', 'spanning-tree portfast'], 10),
(6, 'Enable BPDU Guard', E'On **SW2** Gi0/1, enable BPDU Guard to shut down the port if a switch is accidentally connected.', 'spanning-tree bpduguard enable', 'BPDU Guard protects PortFast ports. If someone plugs a rogue switch into an access port, BPDUs arrive and the port is errdisabled — preventing a loop before STP even needs to converge.', 'SW2', ARRAY['spanning-tree bpduguard enable'], 10),
(7, 'Verify STP topology', E'Check the spanning-tree on **SW3** to verify port roles (Root, Designated, Blocking).\n\nSW1 should be root. SW3 should have one root port (toward SW1) and may have a blocking port (redundant path).', 'show spanning-tree', 'Non-root switches have root ports (best path toward root) and may have blocking ports to prevent loops. This is the result of the election you forced in step 4.', 'SW3', ARRAY['show spanning-tree'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'stp-loop-prevention';

-- ============================================================
-- LACP Lab (was 4 steps → now 7)
-- Setup: Create VLANs + trunk config, THEN bundle with LACP
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'lacp-etherchannel');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'lacp-etherchannel');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'lacp-etherchannel');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Create VLANs', E'On **SW1**, create VLAN 10 (Corp) and VLAN 20 (Guest).\n\nThe EtherChannel trunk you build will carry these VLANs.', 'vlan 10 → name Corp → vlan 20 → name Guest', 'EtherChannels are most useful on trunk links carrying multiple VLANs. Creating VLANs first gives context for why you need the extra bandwidth.', 'SW1', ARRAY['configure terminal', 'vlan 10', 'name Corp', 'vlan 20', 'name Guest'], 10),
(2, 'Setup: Create matching VLANs on SW2', E'Create the same VLANs on **SW2** so both switches agree on the VLAN database.', 'vlan 10 → name Corp → vlan 20 → name Guest', 'VLANs must exist on both switches for trunk traffic to flow. A VLAN that exists on one switch but not the other will be silently dropped on the trunk.', 'SW2', ARRAY['configure terminal', 'vlan 10', 'name Corp', 'vlan 20', 'name Guest'], 10),
(3, 'Select interfaces for bundling', E'On **SW1**, enter interface range Gi0/1-2 to configure both ports for the EtherChannel.', 'interface range GigabitEthernet0/1-2', 'EtherChannel bundles multiple physical links into one logical link for bandwidth and redundancy.', 'SW1', ARRAY['configure terminal', 'interface range GigabitEthernet0/1-2'], 10),
(4, 'Configure LACP active mode', E'Set the channel-group to 1 with LACP active mode on **SW1**.', 'channel-group 1 mode active', 'LACP active mode initiates negotiation. Both sides can be active, or one active and one passive.', 'SW1', ARRAY['channel-group 1 mode active'], 15),
(5, 'Configure SW2 matching LACP', E'On **SW2**, configure the same interface range with channel-group 1 mode active.', 'Same commands as SW1', 'Both ends must be in the same channel-group number and use compatible LACP modes.', 'SW2', ARRAY['configure terminal', 'interface range GigabitEthernet0/1-2', 'channel-group 1 mode active'], 15),
(6, 'Configure trunk on Port-channel', E'Configure the logical Port-channel1 interface as a trunk carrying VLANs 10 and 20.', 'interface Port-channel1 → switchport mode trunk', 'Configure the Port-channel interface, not the member interfaces. Settings applied to the Port-channel are inherited by all members.', 'SW1', ARRAY['interface Port-channel1', 'switchport trunk encapsulation dot1q', 'switchport mode trunk'], 10),
(7, 'Verify EtherChannel', E'Verify the EtherChannel is up and bundled with both member ports.', 'show etherchannel summary', 'Look for (P) flags indicating ports are bundled in the port-channel. (I) means individual — not bundled. (s) means suspended due to mismatch.', 'SW1', ARRAY['show etherchannel summary'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'lacp-etherchannel';

-- ============================================================
-- OSPF Lab (was 5 steps → now 7)
-- Setup: Configure subnet IPs on router interfaces
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ospf-single-area');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ospf-single-area');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ospf-single-area');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Assign subnet IPs to R1', E'Before OSPF can advertise routes, each router needs IP addresses.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 (connecting to R2) and **10.0.12.1/24** to Gi0/1 (connecting to R3).', 'interface Gi0/0 → ip address 10.0.1.1 255.255.255.0 → no shutdown', 'OSPF advertises connected subnets. Without IP addresses on interfaces, there is nothing to advertise. Each link between routers needs its own subnet.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Setup: Assign subnet IPs to R2 and R3', E'On **R2**, assign **10.0.1.2/24** to Gi0/0 and **10.0.2.1/24** to Gi0/1.\nOn **R3**, assign **10.0.12.2/24** to Gi0/0 and **10.0.3.1/24** to Gi0/1.', 'Same pattern — each interface gets an IP in its link subnet', 'The subnetting scheme ensures no overlap: 10.0.1.0/24 is the R1-R2 link, 10.0.12.0/24 is R1-R3, and each router has a LAN subnet.', 'R2', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.2 255.255.255.0', 'no shutdown'], 10),
(3, 'Enable OSPF on R1', E'Enter OSPF configuration on **R1** with process ID 1 and advertise the 10.0.1.0/24 network in area 0.', 'router ospf 1 → network 10.0.1.0 0.0.0.255 area 0', 'OSPF process IDs are locally significant. The network command uses wildcard masks (inverse of subnet mask). Area 0 is the backbone.', 'R1', ARRAY['router ospf 1', 'network 10.0.1.0 0.0.0.255 area 0'], 10),
(4, 'Configure OSPF on R2', E'Enable OSPF on **R2** and advertise 10.0.2.0/24 in area 0.', 'router ospf 1 then network command', 'All routers in the same area exchange LSAs to build an identical LSDB.', 'R2', ARRAY['configure terminal', 'router ospf 1', 'network 10.0.2.0 0.0.0.255 area 0'], 10),
(5, 'Configure OSPF on R3', E'Enable OSPF on **R3** and advertise 10.0.3.0/24 in area 0.', 'Same pattern as R1 and R2', 'Once all routers are in the same area, OSPF calculates the shortest path tree using Dijkstra''s algorithm.', 'R3', ARRAY['configure terminal', 'router ospf 1', 'network 10.0.3.0 0.0.0.255 area 0'], 10),
(6, 'Verify OSPF neighbors', E'On **R1**, verify OSPF neighbor adjacencies have formed with R2 and R3.', 'show ip ospf neighbor', 'FULL state means adjacency is complete and LSDBs are synchronized. If stuck in INIT, check IP connectivity and matching hello/dead timers.', 'R1', ARRAY['show ip ospf neighbor'], 10),
(7, 'Verify routing table', E'Check R1''s routing table to see OSPF-learned routes (marked with O).', 'show ip route', 'You should see O (OSPF) routes for R2 and R3''s subnets. The connected routes (C) are the subnets you configured in setup.', 'R1', ARRAY['show ip route'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'ospf-single-area';

-- ============================================================
-- DHCP Lab (was 4 steps → now 6)
-- Setup: Configure router interface IP + connected subnet
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dhcp-server-config');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dhcp-server-config');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dhcp-server-config');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure router gateway IP', E'The DHCP server needs to be on the same subnet it serves.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 — this will be the default gateway for DHCP clients.', 'interface Gi0/0 → ip address 10.0.1.1 255.255.255.0 → no shutdown', 'The router interface IP becomes the default-router in the DHCP pool. Clients need this gateway to reach other subnets.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Exclude reserved addresses', E'Exclude addresses 10.0.1.1 through 10.0.1.10 from the DHCP pool.\n\nThese are reserved for the router, servers, and network infrastructure.', 'ip dhcp excluded-address 10.0.1.1 10.0.1.10', 'Excluding addresses prevents DHCP from assigning IPs that are already statically assigned to routers or servers — avoiding IP conflicts.', 'R1', ARRAY['ip dhcp excluded-address 10.0.1.1 10.0.1.10'], 10),
(3, 'Create DHCP pool', E'Create a DHCP pool named "LAN" with network 10.0.1.0/24.', 'ip dhcp pool LAN → network 10.0.1.0 255.255.255.0', 'The pool network must match the subnet on the router interface. DHCP will assign addresses from this range (minus excluded addresses).', 'R1', ARRAY['ip dhcp pool LAN', 'network 10.0.1.0 255.255.255.0'], 10),
(4, 'Set default gateway and DNS', E'In the DHCP pool, set the default router to 10.0.1.1 (the gateway you configured in step 1) and DNS server to 8.8.8.8.', 'default-router 10.0.1.1 → dns-server 8.8.8.8', 'DHCP options tell clients which gateway and DNS server to use. The default-router must match the router interface IP on this subnet.', 'R1', ARRAY['default-router 10.0.1.1', 'dns-server 8.8.8.8'], 10),
(5, 'Verify DHCP bindings', E'Check active DHCP leases on **R1**.', 'show ip dhcp binding', 'The binding table shows which IPs have been leased, to which MAC address, and when they expire.', 'R1', ARRAY['show ip dhcp binding'], 10),
(6, 'Verify DHCP pool statistics', E'Check the DHCP pool utilization and configuration.', 'show ip dhcp pool', 'This shows the total addresses in the pool, how many are leased, and the configured options (gateway, DNS, lease time).', 'R1', ARRAY['show ip dhcp pool'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'dhcp-server-config';

-- ============================================================
-- DNS Lab (was 4 steps → now 6)
-- Setup: Configure IP addressing + connectivity
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dns-resolution');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dns-resolution');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'dns-resolution');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure router interface', E'DNS needs IP connectivity to work.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 so the router can reach the DNS server at 10.0.1.100.', 'interface Gi0/0 → ip address 10.0.1.1 255.255.255.0 → no shutdown', 'DNS queries travel over IP. The router must have a valid IP on the same subnet as (or a route to) the DNS server.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Enable DNS lookup', E'Enable DNS name resolution on **R1**.', 'ip domain-lookup', 'By default IOS tries to resolve unknown commands as hostnames. This enables explicit DNS queries to a configured server.', 'R1', ARRAY['ip domain-lookup'], 10),
(3, 'Set DNS server', E'Point **R1** to the DNS server at 10.0.1.100.', 'ip name-server 10.0.1.100', 'The name-server command tells the router where to send DNS queries. You can configure up to 6 DNS servers for redundancy.', 'R1', ARRAY['ip name-server 10.0.1.100'], 10),
(4, 'Set domain name', E'Configure the default domain name as **lab.local** on **R1**.', 'ip domain-name lab.local', 'The domain name is appended to unqualified hostnames. Typing "ping server1" becomes "ping server1.lab.local" automatically.', 'R1', ARRAY['ip domain-name lab.local'], 10),
(5, 'Create a static host entry', E'Add a static DNS mapping: **server1** resolves to 10.0.1.100.', 'ip host server1 10.0.1.100', 'Static host entries are resolved locally without querying the DNS server — useful for critical devices that must always be reachable by name.', 'R1', ARRAY['ip host server1 10.0.1.100'], 10),
(6, 'Verify DNS', E'Verify the DNS configuration and static entries.', 'show hosts', 'This shows both static entries (configured manually) and cached entries (learned from DNS queries). The flags column shows the entry type.', 'R1', ARRAY['show hosts'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'dns-resolution';

-- ============================================================
-- NAT Lab (was 4 steps → now 6)
-- Setup: Configure inside/outside subnets
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'nat-configuration');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'nat-configuration');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'nat-configuration');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure inside subnet', E'NAT translates between inside (private) and outside (public) networks.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 (LAN / inside) and **203.0.113.1/24** to Gi0/1 (WAN / outside).', 'interface Gi0/0 → ip address 10.0.1.1 255.255.255.0 → no shutdown', 'The inside interface connects to your private RFC 1918 network. The outside interface connects to the ISP with a public IP. NAT translates between them.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 203.0.113.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Mark inside interface', E'Mark Gi0/0 as the NAT inside interface.', 'ip nat inside', 'Inside interfaces face the private network. The NAT process only applies to traffic crossing the inside/outside boundary.', 'R1', ARRAY['interface GigabitEthernet0/0', 'ip nat inside'], 10),
(3, 'Mark outside interface', E'Mark Gi0/1 as the NAT outside interface.', 'ip nat outside', 'NAT translates the source IP as packets exit the inside and enter the outside — and reverses the translation for return traffic.', 'R1', ARRAY['interface GigabitEthernet0/1', 'ip nat outside'], 10),
(4, 'Configure static NAT', E'Create a static NAT mapping: inside 10.0.1.100 to outside 203.0.113.100.\n\nThis allows the internal server to be reachable from the internet.', 'ip nat inside source static 10.0.1.100 203.0.113.100', 'Static NAT creates a permanent 1:1 mapping, useful for servers that need to be reachable from outside. The public IP 203.0.113.100 always maps to the internal server 10.0.1.100.', 'R1', ARRAY['ip nat inside source static 10.0.1.100 203.0.113.100'], 15),
(5, 'Verify NAT translations', E'Check the NAT translation table.', 'show ip nat translations', 'The translation table shows the mapping between inside local (private) and inside global (public) addresses. Static entries persist; dynamic entries have timeouts.', 'R1', ARRAY['show ip nat translations'], 10),
(6, 'Verify NAT statistics', E'Check NAT hit counts and active translations.', 'show ip nat statistics', 'Statistics show how many packets have been translated, the number of active translations, and which interfaces are marked inside/outside.', 'R1', ARRAY['show ip nat statistics'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'nat-configuration';

-- ============================================================
-- PAT Lab (was 3 steps → now 5)
-- Setup: Configure subnets + inside/outside
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'pat-overload');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'pat-overload');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'pat-overload');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure interfaces and NAT directions', E'On **R1**, set up the inside network (10.0.1.1/24 on Gi0/0) and outside interface (Gi0/1).\n\nMark Gi0/0 as NAT inside and Gi0/1 as NAT outside.', 'ip address → ip nat inside / ip nat outside', 'PAT builds on NAT concepts. You need inside/outside interfaces defined before configuring the overload rule.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'ip nat inside', 'no shutdown', 'interface GigabitEthernet0/1', 'ip nat outside', 'no shutdown'], 10),
(2, 'Create ACL for NAT traffic', E'Create access-list 1 permitting the 10.0.1.0/24 subnet.\n\nThis defines which inside addresses are eligible for PAT translation.', 'access-list 1 permit 10.0.1.0 0.0.0.255', 'The ACL is a prerequisite for dynamic NAT/PAT. It tells the router which source addresses should be translated.', 'R1', ARRAY['access-list 1 permit 10.0.1.0 0.0.0.255'], 10),
(3, 'Configure PAT overload', E'Configure PAT using the outside interface with the **overload** keyword.\n\nThis maps ALL internal hosts to the single outside interface IP using port numbers.', 'ip nat inside source list 1 interface Gi0/1 overload', 'The overload keyword is what makes this PAT instead of dynamic NAT. Without it, only one host can translate at a time (one-to-one). With overload, thousands of hosts share one IP via unique port numbers.', 'R1', ARRAY['ip nat inside source list 1 interface GigabitEthernet0/1 overload'], 15),
(4, 'Verify PAT translations', E'Check the translation table to see port mappings.', 'show ip nat translations', 'PAT entries show different source ports mapped to the same outside IP. Each internal host gets a unique port number.', 'R1', ARRAY['show ip nat translations'], 10),
(5, 'Verify NAT statistics', E'Confirm PAT is working by checking statistics.', 'show ip nat statistics', 'The hits counter shows how many packets have been translated. The total active translations count should grow as more internal hosts access the internet.', 'R1', ARRAY['show ip nat statistics'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'pat-overload';

-- ============================================================
-- ACL Lab (was 4 steps → now 7)
-- Setup: VLANs + subnets + routing context
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'acl-traffic-filtering');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'acl-traffic-filtering');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'acl-traffic-filtering');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure subnets on interfaces', E'ACLs filter traffic between subnets. First, create the subnets.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 (LAN) and **10.0.2.1/24** to Gi0/1 (Servers).', 'ip address on each interface', 'ACLs match on source/destination IPs. Without configured subnets, there is no traffic to filter. The /24 subnets define which hosts the ACL rules will match.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 10.0.2.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Setup: Verify connectivity', E'Verify that both subnets are up and routing works between them.\n\nPing from R1 to confirm both interfaces are active.', 'show ip interface brief', 'Before adding ACLs, verify the network works WITHOUT filtering. This way, if connectivity breaks after applying the ACL, you know the ACL is the cause.', 'R1', ARRAY['show ip interface brief'], 5),
(3, 'Create named extended ACL', E'Create an extended ACL named **BLOCK-TELNET** that will deny Telnet from the LAN to the Servers.', 'ip access-list extended BLOCK-TELNET', 'Named ACLs are easier to manage than numbered ones — you can edit individual entries without rewriting the whole list.', 'R1', ARRAY['ip access-list extended BLOCK-TELNET'], 10),
(4, 'Add deny and permit rules', E'Deny TCP port 23 (Telnet) from any source to the server subnet, then permit all other traffic.', 'deny tcp any 10.0.2.0 0.0.0.255 eq 23 → permit ip any any', 'ACLs are processed top-down. The explicit permit at the end is critical — without it, the implicit deny blocks everything, not just Telnet.', 'R1', ARRAY['deny tcp any any eq 23', 'permit ip any any'], 15),
(5, 'Apply ACL to interface', E'Apply BLOCK-TELNET inbound on Gi0/0 (the LAN interface).\n\nInbound = filter traffic arriving FROM the LAN.', 'ip access-group BLOCK-TELNET in', 'Extended ACLs should be placed close to the source of the traffic. Applying it inbound on the LAN interface catches Telnet attempts before they cross the router.', 'R1', ARRAY['interface GigabitEthernet0/0', 'ip access-group BLOCK-TELNET in'], 10),
(6, 'Verify ACL', E'Check the ACL configuration and hit counts.', 'show access-lists', 'Match counts help verify the ACL is working. Each rule shows how many packets it has matched. If the deny rule has hits, Telnet attempts are being blocked.', 'R1', ARRAY['show access-lists'], 10),
(7, 'Verify interface ACL application', E'Confirm which ACLs are applied to which interfaces.', 'show ip interface GigabitEthernet0/0', 'This shows "Inbound access list is BLOCK-TELNET" confirming the ACL is active on the correct interface in the correct direction.', 'R1', ARRAY['show ip interface GigabitEthernet0/0'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'acl-traffic-filtering';

-- ============================================================
-- SSH Lab (was 4 steps → now 6)
-- Setup: IP addressing + hostname/domain
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ssh-secure-mgmt');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ssh-secure-mgmt');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ssh-secure-mgmt');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure management IP', E'SSH needs IP connectivity to the device.\n\nOn **R1**, assign **10.0.1.1/24** to Gi0/0 so administrators can reach the router for management.', 'interface Gi0/0 → ip address → no shutdown', 'Without an IP address, no one can SSH into the router. The management IP should be on the management VLAN/subnet in production.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Set hostname and domain', E'Set the hostname and domain name — both are required for RSA key generation.', 'hostname R1 → ip domain-name lab.local', 'RSA keys use the FQDN (hostname.domain) as part of the key identity. Without both set, the crypto key generate command will fail.', 'R1', ARRAY['hostname R1', 'ip domain-name lab.local'], 10),
(3, 'Generate RSA keys', E'Generate 2048-bit RSA keys for SSH version 2.', 'crypto key generate rsa modulus 2048', '2048 bits is the minimum recommended key size. Smaller keys are vulnerable to factoring attacks. This step enables SSH on the router.', 'R1', ARRAY['crypto key generate rsa modulus 2048'], 10),
(4, 'Create local user account', E'Create a local admin account with privilege level 15 (full access).', 'username admin privilege 15 secret MyP@ss', 'Local authentication means credentials are stored on the router. In production, you would use RADIUS/TACACS+ for centralized authentication.', 'R1', ARRAY['username admin privilege 15 secret'], 10),
(5, 'Restrict VTY to SSH only', E'Configure VTY lines 0-4 to accept only SSH connections and use local authentication.', 'line vty 0 4 → transport input ssh → login local', 'This blocks insecure Telnet access. Combined with the ACL skills from earlier, you could also restrict which subnets can SSH in.', 'R1', ARRAY['line vty 0 4', 'transport input ssh', 'login local'], 15),
(6, 'Verify SSH', E'Verify SSH is enabled and check the configuration.', 'show ip ssh', 'SSH version 2.0 should be enabled with the configured RSA key size. Version 1 is deprecated and insecure.', 'R1', ARRAY['show ip ssh'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'ssh-secure-mgmt';

-- ============================================================
-- Firewall Lab (was 3 steps → now 6)
-- Setup: Configure interfaces + assign to zones
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'firewall-zones');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'firewall-zones');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'firewall-zones');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure inside and outside subnets', E'Firewalls sit between network segments.\n\nOn **FW1**, assign **10.0.1.1/24** to Gi0/0 (INSIDE) and **203.0.113.1/24** to Gi0/1 (OUTSIDE).', 'ip address on each interface', 'The firewall needs IPs on both the trusted (inside) and untrusted (outside) networks. This is similar to the NAT configuration — but firewalls add stateful inspection.', 'FW1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 203.0.113.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Create security zones', E'Create INSIDE and OUTSIDE security zones.\n\nZones are like ACLs for network segments — but with stateful inspection.', 'zone security INSIDE → zone security OUTSIDE', 'Zones group interfaces by trust level. All traffic between zones is denied by default — the opposite of a router, which forwards everything by default.', 'FW1', ARRAY['zone security INSIDE', 'zone security OUTSIDE'], 10),
(3, 'Assign interfaces to zones', E'Assign Gi0/0 to the INSIDE zone and Gi0/1 to the OUTSIDE zone.', 'zone-member security INSIDE on each interface', 'Once an interface joins a zone, all traffic to/from that interface is subject to zone policies. Unassigned interfaces can only communicate with the router itself.', 'FW1', ARRAY['interface GigabitEthernet0/0', 'zone-member security INSIDE', 'interface GigabitEthernet0/1', 'zone-member security OUTSIDE'], 10),
(4, 'Create zone pair', E'Create a zone-pair from INSIDE to OUTSIDE to define the traffic direction.', 'zone-pair security IN-OUT source INSIDE destination OUTSIDE', 'Zone pairs define which direction traffic can flow. Without a zone pair, NO traffic passes between the zones.', 'FW1', ARRAY['zone-pair security IN-OUT source INSIDE destination OUTSIDE'], 15),
(5, 'Apply inspection policy', E'Create and apply a service-policy that inspects HTTP, HTTPS, and DNS traffic from INSIDE to OUTSIDE.\n\nStateful inspection allows return traffic automatically.', 'service-policy type inspect IN-OUT-POLICY', 'The inspect action builds on ACL concepts but adds connection tracking. The firewall remembers each outbound connection and automatically permits the return traffic — no explicit permit rule needed for responses.', 'FW1', ARRAY['service-policy type inspect IN-OUT-POLICY'], 15),
(6, 'Verify firewall zones', E'Verify zone configuration, zone pairs, and active policies.', 'show zone security → show zone-pair security', 'Check that interfaces are assigned to the correct zones and that the zone-pair has the inspect policy applied.', 'FW1', ARRAY['show zone security', 'show zone-pair security'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'firewall-zones';

-- ============================================================
-- BGP Lab (was 4 steps → now 6)
-- Setup: Interface addressing + AS context
-- ============================================================
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'bgp-peering');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'bgp-peering');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'bgp-peering');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure link subnet', E'BGP peers must be IP-reachable.\n\nOn **R1**, assign **10.0.0.1/30** to Gi0/0 (the link to the ISP).\nAlso create a loopback with your LAN prefix: **192.168.1.1/24**.', 'interface Gi0/0 → ip address 10.0.0.1 255.255.255.252', 'The /30 subnet provides exactly 2 usable IPs — one for each side of the point-to-point link. The loopback represents your internal network that you will advertise via BGP.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.0.1 255.255.255.252', 'no shutdown', 'interface Loopback0', 'ip address 192.168.1.1 255.255.255.0'], 10),
(2, 'Start BGP process', E'On **R1**, start BGP with AS number 65001 (private AS).', 'router bgp 65001', 'BGP uses AS numbers to identify routing domains. Private ASNs (64512-65534) are used when you only peer with one ISP.', 'R1', ARRAY['router bgp 65001'], 10),
(3, 'Configure eBGP neighbor', E'Add the ISP router (10.0.0.2) as an eBGP neighbor in AS 65000.', 'neighbor 10.0.0.2 remote-as 65000', 'eBGP peers are in different ASes. The remote-as must match the ISP''s actual AS number. BGP establishes a TCP session (port 179) to the neighbor.', 'R1', ARRAY['neighbor 10.0.0.2 remote-as 65000'], 15),
(4, 'Advertise your prefix', E'Advertise the 192.168.1.0/24 network into BGP so the ISP knows how to reach you.', 'network 192.168.1.0 mask 255.255.255.0', 'The BGP network command requires an exact match in the routing table. The Loopback0 interface creates this route. Without it, BGP will not advertise the prefix.', 'R1', ARRAY['network 192.168.1.0 mask 255.255.255.0'], 10),
(5, 'Verify BGP neighbor', E'Check the BGP neighbor status.', 'show ip bgp summary', 'The State/PfxRcd column should show a number (prefixes received) — not "Active" or "Idle" (which means the session is down).', 'R1', ARRAY['show ip bgp summary'], 10),
(6, 'Verify BGP table', E'Check the BGP routing table to see your advertised prefix and any routes received from the ISP.', 'show ip bgp', 'The > symbol indicates the best path. * means the route is valid. Your 192.168.1.0/24 should appear as a locally originated route.', 'R1', ARRAY['show ip bgp'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'bgp-peering';

-- ============================================================
-- Remaining labs: Tunneling, GRE, AS, MPLS, IPv6, Wireless, VPN
-- Same pattern: 2 setup steps + existing topic steps
-- ============================================================

-- Tunneling (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-tunneling');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-tunneling');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-tunneling');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure transport IPs', E'Tunnels need routable endpoints.\n\nOn **R1**, assign **203.0.113.1/24** to Gi0/0 (the public-facing interface that will be the tunnel source).', 'interface Gi0/0 → ip address 203.0.113.1 255.255.255.0', 'The tunnel source and destination must be reachable over the underlying transport network. These public IPs carry the encapsulated packets.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 203.0.113.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Create tunnel interface', E'Create a Tunnel0 interface on **R1**.', 'interface Tunnel0', 'Tunnel interfaces are virtual — they encapsulate packets inside another protocol for transport across untrusted networks.', 'R1', ARRAY['interface Tunnel0'], 10),
(3, 'Set tunnel source and destination', E'Configure the tunnel source as Gi0/0 and destination as 203.0.113.2 (R2''s public IP).', 'tunnel source Gi0/0 → tunnel destination 203.0.113.2', 'The outer header uses these endpoints. Packets are encapsulated with a new IP header containing these addresses for delivery across the transport network.', 'R1', ARRAY['tunnel source GigabitEthernet0/0', 'tunnel destination 203.0.113.2'], 15),
(4, 'Assign tunnel IP', E'Assign **10.255.0.1/30** to the Tunnel0 interface — this is the overlay network address.', 'ip address 10.255.0.1 255.255.255.252', 'The tunnel IP is separate from the transport IPs. Routing protocols and traffic use these overlay addresses. The /30 subnet gives exactly 2 usable IPs for the point-to-point tunnel.', 'R1', ARRAY['ip address 10.255.0.1 255.255.255.252'], 10),
(5, 'Verify tunnel', E'Check the tunnel interface status.', 'show interfaces tunnel 0', 'The tunnel should show up/up when both the source interface is up and the destination is reachable. Check for "Tunnel protocol/transport" to confirm the encapsulation type.', 'R1', ARRAY['show interfaces tunnel 0'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'network-tunneling';

-- GRE (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'gre-tunnels');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'gre-tunnels');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'gre-tunnels');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure transport IPs', E'On **R1**, assign **198.51.100.1/24** to Gi0/0 as the tunnel transport endpoint.', 'ip address 198.51.100.1 255.255.255.0', 'GRE tunnel endpoints must be reachable via the underlying network. In production, these are your site''s public IPs.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 198.51.100.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Create GRE tunnel', E'Create Tunnel0 and set tunnel mode to GRE IP.', 'interface Tunnel0 → tunnel mode gre ip', 'GRE is the default tunnel mode. It supports multicast (unlike IPsec), so you can run OSPF over it.', 'R1', ARRAY['interface Tunnel0', 'tunnel mode gre ip'], 10),
(3, 'Configure tunnel endpoints', E'Set tunnel source to Gi0/0 and destination to 198.51.100.2 (R2''s public IP).', 'tunnel source → tunnel destination', 'GRE adds a 24-byte overhead (4 GRE + 20 new IP header) to each packet. The MTU may need adjustment for large packets.', 'R1', ARRAY['tunnel source GigabitEthernet0/0', 'tunnel destination 198.51.100.2', 'ip address 10.255.0.1 255.255.255.252'], 15),
(4, 'Verify tunnel status', E'Check the tunnel interface status on **R1**.', 'show interfaces tunnel 0', 'The tunnel should show up/up when source and destination are reachable. "Tunnel protocol/transport GRE/IP" confirms the encapsulation.', 'R1', ARRAY['show interfaces tunnel 0'], 10),
(5, 'Test overlay connectivity', E'Ping across the GRE tunnel to verify the overlay network works.', 'ping 10.255.0.2', 'If the ping succeeds, packets are being encapsulated in GRE, transported across the public network, and decapsulated at the remote end.', 'R1', ARRAY['ping 10.255.0.2'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'gre-tunnels';

-- Autonomous Systems (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'autonomous-systems');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'autonomous-systems');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'autonomous-systems');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure inter-router links', E'On **R1**, assign **10.0.0.1/30** to Gi0/0 (link to R2) and **10.1.0.2/30** to Gi0/1 (link to ISP).', 'ip address on each interface', 'BGP peers must be IP-reachable. The /30 subnets provide point-to-point links between routers in different ASes.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.0.1 255.255.255.252', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 10.1.0.2 255.255.255.252', 'no shutdown'], 10),
(2, 'Configure iBGP within AS', E'On **R1**, set up iBGP peering with R2 (both in AS 65001).', 'router bgp 65001 → neighbor 10.0.0.2 remote-as 65001', 'iBGP peers share the same AS number. They don''t modify the AS path — which is why iBGP requires full mesh or route reflectors.', 'R1', ARRAY['router bgp 65001', 'neighbor 10.0.0.2 remote-as 65001'], 15),
(3, 'Configure eBGP to ISP', E'Add eBGP peering with the ISP (AS 65000) on R1.', 'neighbor 10.1.0.1 remote-as 65000', 'eBGP peers are in different ASes. The AS path is prepended when routes cross AS boundaries — this is how BGP prevents loops.', 'R1', ARRAY['neighbor 10.1.0.1 remote-as 65000'], 15),
(4, 'Verify BGP summary', E'Check BGP neighbor status to see both iBGP and eBGP sessions.', 'show ip bgp summary', 'The State/PfxRcd column shows how many prefixes were received. iBGP and eBGP peers both appear in the same table.', 'R1', ARRAY['show ip bgp summary'], 10),
(5, 'Examine AS path', E'Check the BGP table to see AS path attributes.', 'show ip bgp', 'Routes from the ISP show the ISP''s AS number in the path. iBGP routes from R2 show an empty AS path (same AS). This path information is how BGP makes routing decisions.', 'R1', ARRAY['show ip bgp'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'autonomous-systems';

-- MPLS (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'mpls-label-switching');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'mpls-label-switching');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'mpls-label-switching');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure OSPF as the IGP', E'MPLS requires an underlying IGP (Interior Gateway Protocol) for label distribution.\n\nOn **PE1**, configure OSPF on Gi0/0 and advertise the link subnet.', 'router ospf 1 → network area 0', 'MPLS LDP uses the IGP to discover neighbors and distribute labels. Without OSPF (or IS-IS), LDP has no routing information to bind labels to.', 'PE1', ARRAY['configure terminal', 'router ospf 1', 'network 10.0.0.0 0.0.0.255 area 0'], 10),
(2, 'Enable MPLS on PE1', E'Enable MPLS IP on interface Gi0/0 of **PE1**.', 'mpls ip under the interface', 'MPLS must be enabled per-interface. This activates LDP (Label Distribution Protocol) on the link and begins label exchange with the neighbor.', 'PE1', ARRAY['interface GigabitEthernet0/0', 'mpls ip'], 10),
(3, 'Enable MPLS on P1', E'Enable MPLS on both interfaces of **P1** (Gi0/0 and Gi0/1).', 'mpls ip on each interface', 'Core (P) routers switch packets based on labels without examining the IP header — pure label switching at wire speed.', 'P1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'mpls ip', 'interface GigabitEthernet0/1', 'mpls ip'], 15),
(4, 'Verify LDP neighbors', E'On **PE1**, check that LDP sessions have formed with P1.', 'show mpls ldp neighbor', 'LDP neighbors should show the peer''s router ID and the interface. Session state should be "Oper" (operational).', 'PE1', ARRAY['show mpls ldp neighbor'], 10),
(5, 'Verify MPLS forwarding table', E'Examine the MPLS forwarding table (LFIB) on PE1.', 'show mpls forwarding-table', 'The LFIB shows local labels, outgoing labels, and next-hop interfaces. "Pop Label" means this is the penultimate hop and the label is removed before forwarding.', 'PE1', ARRAY['show mpls forwarding-table'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'mpls-label-switching';

-- IPv6 (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ipv6-addressing');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ipv6-addressing');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'ipv6-addressing');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Verify existing IPv4 config', E'IPv6 runs alongside IPv4 (dual-stack).\n\nOn **R1**, assign an IPv4 address **10.0.1.1/24** to Gi0/0 to demonstrate that both protocols coexist on the same interface.', 'ip address 10.0.1.1 255.255.255.0', 'Dual-stack means both IPv4 and IPv6 are active simultaneously. This is the most common transition strategy — you don''t have to choose one or the other.', 'R1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Enable IPv6 routing', E'Enable IPv6 unicast routing on **R1** globally.', 'ipv6 unicast-routing', 'IPv6 routing is disabled by default on Cisco routers. Without this command, the router processes IPv6 packets for itself but does not forward them between interfaces.', 'R1', ARRAY['ipv6 unicast-routing'], 10),
(3, 'Configure IPv6 address', E'Assign **2001:DB8:1::1/64** to Gi0/0 on **R1**.\n\nThis is a global unicast address — the IPv6 equivalent of a public IPv4 address.', 'ipv6 address 2001:DB8:1::1/64', 'The /64 prefix is standard for LAN subnets. The interface also auto-generates a link-local (FE80::) address used for neighbor discovery.', 'R1', ARRAY['interface GigabitEthernet0/0', 'ipv6 address 2001:DB8:1::1/64'], 10),
(4, 'Verify IPv6 interfaces', E'Check IPv6 addresses on all interfaces.', 'show ipv6 interface brief', 'Each interface should show both the configured global address (2001:DB8:...) and an auto-generated link-local address (FE80::). The IPv4 address from step 1 is still there too.', 'R1', ARRAY['show ipv6 interface brief'], 10),
(5, 'Verify IPv6 neighbors', E'Check the IPv6 neighbor discovery table.', 'show ipv6 neighbors', 'NDP (Neighbor Discovery Protocol) replaces ARP in IPv6. It maps IPv6 addresses to MAC addresses on the local link.', 'R1', ARRAY['show ipv6 neighbors'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'ipv6-addressing';

-- Wireless AP (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-ap-config');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-ap-config');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-ap-config');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Create VLAN for wireless', E'Wireless clients need a VLAN to connect to.\n\nOn **AP1**, the wired backhaul connects to a switch port in VLAN 10. This VLAN will carry wireless client traffic.', 'The VLAN is configured on the upstream switch — the AP bridges wireless clients onto it.', 'Just like wired access ports, wireless APs bridge client traffic onto a specific VLAN. The SSID-to-VLAN mapping determines which broadcast domain wireless clients join.', 'AP1', ARRAY['configure terminal'], 10),
(2, 'Set SSID name', E'Configure the primary SSID as **CorpWiFi** on **AP1**.', 'dot11 ssid CorpWiFi', 'The SSID is the network name clients see when scanning. It should be descriptive and consistent across all APs for seamless roaming.', 'AP1', ARRAY['dot11 ssid CorpWiFi'], 10),
(3, 'Set authentication mode', E'Configure WPA2 authentication for the SSID.', 'authentication open → authentication key-management wpa version 2', 'Open authentication with WPA2 key management means clients authenticate using a pre-shared key (PSK). Enterprise environments use 802.1X instead.', 'AP1', ARRAY['authentication open', 'authentication key-management wpa version 2'], 15),
(4, 'Assign VLAN to SSID', E'Map the CorpWiFi SSID to VLAN 10.', 'vlan 10', 'This bridges wireless clients onto VLAN 10 — the same VLAN and subnet as wired Corp users. They get IPs from the same DHCP pool and use the same SVI gateway.', 'AP1', ARRAY['vlan 10'], 10),
(5, 'Verify wireless configuration', E'Check the wireless configuration on **AP1**.', 'show dot11 associations', 'This shows connected wireless clients, their signal strength, data rates, and which SSID/VLAN they are associated with.', 'AP1', ARRAY['show dot11 associations'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'wireless-ap-config';

-- Wireless Controller (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-controller-mgmt');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-controller-mgmt');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-controller-mgmt');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Understand the VLAN context', E'The WLC manages APs that bridge wireless clients onto VLANs.\n\nThe upstream switch has VLAN 10 (Corp) and VLAN 20 (Guest) already configured. The WLC maps WLANs to these VLANs.', 'WLANs on the WLC correspond to VLANs on the switch infrastructure.', 'Unlike autonomous APs, a WLC centralizes configuration. You configure the SSID, security, and VLAN mapping once on the WLC, and it pushes the config to all registered APs.', 'WLC1', ARRAY['configure terminal'], 10),
(2, 'Create WLAN on WLC', E'Create a WLAN named **CorpWiFi** with ID 1.', 'wlan CorpWiFi 1 CorpWiFi', 'WLANs define the SSID, security policy, and interface (VLAN) mapping. The WLC can host up to 512 WLANs (model dependent).', 'WLC1', ARRAY['wlan CorpWiFi 1 CorpWiFi'], 15),
(3, 'Assign VLAN interface', E'Map the WLAN to VLAN 10 so wireless clients join the Corp network.', 'interface vlan 10', 'Each WLAN maps to a dynamic interface on a specific VLAN. Wireless clients on CorpWiFi get the same subnet, DHCP pool, and gateway as wired VLAN 10 users.', 'WLC1', ARRAY['interface vlan 10'], 10),
(4, 'Enable the WLAN', E'Enable the WLAN so APs begin broadcasting the SSID.', 'no shutdown', 'WLANs are disabled by default on creation. This is a safety feature — configure security before enabling the SSID.', 'WLC1', ARRAY['no shutdown'], 10),
(5, 'Verify AP registration', E'Check that APs have registered with the WLC.', 'show ap summary', 'Registered APs show their name, model, IP, and the number of clients. APs discover the WLC via DHCP Option 43, DNS, or broadcast.', 'WLC1', ARRAY['show ap summary'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'wireless-controller-mgmt';

-- Wireless Security (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-security-config');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-security-config');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-security-config');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Create WLAN to secure', E'Before applying security, create the WLAN.\n\nOn **WLC1**, create a WLAN named **SecureWiFi** — this is the SSID we will lock down with WPA3-Enterprise.', 'wlan SecureWiFi 1 SecureWiFi → no shutdown', 'Security is applied to an existing WLAN. Just like ACLs are applied to interfaces, wireless security policies are applied to WLANs.', 'WLC1', ARRAY['configure terminal', 'wlan SecureWiFi 1 SecureWiFi', 'no shutdown'], 10),
(2, 'Configure WPA3-Enterprise', E'Set the WLAN security to WPA3 with 802.1X authentication.', 'security wpa3 → security dot1x', 'WPA3-Enterprise provides per-user encryption via 802.1X. Each user gets unique encryption keys — unlike PSK where everyone shares one password.', 'WLC1', ARRAY['security wpa3', 'security dot1x'], 15),
(3, 'Add RADIUS server', E'Configure the RADIUS server address (10.0.1.200) and shared secret.', 'radius server → address ipv4 10.0.1.200 → key', '802.1X delegates authentication to a RADIUS server. The shared secret must match on both the WLC and the RADIUS server.', 'WLC1', ARRAY['radius server RADIUS-SRV', 'address ipv4 10.0.1.200', 'key radiussecret'], 15),
(4, 'Enable PMF', E'Enable Protected Management Frames (802.11w) to prevent deauthentication attacks.', 'security pmf required', 'Without PMF, attackers can send forged deauthentication frames to disconnect any client. PMF cryptographically protects management frames — a critical security feature.', 'WLC1', ARRAY['security pmf required'], 10),
(5, 'Verify wireless security', E'Check the WLAN security configuration.', 'show wlan summary', 'Verify the WLAN shows WPA3 with 802.1X and PMF required. All three components must be active for enterprise-grade wireless security.', 'WLC1', ARRAY['show wlan summary'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'wireless-security-config';

-- Wireless Topology (was 3 → 5)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-topology-design');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-topology-design');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'wireless-topology-design');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure SSID on all APs', E'Before channel planning, each AP needs an SSID configured.\n\nAll three APs will broadcast the same SSID **CorpWiFi** so clients can roam seamlessly between them.', 'dot11 ssid CorpWiFi on each AP', 'Using the same SSID across all APs enables seamless roaming — clients automatically switch to the strongest signal without disconnecting.', 'AP1', ARRAY['configure terminal', 'dot11 ssid CorpWiFi'], 10),
(2, 'Set AP1 channel', E'On **AP1**, set the 2.4GHz radio to **channel 1**.', 'channel 1', 'Only channels 1, 6, and 11 are non-overlapping in 2.4GHz. Using other channels (like 3 or 9) causes interference with adjacent APs.', 'AP1', ARRAY['interface dot11Radio0', 'channel 1'], 10),
(3, 'Set AP2 channel', E'On **AP2**, set the 2.4GHz radio to **channel 6** to avoid co-channel interference with AP1.', 'channel 6', 'Adjacent APs must use non-overlapping channels. AP1 on channel 1 and AP2 on channel 6 have no frequency overlap.', 'AP2', ARRAY['configure terminal', 'interface dot11Radio0', 'channel 6'], 10),
(4, 'Set AP3 channel', E'On **AP3**, set **channel 11** to complete the 1/6/11 non-overlapping channel plan.', 'channel 11', 'The 1/6/11 plan is the foundation of 2.4GHz wireless design. Three channels with 25MHz separation and no overlap.', 'AP3', ARRAY['configure terminal', 'interface dot11Radio0', 'channel 11'], 10),
(5, 'Verify channel plan', E'Review the channel assignments across all APs to confirm no co-channel interference.', 'show dot11 associations on each AP', 'A proper channel plan ensures each AP operates on a clean frequency. In production, you would also adjust transmit power so coverage areas overlap by about 20% for roaming but don''t create excessive interference.', 'AP1', ARRAY['show dot11 associations'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'wireless-topology-design';

-- Remote Access VPN (was 3 → 6)
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'remote-access-vpn');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'remote-access-vpn');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'remote-access-vpn');

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points)
SELECT l.id, s.n, s.title, s.instr, s.hint, s.expl, s.dev, s.cmds, 'command', s.pts
FROM labs l, (VALUES
(1, 'Setup: Configure firewall interfaces', E'VPN terminates on the firewall.\n\nOn **FW1**, assign **203.0.113.1/24** to the outside interface (where VPN clients connect) and **10.0.1.1/24** to the inside interface.', 'ip address on outside and inside interfaces', 'Remote VPN clients connect to the outside (public) IP and get access to the inside (private) network through the encrypted tunnel. This combines tunneling, encryption, and firewall concepts from earlier labs.', 'FW1', ARRAY['configure terminal', 'interface GigabitEthernet0/0', 'ip address 203.0.113.1 255.255.255.0', 'no shutdown', 'interface GigabitEthernet0/1', 'ip address 10.0.1.1 255.255.255.0', 'no shutdown'], 10),
(2, 'Setup: Create ACL for VPN traffic', E'Define which internal subnets VPN users can access.\n\nCreate an ACL that permits traffic between the VPN pool (10.0.100.0/24) and the internal LAN (10.0.1.0/24).', 'access-list for VPN interesting traffic', 'This is the same ACL concept from the security lab, applied to VPN split tunneling. Only traffic matching this ACL is sent through the VPN tunnel.', 'FW1', ARRAY['access-list 100 permit ip 10.0.1.0 0.0.0.255 10.0.100.0 0.0.0.255'], 10),
(3, 'Configure ISAKMP policy', E'Create an ISAKMP policy with AES-256 encryption for the Phase 1 tunnel.', 'crypto isakmp policy 10 → encryption aes 256', 'ISAKMP Phase 1 establishes a secure channel — similar to how GRE establishes a tunnel, but with encryption. This negotiates the shared secret and encryption algorithm.', 'FW1', ARRAY['crypto isakmp policy 10', 'encryption aes 256'], 15),
(4, 'Create transform set', E'Define an IPsec transform set using ESP with AES and SHA for data encryption.', 'crypto ipsec transform-set MYSET esp-aes esp-sha-hmac', 'Transform sets define how actual data packets are encrypted (Phase 2). ESP provides both encryption and authentication.', 'FW1', ARRAY['crypto ipsec transform-set MYSET esp-aes esp-sha-hmac'], 15),
(5, 'Create dynamic crypto map', E'Create a dynamic crypto map for remote access clients.\n\nDynamic maps allow VPN clients with unknown IP addresses to connect.', 'crypto dynamic-map REMOTE-MAP 10', 'Static crypto maps require you to know the peer''s IP. Dynamic maps accept connections from any IP — essential for mobile workers on different networks.', 'FW1', ARRAY['crypto dynamic-map REMOTE-MAP 10'], 10),
(6, 'Verify VPN status', E'Check the ISAKMP security associations to verify VPN tunnel status.', 'show crypto isakmp sa', 'QM_IDLE state means Phase 1 is complete and the tunnel is active. The dst/src columns show the VPN endpoints.', 'FW1', ARRAY['show crypto isakmp sa'], 10)
) AS s(n, title, instr, hint, expl, dev, cmds, pts) WHERE l.slug = 'remote-access-vpn';
