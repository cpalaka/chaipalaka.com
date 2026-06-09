---
id: TASK-006
title: >-
  vite-plugin-atelier — write-back endpoint + tokens rewriter + physics/layout
  codegen
status: Done
assignee: []
created_date: '2026-06-05 07:02'
updated_date: '2026-06-09 21:47'
labels:
  - claude-generated
  - atelier
  - tooling
  - write-back
milestone: Atelier v1
dependencies:
  - TASK-002
  - TASK-003
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 6
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Dev-serve-only middleware vite-plugin-atelier.ts (same idiom as serveLocalAssets / vite-plugin-feeds in web/vite.config.ts and web/src/blog/): POST /__atelier/write {target, payload} against a hard whitelist — tokens → value-only replacement in web/src/styles/tokens.css preserving comments/order, light values written into BOTH light blocks (media query + [data-theme=light]); physics → whole-file regen of physicsTuning.ts; layout → whole-file regen of web/src/routes/<route>.layout.ts. The chain target (layoutTuning.ts) is registered later by task-009, which creates that file. All-or-nothing: the tokens rewriter must match every requested property or the write is rejected untouched; regen targets validate generated source before writing. Mirrors map: writing a mirrored token (--font-body/--font-mono ↔ web/src/text/fonts.ts; card padding ↔ web/src/routes/blog/BlogIndex.measure.ts CARD_PADDING et al.) returns warnings the panel surfaces — v1 warns, never auto-edits TS; fonts.test.ts drift tests are the backstop. Rewriters/codegen are pure exports tested string-in → string-out (buildRss pattern). Failed write → panel shows the error; working state and files untouched.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Fixture tests: tokens rewrite keeps both light blocks in sync; one unmatched property rejects the whole write
- [x] #2 Codegen round-trip tests: generate → import → deep-equal for physics and layout targets
- [x] #3 Mirror warnings returned for mirrored tokens; non-whitelisted targets refused
- [x] #4 Endpoint absent from production builds (dev-serve only)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
vite-plugin-atelier write-back endpoint merged to main as c1d92ac (squash of feat/task-006-vite-plugin-atelier). 30 tests: light-block sync + all-or-nothing, codegen round-trips + byte-identical regen, mirror warnings + whitelist refusal, dev-serve-only (zero __atelier in dist, re-verified post-merge). Dark edits get symmetric sync beyond spec; Lifelog/Stuff.layout.ts whitespace-aligned to generator. CONTEXT.md: Write-back target entry. Verified post-merge: typecheck 0, 674 tests green, build + prerender, secret grep clean. Chai sign-off 2026-06-09.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
