-- ============================================================
-- MIGRATION: Reorder topics and labs in logical progression
-- Beginner → Intermediate → Advanced → Expert
-- Each topic builds on the previous ones
-- ============================================================

-- ── Topics: Logical learning order ───────────────────────

UPDATE topics SET sort_order = 1  WHERE slug = 'ipv4-subnetting';
UPDATE topics SET sort_order = 2  WHERE slug = 'vlans';
UPDATE topics SET sort_order = 3  WHERE slug = 'stp';
UPDATE topics SET sort_order = 4  WHERE slug = 'lacp';
UPDATE topics SET sort_order = 5  WHERE slug = 'ospf';
UPDATE topics SET sort_order = 6  WHERE slug = 'dhcp';
UPDATE topics SET sort_order = 7  WHERE slug = 'dns';
UPDATE topics SET sort_order = 8  WHERE slug = 'nat';
UPDATE topics SET sort_order = 9  WHERE slug = 'pat';
UPDATE topics SET sort_order = 10 WHERE slug = 'acls';
UPDATE topics SET sort_order = 11 WHERE slug = 'ssh';
UPDATE topics SET sort_order = 12 WHERE slug = 'firewalls';
UPDATE topics SET sort_order = 13 WHERE slug = 'autonomous-systems';
UPDATE topics SET sort_order = 14 WHERE slug = 'bgp';
UPDATE topics SET sort_order = 15 WHERE slug = 'tunneling';
UPDATE topics SET sort_order = 16 WHERE slug = 'gre';
UPDATE topics SET sort_order = 17 WHERE slug = 'mpls';
UPDATE topics SET sort_order = 18 WHERE slug = 'ipv6';
UPDATE topics SET sort_order = 19 WHERE slug = 'wireless-ap';
UPDATE topics SET sort_order = 20 WHERE slug = 'wireless-controller';
UPDATE topics SET sort_order = 21 WHERE slug = 'wireless-security';
UPDATE topics SET sort_order = 22 WHERE slug = 'wireless-topology';
UPDATE topics SET sort_order = 23 WHERE slug = 'remote-access';

-- ── Labs: Match topic order ──────────────────────────────

UPDATE labs SET sort_order = 1  WHERE slug = 'ipv4-subnetting-lab';
UPDATE labs SET sort_order = 2  WHERE slug = 'vlan-fundamentals';
UPDATE labs SET sort_order = 3  WHERE slug = 'stp-loop-prevention';
UPDATE labs SET sort_order = 4  WHERE slug = 'lacp-etherchannel';
UPDATE labs SET sort_order = 5  WHERE slug = 'ospf-single-area';
UPDATE labs SET sort_order = 6  WHERE slug = 'dhcp-server-config';
UPDATE labs SET sort_order = 7  WHERE slug = 'dns-resolution';
UPDATE labs SET sort_order = 8  WHERE slug = 'nat-configuration';
UPDATE labs SET sort_order = 9  WHERE slug = 'pat-overload';
UPDATE labs SET sort_order = 10 WHERE slug = 'acl-traffic-filtering';
UPDATE labs SET sort_order = 11 WHERE slug = 'ssh-secure-mgmt';
UPDATE labs SET sort_order = 12 WHERE slug = 'firewall-zones';
UPDATE labs SET sort_order = 13 WHERE slug = 'autonomous-systems';
UPDATE labs SET sort_order = 14 WHERE slug = 'bgp-peering';
UPDATE labs SET sort_order = 15 WHERE slug = 'network-tunneling';
UPDATE labs SET sort_order = 16 WHERE slug = 'gre-tunnels';
UPDATE labs SET sort_order = 17 WHERE slug = 'mpls-label-switching';
UPDATE labs SET sort_order = 18 WHERE slug = 'ipv6-addressing';
UPDATE labs SET sort_order = 19 WHERE slug = 'wireless-ap-config';
UPDATE labs SET sort_order = 20 WHERE slug = 'wireless-controller-mgmt';
UPDATE labs SET sort_order = 21 WHERE slug = 'wireless-security-config';
UPDATE labs SET sort_order = 22 WHERE slug = 'wireless-topology-design';
UPDATE labs SET sort_order = 23 WHERE slug = 'remote-access-vpn';
UPDATE labs SET sort_order = 100 WHERE slug = 'full-enterprise-network';
