---
id: TASK-029
title: v2 — external-link annotation cards
status: Done
assignee: []
created_date: '2026-06-19 07:54'
updated_date: '2026-06-21 04:09'
labels:
  - claude-generated
  - v2
  - content
milestone: v2
dependencies:
  - TASK-022
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: low
ordinal: 19010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Authored previews for external (cross-origin) links, which cannot be live-transcluded (spec section 9). An external link is Portal-shaped but its preview is an authored annotation card (title + source + note); enter opens the URL in a new tab; marked visually distinct from internal links. Built after internal transclusion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An external link peeks an authored annotation card (title/source/note) and can be pinned
- [x] #2 Enter opens the external URL in a new tab
- [x] #3 External links are visually distinct from internal Portal/Pocket links
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
External = third ladder link-type (PeekKind/PinKind 'external'); authored annotation derived from the link (note=md link-title, title=link text, source=hostname via externalSourceLabel) — no build plugin/frontmatter/sidecar. Enter=new tab (window.open + native target=_blank), never a morph. peek->pin lifecycle reused unchanged; only the trigger branch, two card render branches, the helper, and CSS are new. Verified in-browser on /test/box (peek/keep/enter). Docs: spec §9 resolved-block, CONTEXT.md (External annotation), PRD ladder line.
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
