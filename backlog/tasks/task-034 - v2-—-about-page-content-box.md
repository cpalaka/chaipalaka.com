---
id: TASK-034
title: v2 — about page (content-box)
status: To Do
assignee: []
created_date: '2026-06-21 00:02'
updated_date: '2026-07-28 21:19'
labels:
  - claude-generated
  - v2
  - content
  - prod-v1
milestone: prod-v1
dependencies:
  - TASK-026
  - TASK-046
priority: high
ordinal: 24010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create the greenfield /about route as a quiet content-box (spec §8). No route, component, or copy exists today — fully net-new (route entry + component + authored bio prose with Portal links). Deferred from task-026 (Heartland-first scope, 2026-06-20). Needs an authoring decision on the bio copy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 /about route exists under ContentBoxLayout as a quiet content-box (resting: 'quiet'), prerendered
- [ ] #2 Bio prose authored with Portal links; peek/keep fires on them inside the box
- [ ] #3 web/: typecheck + test + build green; prerendered no-JS floor present (data-server-rendered)
- [ ] #4 Verify dist/about/index.html contains BOTH the authored bio text and data-server-rendered. Note: a component-level import of its own .css code-splits and never loads for no-JS, so anything the pre-hydration floor needs belongs in base.css.
- [ ] #5 Bio depth is elastic and CUT-6 reduces it to one strong paragraph without losing the route or AC#2 — one paragraph still carries two Portal links. Bio prose is Chai serial writing time, tracked in the content-authoring task, and is on this task critical path.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
SWEEP VERDICT 2026-07-28 (task-043): LIVE — confirmed fully net-new. No About route component exists under web/src/routes/, and the only /about string anywhere in web/src is an assertion inside peek/peekContent.test.ts that resolvePortalLead('/about', posts) returns null. So there is no route entry, no component and no copy — the description is accurate.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
- [ ] #7 Pre-merge adversarial review after the verify gate is green, before diff review: .claude/workflows/adversarial-review.js with {mode: "modest", task: "task-034", diffRange: "main...HEAD", specSections: "v2 spec §8 route table; ADR-0004; ADR-0008 progressive-enhancement contract"}. Relay ALL findings verbatim; never self-dismiss one.
<!-- DOD:END -->
