---
id: TASK-016
title: Adopt codegraph for code-intelligence in agent sessions
status: Done
assignee: []
created_date: '2026-06-17 22:56'
updated_date: '2026-06-18 03:30'
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
- [x] #1 codegraph CLI installed and 'codegraph install' has wired its MCP server into Claude Code (MCP tools appear in a session)
- [x] #2 'codegraph init' run at repo root; index builds without errors and covers web/ TS/TSX sources
- [x] #3 A sample query (symbol search + call-trace/impact-analysis) returns correct results for a known repo symbol (e.g. PhysicsWorld or CardLayout)
- [x] #4 .codegraph/ added to .gitignore and confirmed untracked (public repo — the local index must never be committed)
- [x] #5 NOTES.md updated with install + usage steps for the tool
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Trial install on branch chore/task-016-adopt-codegraph. AC#2/3/4/5 verified; AC#1 wired but MCP tools require a Claude Code restart to appear (cannot self-verify in-session). Decisions: curl installer (CLI -> ~/.codegraph + ~/.local/bin), --location local (project .mcp.json), telemetry off. Committed footprint is ONLY .gitignore (+.codegraph/ +.mcp.json); .mcp.json/.codegraph/NOTES.md/.claude/CLAUDE.md all gitignored/per-machine by design. Index: 249 files, 2320 nodes, 7530 edges. Sample queries on PhysicsWorld: query/callers(15)/impact(144) all correct vs grep. DoD: typecheck+test(754 pass)+build+prerender green; secret grep zero. Open item for Chai: codegraph install also dropped .claude/CLAUDE.md (generated agent hint, gitignored) - keep or remove?

EVAL DONE (2026-06-17, post-restart).
AC#1 VERIFIED: codegraph MCP tools appear in-session AND return correct results (PhysicsWorld @ web/src/physics/PhysicsWorld.ts:55, accurate caller trail).
SAVINGS A/B (in-session Workflow: 6 structural Qs x {grep-only baseline vs codegraph-only arm}, impartial judge establishes ground truth): baseline 37 tool calls vs codegraph 30 = 19pct fewer (NOT the ~58pct reported upstream). Correctness: baseline 6/6, codegraph 5/6 (q3 impact = partial). codegraph wins call-count on q1-locate/q2-callers/q4-flow/q6-behavior; baseline wins q3 (codegraph impact/affected OVER-REPORTS: flagged CardImpl/StringLayer as Tether dependents but Tether types do not leak through their props interfaces - structural blast-radius is an upper bound, needs interface-level pruning) and q5 (dir survey: grep-extract-imports 6 calls beat codegraph 9).
CAVEAT: measured tool-call count + correctness, NOT token bytes; codegraph per-call curated-source token advantage is plausible but unmeasured here.
DoD gate re-run GREEN: typecheck pass; vitest 754 pass / 1 skip (95 files); build 16 pages prerendered; data-server-rendered present; secret-grep clean. Committed footprint unchanged: only .gitignore.
DoD#3 = N/A (dev tooling, no new domain language; adoption trivially reversible so not ADR-worthy).
RECOMMENDATION: KEEP (near-zero committed cost + modest-but-real benefit, clear win on flow/locate/callers queries); treat impact/affected as a starting set and verify interfaces.
PENDING: Chai sign-off (DoD#6) + decisions: (a) keep gitignored curated .claude/CLAUDE.md codegraph hint? (b) commit codegraph guidance into tracked root CLAUDE.md so it travels to clones, or keep per-machine?

DONE 2026-06-17 — Chai signed off on the branch diff. Squash-merging to main. Durable codegraph guidance committed to tracked root CLAUDE.md (0b03746); redundant gitignored .claude/CLAUDE.md removed (regenerable via codegraph install).
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
