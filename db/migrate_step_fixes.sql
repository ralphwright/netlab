-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Lab step content fixes
-- Adds missing 'configure terminal' to steps where a device
-- appears for the first time in a lab but immediately needs
-- to be in global configuration mode.
-- Safe to re-run — guarded by NOT ('configure terminal' = ANY(...))
-- ══════════════════════════════════════════════════════════════

-- full-enterprise-network, step 9 (HQ-R1 first appearance)
-- Prior steps 1-8 were all on HQ-SW1. HQ-R1 starts in privileged mode
-- but 'ip dhcp pool' requires global config mode.
UPDATE lab_steps
SET expected_commands = ARRAY['configure terminal'] || expected_commands
WHERE lab_id        = (SELECT id FROM labs WHERE slug = 'full-enterprise-network')
  AND step_number   = 9
  AND target_device = 'HQ-R1'
  AND NOT ('configure terminal' = ANY(expected_commands));

-- full-enterprise-network, step 17 (HQ-FW1 first appearance)
-- 'zone security' requires global config mode.
UPDATE lab_steps
SET expected_commands = ARRAY['configure terminal'] || expected_commands
WHERE lab_id        = (SELECT id FROM labs WHERE slug = 'full-enterprise-network')
  AND step_number   = 17
  AND target_device = 'HQ-FW1'
  AND NOT ('configure terminal' = ANY(expected_commands));

-- full-enterprise-network, step 22 (HQ-WLC first appearance)
-- 'wlan' requires global config mode.
UPDATE lab_steps
SET expected_commands = ARRAY['configure terminal'] || expected_commands
WHERE lab_id        = (SELECT id FROM labs WHERE slug = 'full-enterprise-network')
  AND step_number   = 22
  AND target_device = 'HQ-WLC'
  AND NOT ('configure terminal' = ANY(expected_commands));

