---
id: TASK-002
title: 'physicsTuning.ts refactor — consolidate feel constants, read-at-use'
status: To Do
assignee: []
created_date: '2026-06-05 07:01'
labels:
  - claude-generated
  - atelier
  - refactor
  - physics
milestone: Atelier v1
dependencies: []
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 2
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Consolidate scattered physics feel constants into one data literal web/src/physics/physicsTuning.ts: GRAVITY_Y 0.7 + BUOYANCY_GAIN 1.5 (PhysicsWorld.ts), TETHER_STIFFNESS 1.75e-5 + SLACK_FACTOR 0.98 (Tether.ts), fling scale 16 (flingImpulse.ts), spawn offset 20 (spawnOffset.ts), transition timings from web/src/transitions/ primitives (POUR_IN_BASE_DELAY_MS 1000, stagger 80, tween 600, anchorSlide 700, EXIT_KICK 10, etc.). Read-at-use rule: consumers read physicsTuning.x (or the dev subscribable wrapping it) at the moment of use — per tick for gravity/stiffness, per event for fling/kick — never captured into a closure at construction; this is what makes sliders act on a running world. SLACK_FACTOR stays single-sourced so rope physics and StringLayer sag drawing move together. Independently valuable; prerequisite for the Physics axis (task-007).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 All listed constants live in physicsTuning.ts; no consumer captures them at construction
- [ ] #2 PhysicsWorld test: a mid-simulation gravityY change affects the next tick
- [ ] #3 Tests import from the module, never copy literals
- [ ] #4 Site behaves identically (dev smoke: cards spawn/fall/settle as before)
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
