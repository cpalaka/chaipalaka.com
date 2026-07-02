# ADR 0010: Drift is the default physics mode; gravity becomes dormant

**Date:** 2026-07-01
**Status:** Accepted (design ratified + adversarially reviewed; build pending — DRAFT-010)
**Task:** DRAFT-010 grilling · spec: `docs/superpowers/specs/2026-07-01-drift-physics-design.md`
**Relates to:** ADR-0001 (supersedes decisions 1, 6 + 7's rationale in part), ADR-0006
(word-anchor mechanisms retained), ADR-0008 (reduced-motion pin gate unchanged),
ADR-0009 (the WebGPU canvas direction this model serves)

---

## Context

The v2 art direction (DRAFT-009 walk → tasks 038/039/041: metaball auras, fat tethers,
field-warp) converged on a top-down plane where the GPU layer makes the physics visible.
The gravity-hang model (ADR-0001) is the wrong habitat for it: hang/pendulum aesthetics
are vertical, the effects want slow relative drift between cards. Two committed
prototypes (`prototypes/fat-tethers.html`, `lava-metaball.html`) validated the drift
feel at ~60fps.

## Decision

1. **Per-route Physics mode `'drift' | 'gravity'`, default `'drift'` — every route
   converts.** No route declares gravity at ship; the gravity/buoyancy code and knobs
   stay in the engine as a **dormant mode** (not deleted).
2. **Drift = edge-only drift:** dt-normalized, mass-invariant Brownian velocity kicks +
   damping + the existing **pull-only rope** tethers (unchanged) + card-card collision +
   wall bounds + **prose repel** (the content box gently repels every non-dragged card;
   repel + rope jointly produce the parked/word-anchored poses). **No home anchors, no
   spring-back** — the standing v2 principle holds.
3. **STRUNG / DETACHED keep their names**; consequences become bounded drift vs free
   wander.
4. **matter.js is retained** — drift is configuration (zero gravity + a force pass),
   not an engine swap.

## Why

One coherent tether/motion language site-wide (tension = the visual vocabulary
task-039 renders); the native habitat for the WebGPU canvas layer; reversible (gravity
dormant, not deleted); feel pre-validated by the prototypes. A hand-rolled integrator
was rejected: it would rebuild collision/drag/sensors/anchors and every physics test
for zero behavioral gain.

## Trade-offs

- Composition dissolves slowly on canvas routes (free components wander; accepted).
- The 404 up-gravity balloon joke and route "gravitational identity" retire.
- Dormant gravity code carries maintenance weight (kept deliberately for later use).
- Reading routes must tune drift to near-still (`driftScale`) or motion beside prose
  becomes a regression.

## Consequences

- ADR-0001 decisions 1 and 6 (and decision 7's rationale) are superseded in part
  (banners added there); decisions 2, 4, 5 survive unchanged.
- CONTEXT.md gains **Physics mode / Drift / Prose repel** and redefines **Cardinal,
  Strung, Detached, PageSpec, Preview card, Resting state**; pendulum-settle →
  **drift-settle** (a bounded-drift invariant, never a rest state).
- PRD physics/strings sections annotated; the "Modules with tests" roster entries for
  `PhysicsWorld` and `Tether`/`StringLayer` are rewritten to drift-mode coverage + a
  dormant-gravity subset.
- Demo surfaces: `sandbox/Strings.tsx` deleted; `test/Box.tsx` + `test/BoxB.tsx` kept
  and converted — the standing ladder + nested-cards demo (amends ADR-0007's recorded
  demo-surface note).
- The full change map, force model, and test plan live in the spec (single source);
  this ADR records the decision, not the mapping.
