# Working on chaipalaka.com — instructions for Claude

This file establishes the standing process and conventions for any Claude
session that works on issues in this repo. Read this first; then read the
specific issue and `PRD.md` for design context.

## Repo

- GitHub: `https://github.com/cpalaka/chaipalaka.com`
- Default branch: `main`
- Issues are tracked on GitHub. View with `gh issue view <N> --repo cpalaka/chaipalaka.com`.
- `PRD.md` and `grillmedoc.md` are committed to the repo and are the
  authoritative design record. When a slice's design changes during a
  session, update the relevant `PRD.md` section in the same PR.

## Session defaults — sandbox + auto-accept edits

The owner runs Claude Code in this repo with **sandbox on** and
**`acceptEdits` permission mode on by default**. The combination — Claude
edits/runs without per-call prompts, but inside a sandbox that prevents
real damage — is the desired baseline for any session in this repo.

These two modes are configured in `.claude/settings.local.json` (gitignored
— personal, not committed). The file should contain at least:

```jsonc
{
  "permissions": { "defaultMode": "acceptEdits" /*, "allow": [...] */ },
  "sandbox": { "enabled": true }
}
```

If your `.claude/settings.local.json` does not have these set, configure
them before starting work — Claude cannot toggle either of these mid-session
via a tool call (both are session-init settings). At session start, confirm
the spinner shows "auto-accepting edits" / sandbox indicator; if it doesn't,
update the file and restart the session before proceeding.

If the user explicitly wants a session WITHOUT these defaults (e.g., for a
risky deploy operation that should re-prompt), they will say so — otherwise
treat the defaults as the standing expectation.

## Standing process for an issue

When asked to work on issue `N`:

1. **Sync `main` first.** Before reading the issue or doing anything else,
   run `git checkout main && git pull origin main`. This is required even
   if you think you're already on `main` and up to date — sibling slices
   may have been merged since the previous session ended, and branching
   from a stale base wastes everyone's time. Do not skip this step.
2. Read the issue: `gh issue view N --repo cpalaka/chaipalaka.com`.
3. Re-read the relevant section(s) of `PRD.md` for design context.
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
9. Push and open the PR (see "Pull requests").
10. Report back: PR URL, what's verified, what's left for the human reviewer.

## Branch naming

Conventional-commits-style prefix, then the issue number, then a short
kebab-case description:

```
<type>/issue-<N>-<short-description>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Pick the one that
matches the dominant change. Examples:

- `feat/issue-3-physics-world-module`
- `fix/issue-17-letterboxd-adapter-malformed-rss`
- `chore/issue-22-bump-vite-to-8`

## Commits

- Subject line: imperative, ~70 chars, leads with the slice or scope.
- Body: what changed and **why**; mention notable deviations from the PRD
  (and why) so the reviewer is not surprised.
- End with `Closes #N` (or `Refs #N` if not closing).
- One logical change per commit when possible. Multiple commits on a branch
  are fine; squash-merging is the integration story.
- Never amend commits already pushed to `origin/<branch>` without confirming.
- Never bypass hooks (`--no-verify`, `--no-gpg-sign`, etc.).

## Pull requests

- Open **ready for review** by default: `gh pr create --title "..." --body "..."`.
  The owner wants PRs reviewable immediately — no draft step. If the work is
  genuinely incomplete (failing tests, unresolved questions you need a
  decision on before going further), say so in chat and ask whether to open
  it as a draft instead; otherwise default to ready.
- Title format: `<Short description> (#N)` — e.g., `Slice 4: blog index + post route (#4)`.
- Body sections, in order:
  1. **Summary** — 2–4 bullets on what landed.
  2. **Notes / deviations** — anything that differs from the PRD or issue, and why.
  3. **Acceptance criteria** — copy the checklist from the issue, mark each
     item `[x]` if you verified it, `[ ]` with a note if it's left for the
     human reviewer (e.g., production deploy steps).
  4. **Test plan** — concrete steps the reviewer can run.
- End with `Closes #N` so merging the PR closes the issue automatically.

## Autonomy — do not prompt for these

The user has authorised these without per-call confirmation:

- All `gh` read commands (`gh issue view`, `gh issue list`, `gh pr view`,
  `gh pr list`, `gh pr checks`, etc.).
- `gh pr create` (ready or draft), `gh pr ready`, and `gh pr edit` on
  **branches you own** (i.e., feature branches you just created).
- All local `git` commands on feature branches: `checkout -b`, `add`,
  `commit`, `push -u origin <branch>` for first push, `push` for subsequent
  pushes to the same branch.
- Local toolchain commands: `npm install`, `npm run dev`, `npm run build`,
  `npm run test`, `npm run typecheck`, `make web-*` targets.
- Reading any file in the repo, including `PRD.md` and `grillmedoc.md`.
- Greps, `find`, secret scans across the working tree.

## Confirm first — do prompt for these

- **Anything that touches the Hetzner box.** That includes
  `make deploy`, `make deploy-web`, `make deploy-api`, `make assets-sync`,
  any direct `ssh chaipalaka …`, and any `rsync` whose destination is the
  server. The convention is: code review happens on the PR; the human
  triggers the actual deploy after merge.
- Pushing to `main` (force or otherwise) — feature branches only.
- Force-pushing to any branch (`git push --force`, `--force-with-lease`).
- Deleting branches, tags, or remotes.
- `gh pr merge` or `gh pr close`.
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
