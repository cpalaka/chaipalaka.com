---
id: TASK-044
title: >-
  prod-v1 — launch hygiene: prod 404, dev-route disposition, sitemap, deploy
  dry-run
status: Done
assignee: []
created_date: '2026-07-27 01:37'
updated_date: '2026-07-29 01:16'
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
- [x] #1 PROD 404, BOTH HALVES. deploy/Caddyfile has a bare file_server and ZERO handle_errors blocks, so an unknown URL returns Caddy default 404. AND there is no 404 page to serve: a fresh build emits 19 pages and none is a 404 — vite-react-ssg never prerenders the splat route, which exists in App.tsx as a client route only. Fix both: emit a static 404 from SSG, and add the Caddy block that routes to it. Verify: ls web/dist/404.html or web/dist/404/index.html succeeds, AND a live-host curl of an unknown URL returns the app markup (grep for data-server-rendered), not Caddy default page.
- [x] #2 TRY_FILES FALLBACK. file_server has no try_files, so any client-only route returns Caddy 404 in production — which is why /sandbox/cards (filtered out of prerender but still a client route) is already dead in prod today, by accident rather than design. Add the fallback, or record the deliberate decision not to.
- [x] #3 DEV-ROUTE DISPOSITION executed per Chai ruling (decision O5). web/vite.config.ts includedRoutes filters only on sandbox paths, so /test/canvas, /test/plain, /test/box, /test/box-b, /lab and /sandbox/scenes/* all ship as REAL STATIC DIRECTORIES — confirmed against a fresh build. Plan default, applies if Chai does not rule: strip the four /test/* routes and both /sandbox/* routes from the prerender set (keeping them reachable in npm run dev — /test/box and /test/box-b remain the ratified ladder + nested-card demo surface, drift spec D1), and KEEP /lab public (an ADR-0011-ratified art surface, the only place the metaball auras are visible, and exactly the admire-the-site material brief A5 asks for). Verify: ls web/dist/test web/dist/sandbox absent for every route ruled hide.
- [x] #4 SITEMAP covers the real public route set. web/src/blog/vite-plugin-feeds.ts buildSitemap hardcodes staticRoutes as slash and slash-blog only, so the emitted sitemap carries exactly 4 URLs and omits /lifelog, /stuff, /stuff/flash, /lab — and will omit /about and /claude once they exist. On a launch whose point is real URLs and real shareability, half the site is invisible to crawlers. Derive the list from the real route set and ADD A TEST. Verify: grep -c for loc in dist/sitemap.xml is at least the public route count, and grep -c for /test/ or /sandbox/ is 0.
- [x] #5 CANONICAL HOST agreed and applied. The Caddy site block serves chaipalaka.com AND www.chaipalaka.com with no redirect between them, while vite.config.ts sets the feed/sitemap baseUrl to the apex and make deploy-web echoes www. Duplicate content on two hostnames with no agreed canonical. Pick one, redirect the other, make baseUrl match.
- [ ] #6 DEPLOY DRY-RUN, human-gated, end-to-end against the real box: make deploy-web plus make assets-sync with the existing payload. This settles the one genuinely open flash question. NOTE: the claim that assets/ does not exist and that assets-sync has never carried a payload is FALSE — it was checked against the git tree, where assets/ is gitignored BY DESIGN per the >1 MB rule. assets/ holds 33 MB including assets/ruffle/nightly-2026-05-12, exactly the version RuffleEmbed.tsx:3 requests. What is unknown is whether assets-sync has ever been RUN against the box. Verify: curl the live host for /assets/ruffle/nightly-2026-05-12/ruffle.js and expect 200.
- [x] #7 docs/process/launch-checklist.md drafted, covering RSS validity, sitemap vs the real route set, OG tags per route, no-JS floor per content-box route, reduced-motion pass, /api/* liveness, secret-scan, and the data-server-rendered prerender check. It is executed in M4, not here.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PARKED OPEN DECISION O4 — .swf vs video for the ~40 flash items (brief Q7, never answered; docs/plan/open-questions.md T11). Recorded HERE because the flash-ingest task is M4 and is created at its own checkpoint under rolling-wave discipline, so until it exists this question has no board home — and it has a forcing date of 2026-09-06, with TRIGGER-G firing CUT-3 if the source media is not locatable and format-classified by then.

The fork is real: .swf plays through the shipped, tested RuffleEmbed component; video files do not and need a different component AND a different route treatment (about +6 h). The four items that exist in assets/ are .swf, which is evidence but not an answer for the other ~36. About 100 MB across ~40 items is ~2.5 MB each, plausible for either.

ACTION FOR THIS TASK: the M0 deploy dry-run is the natural moment to ask it, since it already touches assets/ and make assets-sync. Surface the question to Chai then, and carry the answer forward onto the flash-ingest task when it is created at the M3 checkpoint. Risk R5: the media may not exist in usable form at all, in which case /stuff/flash is re-scoped honestly to the four pieces it has rather than promised and missed.

POINTER from task-043 sweep 2026-07-28: two OPEN GitHub issues duplicate this task's scope and are the only prior record of it — read them before designing, and close them against this task rather than as generic v1-archive. #64 'Redesign 404 page (deferred from masonry refactor)' overlaps the bespoke-404 half; #50 'Slice 29: Sandbox cleanup — remove /sandbox/cards prototype' overlaps the dev-route disposition half and may already carry the intended strip decision. #24 'Slice 24: Lifelog feed view + 404 + per-page OG metadata' straddles this task and task-033. Triage is task-032's job but the content is this task's input. Also: gh READ calls fail TLS in the sandbox (OSStatus -26276), not just writes — use dangerouslyDisableSandbox per call.

O4 ANSWERED 2026-07-28 (Chai, during task-044): the flash catalogue is ALL .swf — not just the four items held in assets/. Consequence: everything plays through the shipped, tested RuffleEmbed; no second component, no separate route treatment, and none of the ~6 h the video branch would have cost. WP-09 keeps its sized shape.

NOT retired by this: TRIGGER-G and risk R5. Format was only half of Q7 — whether the ~36 unheld items are LOCATABLE is still open, and TRIGGER-G still fires CUT-3 on 2026-09-06 if they are not in hand by then. CARRY THIS RULING onto the flash-ingest task when it is created at the M3 checkpoint (that task has no board home yet under rolling-wave discipline). Recorded in docs/plan/open-questions.md T11/O4 and workstream-content.md WP-09.

O5 ANSWERED 2026-07-28 (Chai): plan default confirmed — strip /test/* and /sandbox/* from the prerender set (still reachable under npm run dev), keep /lab public. Executed on this branch; ratified by ADR-0013.

ADR NUMBERING: this task's ADR is 0013, NOT 0012 — docs/plan (workstream-build, work-pieces, risk-cut-register) already cite ADR-0012 as the M1 lifelog composed-canvas mechanism gate, which is task-033's to write.

GITHUB ISSUE TRIAGE (task-032's call, no gh writes made): #50 is NOT satisfied by this branch — it asks to DELETE web/src/sandbox/cards/, which still exists; this task only stopped shipping the route. #64 is a 404 VISUAL redesign (hand-placed anchors, composition) and is also not delivered here; its 'gravity: up + parent: floor topology stays' premise is stale under ADR-0010. Recommend triaging both rather than closing them against task-044.

CODE REVIEW 2026-07-28 (standards + spec + completeness critic + counter-critic, all Opus). Found 5 real defects in the first cut, all reproduced then fixed in 0465eb5. Root cause of three of them: the first pass was verified only against URLs matching NO route, never a URL matching a route with an unknown PARAM.

STANDING OBLIGATION for future work — every :param route needs its own not-found branch. Caddy always serves the 404 shell for a miss, but the CLIENT router still resolves /blog/<typo> to BlogPostReader, so that component decides what the visitor sees. 'return null' rendered a blank content box; FlashDetail's <Navigate> discarded the typed URL under a 404. Nothing enforces this. Wording lives in web/src/routes/notFoundCopy.ts. Recorded in ADR-0013.

Also fixed: /404 answered 200 (soft 404, indexable) -> Caddy forces the status + robots.txt added; data-active nav highlight carried the same hydration hazard as the path indicator but SILENTLY (React never reconciles attributes at hydration, so no #418 is logged and the wrong value persists for the life of the page); sitemap listed the slash-less form that Caddy 301s, failing this task's own launch-checklist 'no redirects' line; a test actively blessed an empty sitemap as well-formed.

Deliberate judgement call against a review suggestion: TUNABLE_SCENE_IDS kept and documented rather than deleted — its production consumer went with the sandbox prerender, but it is the iteration source for the registry's tunable-module tests and entry.tunable is still live in scenes.test.ts.

NOTE: a review subagent ran 'rm -rf web/content' unprompted (a temp fixture it had created). No damage — content/ intact, tree clean, verified.

CLOSED 2026-07-28, Chai signed off the diff.

AC#6 IS DEFERRED, NOT DONE — left deliberately unchecked. The deploy dry-run (make deploy-web + make assets-sync against the real box, ending in the live-host curl for /assets/ruffle/nightly-2026-05-12/ruffle.js) was never run: Chai chose 'review diff first' and the box was never touched. THE FLASH-PIPELINE QUESTION IT EXISTS TO SETTLE IS THEREFORE STILL OPEN — whether assets-sync has ever been run against the box is still unknown in both directions, exactly as WP-09 records. It needs a home in M4 (WP-14) or its own task; docs/process/launch-checklist.md sections 4 and 5 carry the checks themselves.

Also unapplied by design: deploy/Caddyfile is changed in the repo but NOT on the box. It validates locally (caddy 2.11.4, 'Valid configuration') and was exercised against a real Caddy serving dist/, but /etc/caddy/Caddyfile is untouched. Applying it is propose-then-apply and must be followed by caddy validate before reload. NOTE THE ORDERING: the Caddyfile must land BEFORE the next deploy-web, or the newly-404ing dev routes and the new /404 document hit the old bare file_server with no handle_errors.

Shipped: prerendered /404 served with a real 404 status; no SPA fallback; /stuff/flash/:slug prerendered so nothing public is client-only; /test/* and /sandbox/* dropped from the build (still live under npm run dev), /lab public; sitemap derived from the App.tsx route tree, 4 -> 12 URLs, all returning 200; apex canonical with www 301; robots.txt; ADR-0013; docs/process/launch-checklist.md drafted for M4 execution.

PRECISION on the checked ACs: #1 and #5 are checked for the FIX, which is implemented and verified end-to-end against a real Caddy 2.11.4 serving dist/ locally. Their live-host halves (AC#1's 'curl the live host for an unknown URL', AC#5's 'applied') ride on the same deferred deploy as AC#6 and are re-listed in docs/process/launch-checklist.md section 1 for M4.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
- [x] #7 Any deploy/ change is proposed to Chai and applied only after agreement. Any Caddyfile edit is followed by caddy validate before reload.
<!-- DOD:END -->
