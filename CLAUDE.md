# Working on chaipalaka.com — instructions for Claude — the Claude Code adapter

This file guides Claude Code (claude.ai/code) in this repository. It is a **thin host adapter**:
**every project rule lives in `docs/agents/project-workflow.md`**, the one shared contract this repo
keeps for all agent hosts (`AGENTS.md` is the Codex adapter over the same file). Dev-process rules
come from the shared Chunk library, delivered via `~/.claude/chunks` — edit a rule THERE, not here.
What stays in this file is Claude Code mechanics and nothing else.

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
@docs/agents/project-workflow.md

## Claude Code mechanics (this host only)

- **Session baseline:** sandbox on, `permissions.defaultMode: auto`, both in
  `.claude/settings.local.json` (gitignored, so it does not travel with a clone or a worktree).
  Shape and recovery: the `sandbox-auto` chunk.
- **MCP registration:** `.mcp.json` is this adapter's project-scope MCP config. It takes effect only
  after a Claude Code **restart**; so does any change to the user-scope `~/.claude.json`.
- **Project-local subagents live in `.claude/agents/`** — dispatch them with the `Agent` tool.
- **Skills fire from context here.** Where the contract names a skill to read when you touch the
  work it covers, this host loads it on its own; everything else is invoked explicitly.
- **Skill and command spelling on this host is `/name`** (`/refresh-context`, `/implement`, …). The
  contract names skills without a prefix; add the slash here.
