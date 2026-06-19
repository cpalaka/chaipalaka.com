---
id: TASK-019
title: v2 spike — hero-morph transition approach
status: To Do
assignee: []
created_date: '2026-06-19 07:53'
updated_date: '2026-06-19 08:14'
labels:
  - claude-generated
  - v2
  - spike
  - transitions
milestone: v2
dependencies: []
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: high
ordinal: 9010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Throwaway spike choosing the hero-morph mechanism (spec section 10, ADR-0007). There is no ViewTransition in React 19.2.6 stable and no existing morph in web/src. Compare: (a) browser-native document.startViewTransition (no React dep); (b) react experimental ViewTransition (a toolchain-pin change against the vite-react-ssg discipline); (c) the existing canvas/flip.ts FLIP. Verify the chosen approach works under vite-react-ssg prerender + react-router-dom v6 client nav, degrades where unsupported, and preserves focus + SR route-change announcement. Output: chosen mechanism + a minimal proof.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A card-to-box morph runs on a real client navigation under the prod build/prerender
- [ ] #2 Unsupported-browser fallback (no morph, plain nav) verified
- [ ] #3 Focus + SR route-change announcement preserved across the morph
- [ ] #4 Chosen mechanism recorded with rationale
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
