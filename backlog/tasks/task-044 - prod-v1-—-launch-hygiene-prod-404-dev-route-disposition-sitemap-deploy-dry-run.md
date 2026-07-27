---
id: TASK-044
title: >-
  prod-v1 — launch hygiene: prod 404, dev-route disposition, sitemap, deploy
  dry-run
status: To Do
assignee: []
created_date: '2026-07-27 01:37'
labels:
  - claude-generated
  - prod-v1
  - ops
milestone: prod-v1
dependencies: []
priority: high
ordinal: 37010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M0 (exit 2026-08-02), about 8 h. Four launch-visible defects plus one dry run, batched because they touch the same two files (deploy/Caddyfile, web/vite.config.ts) and the same human gate. THREE of the four were found by direct inspection of main at 1d5bed6 on 2026-07-26 — they appear on no board item, in no ADR, and in no line of the planning brief.

EVERY server touch is confirm-first and human-gated (make deploy-web, make assets-sync, ssh chaipalaka, any rsync to the box). Modifying anything under deploy/ that affects production is PROPOSE-THEN-APPLY.

Plan: docs/plan/workstream-ops.md WP-02, open-questions.md T7/T11.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 PROD 404, BOTH HALVES. deploy/Caddyfile has a bare file_server and ZERO handle_errors blocks, so an unknown URL returns Caddy default 404. AND there is no 404 page to serve: a fresh build emits 19 pages and none is a 404 — vite-react-ssg never prerenders the splat route, which exists in App.tsx as a client route only. Fix both: emit a static 404 from SSG, and add the Caddy block that routes to it. Verify: ls web/dist/404.html or web/dist/404/index.html succeeds, AND a live-host curl of an unknown URL returns the app markup (grep for data-server-rendered), not Caddy default page.
- [ ] #2 TRY_FILES FALLBACK. file_server has no try_files, so any client-only route returns Caddy 404 in production — which is why /sandbox/cards (filtered out of prerender but still a client route) is already dead in prod today, by accident rather than design. Add the fallback, or record the deliberate decision not to.
- [ ] #3 DEV-ROUTE DISPOSITION executed per Chai ruling (decision O5). web/vite.config.ts includedRoutes filters only on sandbox paths, so /test/canvas, /test/plain, /test/box, /test/box-b, /lab and /sandbox/scenes/* all ship as REAL STATIC DIRECTORIES — confirmed against a fresh build. Plan default, applies if Chai does not rule: strip the four /test/* routes and both /sandbox/* routes from the prerender set (keeping them reachable in npm run dev — /test/box and /test/box-b remain the ratified ladder + nested-card demo surface, drift spec D1), and KEEP /lab public (an ADR-0011-ratified art surface, the only place the metaball auras are visible, and exactly the admire-the-site material brief A5 asks for). Verify: ls web/dist/test web/dist/sandbox absent for every route ruled hide.
- [ ] #4 SITEMAP covers the real public route set. web/src/blog/vite-plugin-feeds.ts buildSitemap hardcodes staticRoutes as slash and slash-blog only, so the emitted sitemap carries exactly 4 URLs and omits /lifelog, /stuff, /stuff/flash, /lab — and will omit /about and /claude once they exist. On a launch whose point is real URLs and real shareability, half the site is invisible to crawlers. Derive the list from the real route set and ADD A TEST. Verify: grep -c for loc in dist/sitemap.xml is at least the public route count, and grep -c for /test/ or /sandbox/ is 0.
- [ ] #5 CANONICAL HOST agreed and applied. The Caddy site block serves chaipalaka.com AND www.chaipalaka.com with no redirect between them, while vite.config.ts sets the feed/sitemap baseUrl to the apex and make deploy-web echoes www. Duplicate content on two hostnames with no agreed canonical. Pick one, redirect the other, make baseUrl match.
- [ ] #6 DEPLOY DRY-RUN, human-gated, end-to-end against the real box: make deploy-web plus make assets-sync with the existing payload. This settles the one genuinely open flash question. NOTE: the claim that assets/ does not exist and that assets-sync has never carried a payload is FALSE — it was checked against the git tree, where assets/ is gitignored BY DESIGN per the >1 MB rule. assets/ holds 33 MB including assets/ruffle/nightly-2026-05-12, exactly the version RuffleEmbed.tsx:3 requests. What is unknown is whether assets-sync has ever been RUN against the box. Verify: curl the live host for /assets/ruffle/nightly-2026-05-12/ruffle.js and expect 200.
- [ ] #7 docs/process/launch-checklist.md drafted, covering RSS validity, sitemap vs the real route set, OG tags per route, no-JS floor per content-box route, reduced-motion pass, /api/* liveness, secret-scan, and the data-server-rendered prerender check. It is executed in M4, not here.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
- [ ] #7 Any deploy/ change is proposed to Chai and applied only after agreement. Any Caddyfile edit is followed by caddy validate before reload.
<!-- DOD:END -->
