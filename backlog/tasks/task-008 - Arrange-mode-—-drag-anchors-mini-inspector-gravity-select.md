---
id: TASK-008
title: 'Arrange mode — drag anchors, mini-inspector, gravity select'
status: In Progress
assignee: []
created_date: '2026-06-05 07:02'
updated_date: '2026-06-10 00:55'
labels:
  - claude-generated
  - atelier
  - ui
  - layout
milestone: Atelier v1
dependencies:
  - TASK-003
  - TASK-005
  - TASK-006
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 8
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Layout tab toggle flips pointer semantics: normal drag = physics fling; arrange drag = move the card's anchor (body re-tethers and pendulum-settles onto the new rest position; live fraction readout). Selecting a card shows a mini-inspector: parent (ceiling | floor | <card> | detached) and kind. Route-level: gravity-direction select — data-layout routes only (chain routes build their PageDef in code at runtime; their gravity has no write-back target and stays code-edited in v1). Scope fences: add/remove cards stays in code (a card needs cardContent, not just a spec); the / placeholder keeps its computed letter anchors. Write-back via the layout target of task-006 (whole-file regen of the route's .layout.ts). Tether gotcha: anchorA is body-relative — re-tethering must not yank sibling tethers.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Arrange drag moves the anchor with live fraction readout; card re-tethers and pendulum-settles
- [ ] #2 Mini-inspector edits parent (ceiling | floor | card | detached) and kind
- [ ] #3 Gravity-direction select appears on data-layout routes only
- [ ] #4 Write-back regenerates the route's .layout.ts; reload reproduces the arranged layout
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
