-- ============================================================
-- MIGRATION: Redo Network Layer Architecture
-- Changes from TCP/IP model to Cisco 3-tier hierarchical design
-- (Core/Distribution/Access layers)
-- ============================================================

-- Update topic
UPDATE topics SET
  name = 'Network Layer Architecture',
  description = 'Core, distribution, and access layers — hierarchical network design'
WHERE slug = 'network-layer-arch';

-- Update lab
UPDATE labs SET
  title = 'Network Architecture Quiz',
  subtitle = 'Core, distribution, and access layer design',
  description = 'Identify the three layers of hierarchical network design and their roles.'
WHERE slug = 'network-layer-arch-quiz';

-- Delete old steps
DELETE FROM user_step_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-layer-arch-quiz');
DELETE FROM user_lab_progress WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-layer-arch-quiz');
DELETE FROM lab_steps WHERE lab_id = (SELECT id FROM labs WHERE slug = 'network-layer-arch-quiz');

-- New steps (5)

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points) SELECT l.id, 1, 'Identify: End-User Connections', E'This layer is where end devices (PCs, phones, printers, APs) connect to the network. It provides port-level security, VLANs, PoE, and QoS marking.\n\nWhat is this layer called?', 'It is the bottom layer of the hierarchy', 'The Access layer connects end devices to the network. Switches at this layer provide per-port VLAN assignment, 802.1X authentication, PortFast, BPDU Guard, and Power over Ethernet (PoE) for IP phones and APs. Typically uses Cisco 2960/9200 series switches.', 'QUIZ', ARRAY['access'], 'command', 10 FROM labs l WHERE l.slug = 'network-layer-arch-quiz';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points) SELECT l.id, 2, 'Identify: Policy and Routing Layer', E'This middle layer aggregates traffic from multiple access switches, enforces routing policies, ACLs, QoS, and provides inter-VLAN routing via SVIs.\n\nWhat is this layer called?', 'It distributes traffic between access and core', 'The Distribution layer aggregates access switches and applies network policies. It handles inter-VLAN routing (via L3 switches with SVIs), ACL filtering, route summarization, and redundancy (HSRP/VRRP). Typically uses Cisco 3850/9300 series L3 switches.', 'QUIZ', ARRAY['distribution'], 'command', 10 FROM labs l WHERE l.slug = 'network-layer-arch-quiz';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points) SELECT l.id, 3, 'Identify: High-Speed Backbone', E'This top layer provides fast, reliable transport between distribution blocks. It should NEVER apply policies or filters — its only job is to switch packets as fast as possible.\n\nWhat is this layer called?', 'Also called the backbone', 'The Core (Backbone) layer provides high-speed, low-latency transport between distribution switches. It should never do anything that slows down packet forwarding — no ACLs, no QoS classification, no detailed route filtering. Redundancy is critical. Uses Cisco 9500/Nexus series.', 'QUIZ', ARRAY['core'], 'command', 10 FROM labs l WHERE l.slug = 'network-layer-arch-quiz';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points) SELECT l.id, 4, 'Where are ACLs applied?', E'In the three-tier model, ACLs and security policies should be applied at one specific layer — not at the core (too slow) and not at access (too many ports to manage).\n\nWhich layer handles policy enforcement?', 'The middle layer', 'The Distribution layer is where policies live. ACLs, route filtering, QoS marking, and VLAN pruning are all applied here. This centralizes policy in one manageable location instead of configuring thousands of access ports individually.', 'QUIZ', ARRAY['distribution'], 'command', 10 FROM labs l WHERE l.slug = 'network-layer-arch-quiz';

INSERT INTO lab_steps (lab_id, step_number, title, instruction, hint, explanation, target_device, expected_commands, validation_type, points) SELECT l.id, 5, 'Collapsed Core Design', E'In smaller networks, two layers are often merged into one to save cost. The combined layer handles both high-speed transport AND policy enforcement.\n\nWhich two layers are typically collapsed together?', 'The top two layers merge', 'A collapsed core merges the Core and Distribution layers into a single L3 switch layer. Common in small/medium campuses where a dedicated core is overkill. The access layer stays separate. This is also called a two-tier (spine-leaf in data centers) design.', 'QUIZ', ARRAY['core and distribution'], 'command', 10 FROM labs l WHERE l.slug = 'network-layer-arch-quiz';

-- Update theory content
DELETE FROM topic_content WHERE topic_id = (SELECT id FROM topics WHERE slug = 'network-layer-arch');

INSERT INTO topic_content (topic_id, osi_layer, theory_md, practical_md, key_commands, common_mistakes)
SELECT t.id, 'All',
E'## Hierarchical Network Design\n\nCisco''s three-tier hierarchical model divides a campus network into three functional layers, each with a distinct role.\n\n### Access Layer (Bottom)\n\nWhere **end devices connect** to the network.\n\n- Switches: Cisco 2960, 9200 series\n- Functions: VLAN assignment, PoE, port security, 802.1X, PortFast, BPDU Guard\n- Connects: PCs, phones, printers, wireless APs, cameras\n- Design: High port density, low cost per port\n\n### Distribution Layer (Middle)\n\nThe **policy enforcement** and **aggregation** layer.\n\n- Switches: Cisco 3850, 9300 series (L3)\n- Functions: Inter-VLAN routing (SVIs), ACLs, QoS, route summarization, HSRP/VRRP\n- Connects: Aggregates multiple access switches\n- Design: Redundant uplinks, L3 boundaries\n\n### Core Layer (Top / Backbone)\n\nThe **high-speed transport** backbone.\n\n- Switches: Cisco 9500, Nexus series\n- Functions: Fast forwarding ONLY — no ACLs, no QoS, no detailed filtering\n- Connects: Distribution switches across buildings or campus blocks\n- Design: Full mesh, redundancy, 40/100 Gbps links\n\n### The Rule\n\n**Access** = connect and protect\n**Distribution** = route and filter\n**Core** = switch fast, never slow down\n\n### Collapsed Core\n\nSmall/medium networks often merge Core + Distribution into one layer (two-tier). The Access layer stays separate. Data centers use a similar concept called **spine-leaf** architecture.',
E'## Design Guidelines\n\n### Three-Tier Campus\n\n```\n[Core SW1]----[Core SW2]     ← 40/100G, full mesh, NO policies\n   |    \\  /    |\n   |     \\/     |\n[Dist SW1]  [Dist SW2]      ← L3, SVIs, ACLs, OSPF, HSRP\n   |   |      |   |\n[Acc1][Acc2][Acc3][Acc4]     ← L2, VLANs, PoE, port security\n  |     |     |     |\n PCs  Phones  APs  Printers\n```\n\n### Collapsed Core (Two-Tier)\n\n```\n[Core/Dist SW1]--[Core/Dist SW2]  ← L3, does routing AND transport\n   |    |            |    |\n[Acc1][Acc2]      [Acc3][Acc4]    ← L2, VLANs, PoE\n```\n\n### Layer Mapping to Features\n\n| Feature | Access | Distribution | Core |\n|---------|--------|-------------|------|\n| VLANs | Assign | Trunk/prune | Trunk |\n| Routing | No (L2) | Yes (SVIs) | Yes (fast) |\n| ACLs | Port security | Yes (policy) | Never |\n| PoE | Yes | No | No |\n| Redundancy | Optional | Required | Critical |\n| Speed | 1G to hosts | 10G uplinks | 40-100G |',
'["show vlan brief", "show ip route", "show etherchannel summary", "show spanning-tree", "show ip interface brief"]'::jsonb,
'["Applying ACLs at the core layer — this slows down the backbone", "Trying to do inter-VLAN routing at the access layer — use distribution SVIs", "Building a flat L2 network without a hierarchical design — does not scale", "Forgetting redundancy at the distribution/core layers"]'::jsonb
FROM topics t WHERE t.slug = 'network-layer-arch';
