---
id: TASK-009
title: Chain constants — layoutTuning.ts + live re-partition
status: Done
assignee: []
created_date: '2026-06-05 07:02'
updated_date: '2026-06-10 02:34'
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
- [x] #1 Chain constants single-sourced from layoutTuning.ts (sectionLayout reads from it; tests import, never copy)
- [x] #2 Editing a constant re-partitions /blog and /stuff/flash live
- [x] #3 Chain target registered in the whitelist; codegen round-trip test (generate → import → deep-equal)
- [x] #4 Write-back regenerates layoutTuning.ts; after HMR reload, baselines refresh and dirty flags clear
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Merged to main as 2d48c8e (squash of feat/task-009-chain-constants-layouttuning). layoutTuning.ts single-sources chain constants with notify-based live re-partition on /blog + /stuff/flash; chain target registered in vite-plugin-atelier with byte-identical + round-trip codegen tests; Flash CHAIN_TOP drift (100 vs 80) unified onto the shared value, approved at review. All ACs verified in dev browser; diff approved by Chai 2026-06-09.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
