---
id: TASK-015
title: 'Fix pre-existing React #418 hydration mismatch on all canvas routes'
status: To Do
assignee: []
created_date: '2026-06-09 03:28'
labels:
  - claude-generated
  - bug
  - ssr
dependencies: []
priority: medium
ordinal: 5010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Every canvas route (/, /blog, /stuff, /lifelog) throws React error #418 (hydration text-content mismatch) in the prod bundle on load. Confirmed PRE-EXISTING and independent of task-012: stashing the task-012 diff, rebuilding, and reloading shows the identical #418 on main. Discovered during task-012's browser smoke (vite preview + agent-browser 'errors').

The mismatch is on the path common to all canvas routes (it fires on /stuff too, which has no dates), so a component renders client-dependent text during initial render rather than something route-specific. Candidates: the always-rendered children of CanvasLayout — FrameBar, CardLayer, StringLayer, BackgroundCanvas — or anything reading window/viewport/locale at render time.

A hydration mismatch makes React discard the server HTML and regenerate the subtree on the client (perf cost + a flash), and is a latent correctness risk. The no-JS fallback (task-012) is unaffected: its prerendered content still ships.

Diagnosis hint: build with non-minified React (dev mode) to read the exact 'Server: X Client: Y' text, then bisect the CanvasLayout children. See memory project_canvas_hydration_418.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Root cause identified: the component + the specific text that differs server vs client, documented in the task notes
- [ ] #2 No React #418 (nor any hydration error) in the prod-build browser console on /, /blog, /stuff, /lifelog — verified via vite preview + a real browser
- [ ] #3 web/: typecheck + test + build green; no regression to the task-012 no-JS fallback (prerendered fallback still present in dist)
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
