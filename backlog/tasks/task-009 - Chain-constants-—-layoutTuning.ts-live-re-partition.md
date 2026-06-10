---
id: TASK-009
title: Chain constants — layoutTuning.ts + live re-partition
status: In Progress
assignee: []
created_date: '2026-06-05 07:02'
updated_date: '2026-06-10 01:43'
labels:
  - claude-generated
  - atelier
  - ui
  - layout
milestone: Atelier v1
dependencies:
  - TASK-005
  - TASK-006
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 9
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Chain routes (/blog, /stuff/flash) get no per-card drag — honest to the computed layout. Move chain-layout constants (CHAIN_GAP 60, CHAIN_TOP 80, NAV_CARD_W 180, NAV_CARD_H 56, insets — currently in web/src/layout/sectionLayout.ts) into a new layoutTuning.ts data file with the same live-binder + write-back treatment as physicsTuning. The Layout tab exposes these constants on chain routes; changing a value re-partitions the chain live. Registers the chain target in the vite-plugin-atelier whitelist (task-006 ships without it, since this task creates the file). Layout spacing guardrail: parent/child spacing ≥ CARD_H + 60px (tether lengths derive from layout).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Chain constants single-sourced from layoutTuning.ts (sectionLayout reads from it; tests import, never copy)
- [ ] #2 Editing a constant re-partitions /blog and /stuff/flash live
- [ ] #3 Chain target registered in the whitelist; codegen round-trip test (generate → import → deep-equal)
- [ ] #4 Write-back regenerates layoutTuning.ts; after HMR reload, baselines refresh and dirty flags clear
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
