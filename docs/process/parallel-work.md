# Parallel wave runs — in-session subagents

> Extracted from `CLAUDE.md` (split-to-index). `CLAUDE.md` keeps the one-line
> decision rule and points here for the full recipe. Dependency-free tasks only.

`/goal` headless runs are retired for waves (decided 2026-06-09): Chai is at
the terminal during work sessions, and in-session subagents give live progress
in the UI and mid-flight steering that detached `claude -p` processes cannot.
The main session is the orchestrator and re-verifies everything itself, which
is stronger than `/goal`'s transcript-judging evaluator anyway.

1. Main session only: sync `main`, mark each task In Progress (board writes
   never happen in subagents — ID generation collides).
2. Per task, from the repo root:
   `git worktree add ../cp-task-NNN-<slug> -b <branch> main`, then
   `npm install` in the worktree's `web/`. (No settings copy — subagents
   inherit the main session's permission mode and sandbox.)
3. Spawn one background subagent per task, all in a single message so they run
   concurrently. Each subagent's prompt must include: work ONLY inside its own
   worktree; read the task (`backlog/tasks/`, read-only), `PRD.md`,
   `CONTEXT.md`, `docs/adr/`, and the relevant spec first; TDD per `CLAUDE.md`;
   run the full verification gate (typecheck/test/build exit 0 in `web/`,
   prerender check, secret-leak grep — see `docs/process/local-verification.md`)
   and include the output in its report; commit all work on the branch; end
   with a review handoff (branch, what's verified, what to inspect closely).
   Hard limits, verbatim in every prompt: no merge/push to `main`, no marking
   Done, no deploys, no `backlog` write commands, no `gh` writes.
4. Monitor live in the session UI. Steer a drifting subagent with SendMessage
   rather than respawning it (a respawn loses its context).
5. On each handoff, the MAIN session independently re-runs the verification
   gate in that worktree before relaying the handoff to Chai — never pass on a
   subagent's claims unverified.
6. Review each diff as usual; for each approved branch, mark its task Done on
   the branch from the main session (never in a subagent) — using
   `--check-ac`/`--check-dod` + `--append-notes` (never `--desc`/`--notes`,
   which REPLACE) and **no commit SHA in the notes**, per CLAUDE.md
   "On completion" — then squash-merge serially into `main` so each task
   lands as one commit, re-running the verification gate
   (`docs/process/local-verification.md`) after each merge; `git worktree
   remove` each worktree and delete merged branches.

Tasks with visual/feel AC (screenshots, "feels right") don't belong in waves —
they need human eyes mid-flight; run them solo in-session.
