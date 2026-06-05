---
id: TASK-001
title: TuningSchema extensions (enum/boolean/group) + widget components
status: To Do
assignee: []
created_date: '2026-06-05 07:01'
labels:
  - claude-generated
  - atelier
  - dsl
milestone: Atelier v1
dependencies: []
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 1
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Generalize the SceneParamSchema DSL (web/src/canvas/scenes/paramSchema.ts, ADR-0003) into the Atelier TuningSchema. New field kinds: enum, boolean, group (existing: number, range, color). Panel widgets are auto-generated from the schema, same pattern as web/src/sandbox/particles/TunePanel.tsx. Every tunable — token fields, physics fields, chain-layout fields — is declared in a schema.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 defaultsOf/fieldsOf tests for enum/boolean/group pass alongside paramSchema.test.ts
- [ ] #2 Widget components render from a schema using all six field kinds
- [ ] #3 Existing SceneParamSchema consumers unaffected (typecheck + existing tests green)
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
