# ADR 0011: Metaball auras mount on a box-less /lab route, as a transparent layer under the cards

**Date:** 2026-07-13
**Status:** Accepted
**Task:** task-038 (SDF metaball card auras) · relates to ADR-0009 (WebGPU-exclusive
canvas), ADR-0010 (drift default physics), task-041 (field-warp sibling)

## Context

The aura field must not fight the v2 content box (task-038 AC#6): on reading
routes the box occludes most of the viewport, and an aura glooping *under* prose
is noise. The task named two candidate resolutions — a box-less route, or a
dedicated above-box layer.

## Decision

1. **Mount surface = a new box-less `/lab` route** (Chai-approved 2026-07-13):
   12 detached, full-drift specimen cards under `CanvasLayout`, no content box.
   The above-box-layer option is not built; if the aura ever moves onto reading
   routes, that becomes its own decision.
2. **`AuraLayer` is a transparent compositing layer at z-index 1** — above the
   background canvas (0), below the tether `StringLayer` (2) and cards (10).
   Like the validated prototype, the scene renders blobs with premultiplied
   alpha and is transparent elsewhere; it never paints a backdrop, so the
   user's active background scene stays visible on `/lab`.
3. **The physics→GPU bridge is `PhysicsWorld.snapshotCardRects`** (zero-alloc,
   one-way, optional `[cos θ, sin θ]` rotation channel) — the shared substrate
   task-041's field-warp consumes too; 041's AC#1 combine-or-pick-one decision
   is deliberately NOT made here.

## Why

A box-less route resolves the occlusion by construction (nothing to occlude)
and gives the effect a home where full drift (`driftScale: 1`) is appropriate;
an above-box layer would have forced the aura to compete with prose legibility
on every reading route before the art direction capstone (task-030) exists.
Transparency keeps the aura composable with the existing background-scene
system instead of replacing it.

## Trade-offs

- The effect is only visible on `/lab` until a later decision promotes it.
- A static fallback PNG (baked from the live canvas at the stilled card grid)
  can never track live cards for no-WebGPU users — accepted. For reduced-motion
  users it only *approximates*: the card anchors are fractional and the PNG is
  `object-fit: cover`, so it lines up with the resting grid on a fresh load only
  near the bake viewport (~1280×860) and drifts out of register at other sizes;
  a mid-session reduced-motion toggle freezes cards wherever they had drifted,
  not back on the grid. Acceptable for a placeholder `/lab` toy.
