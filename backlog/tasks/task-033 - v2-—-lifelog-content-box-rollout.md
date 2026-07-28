---
id: TASK-033
title: v2 — lifelog composed-canvas route (prod-v1)
status: To Do
assignee: []
created_date: '2026-06-21 00:02'
updated_date: '2026-07-28 21:19'
labels:
  - claude-generated
  - v2
  - content
  - prod-v1
milestone: prod-v1
dependencies:
  - TASK-026
  - TASK-043
priority: high
ordinal: 23010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
REDEFINED 2026-07-26, superseding this task original quiet content-box scope from spec §8. Brief A9 rules /lifelog a COMPOSED CANVAS route: box-less, under CanvasLayout (the /lab shape, ADR-0011), an authored arrangement of differently-sized cards using the space creatively (A6). The four live /api/{books,now-playing,films,github} widgets move into card content with fetches unchanged.

Composition mechanism ruled by Chai 2026-07-26 (decision O1): STRUNG cards on short ropes — bounded drift, a LIVING composition — not driftScale 0. Plan: docs/plan/ (work-pieces WP-03, open-questions T1/T2).

Verified state at planning time: routes/Lifelog.tsx still imports card/Page and pageSpecFromLayout, i.e. genuinely the v1 scatter shape.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
- [ ] #7 Pre-merge adversarial review run after the verify gate is green, before diff review: .claude/workflows/adversarial-review.js with {mode: "modest", task: "task-033", diffRange: "main...HEAD", specSections: "v2 spec §8 route table; ADR-0005 dec.1; ADR-0010 dec.2-3; ADR-0011; ADR-0012; drift spec D7"}. Escalate to full mode if the spawn-kick fix changes shared CardImpl/PhysicsWorld ordering. Relay ALL findings verbatim; never self-dismiss one.
<!-- DOD:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 GATE — before any build hour: ADR-0012 drafted and ratified by Chai. It records (a) the box-less carve-out and its departure from ADR-0005 decision 1 (each route is a fixed, solid, scrollable content box) — ADR-0011 states that extending that carve-out beyond /lab becomes its own decision, and this is the second box-less route; (b) the STRUNG bounded-drift mechanism (O1); (c) the shipping minimum. v2 spec §8 route table AND the CONTEXT.md lifelog content-box language are amended IN THIS BRANCH (PRD-sync rule, unconditional).
- [ ] #2 /lifelog renders box-less under CanvasLayout with an authored composition of differently-sized cards. NOT ContentBoxLayout, NOT card/Page scatter.
- [ ] #3 Mechanism = STRUNG: every composed card tethers to an authored static anchor so its wander is BOUNDED (CONTEXT.md Strung; ADR-0010 decision 3 — consequences become bounded drift vs free wander). Route driftScale is authored low but greater than 0, so the cards stay alive. driftScale is authored ROUTE-SIDE on the PageSpec, NEVER in an Atelier-regenerated .layout.ts — whole-file regen silently drops it and the failure is invisible (drift spec D7; Lab.layout.ts:6 carries the same warning).
- [ ] #4 Rope-length problem addressed explicitly, not left implicit: a Tether length is DERIVED from distance(parentAnchorPos, cardLayoutPos) (CONTEXT.md), so short ropes means cards authored near a static anchor. Any card placed mid-viewport needs its own authored static anchor or it gets a long rope and a loose composition. The anchor topology is authored and recorded in the layout, and the ADR notes it.
- [ ] #5 Spawn-kick ordering gap fixed as a CLASS, not an instance. CardImpl.tsx:90 computes SPAWN_KICK * world.getDriftScale() before usePageDef has applied the route value — the code own comments at :13-18 and :87-89 say so — and PhysicsWorld.driftScale defaults to 1 (:102). Prefer ordering the driftScale set ahead of card registration over adding a second synchronous read at the spawn site: the latter is precisely the instance-fix that left this class behind in the task-042.04 review.
- [ ] #6 Idle stability: card centres move under 2 px between t=0 and t=5 min on an idle session. Verify per-frame or from PhysicsWorld.snapshotCardRects — NEVER a single-frame snapshot, a soft system is mid-settle one frame after any action. agent-browser runs in the MAIN session (a subagent screenshot never reaches the orchestrator) with an explicit viewport 1280 860; the default is about 1280x577 and clips fixed chrome.
- [ ] #7 The four existing adapters move into card content with fetches unchanged. ZERO new adapters and zero deepening: A8 expansions (last.fm weekly artists, Letterboxd/Goodreads depth, Claude activity log, sleep, YouTube) are deferred post-launch and recorded in the ADR-0012 shipping-minimum section.
- [ ] #8 No-JS floor present and prerendered. Verify gate green per docs/process/local-verification.md, including data-server-rendered, and a dev smoke of /lifelog.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SWEEP VERDICT 2026-07-28 (task-043): LIVE — premise re-confirmed by direct read, not inherited. web/src/routes/Lifelog.tsx still imports Page from ../card/Page and pageSpecFromLayout from ./routeLayout (lines 2 and 5), i.e. genuinely the v1 scatter shape the planning session recorded. The redefinition to a composed canvas route stands unchallenged.
<!-- SECTION:NOTES:END -->
