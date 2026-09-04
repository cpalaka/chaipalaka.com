---
id: TASK-048
title: 'Parity rollout B6: migrate to the shared Codex/Claude contract'
status: To Do
assignee: []
created_date: '2026-09-04 21:18'
updated_date: '2026-09-04 21:20'
labels:
  - parity
  - claude-generated
dependencies: []
references:
  - ~/Code/skills/docs/tickets/06-b6-rollout-campaign.md
  - ~/gamedev/godot/journeymen/docs/plans/codex-claude-parity.md
priority: medium
ordinal: 41010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Parity rollout B6 (index: ~/Code/skills/docs/tickets/06-b6-rollout-campaign.md; plan: ~/gamedev/godot/journeymen/docs/plans/codex-claude-parity.md section 6 B6, decision Q10). Move this repo onto the shared Codex/Claude contract: run the init-project engine's Migrate mode (~/Code/agent-skills/init-project/SKILL.md section Migrate mode) over CLAUDE.md, then run init once with the backlog Profile to stamp the files the contract names (migrate stamps no Templates). Instruction files and tool wrappers only - nothing under the build tree.
Prerequisites, measured 2026-09-04 on codex-cli 0.153.3: (1) a project .codex/config.toml, and a project .codex/hooks.json, load only after this repo has a [projects."<absolute path>"] trust_level = "trusted" entry in ~/.codex/config.toml, which only the directory-trust prompt of an interactive codex session here grants - with no entry there is no error, the project file is simply skipped; codex mcp list from the repo root is the check. (2) ~/.codex/config.toml has a second writer (the ChatGPT desktop app shares it with the CLI): re-read it immediately before any edit and never restore it from a backup. (3) Codex truncates each instruction file past 32768 bytes silently (MARK at byte 32318 returned, byte 32772 absent); the engine's byte gate covers the emitted AGENTS.md and the canary line is its last line, so a session that cannot quote the canary did not load the whole file.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Migrate mode has been run over CLAUDE.md and its step-8 ledger (every line moved and where, every line flagged and why) is in this task's notes; no flagged line was rewritten by hand as part of the move.
- [ ] #2 init has been run once afterwards with the backlog Profile and reported skip-if-exists for everything migrate wrote; the files the contract names now exist.
- [ ] #3 A fresh codex exec in this repo quotes 'Canary: parity-adapter-v1 loaded' (the last line of AGENTS.md) and names docs/agents/project-workflow.md as the source of the verify-gate knob.
- [ ] #4 A headless claude -p in this repo names the same contract path and quotes the same verify-gate commands as the Codex reading; both readings are pasted verbatim into the notes.
- [ ] #5 The Claude-only scanner reports VERDICT: PASS with zero un-allowlisted hits over the prospective instructions, and --no-allowlist still reports FAIL (the known-bad control). The engine does not stamp the scanner (measured 2026-09-04): copy tools/agent/claude-only-scan.sh and claude-only-scan.allow from ~/gamedev/godot/journeymen.
- [ ] #6 git diff --stat for the migration touches only CLAUDE.md, AGENTS.md, docs/agents/, tools/agent/ and, if present, .codex/ (config.toml there is gitignored machine-wide) - nothing under the build tree.
- [ ] #7 Codex directory trust for this repo is present in ~/.codex/config.toml (granted interactively, or already there) and was checked after the migration, not assumed.
- [ ] #8 This repo's row in the B6 index (~/Code/skills/docs/tickets/06-b6-rollout-campaign.md) carries this task id, its status and the date landed.
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
