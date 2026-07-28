---
id: TASK-041
title: 'v2 canvas — field-warp around cards (DRAFT-009 #7 reframed, Theme-1, TSL)'
status: To Do
assignee: []
created_date: '2026-06-22 01:09'
updated_date: '2026-07-28 21:19'
labels:
  - claude-generated
  - threejs
  - webgpu
  - v2
  - canvas
milestone: v2
dependencies: []
ordinal: 31010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The ambient background field DISPLACED / bent around the drifting physics CARDS — the field parts around each card like water around a stone and re-forms behind it as the card drifts/drags. Originates as DRAFT-009 #7 'the field feels the typography' (text warps the field), REFRAMED by Chai 2026-06-22: on the live site the natural warp-source on canvas-mode routes is the CARDS, not static text (text-warp only pays off on a hero headline on open canvas, and is occluded inside the content box).

WHY THE REFRAME IS BETTER: (1) DYNAMIC not static — text-warp bakes one fixed SDF; card-warp moves every frame with the cards (responsive to drag/drift), so it reads as alive and as caused-by-interaction (a subtle effect you CAUSE reads better than one that just sits there); (2) NO occlusion — cards float on the open canvas; (3) it IS the foreground<->background tie (the 'close the two-RAF gap' Theme-1, the site's most-native opportunity) — cards warping the ambient layer literally makes the physics visible in the background.

SAME BRIDGE AS task-038: this rides the IDENTICAL physics->GPU bridge as the SDF metaball auras — snapshot live card rects into a GPU uniform array each frame. Card-warp (distortion) and #1/task-038 auras (additive glow) are TWO TREATMENTS OF ONE MECHANISM ('the card is present in the GPU layer'). They either COMBINE (cards that both glow AND push the field) or COMPETE (two ways of saying 'here' may be one too many) — that is AC#1. Sibling of task-038; gated on the same DRAFT-010 gravity->top-down-drift physics rewrite.

PROTOTYPE EVIDENCE (text-warp proxy, prototypes/field-feels-type.html, WebGL2, ~60fps): the SDF-driven UV warp + crisp text overlay works and the mechanism is sound. HONEST FINDING: the warp is QUIET — even at exaggerated settings the bend-around reads subtly in a still; it is a motion/feel effect, justified mainly when tied to interaction. SEPARATE TAKEAWAY: the large-scale monochrome ink-wash / topographic flow-field rendered UNDER the warp is a pleasant ambient look on its own — a reusable BACKGROUND-SCENE candidate independent of the warp feature.

BUILD NOTES: cards are rectangles -> ANALYTIC SDF in-shader (sdBox + smin), NO bake needed (easier than the glyph version; mirrors task-038's approach). pretext caveat does NOT apply (rects, not glyphs); if a text/headline warp is ever ALSO wanted, seed from rasterize/font-outline, never pretext (block metrics only). Per ADR-0009: WebGPU/TSL exclusive; static-PNG fallback first-class.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Relationship to task-038 (#1 metaball auras) DECIDED and recorded: card-warp (distortion) and metaball auras (glow) are two treatments of the same physics->GPU bridge — COMBINE into one renderer or pick one (ADR if load-bearing).
- [ ] #2 Live card rects fed into the warp each frame via the shared physics->GPU bridge (same as task-038); analytic rect SDF (sdBox + smin), buffers reused (no per-frame alloc), resize-tracked.
- [ ] #3 Background TSL field visibly parts/bends around each card and re-forms behind it as cards drift/drag (dynamic, not a static bake); authored on WebGPU/TSL per ADR-0009.
- [ ] #4 Warp magnitude clamped + tuned so it reads as responsive-but-restrained (the effect is quiet — tune solo in-session; strongest when tied to drag/interaction, not ambient idle).
- [ ] #5 Static-PNG / no-WebGPU + no-JS fallback retained (field degrades to an un-warped or baked still).
- [ ] #6 Visual/feel verification: agent-browser pass in the MAIN session showing the field parting around a card ON DRAG (motion + magnitude, not a single static frame).
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reframe of DRAFT-009 #7 (text->cards, Chai 2026-06-22). Prototype: prototypes/field-feels-type.html (text-warp proxy — validated SDF UV-warp + crisp overlay @~60fps; warp confirmed QUIET; the ink-wash flow-field under it is a reusable bg-scene candidate). SIBLING of task-038 (shares the physics->GPU bridge + the DRAFT-010 drift-rewrite gate). Cross-refs: DRAFT-009 #7 + #1, task-038, task-040, ADR-0009, task-037, DRAFT-010.

GATE LIFTED 2026-07-03: task-042 (top-down drift physics) shipped to main (squash d591291; S1–S4 all Done). Live per-frame card rects (same bridge as task-038) now exist under the drift model — spec §4: 'task-041 (field-warp): live card rects: same bridge as 038.' 041 is a sibling of 038 (card-warp-distortion vs aura-glow — combine or pick one). Ref: docs/superpowers/specs/2026-07-01-drift-physics-design.md §4 + ADR-0010.

From task-038 review (2026-07-14, commit 94b36c4): the shared bridge PhysicsWorld.snapshotCardRects now EXCLUDES dynamic sensor bodies (reg.body.isSensor — dismissed previews from PreviewCard.setSensor), mirroring the drift force pass. So when 041's field-warp consumes the bridge on peek-enabled routes, a dismissed preview will NOT grow a warp. Also: task-038's auraTuning.maxCards caps at 12 (AC#7 fill-rate budget) with zero headroom on /lab — 041 must size its own GPU-slot capacity for its route, not inherit 038's 12.

PROD-V1 DISPOSITION (2026-07-26, docs/plan/): DEFERRED post-launch. Not picked in brief Q15. Its AC#1 (combine with the task-038 auras or pick one) is undecided, and ADR-0011 deliberately declines to decide it. Stays To Do under milestone v2.

SWEEP VERDICT 2026-07-28 (task-043): LIVE — premise confirmed, prototypes/field-feels-type.html exists as described. Remains DEFERRED in the plan. Its stated gate (the DRAFT-010 drift rewrite) has since LANDED — 042.01 through 042.04 all merged 2026-07-01 to 07-03 — so the physics dependency is satisfied and the sibling bridge shipped with task-038. The gate language in the description is therefore stale even though the task is live.
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
