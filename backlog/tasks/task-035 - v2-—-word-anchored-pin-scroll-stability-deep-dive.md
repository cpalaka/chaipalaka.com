---
id: TASK-035
title: v2 — word-anchored pin scroll stability (deep dive)
status: To Do
assignee: []
created_date: '2026-06-21 03:13'
updated_date: '2026-06-21 04:23'
labels:
  - claude-generated
  - v2
  - physics
  - hardening
milestone: v2
dependencies:
  - TASK-024
ordinal: 25010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Deep dive on flaky word-anchored pinned-card behavior under scroll, surfaced during task-028 dev review. The task-018 spike predicted fast-scroll instability and its single-frame verify missed it. Symptoms observed on /test/box: (1) FAST scroll down -> the card gets STUCK ABOVE the screen (the exact spike-G case that wasn't caught); (2) SLOW scroll down, word exits the top -> card auto-parks at the top fold edge — behavior + feel debatable, needs tuning; (3) a parked-bottom card lands BELOW the viewport (y~880 vs fold bottom ~670) — a box-bottom-edge vs fold-region mismatch; (4) the persisted-pin offset model (card centre minus word centre) is not word-meaningful for PARKED cards, so restore leans entirely on parkAt re-placing them (task-028 / ADR-0009). NOT a persistence bug — the auto-park/recall regime physics (task-024) needs focused work. Refs: task-018 (spike), task-024 (scroll regimes + recall), task-028 (persisted pins). Verify per-frame / via conserved invariants, not single-frame snapshots (see reference: physics-feel verify).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Word-anchored pinned cards never get stuck off-screen at ANY scroll speed (fast-scroll-down no longer strands the card above the fold)
- [ ] #2 Auto-park edge selection + landing position is correct and on-screen: a parked card sits at the visible box fold edge, not below the viewport (resolve the box-bottom-edge vs fold-region mismatch)
- [ ] #3 Recall is always reachable: scrolling a parked card's word back into the fold offers recall and clicking it returns the card
- [ ] #4 Parked-card restore (task-028) lands cards correctly via parkAt regardless of edge-handle readiness timing
- [ ] #5 Behavior verified by per-frame trace / conserved invariant (rope drift bounded) across scroll speeds — not single-frame snapshots
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
