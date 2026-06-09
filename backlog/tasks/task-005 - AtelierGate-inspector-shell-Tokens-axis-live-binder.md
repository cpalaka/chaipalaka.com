---
id: TASK-005
title: AtelierGate + inspector shell + Tokens axis (live binder)
status: Done
assignee: []
created_date: '2026-06-05 07:02'
updated_date: '2026-06-09 23:57'
labels:
  - claude-generated
  - atelier
  - ui
  - tokens
milestone: Atelier v1
dependencies:
  - TASK-001
  - TASK-004
references:
  - docs/superpowers/specs/2026-06-04-atelier-design-tool-design.md
ordinal: 5
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Mounting: CanvasLayout mounts <AtelierGate> — renders null in prod (import.meta.env.DEV guard + React.lazy so the chunk never ships); in dev shows a corner toggle that opens the inspector on whatever route is active. Shell: full-height right-docked panel, tabs per axis (Tokens / Physics / Layout), collapsible; working-set controls (set picker, save, write-back button with dirty indicator) in the panel footer; widgets auto-generated from TuningSchema. Tokens axis: hand-curated atelier/schemas/tokens.ts mapping tunable custom properties in web/src/styles/tokens.css to widgets with ranges (groups: palette, card chrome, typography, spacing). Theme-aware: the panel's theme switch drives the production ThemeController (web/src/controls/theme.ts) — no parallel theming mechanism (the cards-sandbox mistake, not repeated); working state stores values per theme, edits apply to the active theme. Live binder: documentElement.style.setProperty(token, value); revert = removeProperty. Write-back wiring to the endpoint lands with task-006. Existing /sandbox/* surfaces stay untouched.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dev: corner toggle opens the docked inspector on any active route; collapsible
- [x] #2 Token edits apply live on a real route; per-field revert removes the inline property
- [x] #3 Theme switch drives ThemeController; panel shows and edits the active theme's values
- [x] #4 Prod build ships no Atelier code (manual chunk inspection; automated guard is task-010)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Merged to main as da673b9 (squash of feat/task-005-inspector-shell-tokens-axis). All four ACs browser-verified on /blog with screenshots reviewed by Chai mid-session: corner toggle + collapsible docked inspector; live token edits with dirty-only inline application and per-field revert (removeProperty); theme switch drives production ThemeController with per-theme palette axes; prod chunk grep shows zero atelier bytes. Approved deviations ratified in CONTEXT.md ('Base token') + spec doc: 3 token axes (tokens.base/dark/light), v1 excludes --color-accent/shadows/rgba tokens/font families, write-back wired live against the task-006 endpoint with optimistic Baseline adoption + mirror warnings. Full gate green: typecheck/test (692)/build/prerender + secret grep.
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
