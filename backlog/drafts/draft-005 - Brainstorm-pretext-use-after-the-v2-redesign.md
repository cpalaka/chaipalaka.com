---
id: DRAFT-005
title: Brainstorm pretext use after the v2 redesign
status: Draft
assignee: []
created_date: '2026-06-19 08:18'
labels:
  - claude-generated
  - pretext
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Brainstorm how to use @chenglou/pretext on the site after the v2 redesign lands. Pretext is a text measurement/layout library, NOT animation (see memory feedback_verify_repo_reuse_claims_in_specs); v2 uses it only for word geometry/anchor placement. Parked use-cases from the 2026-05-13 survey (memory project_pretext_use_cases): (alpha) prose-reflows-around-cards, (beta) title-routes-around-cards, (gamma) particle-glyph transition primitive, (delta) Knuth-Plass justification for blog body text, (epsilon) rich-text metadata pills for lifelog. Revisit which (if any) earn a place once v2's content box + link ladder exist.
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
