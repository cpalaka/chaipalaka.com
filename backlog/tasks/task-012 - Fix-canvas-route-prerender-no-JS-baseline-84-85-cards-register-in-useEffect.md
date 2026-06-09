---
id: TASK-012
title: >-
  Fix canvas-route prerender + no-JS baseline (#84/#85): cards register in
  useEffect
status: In Progress
assignee: []
created_date: '2026-06-08 23:43'
updated_date: '2026-06-09 02:06'
labels:
  - claude-generated
  - bug
  - ssr
dependencies: []
priority: high
ordinal: 2010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Split out of task-011 (hygiene) because this is a real SSR architecture problem, not cleanup.

Root cause: Card components call registry.register(entry) inside useEffect (web/src/card/Card.tsx:75), which React renderToString skips during prerender. The CardRegistry is therefore empty at SSG time and CardLayer renders no article cards, so every canvas route (/, /blog, /stuff, /lifelog, /test/canvas) ships an empty data-physics-layer div in dist. Plain-mode routes (e.g. /blog/<slug>/read) prerender fully and are unaffected. BackgroundCanvas also returns null during SSR, so no fallback image is emitted either.

Issue #84 = empty card content in prerendered canvas routes. Issue #85 = no-JS users get a blank canvas shell. Same root cause.

Fix options (decide before implementing; needs a design pass):
1. Register cards at render-time, out of useEffect, so SSR sees them. Touches the Card lifecycle (spawning to active to exiting) and physics coupling; highest risk.
2. Thread an SSR-aware CardRegistry through CanvasLayout and pre-populate during prerender.
3. Accept client-only cards plus an explicit no-JS fallback: prerendered prose and the BackgroundScene fallbackPng image, hidden once JS hydrates.
4. Minimal honest baseline: a noscript notice; defer full parity.

Trade-off axis: how much no-JS parity the site demands versus preserving the client-first physics model. Choose the approach in a design or grilling pass first.

Refs: GitHub issues #84 and #85 (v1 record). Evidence: Card.tsx:75, CardRegistry.tsx, CardLayer.tsx, BackgroundCanvas.tsx, and the empty data-physics-layer in web/dist canvas routes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Canvas routes prerender either card content OR a documented graceful no-JS fallback (prose + fallback image); verified in web/dist canvas route HTML
- [ ] #2 Chosen approach recorded (ADR if it changes Card registration or the SSG strategy)
- [ ] #3 GitHub issues #84 and #85 resolved
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
