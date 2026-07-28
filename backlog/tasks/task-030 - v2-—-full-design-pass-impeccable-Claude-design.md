---
id: TASK-030
title: v2 — full design pass (impeccable + Claude design)
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-07-28 21:19'
labels:
  - claude-generated
  - v2
  - design
  - prod-v1
milestone: prod-v1
dependencies:
  - TASK-020
  - TASK-021
  - TASK-022
  - TASK-023
  - TASK-024
  - TASK-025
  - TASK-026
  - TASK-027
  - TASK-029
  - TASK-033
  - TASK-034
  - TASK-045
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: high
ordinal: 20010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The capstone visual design pass over the working v2 spine (spec section 15), decided after the mechanics work so the aesthetic is chosen with full context. One coherent impeccable + Claude-design run. Owns: card chrome (title bar, body, outline, highlight states), preview / Portal / Pocket styling, content-box type/color/spacing, and the motion vocabulary (the section 15 easing/duration bands). Restyles the token-separable spine without touching behavior. Owner-driven. NOTE: the section 16 art-direction follow-ups are split into separate drafts (out of this task's scope): DRAFT-002 (card fragment shaders), DRAFT-003 (background-shader overhaul), DRAFT-004 (asymmetric wide media).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A coherent visual design system applied across the v2 spine (card chrome, preview, box, motion), replacing the v1 placeholder styling
- [ ] #2 Restyle touches styling/tokens only, no behavior regressions (spine tests green)
- [ ] #3 PROTECT-LAST (brief A23). Scheduled M3 of five (2026-08-31 to 2026-09-13), NOT last — a protect-last item scheduled dead last is the first thing squeezed. Nothing shares the M3 window and no cut in docs/plan/risk-cut-register.md touches this task before CUT-9. CUT-9 is an ESCALATION to Chai (A18 date-fixed vs A23 protect-last), never a silent cut. Runs only after the structural work is final — lifelog composed, /about live, mobile laid out, per-route compositions designed.
- [ ] #4 Scope explicitly includes A23 general UX/look-and-feel polish, which is broader than AC#1-2: (a) MOBILE VIEWPORTS as a first-class case, not an afterthought — the pass runs over the mobile-complete whole; (b) the STATIC-FALLBACK LOOK for the ~18% of visitors without WebGPU (ADR-0009) — fallback PNGs and gradients designed, NOT residual; (c) BACKGROUND-SCENE CURATION, i.e. which existing scenes ship and their fallback PNGs. Authoring new scenes is DRAFT-003 and stays deferred.
- [ ] #5 Contrast floor evaluated PER THEME, not once: v2 spec §6 requires at least 4.5:1 for prose in the box, and the spec rejected translucency precisely because it could not guarantee this. Verify any value-driven CSS variable at its RANGE EXTREMES, not at its live value — a modulated style can invert only at the boundary.
- [ ] #6 Does NOT own the spec §16 art-direction follow-ups, split out on 2026-06-19 into DRAFT-002 (card shaders), DRAFT-003 (background shaders), DRAFT-004 (wide media). All three deferred. Do not let them creep back under polish — that split is what gives this task a finite surface.
- [ ] #7 DRAFT-006 coordination note is conditional: the staleness sweep first adjudicates whether the DRAFT-006 premise survives drift (it complains of a card that hangs and swings as a live pendulum, but ADR-0010 set engine gravity to zero on every route). Style the ACTUAL parked pose the sweep finds, not the dangle that no longer exists.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Token-name bug to fix during the reskin (found in task-020): ReadingSubstrate.css (and BlogPost.css) reference --text-sm/--text-xs/--text-2xl/--text-3xl, which do not exist in tokens.css (real names are --font-size-*). They resolve to nothing → those font-sizes inherit. Carried verbatim during the task-020 reader extraction to keep /blog/:slug/read byte-identical; correct to --font-size-* here.

Parked/edge-anchored card *feel* is being reworked — see DRAFT-006 (high-priority, grill-first). task-024 shipped parking as a card that hangs/swings off the content-box edge (spec §6/ADR-0006); Chai wants a calmer parked representation. Coordinate the capstone visuals with that redesign, don't polish the current dangle.

PROD-V1 (2026-07-26, docs/plan/): protect-last item per brief A23, scheduled M3 (2026-08-31 to 2026-09-13, 26 h reserved). Dependency on TASK-028 REMOVED this session — 028 was deferred post-launch by brief A21, so the capstone was formally blocked by a deferred task. Both input roadmaps missed this; --dep replaces the whole list, which is likely why. Remaining deps TASK-020..027 + TASK-029 are all Done. Plan: docs/plan/workstream-design.md WP-11.

DEPENDENCY NOTE (2026-07-26): structural prod-v1 predecessors TASK-033 (lifelog composed canvas), TASK-034 (/about) and TASK-045 (per-route composition) added. The responsive-layout foundation and mobile pin rail are ALSO hard predecessors per the ratified spine-first rule — mobile responsiveness is spine, not design — but their tasks are created at the M2 checkpoint under rolling-wave discipline, so those two edges must be ADDED THEN. --dep replaces the whole list: pass the complete set, do not append one id.

OPEN DECISION O3 — delight vs triage (docs/plan/open-questions.md T3; forcing date 2026-08-30, the M2 checkpoint). Brief A5 makes "visitors admire the site itself" an explicit launch goal. A19 then moved EVERY delight-bearing item to NICE — sound (DRAFT-001), card shaders (002), background shaders (003), wide media (004), pretext (005), morph polish (007) — and A21 cut two outright. CUT-1 removes TASK-039, the last visual-fidelity item beside this one.

CONSEQUENCE FOR THIS TASK: in the budgeted cut path (CUT-1 and CUT-2 both fire in M4), THIS TASK CARRIES THE ENTIRE LAUNCH DELIGHT BUDGET ALONE. That may be exactly right, or A19 rule may have over-fired — only Chai can say, and the plan cannot resolve it.

If one NICE item is restored, restore DRAFT-007 (hero-morph polish): 4-8 h, pure CSS in head-loaded base.css, improves the single most-seen transition on the site, and folds into this task motion-vocabulary work rather than needing its own slot. Second cheapest is DRAFT-003 (background-shader overhaul) — it upgrades a surface every visitor sees on every route, unlike /lab-only or card-only effects. Decide by the M2 checkpoint so a restored item can ride M3 rather than needing a slot of its own.

SWEEP VERDICT 2026-07-28 (task-043): LIVE, premise unchanged. Unstarted; it is the protected core (A23) and makes no repo claim the sweep could falsify. Sweep note: task-043 confirmed DRAFT-002 (card fragment shaders) is STALE on its renderer premise (names an R3F shader-quad layer plus an SVG/Houdini no-WebGL fallback, both superseded by ADR-0009 WebGPU/TSL-exclusive and ADR-0004 static-PNG fallback). That does not change this task's no-shader-reskin scope — it only means the split-out draft cannot be promoted from its current text.
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
