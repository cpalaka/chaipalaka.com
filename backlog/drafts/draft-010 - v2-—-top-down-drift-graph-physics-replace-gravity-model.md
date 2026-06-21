---
id: DRAFT-010
title: v2 — top-down drift graph physics (replace gravity model)
status: Draft
assignee: []
created_date: '2026-06-21 21:56'
labels:
  - claude-generated
  - v2
  - physics
  - foundational
  - high-priority
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GOAL: replace the current gravity-based matter.js model with a TOP-DOWN 'graph' model — all elements (cards, tethers, etc.) live on a 2D plane viewed top-down and move with GENTLE DRIFT (not gravity); cards stay DRAGGABLE + COLLIDABLE.

PRIORITY: HIGH / FOUNDATIONAL — the foundation for the canvas auras (task-038), fat-line tethers (task-039), and the broader v2 art direction. Everything downstream is gated on this. (Draft CLI has no priority/milestone flag; conveyed via labels high-priority + v2 — set real HIGH priority + v2 milestone when promoting to a task.)

CHANGES FROM TODAY: remove the gravity vector + fall + pendulum-settle; tethers become graph EDGES (springs with rest length, per the fat-tether prototype) instead of gravity-hung sagging ropes; resting behavior becomes gentle drift; PRESERVE drag + collision.

REQUIRES A FULL GRILLING SESSION before promotion (Chai's call). Pair grilling with domain-modeling — this changes core domain language (gravity / pendulum / STRUNG<->DETACHED -> drift / graph-edge / ...). Update CONTEXT.md + PRD.md + an ADR for the model change. Will likely DECOMPOSE into sub-tasks after grilling (needs explicit go-ahead). ACs get written at grilling-end (ungrilled drafts carry none).

OPEN DESIGN QUESTIONS (resolve in the grilling session):
1. Edge dynamics: do edges exert spring / force-directed-layout forces (prototype used gentle springs), or purely visual? Force-directed layout, free Brownian drift, or anchored drift?
2. Resting/anchoring: drift indefinitely, settle into a layout, or drift around per-route anchors? Does a per-route layout still exist?
3. peek / keep / enter: how do they survive? KEEP currently pins a card to a physics toy via a tether constraint; ENTER is the hero-morph. What is the drift-model analog?
4. Card-state model: does STRUNG vs DETACHED survive, or does 'everything is a drifting graph node' replace it?
5. Boundaries: how do drifting cards interact with the content box + viewport edges (current static walls)?
6. Engine: keep matter.js (kill gravity + add spring constraints, watch the frictionAir-inversion NaN) or a lighter custom drift integrator (the prototypes hand-rolled one)?
7. Tuning constants: drift/spring feel constants live in a read-at-use module, NOT the physicsTuning schema (whole-file-regen gotcha).

Prototypes that informed this: prototypes/lava-metaball.html + prototypes/fat-tethers.html (both use a hand-rolled top-down drift integrator with drag + collision + springs).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
