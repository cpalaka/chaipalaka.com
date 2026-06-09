---
id: TASK-015
title: 'Fix pre-existing React #418 hydration mismatch on all canvas routes'
status: Done
assignee: []
created_date: '2026-06-09 03:28'
updated_date: '2026-06-09 20:22'
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
- [x] #1 Root cause identified: the component + the specific text that differs server vs client, documented in the task notes
- [x] #2 No React #418 (nor any hydration error) in the prod-build browser console on /, /blog, /stuff, /lifelog — verified via vite preview + a real browser
- [x] #3 web/: typecheck + test + build green; no regression to the task-012 no-JS fallback (prerendered fallback still present in dist)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause (AC #1, confirmed 2026-06-09 via dev-React build with exact server/client text diff): FrameBar.tsx rendered useLocation().pathname as a text node in span.frame-bar__current-page. SSG bakes the slash-less path into prerendered HTML (server: /stuff) while production Caddy file_server 308-redirects /stuff → /stuff/ (verified live: HTTP/2 308, location: /stuff/), so the client renders /stuff/ — text mismatch → React #418 on /blog/, /stuff/, /lifelog/. A second, preview-only mismatch: vite preview serves dist/index.html (Home prerender) as SPA fallback for slash-less /stuff — structure mismatch (client frame-bar header vs server data-nojs-fallback div); production never hits this path because Caddy redirects first. Correction to the description: / never had a hydration error — the 'all 4 routes' report was a measurement artifact (agent-browser's error buffer accumulates across navigations and errors --clear is a no-op; prod React #418 surfaces via reportError, not console). Fix (commit 7f3f8ad on fix/task-015-canvas-hydration-418): FrameBar strips trailing slashes from pathname once at the top; regression test renders at /stuff/ expecting /stuff; previewDirRedirect() middleware in vite.config.ts mirrors Caddy's 308 so local preview behaves like prod.

Diff approved by Chai 2026-06-09; squash-merged to main as 7fd1e4e (branch commit 7f3f8ad) and pushed. Post-merge verification green: web typecheck exit 0 + 627 passed/1 skipped + build finished; data-server-rendered and nojs-fallback both present in dist/index.html; secret-leak grep zero matches. DoD #3 N/A (bugfix, no new domain language). Awaiting explicit Done sign-off.
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
