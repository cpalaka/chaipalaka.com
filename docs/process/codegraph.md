# Code intelligence — CodeGraph (opt-in, per-machine)

> Extracted from `CLAUDE.md` (split-to-index). `CLAUDE.md` keeps the one-line
> trigger and points here for usage. This doc travels with the repo; the
> tooling does not.

This repo is wired for **CodeGraph** (`colbymchenry/codegraph`), a local SQLite
knowledge graph of every symbol/edge/file under `web/`. Adopted in task-016
(trial: ~19% fewer tool calls than grep/read on structural queries, correctness
on par). It is **opt-in and per-machine** — the index (`.codegraph/`), the MCP
wiring (`.mcp.json`), and the install are all gitignored, so a fresh clone has
none of it until a developer initializes it.

**When a `.codegraph/` directory exists at the repo root**, reach for CodeGraph
BEFORE grep/find or reading files to understand or locate code:

- **MCP tools** (after a Claude Code restart following install):
  `codegraph_explore` answers most code questions in one call — the relevant
  symbols' verbatim source plus the call paths between them. `codegraph_node`
  returns one symbol's source + callers, or reads a whole file with line
  numbers. If the tools are listed but deferred, load them by name via tool
  search.
- **Shell** (always works, no restart needed): `codegraph explore "<symbols or
  question>"` and `codegraph node <symbol-or-file>` print the same output.
  Other verbs: `callers`, `callees`, `impact`, `affected`, `query`, `files`,
  `status`. The watcher daemon auto-syncs the index ~1s behind edits and idles
  out after ~5 min (auto-restarts on next use); `codegraph init` rebuilds it.
- **Caveat — `impact`/`affected` OVER-REPORT.** They follow import edges
  structurally (an upper bound, not semantic). Treat the output as a
  *candidate* set and confirm a symbol actually crosses each dependent's public
  interface before trusting it. For whole-directory surveys, grep is often
  cheaper.

**If there is no `.codegraph/` directory, skip CodeGraph entirely** — indexing
is the developer's choice. To opt in on a new machine/clone: install the CLI
(`npm i -g @colbymchenry/codegraph` or the curl installer), `codegraph install`
(wires the project-local `.mcp.json`; then restart Claude Code so the MCP tools
load), and `codegraph init` at the repo root (builds the index). Nothing about
this is committed except this guidance.
