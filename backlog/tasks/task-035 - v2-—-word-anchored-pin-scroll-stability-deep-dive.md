---
id: TASK-035
title: v2 — word-anchored pin scroll stability (deep dive)
status: To Do
assignee: []
created_date: '2026-06-21 03:13'
updated_date: '2026-07-28 21:51'
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
- [ ] #6 Kept cards rest at the content-box edge on Keep (not hanging word-anchored in mid-prose) — a resting-model change from spec §5; reuse parkAt on pin. Depends on AC#2 (parked-bottom must land on-screen, not below the viewport). Folded from task-036 pass-1 (user feedback 2026-06-21).
- [ ] #7 Reduced-motion park places the card OUTSIDE the box on BOTH edges. Source: task-043 sweep 2026-07-28 (CONFIRMED, was an unverified interviewer reading). PinnedCard.parkAt reduced branch sets y = edgeAnchor.y + parkRest UNCONDITIONALLY, the same expression for parked-top and parked-bottom, so a top-parked card lands at y=278 INSIDE the box [190,670] over the prose, while parked-bottom at 758 is correctly outside. It is permanent, not transient: reduced motion sets driftScale 0, prose repel is BINARY-gated on driftScale > 0, and the body is setDragging(true) static, so no force corrects it. Fix must sign parkRest by edge and assert BOTH edges land outside the box.
- [ ] #8 Parked-bottom must stay on-screen at MOBILE viewport heights, not just desktop. Source: task-043 sweep 2026-07-28. Symptom 3 stated cause (box-bottom-edge vs fold-region mismatch) is REFUTED — anchors and fold agree exactly. Real relation: cardBottom = boxBottom + parkRest + h/2 with boxBottom = (vh + 480)/2, so the card is clipped whenever viewport height < 816. Measured: vh 860 on-screen by 22px, vh 800 clipped 8px, vh 700 clipped 58px. Every phone viewport is far below 816, so this is guaranteed-broken on mobile, not an edge case. Verify at vh 667 and vh 812, not only at desktop height.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
task-036 pass-1 'B' (keep→box-edge pin) folded here per Chai 2026-06-21: kept cards should park to the box edge instead of word-anchored 'thin air'. Reuses parkAt + contentBox edge handles — same machinery as the AC#2 bottom-edge bug, so do them together; pick the edge policy (gravity-direction vs nearest) at implementation. Update spec §5 (resting model: word-anchored → edge-anchored on keep) in the same branch when implemented.

PROD-V1 DISPOSITION (2026-07-26, docs/plan/): VERIFICATION-ONLY in prod-v1. Not picked for FIXING in brief Q16, but A11 makes verification real scheduled work and Chai belief that this is stale is tagged [leaning], not [decided] — nobody has checked. The four symptoms are individually re-tested inside the M0 board-staleness sweep, against current main, UNDER DRIFT, using a per-frame trace or a conserved invariant (never a single-frame snapshot — a soft system is mid-settle one frame after any action). They were observed on /test/box during task-028 dev review, BEFORE the drift conversion landed (042.01-.04, 2026-07-01 to 07-03), so drift may have fixed all, some or none.

The sweep also confirms or REFUTES (rather than inheriting) the brief unverified interviewer reading: that PinnedCard.parkAt reduced-motion branch places a top-parked card at edgeAnchor.y + parkRest, INSIDE the box over the prose, while the non-reduced path lets prose repel settle it outside.

If ANY symptom reproduces, TRIGGER-A fires CUT-1 (drops task-039, freeing about 18 h to fix it) and the escalation goes to Chai at the 2026-08-02 checkpoint — never silently absorbed. AC#4 (parked-card restore via task-028) is dormant, not orphaned, while 028 is deferred.

SWEEP VERDICT 2026-07-28 (task-043, TRIGGER-A): PARTLY STALE — and the [leaning] 'this is stale' belief is WRONG on symptom 1. Harness: web/src/pin/task043.sweep.test.ts, steady-state only, calibrated against the pre-drift model before any reading was trusted.

S1 (fast scroll strands the card above the fold) — REPRODUCES, and drift made it WORSE. Under drift the card never returns on-screen within 6000 frames (~100s), final y=-140. Under the gravity (pre-drift) model it recovers in 23 frames (383ms), final y=240.6. Mechanism: the translate-pair carries the card by the FULL scroll delta before stepRegime parks it, so parkAt ropes from an already off-screen position; pre-drift gravity hauled it back, and drift removed that accidental corrective force. INSTRUMENT CONTROL (so this is not a mis-wired harness): the same rope contracts a modestly-displaced card 210 -> 90.9px, i.e. to parkRest 88.

S2 (auto-park at the top fold edge, feel) — MEASUREMENT ONLY, verdict reserved for Chai. stepRegime parks at fold.top minus foldMarginPx (24), position-based not crossing-based, so no scroll speed can miss the trigger. Whether that FEELS right is a taste call and is not this sweep's to make.

S3 (parked-bottom lands below the viewport) — PARTLY STALE: the stated cause is REFUTED, the symptom is LIVE but viewport-gated. Edge anchors and the fold agree exactly (top.anchor.y = rect.y, bottom.anchor.y = rect.y + height), so there is no 'box-bottom-edge vs fold-region mismatch'. Real relation: cardBottom = boxBottom + parkRest + h/2, with boxBottom = (vh + 480)/2. Clipped whenever viewport height < 816. Measured: vh 860 on-screen by 22px (why the original session saw it only marginally); vh 800 clipped 8px; vh 700 clipped 58px. Drift did not fix this — the original test viewport merely sat above threshold.

S4 (persisted-pin offset model not word-meaningful for parked cards) — DORMANT, premise unchecked by design: task-028 is unmerged and no localStorage exists under web/src/pin/, so the restore path this symptom describes is not reachable on main.

CONSEQUENCE: TRIGGER-A fires on S1. Escalated to Chai in-session 2026-07-28 rather than held to the 2026-08-02 checkpoint. CUT-1 (drop task-039, frees ~18h) is Chai's call — it reverses a preference stated in brief Q15 and was NOT absorbed silently.

CUT-1 RULING 2026-07-28 — Chai declined to fire CUT-1, so task-039 is NOT dropped and the ~18h it would have freed is not available. The park-geometry fix defined by AC#7/AC#8 is therefore currently UNFUNDED in the plan's arithmetic; it competes for reserve (CUT-3/8/9) at the 2026-08-02 checkpoint. The defects themselves are unaffected by this ruling and remain measured and reproducible via web/src/pin/parkGeometry.test.ts.
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
