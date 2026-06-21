---
id: TASK-026
title: v2 — per-route resting state + sitemap rollout
status: Done
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-21 00:11'
labels:
  - claude-generated
  - v2
  - content
milestone: v2
dependencies:
  - TASK-020
  - TASK-022
  - TASK-023
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: medium
ordinal: 16010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Roll v2 across the site (spec sections 7/8). Add the per-route resting-state field to the PageDef (quiet = box + inline links only; populated = cards already strung on arrival). Apply route archetypes: home = bespoke landing in v2 language (populated, balloons, ladder-links to sections); blog/lifelog/about = content-box (quiet); /stuff/flash + 404 = bespoke. Balloons vs cards = per-route cardinal gravity (up/down). Build on v1 card styling, token-separable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 PageDef declares per-route resting state (quiet/populated); both render correctly
- [x] #2 Home loads as a populated bespoke landing; blog/about rest quiet; /stuff + 404 keep bespoke treatment
- [x] #3 A populated route shows the ambient-teacher effect (a pinned card visible on arrival)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Heartland-first rollout (Chai-approved trim 2026-06-20): shipped resting-state field + ambient-teacher mechanism, home populated landing, /blog index list + /blog/:slug content-box; /stuff + 404 unchanged-bespoke. AC#2 'about' + lifelog deferred to task-034 / task-033. Verified: typecheck/736 tests/build+prerender/secret-scan + agent-browser. layout/sectionLayout.ts + PageSpec.sections now prod-unused but kept (Atelier layoutOverride infra).
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
