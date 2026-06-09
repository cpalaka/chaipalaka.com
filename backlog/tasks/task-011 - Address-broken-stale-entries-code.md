---
id: TASK-011
title: Address broken/stale entries + code
status: Done
assignee: []
created_date: '2026-06-05 07:22'
updated_date: '2026-06-09 01:57'
labels: []
dependencies: []
priority: high
ordinal: 1010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- Half-built/dead: NotesReader + 3 content/notes files have zero production callers — no /notes route exists;
  /api/recent-tracks is served but unconsumed; audio-reactive scene fakes its beat (waiting on now-playing wiring).
  - Known broken: #84 (canvas routes prerender with no card content — registrar runs in useEffect, which renderToString
  skips), #85 (no-JS story).
  - Stale docs: PRD still says vite-ssg, /portfolio, locked/free cards, minimize, NotesChain — ADRs and CONTEXT.md override
  it. api/README + architecture-deepening.md claim the backend doesn't exist; it does. Also FYI: the Hetzner IP is committed
  in PRD.md/grillmedoc.md (docs, not frontend — but it's in git history).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Done. Removed dead notes scaffolding + unconsumed /api/recent-tracks; de-staled PRD/architecture docs; scrubbed Hetzner IP to a placeholder. Audio-reactive beat left as an intentional v1 placeholder. Split #84/#85 to TASK-012, IP history rewrite to TASK-013, api typecheck to TASK-014. Verified web typecheck/test(600)/build + api test(77) green. Squash-merged to main as e0d4959.
<!-- SECTION:NOTES:END -->
