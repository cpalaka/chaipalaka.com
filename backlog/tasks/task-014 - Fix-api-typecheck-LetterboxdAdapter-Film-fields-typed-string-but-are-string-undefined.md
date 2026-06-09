---
id: TASK-014
title: >-
  Fix api typecheck: LetterboxdAdapter Film fields typed string but are
  string|undefined
status: In Progress
assignee: []
created_date: '2026-06-09 01:46'
updated_date: '2026-06-09 19:16'
labels:
  - claude-generated
  - bug
dependencies: []
priority: medium
ordinal: 4010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pre-existing api typecheck failure: TS2322 at api/src/adapters/LetterboxdAdapter.ts:90 — letterboxdId is assigned idMatch[1], which is string|undefined under noUncheckedIndexedAccess, but Film.letterboxdId is (correctly) required string. Investigated 2026-06-09: Film's presentational fields (review/posterUrl/year/watchedDate/rating/rewatch) are ALREADY optional in both api and the web mirror (Lifelog.tsx:155-165), and FilmsPanel already guards absence — the original review/posterUrl hypothesis was wrong. Fix: guard/narrow the regex capture group; do not make letterboxdId optional; do not relax tsconfig.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 api/ npm run typecheck passes (tsc --noEmit) with zero errors
- [ ] #2 api/ npm run test stays green
- [ ] #3 Film type reflects which fields are genuinely optional; web consumers handle absent values
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
