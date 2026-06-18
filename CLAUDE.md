# Working on chaipalaka.com — instructions for Claude

This file establishes the standing process and conventions for any Claude
session that works on tasks in this repo. Read this first; then read the
specific task and `PRD.md` for design context.

## Communication Style

When reporting information to me, be extemely concise and sacrifice grammar for the sake of concision

## Repo

- GitHub: `https://github.com/cpalaka/chaipalaka.com`
- Default branch: `main`
- **All work is tracked on the in-repo backlog.md board** (see "Task
  tracking" below). GitHub issues (#1–#150) are the historical record of
  v1 development — read them for context when relevant, but do not create
  or reopen issues for new work.
- `PRD.md` and `grillmedoc.md` are committed to the repo and are the
  authoritative design record. When a slice's design changes during a
  session, update the relevant `PRD.md` section in the same PR.

## Task tracking — backlog.md

ALL future work on this project is tracked on the in-repo board under
`backlog/` (Backlog.md, pinned v1.45.2, CLI-only — no MCP, no generated
agent instructions), not GitHub issues. Forward-looking work goes there,
not in memory files or doc ledgers. `docs/adr/` stays the ONLY decision
system; design docs/specs stay in `docs/` (backlog's `decisions/` and
`docs/` folders are unused). Conventions (decided 2026-06-04, mirroring
`circle-combat-prototype`):

- **Session start: check the board** — `backlog task list --plain` (or
  `backlog board`). Set the session's task to `In Progress`.
- **Always `--plain`** when listing/viewing tasks. All task operations via
  the `backlog` CLI — never hand-edit files in `backlog/` (the CLI owns
  IDs, naming, frontmatter). Config (`backlog/config.yml`) is fine to
  hand-edit.
- Write commands (`task create`, `task edit`) are authorised without
  prompting, but **only from the main session** — never from parallel
  subagents/workflow agents (ID generation is a max+1 scan; concurrent
  creation collides).
- **AC = task-specific verification** (typecheck/test/build green, dev
  smoke of the affected route, screenshot where visual). Standing gates
  live in the Definition of Done defaults (`backlog/config.yml`), not AC.
- Multi-task slices keep a plan doc in `docs/superpowers/plans/` linked
  via `--doc`, with a `Tracked by: task-NNN` header — **board status/AC
  is the single source of progress; plan checkboxes are in-session
  scratch** (completed plans get a STATUS banner instead). Single-session
  tasks plan in-task via `--plan`.
- **On completion**: `backlog task edit <id> --check-ac N … --notes
  "<summary + commit hash>" -s Done`; task-file changes ride along with
  code commits (`auto_commit` is false). **Done requires explicit user
  sign-off — never auto-close on AC/DoD pass.** Mark Done only after
  Chai confirms.
- **Milestones = phases**; **labels = free-form** (multiple via `-l a,b`),
  added organically as themes emerge. Every task Claude creates carries
  the `claude-generated` label.
- **Drafts = ungrilled ideas** — `backlog draft create` to capture;
  promote to a task only once acceptance criteria are written.
- Public repo: task files are repo content — same hygiene rules as code.

## Session defaults — sandbox + auto mode

The owner runs Claude Code in this repo with **sandbox on** and
**`auto` permission mode on by default** (switched from `acceptEdits`
on 2026-06-09). The combination — Claude edits/runs without per-call
prompts, gated by the auto-mode classifier, inside a sandbox that
prevents real damage — is the desired baseline for any session in this
repo.

These two modes are configured in `.claude/settings.local.json` (gitignored
— personal, not committed). The file should contain at least:

```jsonc
{
  "permissions": { "defaultMode": "auto" /*, "allow": [...] */ },
  "sandbox": { "enabled": true }
}
```

If your `.claude/settings.local.json` does not have these set, configure
them before starting work — Claude cannot toggle either of these mid-session
via a tool call (both are session-init settings). At session start, confirm
the mode indicator shows auto mode and the sandbox indicator is present;
if not, update the file and restart the session before proceeding.

`git push` rules are deliberately NOT on the permission allowlist
(removed 2026-06-09): pushes must surface to the classifier or a prompt
rather than run silently, so no autonomous loop or subagent can ever
push without scrutiny. Do not re-add them.

If the user explicitly wants a session WITHOUT these defaults (e.g., for a
risky deploy operation that should re-prompt), they will say so — otherwise
treat the defaults as the standing expectation.

## Standing process for a task

When asked to work on task `N`:

1. **Sync `main` first.** Before reading the task or doing anything else,
   run `git checkout main && git pull origin main`. This is required even
   if you think you're already on `main` and up to date — sibling slices
   may have been merged since the previous session ended, and branching
   from a stale base wastes everyone's time. Do not skip this step.
2. Read the task: `backlog task <N> --plain` (the task file lives under
   `backlog/tasks/`).
3. Re-read the relevant section(s) of `PRD.md` for design context, plus
   `CONTEXT.md` for the domain glossary + current architecture overview, and
   any relevant entries in `docs/adr/` for ratified architectural decisions.
   These three together are the authoritative design record — read them
   before planning, not just before code review.
4. Create the feature branch: `git checkout -b <branch-name>` (see naming
   below). You should already be on freshly-pulled `main` from step 1.
5. Plan briefly in the chat (1–5 bullets is fine). Ask only the questions that
   actually require a decision; do not ask before running standard local commands
   (see "Autonomy" below).
6. Implement. Use the `/tdd` skill when the slice has verifiable runtime
   behavior to drive (modules, pure functions, adapters, API endpoints,
   physics math, etc.). Skip TDD for pure scaffolding — slice 1 is the
   archetype for that exception.
7. Verify locally before committing (see "Local verification").
8. Commit on the branch with a descriptive message (see "Commits").
9. Hand off for local review (see "Review & merge — no PRs"): tell Chai
   the branch is ready and how to view the diff.
10. Report back: branch name, what's verified, what's left for the human
    reviewer. After Chai approves the diff, squash-merge to `main` and
    push (this push is pre-authorised by the approval; see "Review &
    merge").

## Parallel wave runs — in-session subagents (dependency-free tasks only)

`/goal` headless runs are retired for waves (decided 2026-06-09): Chai
is at the terminal during work sessions, and in-session subagents give
live progress in the UI and mid-flight steering that detached
`claude -p` processes cannot. The main session is the orchestrator and
re-verifies everything itself, which is stronger than `/goal`'s
transcript-judging evaluator anyway.

1. Main session only: sync `main`, mark each task In Progress (board
   writes never happen in subagents — ID generation collides).
2. Per task, from the repo root:
   `git worktree add ../cp-task-NNN -b <branch> main`, then
   `npm install` in the worktree's `web/`. (No settings copy — subagents
   inherit the main session's permission mode and sandbox.)
3. Spawn one background subagent per task, all in a single message so
   they run concurrently. Each subagent's prompt must include: work ONLY
   inside its own worktree; read the task (`backlog/tasks/`, read-only),
   `PRD.md`, `CONTEXT.md`, `docs/adr/`, and the relevant spec first; TDD
   per this file; run the full verification gate (typecheck/test/build
   exit 0 in `web/`, prerender check, secret-leak grep) and include the
   output in its report; commit all work on the branch; end with a
   review handoff (branch, what's verified, what to inspect closely).
   Hard limits, verbatim in every prompt: no merge/push to `main`, no
   marking Done, no deploys, no `backlog` write commands, no `gh`
   writes.
4. Monitor live in the session UI. Steer a drifting subagent with
   SendMessage rather than respawning it (a respawn loses its context).
5. On each handoff, the MAIN session independently re-runs the
   verification gate in that worktree before relaying the handoff to
   Chai — never pass on a subagent's claims unverified.
6. Review each diff as usual; squash-merge serially into `main`,
   re-running step-7 verification after each merge; update the board
   from the main session; `git worktree remove` each worktree and delete
   merged branches.

Tasks with visual/feel AC (screenshots, "feels right") don't belong in
waves — they need human eyes mid-flight; run them solo in-session.

## Branch naming

Conventional-commits-style prefix, then the backlog task number, then a
short kebab-case description:

```
<type>/task-<N>-<short-description>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Pick the one that
matches the dominant change. Examples:

- `feat/task-003-physics-tuning-module`
- `fix/task-017-tokens-rewriter-light-blocks`
- `chore/task-022-bump-vite-to-8`

(Pre-backlog branches used `<type>/issue-<N>-…` against GitHub issues;
you'll see both in history.)

## Commits

- Subject line: imperative, ~70 chars, leads with the slice or scope.
- Body: what changed and **why**; mention notable deviations from the PRD
  (and why) so the reviewer is not surprised.
- End with `Refs task-N`. Merging never auto-closes a backlog task —
  the task is marked Done via `backlog task edit` only after merge AND
  Chai's explicit sign-off.
- One logical change per commit when possible. Multiple commits on a branch
  are fine; squash-merging is the integration story.
- Never amend commits already pushed to `origin/<branch>` without confirming.
- Never bypass hooks (`--no-verify`, `--no-gpg-sign`, etc.).

## Review & merge — no PRs

GitHub PRs are retired (decided 2026-06-04). Review happens locally in
VS Code; integration is a local squash-merge to `main`.

- When a branch is ready, report it in chat with: what's on it, what's
  verified, and anything the reviewer should look at closely (the
  information that used to go in a PR body goes here and in the squash
  commit message).
- Chai reviews the diff in VS Code — GitLens "Compare references"
  (`main` ↔ branch), or the squash-merge pause
  (`git checkout main && git merge --squash <branch>` → review staged
  changes → commit or `git reset --merge`).
- After explicit approval of the diff: squash-merge to `main`, write the
  squash commit message per "Commits" (summary + why + `Refs task-N`),
  and push `main`. The approval IS the authorisation for that one push.
- Never push to `main` without that per-branch approval; never merge a
  branch Chai hasn't reviewed.
- Delete the feature branch after merge (local; remote too if it was
  pushed).
- Pushing feature branches to origin is optional (backup / multi-machine),
  not part of the review flow.

## Autonomy — do not prompt for these

The user has authorised these without per-call confirmation:

- All `backlog` CLI commands (`task list`, `task <id>`, `task create`,
  `task edit`, `board`) — main session only, per "Task tracking".
- All `gh` read commands (`gh issue view`, `gh issue list`, `gh pr view`,
  etc.) — reads are for the legacy v1 record (issues #1–#150, merged PRs).
- All local `git` commands on feature branches: `checkout -b`, `add`,
  `commit`, `push -u origin <branch>` for first push, `push` for subsequent
  pushes to the same branch.
- Squash-merging a reviewed branch to `main` + the accompanying
  `git push origin main` — ONLY once Chai has explicitly approved that
  branch's diff (see "Review & merge").
- Local toolchain commands: `npm install`, `npm run dev`, `npm run build`,
  `npm run test`, `npm run typecheck`, `make web-*` targets.
- Reading any file in the repo, including `PRD.md` and `grillmedoc.md`.
- Greps, `find`, secret scans across the working tree.

## Confirm first — do prompt for these

- **Anything that touches the Hetzner box.** That includes
  `make deploy`, `make deploy-web`, `make deploy-api`, `make assets-sync`,
  any direct `ssh chaipalaka …`, and any `rsync` whose destination is the
  server. The convention is: code review happens locally on the diff; the
  human triggers the actual deploy after merge.
- Pushing to `main` WITHOUT a per-branch diff approval (see "Review &
  merge" — an approved squash-merge push is authorised, anything else is
  not). Force-pushing to `main` is never OK.
- Force-pushing to any branch (`git push --force`, `--force-with-lease`).
- Deleting tags or remotes (deleting a feature branch after its approved
  merge is fine).
- Any `gh` write command (`gh pr create`, `gh pr merge`, `gh issue` writes,
  `gh api` writes) — PRs and issues are retired for new work.
- Modifying anything under `deploy/` that affects production behaviour
  (Caddyfile, systemd unit) — propose first, apply after the human agrees.
- Running anything that costs money or hits a third-party rate limit
  (`gh api` to write endpoints, etc.).

## Local verification before committing

Run these in `web/` (or the relevant package directory):

```sh
npm run typecheck
npm run test
npm run build      # confirms vite-react-ssg prerender still works
npm run dev        # smoke check the route renders, then kill it
```

For the prerender check, look for `data-server-rendered="true"` and the
expected route HTML inside `<div id="root">` in `web/dist/index.html`.

Then a secret-leak scan from the repo root:

```sh
grep -rniE '(api[_-]?key|secret|token|password)\s*[:=]\s*["'\''][^"'\'']{8,}' \
  --include='*.ts' --include='*.tsx' --include='*.js' \
  --include='*.json' --include='*.md' --include='Makefile' \
  --exclude-dir=node_modules --exclude-dir=dist \
  --exclude-dir=.git --exclude-dir=assets .
```

Expect zero matches. Secrets live in `/etc/chaipalaka.env` on the server
(see `deploy/SECRETS.md`); never in the repo, never in `web/` runtime.

## Skills to use

The user has Superpowers skills and several Vercel React skills installed.
The general rule from `using-superpowers` applies: if there's even a 1%
chance a skill is relevant to what you're about to do, **invoke it via the
Skill tool before doing the work**, not after. Apply per their stated
triggers — in particular:

### React work — invoke proactively before touching `.tsx` / `.jsx` files

- **`vercel-react-best-practices`** — invoke before writing or modifying
  any React component, hook, or page. Even small JSX edits count. Covers
  bundle splitting, server vs. client boundaries, re-render avoidance,
  data fetching. Default skill for any React touchpoint in this repo.
- **`vercel-composition-patterns`** — invoke when designing or refactoring
  reusable component APIs (compound components, render props, context
  providers). Highly relevant for the physics-card primitives in slice 5+
  (`PhysicsCard`, `CardLayout`, `NotesChain`).
- **`vercel-react-view-transitions`** — invoke when working on
  `<ViewTransition>`, route-level animations, or shared-element morphs.
  Slice 6+ (the portfolio thumbnail → detail hero morph is the canonical
  use case in this repo).

### Process / discipline

- **`/tdd`** — use when implementing any module, adapter, pure function,
  API endpoint, or other code with verifiable runtime behaviour. The PRD's
  "Testing Decisions" section names the modules with required test
  coverage (`PhysicsWorld`, `CardLayout`, `NotesChain`, `TransitionDirector`,
  `PretextRegistry`, `CacheLayer`, the adapters, the content readers).
  These are red-green-refactor candidates; do not write the implementation
  before the failing test.
- **`/diagnose`** — use for any non-obvious bug or test failure before
  proposing a fix; do not skip the reproduce → minimise → hypothesise loop.
- **`/brainstorming`** — use when a slice's PRD section leaves real design
  ambiguity (rare, since the PRD is detailed; but possible for additions).
- **`/grill-with-docs`** — use when a slice introduces new domain language
  or an architectural decision worth promoting into an ADR.
- **`agent-browser`** — use for the real-browser UI verification pass
  (screenshot + drive the page) before calling any visual or interactive
  slice done. Unit tests and DOM-class checks miss actual render bugs (CSS
  collisions, invisible text, wrong-state UI); only a rendered screenshot
  catches them.

The cost of invoking a skill that turns out not to apply is one tool call.
The cost of skipping one that did apply is a code review round-trip or a
shipped regression. Default to invoking.

## Toolchain pins (do not change without checking peer deps)

These are constrained by `vite-react-ssg`'s peer-dependency declarations
as of the slice 1 install. Bumping past them is a separate slice — verify
compatibility before changing:

| Package           | Pinned at      | Why                                  |
|-------------------|----------------|--------------------------------------|
| `vite`            | `^7.3.3`       | `vite-react-ssg` peer deps cap at v7 |
| `react-router-dom`| `^6.30.0`      | `vite-react-ssg` peer deps require v6|
| `vite-react-ssg`  | `^0.9.1-beta.1`| Latest available                     |
| `react`/`react-dom`| `^19.2.0`     | Per PRD                              |
| `typescript`      | `^5.9.3`       | TS 6 too fresh; revisit later        |

**PRD vs reality:** the PRD says `vite-ssg`, but that package is Vue-only.
The React equivalent is `vite-react-ssg`. Treat them as the same intent.

## Things that are off-limits in code

- Hardcoded API keys, tokens, passwords, or any secret value — anywhere.
- `console.log` left in production code paths (use it transiently while
  developing, remove before commit).
- Hardcoded server paths or IPs in frontend code. The Hetzner IP lives in
  DNS / SSH config; the frontend talks to `/api/*` only.
- New top-level dependencies without justification in the PR body.
- Files larger than ~1 MB committed to git — those go in `assets/` (gitignored)
  and ship via `make assets-sync`.

## When unsure

Ask. The cost of a clarifying question is one round-trip; the cost of an
unwanted destructive action or an architectural drift the human has to
unwind is much higher. Default to small, reversible steps with checkpoints.
