---
id: TASK-017
title: Discuss redesign — gwern.net-style design via impeccable skill
status: Done
assignee: []
created_date: '2026-06-18 21:24'
updated_date: '2026-06-19 08:00'
labels:
  - claude-generated
  - design
  - redesign
dependencies: []
priority: high
ordinal: 7010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Open a design discussion for a site-wide visual redesign inspired by gwern.net's aesthetic (dense typography-forward longform, sidenotes/marginalia, restrained palette, link popups/transclusions, generous whitespace within a tight grid). Use the impeccable skill to drive the critique/direction work. This is a DISCUSSION/design task — scope, grilling, and decisions to be captured before any implementation slices are split out.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Design direction agreed with Chai and captured (PRD section and/or ADR)
- [x] #2 gwern.net traits to adopt vs. reject explicitly enumerated
- [x] #3 Follow-up implementation tasks split out (or explicitly deferred) once direction is locked
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done. v2 gwern×physics design direction captured + split. Deliverable (docs/backlog only, no code): v2 spec (docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md), PRD v2 banner, CONTEXT v2 vocabulary, ADRs 0005-0008, and 13 implementation tasks TASK-018..030 (dependency-ordered; visual design deferred to capstone TASK-030). Reached via brainstorming + grilling + a 6-lens adversarial review (corrected 5 false repo-reuse claims). Merged to main as squash commit ae4f4d9. AC#1/2/3 met; DoD green (typecheck/test/build+prerender/secret-scan).
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
