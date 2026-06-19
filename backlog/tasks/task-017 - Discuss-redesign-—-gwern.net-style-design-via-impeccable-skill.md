---
id: TASK-017
title: Discuss redesign — gwern.net-style design via impeccable skill
status: In Progress
assignee: []
created_date: '2026-06-18 21:24'
updated_date: '2026-06-19 03:04'
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
- [ ] #1 Design direction agreed with Chai and captured (PRD section and/or ADR)
- [ ] #2 gwern.net traits to adopt vs. reject explicitly enumerated
- [ ] #3 Follow-up implementation tasks split out (or explicitly deferred) once direction is locked
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
