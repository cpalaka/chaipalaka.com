---
id: TASK-047
title: >-
  prod-v1 — deploy dry-run: apply Caddyfile, deploy-web, assets-sync, verify
  live
status: To Do
assignee: []
created_date: '2026-07-29 01:42'
updated_date: '2026-07-29 01:42'
labels:
  - claude-generated
  - prod-v1
  - ops
milestone: prod-v1
dependencies: []
documentation:
  - docs/process/launch-checklist.md
  - docs/plan/workstream-ops.md
  - docs/adr/0013-canonical-host-and-hard-404.md
priority: high
ordinal: 40010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Carried from task-044 AC#6, which was deferred and closed unchecked (task-044 is Done; the box was never touched). This is the FIRST deploy since task-044 changed how every route ships, so it is not a routine deploy.

EVERY step here is confirm-first and human-gated: make deploy-web, make assets-sync, any ssh chaipalaka, any rsync whose destination is the server. Modifying anything under deploy/ that affects production is propose-then-apply.

ORDERING IS LOAD-BEARING. deploy/Caddyfile on main is NOT on the box. It must be applied BEFORE the next deploy-web: the new build 404s the dev routes and ships a /404 document that only works with the handle_errors block, so deploying the build against the old bare file_server serves Caddy's default 404 for every stripped route and never reaches the bespoke 404.

WHY IT MATTERS BEYOND HYGIENE: this settles the one genuinely open flash question. Whether make assets-sync has ever been RUN against the box is unknown in both directions and not answerable from the repo — assets/ is 33 MB and gitignored by design under the >1 MB rule, so a git-tree check proves nothing (that exact mistake produced a false launch-critical defect once already). WP-09's sizing depends on the answer, and TRIGGER-G fires CUT-3 on 2026-09-06.

Plan: docs/plan/workstream-ops.md WP-02 item 5 and WP-14. Full live checks: docs/process/launch-checklist.md. Decision record: docs/adr/0013-canonical-host-and-hard-404.md.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Caddyfile applied to the box FIRST, before any deploy-web: deploy/Caddyfile copied to /etc/caddy/Caddyfile, 'sudo caddy validate --config /etc/caddy/Caddyfile' run and clean, then 'sudo systemctl reload caddy'. Proposed to Chai and applied only after agreement.
- [ ] #2 make deploy-web run against the box, human-gated, after the Caddyfile is live.
- [ ] #3 make assets-sync run against the box, human-gated, with the existing 33 MB payload.
- [ ] #4 FLASH PIPELINE SETTLED: curl -s -o /dev/null -w '%{http_code}' https://chaipalaka.com/assets/ruffle/nightly-2026-05-12/ruffle.js returns 200, and one .swf actually plays through RuffleEmbed on the live host. Record the answer on the flash-ingest task when it is created at the M3 checkpoint (O4 is already answered: all .swf).
- [ ] #5 task-044's deferred live-host halves pass: an unknown URL returns the app markup (grep data-server-rendered) AND a 404 status, not Caddy's default page; and https://www.chaipalaka.com/blog/ 301s to the apex with the path preserved.
- [ ] #6 The task-044 review fixes hold in production, not just against local Caddy: /404/ returns 404 (not 200); /blog/<no-such-post>/ and /stuff/flash/<no-such>/ return 404 AND visibly say the page does not exist while keeping the requested URL; /test/* and /sandbox/* all 404; every URL in sitemap.xml returns 200 with no redirect; /robots.txt is served.
- [ ] #7 No hydration error in a real browser on a live 404 — check the agent-browser errors buffer, not just the console (prod React errors land there).
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
