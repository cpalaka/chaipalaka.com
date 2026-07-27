---
id: TASK-046
title: 'prod-v1 — launch content authoring wave 1 (bio, blog draft decision)'
status: To Do
assignee: []
created_date: '2026-07-27 01:37'
labels:
  - claude-generated
  - prod-v1
  - content
milestone: prod-v1
dependencies: []
priority: high
ordinal: 39010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M1-M2, about 11 h. THE WORDS. This stream is CHAI-ONLY SERIAL TIME — Claude can draft scaffolding and checklists, but the bio, route intros and retrospective notes are the owner voice. It is therefore the stream most likely to SILENTLY STARVE, and it is scheduled EARLIEST, not last.

VERIFIED STARTING POSITION (main at 1d5bed6, 2026-07-26): content/blog holds 5 posts of which 4 are draft:true, so production /blog lists exactly ONE post (Hello, World). content/stuff/flash holds 4 entries against a stated ~40. /about has no route and no copy. /claude has ~15 documents named and none in the repo. Brief A4 bar is "all the routes that exist currently filled in with all the content" — that reads very differently against one live blog post.

OPEN ASSUMPTION (decision O2, brief §6.9, unanswered): whether Chai prose-writing time comes out of the 133 h. This plan assumes it DOES — the conservative reading — and books 11 h. If it does not, the build budget gains 11 h and CUT-4 stands down. Answerable in one sentence; forcing date 2026-08-02.

Plan: docs/plan/workstream-content.md WP-06.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 AUTHORING CHECKLIST built first, in M1, and it is the STARVATION DETECTOR: bio prose, per-route intros (/stuff, /lifelog, the /claude index blurb), lifelog card copy and empty/stale states, and the four draft:true blog posts. By the M2 exit (2026-08-30) every item is DONE or EXPLICITLY CUT via CUT-4/CUT-6 — no silent starvation. That check turns "we ran out of time to write" from a launch-day discovery into a checkpoint decision.
- [ ] #2 BIO PROSE for /about authored, with at least two real Portal links in it. This is on TASK-034 critical path — its Portal-links AC needs real prose, not lorem. CUT-6 reduces this to one strong paragraph without losing the route or the links.
- [ ] #3 BLOG DRAFT DECISION EXECUTED: each of the four draft:true posts is either finished and published, or explicitly cut onto a written post-launch list. Verify: grep -rln for draft:true in content/blog matches only posts on that list. CUT-4 publishes 1-2 rather than 5 — writing does not compress under deadline pressure, it just gets worse, and a launch with two good posts and a live site beats one with five rushed ones.
- [ ] #4 Uses the EXISTING pipelines only — co-located post dirs (content/blog/yyyy-mm-dd-slug/index.mdx), zod-validated frontmatter, draft:true excluded from production builds, and the shipped MDX component library (Callout, Figure, Video, NowPlaying, BookCard, RuffleEmbed). NO new content infrastructure for prod-v1.
- [ ] #5 PUBLIC-REPO HYGIENE: content is repo content. The secret-scan covers the mechanical half; the judgement half is a read-through for anything personal, half-finished, or bad out of context.
- [ ] #6 Answer decision O2 at the 2026-08-02 checkpoint and record it here: is prose time inside the 133 h or outside? It moves plus or minus 11 h and decides whether CUT-4 fires.
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
