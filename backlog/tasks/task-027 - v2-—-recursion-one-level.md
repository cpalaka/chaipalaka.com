---
id: TASK-027
title: v2 — recursion (one level)
status: Done
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-21 01:18'
labels:
  - claude-generated
  - v2
  - physics
milestone: v2
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
- [x] #1 A link inside a pinned card pins as a child card tethered to its parent card
- [x] #2 Nesting is capped at one level (a child's content does not spawn further pins)
- [x] #3 Uses the generic card-parent Tether (no NotesChain)
- [x] #4 Honors task-018 spike guardrail G5: translate-pair must move the whole bonded SUBTREE (pinned parent AND all descendant cards) by the scroll delta; pairing only the parent yanks an un-paired child off its card-to-card rope. See docs/spikes/2026-06-19-word-anchor-scroll-stability.md
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
One-level ladder recursion. A Portal/Pocket link inside a root pinned card peeks/keeps as a child roped to the PARENT card via wireTetherFor 'card' (no NotesChain); the root carries its whole bonded subtree on scroll (spike G5); one-level cap via new pin/recursion.ts resolvePinHost (data-pin-parent marker). parentId threaded through Peek/Pin stores. /test/box footnote gains a Portal link to reach the path. Child wobble deferred to the design pass; a child does not auto-park. agent-browser verified: child ropes to parent, G5 rope drift <=30px (vs 2490px un-carried), cap holds. Follow-up: draft-008 (recursive previewability inside un-pinned previews).
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
