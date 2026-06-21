---
id: TASK-036
title: v2 — hardening punch-list (pre-design)
status: In Progress
assignee: []
created_date: '2026-06-21 04:24'
updated_date: '2026-06-21 06:02'
labels:
  - claude-generated
  - v2
  - hardening
milestone: v2
dependencies: []
priority: medium
ordinal: 26010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Umbrella for behavioral/functional nitpicks + tweaks across the merged v2 slices (tasks 020-027, 029): peek->keep->enter lifecycle, scroll regimes + recall, hero morph, external-link annotation cards, /blog + /test/box* demo routes. Hardening pass BEFORE the task-030 design capstone (spine-first, then one design pass).

Model: this task's AC list IS the running punch-list. Triage each item: trivial -> fix inline on this branch; non-trivial/independent -> spin its own hardening-labelled task off main. task-035 (word-anchored pin scroll-stability deep dive) is the first spun-out item.

Time-box: collect (user seeds + dogfood pass) -> FREEZE list -> execute -> close.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Punch-list collected (user seeds + dogfood pass) and frozen; each item triaged trivial-inline vs spun-out
- [x] #2 Content box: a standard default width/height applies (extensible with per-route overrides later); the box is removed from the physics sim entirely (borders not pinnable); the temporary black border is removed (pending design round)
- [x] #3 Home page (/) renders the navbar
- [x] #4 Peek preview cards spawn near the click point (not a fixed static location); on drop/dismiss they are flung in a random direction with a slight impulse, not straight down
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Pass 1 (2026-06-20): AC #2 content box, #3 home navbar, #4 peek spawn/fling. Also raised: what happened to the temporary WIP/coming-soon home page — under investigation, not yet an AC.

AC#2 clarification: 'removed from physics entirely / borders not pinnable' was the original framing. DELIVERED (per Chai's mid-impl clarification) as NON-COLLIDING SENSOR borders — cards pass through them, but top/bottom edges REMAIN pinnable. The box stays in the sim as sensor edges, not removed. See commit eb88c17 + CONTEXT.md / v2 spec §6.
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
