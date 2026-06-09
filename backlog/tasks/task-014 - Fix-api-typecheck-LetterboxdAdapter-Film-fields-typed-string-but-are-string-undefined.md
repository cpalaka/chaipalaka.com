---
id: TASK-014
title: >-
  Fix api typecheck: LetterboxdAdapter Film fields typed string but are
  string|undefined
status: To Do
assignee: []
created_date: '2026-06-09 01:46'
labels:
  - claude-generated
  - bug
dependencies: []
priority: medium
ordinal: 4010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Pre-existing (predates task-011), surfaced during task-011 verification: api typecheck (tsc --noEmit in api/) fails at api/src/adapters/LetterboxdAdapter.ts:90.

One or more Film fields populated from optional sources (e.g. review via extractReview, posterUrl via extractPoster, both derived from an optional RSS description) are string | undefined, but the Film type declares them as string. TS2322.

Likely fix: make the genuinely-optional Film fields optional (review?: string, posterUrl?: string) rather than forcing non-null, and update consumers (web Lifelog films panel) to handle absence. Confirm whether year / watchedDate / rating have the same latent issue.

Scope note: api typecheck is currently red; this is the only error. Web typecheck is green.
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
