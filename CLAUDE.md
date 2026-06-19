# Working on chaipalaka.com — instructions for Claude

This file establishes the standing process and conventions for any Claude
session that works on tasks in this repo. Read this first; then read the
specific task and `PRD.md` for design context.

## Communication Style

When reporting information to me, be extemely concise and sacrifice grammar for the sake of concision

## Repo

- GitHub: `https://github.com/cpalaka/chaipalaka.com`
- Default branch: `main`
- **All work is tracked on the in-repo Backlog.md board (the `backlog/`
  directory — there is no `backlog.md` file)** (see "Task tracking" below).
  GitHub issues (#1–#150) are the historical record of v1 development —
  read them for context when relevant, but do not create or reopen issues
  for new work.
- `PRD.md` and `grillmedoc.md` are committed to the repo and are the
  authoritative design record. When a slice's design changes during a
  session, update the relevant `PRD.md` section in the same branch/commit.

## Task tracking — Backlog.md (`backlog/`)

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
- **Propagate downstream findings to dependent tasks.** When a task —
  especially a spike or any decision-bearing task — produces a result that
  constrains or informs tasks that depend on it, do not leave the finding
  only in an ADR / spec / spike doc: **pin it onto each dependent task as
  part of the producing task's own completion** (before marking it Done).
  Add the concrete constraint as an **acceptance criterion** (a Done-gate)
  when it's a hard requirement, or at minimum a description note / appended
  note pointing to the authoritative doc — the dependent task's own
  AC/description is what a future session reads first; an ADR it might never
  open is not enough. Use `--ac` for Done-gating constraints and
  `--append-notes` for pointers — **not `--desc`/`--notes`, which replace the
  whole field**; name the source task and doc in the text.
  (Precedent: task-018 pinned guardrails G1–G6 onto tasks 020/023/024/027 as
  ACs; task-019 pinned its chosen morph mechanism onto task-025, referencing
  ADR-0007.)
- Multi-task slices keep a plan doc under `docs/superpowers/` (specs live in
  `docs/superpowers/specs/`; `plans/` is created lazily on first use) linked
  via `--doc`, with a `Tracked by: task-NNN` header — **board status/AC
  is the single source of progress; plan checkboxes are in-session
  scratch** (completed plans get a STATUS banner instead). Single-session
  tasks plan in-task via `--plan`.
- **On completion — mark Done ON THE BRANCH, before the squash-merge.**
  Once Chai signs off on the diff, run `backlog task edit <id> --check-ac N …
  --check-dod 1 --check-dod 2 … --notes "<summary, NO commit hash>" -s Done`
  *on the feature branch* and commit the task-file change there (the 6
  standing Definition-of-Done items live in `backlog/config.yml` and are
  separate from per-task AC — stamp both at completion); the squash-merge then folds code +
  Done into one commit on `main` (see "Review & merge"). Do **not** put a
  commit SHA in `--notes` — it doesn't exist yet and forces a separate
  post-merge commit (the exact noise this avoids); the `<area>/task-019`
  subject scope + a `Refs task-019` footer carry traceability
  (`git log --grep "task-019"`) — see "Commits" for the subject format.
  `auto_commit` stays false so the edit batches with code. **Done requires
  explicit user sign-off — never auto-close on AC/DoD pass.** Mark Done only
  after Chai confirms.
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

For the same reason, keep the allowlist free of `gh` **write** globs.
A broad pattern like `Bash(gh pr *)` or `Bash(gh issue *)` pre-authorizes
the destructive writes (`gh pr create`/`merge`, `gh issue create`/`edit`)
the "Confirm first" policy requires a human to gate — not just the reads it
was added for, since the `*` glob can't tell a read from a write. The
allowlist overrides the classifier, so such an entry silently defeats the
retired-PRs/issues policy in every session and subagent. Allowlist only the
specific read subcommands you actually need (`gh pr view`, `gh issue list`,
…); let every `gh` write fall through to the classifier. (PRs/issues are
retired, so writes should be rare anyway.)

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
   `backlog/tasks/`), and set it `In Progress`
   (`backlog task edit <N> -s "In Progress"`) — the board is the single
   source of progress, so the To-Do→In-Progress transition is part of the
   process, not optional.
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
    reviewer. After Chai approves the diff: mark the task Done on the
    branch (see "On completion" under "Task tracking"), then squash-merge to
    `main` and push —
    one commit carries code + Done (this push is pre-authorised by the
    approval; see "Review & merge").

## Parallel wave runs — in-session subagents (dependency-free tasks only)

For multiple dependency-free tasks, fan out one background subagent per
task in pre-made worktrees; the main session orchestrates, re-verifies
every handoff itself, and does all board writes / merges. `/goal` headless
runs are retired for waves (2026-06-09). Tasks with visual/feel AC don't
belong in waves — run them solo in-session.

**Full recipe (worktree setup, subagent prompt template, hard limits,
serial-merge sequence): `docs/process/parallel-work.md`.**

## Branch naming

Conventional-commits-style prefix, then the backlog task number, then a
short kebab-case description:

```
<type>/task-<NNN>-<short-description>
```

(`<NNN>` is the backlog ID zero-padded to 3 digits, matching the task file
IDs and the commit-subject scope — `task-003`, never `task-3`.)

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Pick the one that
matches the dominant change. Examples:

- `feat/task-003-physics-tuning-module`
- `fix/task-017-tokens-rewriter-light-blocks`
- `chore/task-022-bump-vite-to-8`

(Pre-backlog branches used `<type>/issue-<N>-…` against GitHub issues;
you'll see both in history.)

## Commits

- **Subject line — `<type>(<area>/task-NNN): <imperative summary>`.**
  Always put the owning task in the scope as `<area>/task-NNN` so the task
  shows on every `git log --oneline` line — e.g.
  `chore(spike/task-019): choose View Transitions for the hero morph`
  (65 chars incl. scope — under the ~72 ceiling).
  `<area>` is the slice/subsystem (`spike`, `atelier`, `canvas`,
  `api`, `backlog`, …); `task-NNN` is the backlog ID, **zero-padded to 3
  digits** to match the file IDs (`task-019`, never `task-19`). Keep the whole
  subject ≤~72 chars including the scope — tighten the summary, never drop the
  task. Pure board grooming not owned by one task keeps a plain area scope
  (`chore(backlog): …`) with no `task-NNN`.
- Body: what changed and **why**; mention notable deviations from the PRD
  (and why) so the reviewer is not surprised.
- End with `Refs task-NNN` (zero-padded) in the footer too; together with
  the subject scope it is the task↔commit link (`git log --grep "task-NNN"`),
  which replaces a SHA in the task notes. Merging never auto-closes a backlog
  task — the task is marked Done via `backlog task edit` only after Chai's
  explicit sign-off, on the branch just before the squash-merge so it rides
  the same commit (see "On completion" under "Task tracking").
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
- After explicit approval of the diff: mark the task Done on the branch
  (`backlog task edit … -s Done`, no SHA in notes) and commit it there,
  then squash-merge to `main` so code + Done collapse into **one** commit,
  write the squash commit message per "Commits" (`<type>(<area>/task-NNN):`
  subject + why + `Refs task-NNN`), and push `main`. The approval IS the authorisation for
  that one push. (Pure board grooming not tied to a feature branch — new
  milestones, drafts, cross-task guardrail pins — is the one expected
  class of standalone `chore(backlog):` commits; batch those rather than
  one-per-edit.)
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

The gate (run in `web/`): `npm run typecheck` → `npm run test` →
`npm run build` (confirms `vite-react-ssg` prerender) → `npm run dev` smoke,
then a repo-root secret-leak grep (expect zero matches). All must pass before
committing. Secrets live in `/etc/chaipalaka.env` on the server (see
`deploy/SECRETS.md`); never in the repo or `web/` runtime.

**Exact commands, prerender check, and the secret-scan grep:
`docs/process/local-verification.md`.**

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
  providers). Highly relevant for the physics-card primitives
  (`Card`, `CardLayout`, `StringLayer`).
- **`vercel-react-view-transitions`** — invoke for the v2 hero morph and
  route-level animations. Per ADR-0007 the chosen mechanism is
  **react-router-dom 6.30 `viewTransition` / `useViewTransitionState`**
  (browser-native `document.startViewTransition` + a CSS `view-transition-name`
  on the shared element) — **not** React's `<ViewTransition>` component
  (rejected: needs react@canary, breaks the `vite-react-ssg` pins). Use the
  skill for its CSS view-transition-pseudo-element / naming guidance; treat
  its `<ViewTransition>`-component sections as not applicable here.

### Process / discipline

- **`/tdd`** — use when implementing any module, adapter, pure function,
  API endpoint, or other code with verifiable runtime behaviour. The PRD's
  "### Modules with tests" section is the authoritative roster of
  required-coverage modules (`PhysicsWorld`, `CardLayout`, `Tether`/
  `StringLayer`, `TransitionDirector`, `TextMeasure`, `CacheLayer`, the
  adapters, the content readers) — defer to that list rather than this
  parenthetical if they ever diverge. These are red-green-refactor
  candidates; do not write the implementation before the failing test.
- **`diagnosing-bugs`** — use for any non-obvious bug or test failure before
  proposing a fix; do not skip the reproduce → minimise → hypothesise loop.
- **`superpowers:brainstorming`** — use when a slice's PRD section leaves real
  design ambiguity (rare, since the PRD is detailed; but possible for
  additions). Per the global note, ask before invoking it.
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

## Code intelligence — CodeGraph (opt-in, per-machine)

**When a `.codegraph/` directory exists at the repo root**, reach for CodeGraph
(`codegraph_explore` / `codegraph_node`, or the `codegraph` shell CLI) BEFORE
grep/find or reading files to locate or understand code. **If there is no
`.codegraph/` directory, skip it entirely** — the index, `.mcp.json`, and
install are all gitignored and per-machine. Caveat: `impact`/`affected`
over-report (structural upper bound).

**Usage, MCP-vs-shell, and per-machine opt-in steps:
`docs/process/codegraph.md`.**

## Toolchain pins (do not change without checking peer deps)

`vite`, `react-router-dom`, `vite-react-ssg`, `react`/`react-dom`, and
`typescript` are pinned by `vite-react-ssg`'s peer deps as of the slice 1
install. **Do not bump any of them without checking compatibility** — that's a
separate slice.

**The pin table + rationale: `docs/process/toolchain-pins.md`.**

## Things that are off-limits in code

- Hardcoded API keys, tokens, passwords, or any secret value — anywhere.
- `console.log` left in production code paths (use it transiently while
  developing, remove before commit).
- Hardcoded server paths or IPs in frontend code. The Hetzner IP lives in
  DNS / SSH config; the frontend talks to `/api/*` only.
- New top-level dependencies without justification in the squash commit
  message / review handoff.
- Files larger than ~1 MB committed to git — those go in `assets/` (gitignored)
  and ship via `make assets-sync`.

## When unsure

Ask. The cost of a clarifying question is one round-trip; the cost of an
unwanted destructive action or an architectural drift the human has to
unwind is much higher. Default to small, reversible steps with checkpoints.
