# Working on chaipalaka.com — instructions for Claude

Read this first, then the specific backlog task and `PRD.md` / `CONTEXT.md` for
design context. Dev-process rules are imported from the shared chunk library;
project-specific rules are inline below (Zone 3).

<!-- Dev-process rules live in the shared chunk library (single-source in
     skills/chunks, delivered via ~/.claude/chunks). Edit a rule
     THERE, not here — the edit propagates to every project. dev-base.md bundles
     the 8 base chunks (git-sync-branch-start, git-commit-format,
     git-confirm-destructive, sandbox-auto, parallel-work, verify-gate,
     dev-practice, code-hygiene); the explicit imports are the integration model
     (squash), the board, and codegraph — the last because this is the one
     project carrying a `.codegraph/` index (it left dev-base 2026-07-25). -->
@~/.claude/chunks/dev-base.md
@~/.claude/chunks/git-flow-squash.md
@~/.claude/chunks/backlog-core.md
@~/.claude/chunks/codegraph.md

<!-- knobs:backlog-core -->
- backlog version: 1.45.2 (pinned; bump deliberately via `npm i -g backlog.md@<pin>`)
- plans dir: docs/superpowers/plans/ (specs in docs/superpowers/specs/; plans/ created lazily)
- AC verify examples: typecheck/test/build green, dev smoke of the affected route, screenshot where visual
- DoD items (source of truth = backlog/config.yml definition_of_done; 6, ending in sign-off):
  1. web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
  2. Secret-leak grep from repo root: zero matches
  3. CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
  4. Debug/scaffolding instrumentation reverted (no stray console.log)
  5. Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
  6. User sign-off received — explicit approval before Done
<!-- /knobs:backlog-core -->

<!-- knobs:verify-gate -->
- dir: web/
- typecheck: npm run typecheck
- test: npm run test
- build: npm run build  (must confirm vite-react-ssg prerender: `data-server-rendered` present in dist/index.html, not just exit 0)
- smoke: npm run dev  (bring up, confirm the affected route renders, bring down)
- secret-scan: repo-root secret-leak grep, expect ZERO matches — exact pattern in docs/process/local-verification.md
- env: secrets live in /etc/chaipalaka.env on the server (deploy/SECRETS.md); never in the repo or web/ runtime
- Full gate (exact commands, prerender check, secret-scan grep): docs/process/local-verification.md
<!-- /knobs:verify-gate -->

<!-- knobs:dev-practice -->
- test-roster: PRD.md "### Modules with tests" (authoritative required-coverage roster)
- spec-verify src: web/src  (the tree specs' [reuse] claims are grep/CodeGraph-checked against)
<!-- /knobs:dev-practice -->

<!-- knobs:parallel-work -->
- worktree path prefix: ../cp-task-NNN-<slug>
- install command: npm install (in web/)
- Full recipe (worktree setup, subagent prompt template, hard limits, serial-merge): docs/process/parallel-work.md
<!-- /knobs:parallel-work -->

## Project-specific (inline-leaf)

### Project

Personal site + frontend-craft portfolio at `chaipalaka.com`, mid-**v2 redesign**: gwern-style
fixed content box over a generative shader, with play relocated into the link ladder
(*peek* → *keep* → *enter*) and matter.js physics cards on tethers. Stack: React prerendered via
`vite-react-ssg` (`web/`), MDX content in `content/`, and a Bun API behind Caddy on a Hetzner box
serving live lifelog data through `/api/*`. The v2 spec (see `PRD.md`'s banner) is the
authoritative design record; `CONTEXT.md` is the domain glossary.

### Communication style
When reporting to me, be extremely concise and sacrifice grammar for concision.

### Design record
- GitHub: https://github.com/cpalaka/chaipalaka.com — GitHub issues (#1–#150) are the
  historical v1 record; read for context when relevant, never create/reopen for new work.
- `PRD.md` and `grillmedoc.md` are committed and authoritative; `CONTEXT.md` is the domain
  glossary + architecture overview (NOT auto-loaded like this file — read it at task start).
- **When a slice's design changes, update the relevant `PRD.md` section in the same
  branch/commit** — unconditionally (any design change, not only new domain language or a
  load-bearing decision). Refresh `CONTEXT.md` / ADRs via `/refresh-context` after work that
  changes domain language or architecture.
- At task start (after sync + branch), read `PRD.md`, `CONTEXT.md`, and any relevant
  `docs/adr/` entries before planning.

### Autonomy note
Ask only the questions that genuinely need a decision; don't prompt before standard local
commands (`npm run typecheck` / `test` / `build` / `dev`, `make web-*` targets) — sandbox +
auto mode authorises them.

### Pre-merge adversarial review (`.claude/workflows/adversarial-review.js`)
- Run after the verify gate is green on a task branch, BEFORE diff review/merge — with the
  user's go per branch (workflows need explicit opt-in). Modes: `modest` (3 Fable finders
  @ high; routine slices) | `full` (5 finders + critic + synthesis @ xhigh; foundational/L
  slices — projects >20 agents, state the estimate in chat first).
- args: `{mode, task, diffRange, specSections, focus?, docs?}` — finders discover the plan
  + spec from the task's board entry unless `docs` overrides.
- Relay ALL confirmed/adjudication/LOW findings to the user verbatim; the session that
  wrote the code never self-dismisses one. Fable appears ONLY in this workflow's
  finder/critic/synthesis stages (model policy 2026-07-01).
- Pin the gate per task as a `--dod` item at task creation (space-miner shape), with the
  args pre-filled (mode + the task's spec §§) so the executing session can't miss it. The
  user may waive it per branch (waiver recorded in notes).

### Deploy (Hetzner — human-gated)
- **Confirm first** for anything touching the box: `make deploy` / `deploy-web` / `deploy-api`
  / `assets-sync`, any direct `ssh chaipalaka …`, any `rsync` whose destination is the server.
- The frontend talks to `/api/*` only; the Hetzner IP lives in DNS / SSH config, never in
  frontend code.
- Modifying anything under `deploy/` (Caddyfile, systemd unit) that affects production:
  propose first, apply after I agree.

### React / framework skills — invoke proactively before any `.tsx` / `.jsx`
- **`vercel-react-best-practices`** — before writing or modifying any React component, hook,
  or page (even small JSX edits). Bundle splitting, server/client boundaries, re-render
  avoidance, data fetching.
- **`vercel-composition-patterns`** — reusable component APIs (compound components, render
  props, context); the physics-card primitives (`Card`, `CardLayout`, `StringLayer`).
- **`vercel-react-view-transitions`** — the v2 hero morph / route animations. Per **ADR-0007**
  use react-router-dom 6.30 `viewTransition` / `useViewTransitionState` (browser-native
  `document.startViewTransition` + a CSS `view-transition-name` on the shared element), **not**
  React's `<ViewTransition>` component (rejected: needs react@canary, breaks the
  `vite-react-ssg` pins). Use the skill for its CSS view-transition-pseudo-element / naming
  guidance; treat its `<ViewTransition>`-component sections as not applicable here.

### Design sequencing (v2 art-direction)
Build the functional spine first on placeholder, token-separable styling; then do ONE
impeccable design + polish pass over the working whole as its own capstone task — don't push
a design system up front. Reach for `impeccable` / `frontend-design` for that capstone.

### Toolchain pins (do not bump without checking peer deps)
`vite`, `react-router-dom`, `vite-react-ssg`, `react`/`react-dom`, and `typescript` are pinned
by `vite-react-ssg`'s peer deps. Do not bump any of them without checking compatibility —
that's a separate slice. Pin table + rationale: `docs/process/toolchain-pins.md`.

### CodeGraph (opt-in, per-machine; `.codegraph/` present here)
Usage, MCP-vs-shell, and per-machine opt-in steps: `docs/process/codegraph.md`.

### Project boundaries (off-limits)
- Hardcoded server paths or IPs in frontend code — never; the frontend talks to `/api/*` only.
- Files larger than ~1 MB are never committed to git — they live in gitignored `assets/` and
  ship via `make assets-sync`.

### Headless note
chaipalaka runs no headless `claude -p` / `/goal` automation (`/goal` retired 2026-06-09; waves
use in-session background subagents). If headless is ever reintroduced, those runs must pass
`--add-dir ~/.claude/chunks` or the external `@import` chunks silently won't load.
