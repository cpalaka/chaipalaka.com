---
id: TASK-028
title: v2.1 — persisted per-route pins
status: In Progress
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-21 03:21'
labels:
  - claude-generated
  - v2
  - physics
milestone: v2
dependencies:
  - TASK-023
  - TASK-024
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: low
ordinal: 18010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fast-follow persistence (spec section 7). Persist a route's pinned-card arrangement to localStorage (which word, regime, position) so it survives reload and return visits; restore on load. Handle stale pins gracefully when content changes underneath (the source word no longer resolves). v2.0 ships ephemeral (session+route only); this upgrades it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Pinned cards on a route survive reload and return visits, restored to word/regime/position
- [ ] #2 A pin whose source word no longer exists degrades gracefully (dropped or edge-parked, no crash)
- [ ] #3 Persistence is per-route and scoped to localStorage
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SHELVED 2026-06-20 — pending the rest of v2 feature work (user second thoughts; nice-to-have, not blocking). Implemented + verified, NOT merged, NOT signed off. Branch: feat/task-028-persisted-pins (2 commits: fa52c2c feat + e921845 review fixes). Gate green at shelve time (typecheck / test 786 / build+prerender / secret-scan / live). Only the user-sign-off DoD remains. RESUME: git checkout the branch, re-run the verify gate, get sign-off, mark Done, squash-merge. Bug-2 (word-anchored scroll/regime flakiness) split out to task-035.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
