---
id: TASK-027
title: v2 — recursion (one level)
status: To Do
assignee: []
created_date: '2026-06-19 07:54'
labels:
  - claude-generated
  - v2
  - physics
dependencies:
  - TASK-023
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: low
ordinal: 17010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
One level of ladder nesting (spec section 9). A link inside a pinned card's content can itself peek/keep; a child pin tethers to the PARENT card via the generic card-parent Tether (parent: parentCardId; Tether.ts wireTetherFor parentKind 'card') over the runtime-creation path from TASK-023. NOT NotesChain (removed, ADR-0001 section 9). Cap at one level in v2.0; arbitrary depth deferred.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A link inside a pinned card pins as a child card tethered to its parent card
- [ ] #2 Nesting is capped at one level (a child's content does not spawn further pins)
- [ ] #3 Uses the generic card-parent Tether (no NotesChain)
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
