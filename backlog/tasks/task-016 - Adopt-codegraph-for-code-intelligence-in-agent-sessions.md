---
id: TASK-016
title: Adopt codegraph for code-intelligence in agent sessions
status: To Do
assignee: []
created_date: '2026-06-17 22:56'
labels:
  - claude-generated
  - tooling
  - devx
dependencies: []
references:
  - 'https://github.com/colbymchenry/codegraph'
priority: medium
ordinal: 6010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Integrate codegraph (colbymchenry/codegraph) into this repo so Claude Code (and other agents) get a pre-indexed, auto-syncing code knowledge graph instead of grepping/reading files. Reported gains: fewer tokens and tool calls per session via symbol search, call tracing, and impact analysis. 100% local — bundles its own Node runtime, no API keys, no external services; per-project SQLite index lives in a .codegraph/ dir. Strong TypeScript/JSX support (relevant for web/). Setup is three commands: install CLI (curl install.sh or npm i -g @colbymchenry/codegraph), 'codegraph install' to wire the MCP server into Claude Code, then 'codegraph init' at repo root to build the index. Evaluate whether the token/tool-call reduction holds on this codebase before committing the team to it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 codegraph CLI installed and 'codegraph install' has wired its MCP server into Claude Code (MCP tools appear in a session)
- [ ] #2 'codegraph init' run at repo root; index builds without errors and covers web/ TS/TSX sources
- [ ] #3 A sample query (symbol search + call-trace/impact-analysis) returns correct results for a known repo symbol (e.g. PhysicsWorld or CardLayout)
- [ ] #4 .codegraph/ added to .gitignore and confirmed untracked (public repo — the local index must never be committed)
- [ ] #5 NOTES.md updated with install + usage steps for the tool
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
