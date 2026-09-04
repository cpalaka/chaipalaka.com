---
id: TASK-048
title: 'Parity rollout B6: migrate to the shared Codex/Claude contract'
status: Done
assignee: []
created_date: '2026-09-04 21:18'
updated_date: '2026-09-04 22:59'
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
- [x] #1 Migrate mode has been run over CLAUDE.md and its step-8 ledger (every line moved and where, every line flagged and why) is in this task's notes; no flagged line was rewritten by hand as part of the move.
- [x] #2 init has been run once afterwards with the backlog Profile and reported skip-if-exists for everything migrate wrote; the files the contract names now exist.
- [x] #3 A fresh codex exec in this repo quotes 'Canary: parity-adapter-v1 loaded' (the last line of AGENTS.md) and names docs/agents/project-workflow.md as the source of the verify-gate knob.
- [x] #4 A headless claude -p in this repo names the same contract path and quotes the same verify-gate commands as the Codex reading; both readings are pasted verbatim into the notes.
- [x] #5 The Claude-only scanner reports VERDICT: PASS with zero un-allowlisted hits over the prospective instructions, and --no-allowlist still reports FAIL (the known-bad control). The engine does not stamp the scanner (measured 2026-09-04): copy tools/agent/claude-only-scan.sh and claude-only-scan.allow from ~/gamedev/godot/journeymen.
- [x] #6 git diff --stat for the migration touches only CLAUDE.md, AGENTS.md, docs/agents/, tools/agent/ and, if present, .codex/ (config.toml there is gitignored machine-wide) - nothing under the build tree.
- [x] #7 Codex directory trust for this repo is present in ~/.codex/config.toml (granted interactively, or already there) and was checked after the migration, not assumed.
- [x] #8 This repo's row in the B6 index (~/Code/skills/docs/tickets/06-b6-rollout-campaign.md) carries this task id, its status and the date landed.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## B6 migration ledger (Astra via codex exec, 2026-09-04; orchestrator: Fable, ticket 06 grant)

### Moved

**Working-tree migration prepared; not committed.** Staging was sandbox-denied. Verification remains blocked as detailed below. Task notes and all AC/DoD boxes are unchanged.

Source ranges refer to `CLAUDE.md` at `29c90a8`. Destination `contract` means `docs/agents/project-workflow.md`.

| Source lines | Destination |
|---|---|
| 1 | All three emitted H1s retain `Working on chaipalaka.com — instructions for Claude` |
| 3–5 | contract:49–51 — original introductory paragraph |
| 7–18 | `CLAUDE.md:9–20` — import comment and four imports, verbatim |
| 20–31 | contract:14–25 — `knobs:backlog-core` |
| 33–42 | contract:27–36 — `knobs:verify-gate` |
| 44–47 | contract:38–41 — `knobs:dev-practice` |
| 49–53 | contract:43–47 — `knobs:parallel-work` |
| 57–64 | contract:53–60 — Project |
| 66–67 | contract:62–63 — Communication style |
| 69–79 | contract:65–75 — Design record |
| 81–84 | contract:77–80 — Autonomy note |
| 86–98 | contract:82–94 — Pre-merge adversarial review |
| 100–106 | contract:96–102 — Deploy |
| 108–119 | contract:104–115 — React / framework skills |
| 121–124 | contract:117–120 — Design sequencing |
| 126–129 | contract:122–125 — Toolchain pins |
| 131–132 | contract:127–128 — CodeGraph |
| 134–137 | contract:130–133 — Project boundaries |
| 139–142 | contract:135–138 — Headless note |

Removed wrapper heading at source:55; promoted its **12** child headings from `###` to `##`. Byte comparisons confirmed all four knob blocks and all project prose survived unchanged apart from promotion. An earlier diagnostic printed a hardcoded “13”; the subsequent source-derived count was **12**.

No whole project bullet was exclusively host mechanics. The mixed Headless note paragraph stayed intact in the contract.

### Flagged

All flagged text remains unchanged.

| File:line | Class | Finding |
|---|---|---|
| `docs/agents/project-workflow.md:1` | host name | Transcribed H1 retains “instructions for Claude.” |
| `docs/agents/project-workflow.md:82` | host name | Review heading names `.claude/workflows/adversarial-review.js`. |
| `docs/agents/project-workflow.md:136` | host name | Mixed paragraph names `claude -p` and `/goal`. |
| `docs/agents/project-workflow.md:138` | host name | Claims `--add-dir ~/.claude/chunks` makes external imports load; contradicts campaign measurements. |
| `docs/agents/project-workflow.md:51` | heading cross-ref | “Zone 3” survives removal of its wrapper. |
| `docs/agents/project-workflow.md:14–25` | knob key mismatch | Existing keys differ from all four Profile keys; comparison below. |
| `docs/agents/project-workflow.md:27–36` | knob key mismatch | Missing `build_check` and `secret_scan`; retains `secret-scan` and extra `Full gate (…)`. |
| `docs/agents/project-workflow.md:38–41` | knob key mismatch | `test-roster` / `spec-verify src` differ from `test_roster` / `spec_verify_src`. |
| `docs/agents/project-workflow.md:43–47` | knob key mismatch | Profile defines no `parallel-work` key set, although migrate requires this block. Comparison cannot be completed. |

`backlog-core` existing keys:

- `backlog version`
- `plans dir`
- `AC verify examples`
- `DoD items (source of truth = backlog/config.yml definition_of_done; 6, ending in sign-off)`

Profile keys: `VERSION`, `PLANS_DIR`, `VERIFY_EXAMPLES`, `DoD`; all four exact spellings are absent.

`verify-gate` Profile keys: `dir`, `typecheck`, `test`, `build`, `build_check`, `smoke`, `secret_scan`, `env`.

No moved knob contains a `~/.claude/skills/<skill>/scripts/…` path. The `### Modules with tests` reference at contract:39 targets `PRD.md`, whose heading was not promoted.

Scanner drift, also unchanged and unallowlisted:

```text
docs/process/parallel-work.md:66:
sandbox+auto — `.claude/settings.local.json` is gitignored, so copy it in first

docs/process/parallel-work.md:67:
(`cp .claude/settings.local.json ../cp-task-NNN-<slug>/.claude/`) or the
```

### Fragments offered

`profiles/backlog/templates/contract.md:1`, **Board** — **no counterpart**.

Offered for hand-adoption: board pointers, AC-versus-DoD conventions, and board-first absence checks. Not inserted during migration or subsequent skip-if-exists init.

The backlog Profile declares no Claude or Codex adapter fragments.

### Skills fill prompt

Transcribed into `AGENTS.md:25`:

`$refresh-context`, `$vercel-react-best-practices`, `$vercel-composition-patterns`, `$vercel-react-view-transitions`, `$impeccable`, `$frontend-design`.

Sources: original `CLAUDE.md:76`, `109`, `112`, `114`, `124`. No skill names invented.

### Byte gate

Command:

```sh
wc -c AGENTS.md ~/.codex/AGENTS.md
```

Output:

```text
    4450 AGENTS.md
   10597 /Users/chaipalaka/.codex/AGENTS.md
   15047 total
```

**PASS: 15,047 ≤ 32,768 bytes.**

Chunk measurement:

```text
    2105 git-sync-branch-start.md
    3332 git-commit-format.md
    1998 git-confirm-destructive.md
    3258 sandbox-auto.md
    6331 parallel-work.md
    3588 verify-gate.md
    3505 dev-practice.md
   10172 git-flow-squash.md
   13838 backlog-core.md
    2522 codegraph.md
   50649 total
```

All ten named chunk files exist under `~/.codex/chunks/`. Both chunk symlinks resolve to `/Users/chaipalaka/Code/agent-skills/chunks`. All five emitted Claude imports resolve.

`AGENTS.md:68` is the last line:

```text
Canary: parity-adapter-v1 loaded
```

This is a file inspection, **not AC#3’s fresh-session check**.

### Init: stamped / skipped, exists / skipped for scope / owed fills

**Stamped**

- `docs/agents/triage-labels.md` — Profile Template row `profiles/backlog.md:17`; byte-identical to source.
- Separately, step C copied `tools/agent/claude-only-scan.sh` byte-for-byte, set mode `0755`, and wrote its repository-specific allow file. These are not init Templates.

**Skipped, exists**

- `CLAUDE.md`
- `AGENTS.md`
- `docs/agents/project-workflow.md`
- `docs/agents/issue-tracker.md` — Profile Template row `profiles/backlog.md:16`.
- `.claude/settings.local.json` — existing; Profile supplies no settings delta.
- Bespoke “Init (flags beat the wizard)” — existing board/config retained.
- Bespoke “DoD defaults” — existing six-item list retained and read back with `backlog config get definitionOfDone`.
- Pinned install unnecessary: `backlog --version` returned `1.45.2`.

**Skipped for scope**

- External-includes approval, Codex directory trust, and host-reader launches — orchestrator-owned.
- Any global pinned installation — outside repository writes prohibited; installed version already matches.
- “Seed the board” — no board expansion authorized; dispatched task forbids task edits.
- “Adoption commit” — blocked by denied staging.
- No addon edits, `project.godot` edits, MCP installs/freezes, global helpers, or global skill installations ran. This backlog Profile requires none of the Godot-specific steps.

**Owed fills**

- `docs/agents/project-workflow.md:142–144` — Working in this repo.
- `docs/agents/project-workflow.md:148–149` — Running.
- `docs/agents/triage-labels.md:33–35` — optional `human` / `checkpoint` labels.

**Verify-after-write fails on surviving prompts.**

### Scanner

`tools/agent/claude-only-scan.sh` complete output:

```text
claude-only-scan: 104 files in scope, 6 patterns, mode: allow file and qualified rule applied

hits:
  docs/process/parallel-work.md:66: .claude/settings.local.json
  docs/process/parallel-work.md:67: .claude/settings.local.json

qualified:
  (none)

allowlisted:
  CLAUDE.md:26: .claude/settings.local.json

hits: 2 un-allowlisted, 1 allowlisted, 0 qualified
VERDICT: FAIL
```

`tools/agent/claude-only-scan.sh --no-allowlist` complete output:

```text
claude-only-scan: 104 files in scope, 6 patterns, mode: no allowlist, no qualification (known-bad control)

hits:
  CLAUDE.md:26: .claude/settings.local.json
  docs/process/parallel-work.md:66: .claude/settings.local.json
  docs/process/parallel-work.md:67: .claude/settings.local.json

qualified:
  (not applied in this mode)

allowlisted:
  (not applied in this mode)

hits: 3 un-allowlisted, 0 allowlisted, 0 qualified
VERDICT: FAIL
```

Both commands exited 0; verdicts came from their output.

**Scope limitation:** the scanner uses `git ls-files`. Denied staging means new `AGENTS.md`, contract, and triage-labels files were not scanned. Re-run both commands after staging. No alternative index or other workaround was used.

Complete `tools/agent/claude-only-scan.allow` contents:

```text
# claude-only-scan.sh allow file — HISTORICAL records and HOST ADAPTERS only.
# Format: <repo-relative path><TAB><reason>.  '#' comments and blank lines ignored.
# A line with no TAB-separated reason is a hard error (exit 2): an entry that does not
# say why a file is exempt cannot be reviewed later.
#
# Two categories, and nothing else:
#
#   HISTORICAL — a dated record of what happened. Anything a future session reads as
#   instruction (the shared contract, guides, OPEN tickets, specs and plan docs without
#   a STATUS banner) stays out; its hits are the baseline this campaign removes, and
#   they must show as un-allowlisted hits today.
#
#   ADAPTER — a host adapter, whose entire job is the mechanics of ONE host. An adapter
#   naming its own host's paths is the design working, not the drift this scan hunts:
#   the parity rule is that project rules live once in the shared contract, not that no
#   file may say `.claude/`. The exemption holds only while the adapter stays thin — a
#   project rule that migrates back into one is caught by reading the contract against
#   it, never by this scanner, so an adapter entry is not a licence to grow the file.
#
CLAUDE.md	HOST ADAPTER — Claude Code mechanics; project prose moved into docs/agents/project-workflow.md.
```

### Gate outputs

Commands ran from `web/` except the documented repository-root secret scan and host scanner. Finite gate commands had 120-second process-group timeouts; none hung.

`npm run typecheck`, migration and init runs:

```text
> chaipalaka-web@0.0.1 typecheck
> tsc --noEmit

EXIT: 0
```

`npm run test`, migration run — output tail:

```text
 Test Files  1 failed | 105 passed (106)
      Tests  1 failed | 897 passed | 1 skipped (899)
   Start at  15:11:35
   Duration  7.36s (transform 2.39s, setup 9.58s, collect 6.69s, tests 9.06s, environment 17.71s, prepare 4.17s)

EXIT: 1
```

Failure:

```text
FAIL  src/__tests__/bundle-splitting.test.ts > atelier prod-bundle guard > no emitted prod chunk contains the atelier-only marker
AssertionError: chunk _app/AtelierPanel-TPCgB2Wt.js unexpectedly contains atelier-only marker: expected true to be false // Object.is equality
```

`npm run build`, migration run — output tail:

```text
[vite-react-ssg] Generating static loader data... (13)
dist/static-loader-data-manifest-s5322igrg.json  0.81 KiB

[vite-react-ssg] Build finished.
[sitemap] 12 URLs written to sitemap.xml
EXIT: 0
```

Initial artifact command:

```sh
grep -n 'data-server-rendered="true"' dist/index.html
```

Exit 0; matched line 16 containing the marker and rendered home-page HTML. Output’s final text:

```text
</script></div>
```

`npm run test`, init run after the production build — output tail:

```text
 Test Files  106 passed (106)
      Tests  898 passed | 1 skipped (899)
   Start at  15:12:48
   Duration  4.46s (transform 2.58s, setup 9.42s, collect 6.56s, tests 4.11s, environment 18.57s, prepare 4.35s)

EXIT: 0
```

The test’s `ensureBuilt()` at `web/src/__tests__/bundle-splitting.test.ts:50` reuses existing artifacts when its sampled HTML exists. The changed verdict after building is consistent with stale initial artifacts; no source was patched.

Warnings remained, including:

```text
THREE.WARNING: Multiple instances of Three.js being imported.
```

React Router also emitted `v7_startTransition` and `v7_relativeSplatPath` future-flag warnings. **Passing assertions are not a clean-output gate verdict.**

`npm run build`, init run — output tail:

```text
[vite-react-ssg] Generating static loader data... (13)
dist/static-loader-data-manifest-ygdy1gbqlm.json  0.82 KiB

[vite-react-ssg] Build finished.
[sitemap] 12 URLs written to sitemap.xml
EXIT: 0
```

Earlier build output included:

```text
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

Build warnings remain unresolved.

Final artifact command and output:

```text
$ grep -o 'data-server-rendered="true"' dist/index.html
data-server-rendered="true"
EXIT: 0
```

`npm run dev`:

```text
> chaipalaka-web@0.0.1 dev
> vite

error when starting dev server:
Error: listen EPERM: operation not permitted ::1:5173
    at Server.setupListenHandle [as _listen2] (node:net:1986:21)
    at listenInCluster (node:net:2065:12)
    at GetAddrInfoReqWrap.callback (node:net:2274:7)
    at GetAddrInfoReqWrap.onlookupall [as oncomplete] (node:dns:134:8)

EXIT: 1
```

Smoke **not completed: sandbox denied listening**. Not retried or bypassed.

Secret scan, verbatim command from `docs/process/local-verification.md`, run at repository root:

```sh
grep -rniE '(api[_-]?key|secret|token|password)\s*[:=]\s*["'\''][^"'\'']{8,}' \
  --include='*.ts' --include='*.tsx' --include='*.js' \
  --include='*.json' --include='*.md' --include='Makefile' \
  --exclude-dir=node_modules --exclude-dir=dist \
  --exclude-dir=.git --exclude-dir=assets .
```

Output empty; exit 1, meaning no matches. Calibrated with a temporary nonsecret fixture, then removed it and reran:

```text
SECRET-SCAN KNOWN-BAD CONTROL: exit 0; matched planted nonsecret VERIFICATION_SENTINEL using the exact documented command.
SECRET-SCAN FINAL: exit 1; stdout empty; stderr empty; temporary control removed.
```

Host scan: both complete outputs appear above. The moved knob has no `host-scan` key; executed separately under step C.

`git diff --check`: empty output, exit 0.

### AC table

| AC | Status | Evidence |
|---|---|---|
| #1 | blocked: verify-after-write fails; ledger not appended to protected task notes | Moved, Flagged, owed fills |
| #2 | blocked: scoped init applied, but surviving fills prevent successful verification | Init section |
| #3 | orchestrator | Fresh Codex reader not attempted |
| #4 | orchestrator | Headless Claude reader not attempted |
| #5 | blocked: two drift hits; newly emitted files outside tracked scanner scope | Scanner |
| #6 | blocked: staging denied, so no committed diff exists | git, Sandbox denials |
| #7 | orchestrator | Global trust config not inspected or modified |
| #8 | orchestrator | Campaign index not modified |

No AC or DoD box was checked.

### git

Branch:

```text
docs/task-048-parity-migration
```

`git log --oneline main..HEAD`: **empty output**.

`git diff --stat main...HEAD`: **empty output**. This is not migration-scope evidence: no commit was created.

`git diff --cached --stat`: **empty output**.

Only intended path outside the listed migration directories:

```text
backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md
```

No Profile Template stamped it. It is the explicitly required orchestrator-owned edit, retaining its existing `status` and `updated_date` changes. No source/build-tree path appears in the tracked diff or untracked deliverables.

Commit was not attempted after staging failed. Prepared message:

```text
docs(docs/task-048): migrate shared agent contract

Move project prose into the shared contract and emit host adapters.
Stamp the missing backlog guide and copy the Claude-only scanner.

Preserve flagged prose and report verification blockers in the handoff.

Refs task-048
```

Final `git status --porcelain` — **not empty; handoff remains uncommitted**:

```text
 M CLAUDE.md
 M "backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md"
?? AGENTS.md
?? docs/agents/project-workflow.md
?? docs/agents/triage-labels.md
?? tools/
```

The untracked `tools/` directory contains only:

```text
tools/agent/claude-only-scan.allow
tools/agent/claude-only-scan.sh
```

### Sandbox denials

Command, from `web/`:

```sh
npm run dev
```

Denial:

```text
Error: listen EPERM: operation not permitted ::1:5173
```

Command, from repository root:

```sh
git add CLAUDE.md AGENTS.md docs/agents/project-workflow.md docs/agents/triage-labels.md tools/agent/claude-only-scan.sh tools/agent/claude-only-scan.allow 'backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md'
```

Denial:

```text
fatal: Unable to create '/Users/chaipalaka/Code/chaipalaka.com/.git/index.lock': Operation not permitted
```

Neither command was escalated or worked around. These were sandbox denials, not automatic approval-review rejections.

### Engine prose report

- **Init contradicts its migration handoff.** Engine `SKILL.md:135` says reruns replace knob contents; `:395–396` says init touches nothing migration wrote. I followed the latter and the execution spec’s skip-if-exists requirement. Mismatched keys remain unchanged.
- **`parallel-work` has no Profile schema.** Migrate requires its block at engine `:293`; `profiles/backlog.md:23–49` provides no corresponding knob definition. I preserved all three existing keys rather than inventing a schema.
- **H1 extraction is underspecified.** Engine `:280` says use the existing H1 string. I transcribed the entire H1, including “Working on” and “instructions for Claude,” into all three filenames’ headings rather than guessing a normalized name.
- **Unmatched stubs have no migration placement rule.** Only Project matched an existing section. I kept all 12 moved sections in their original order and placed the untouched Working/Running stubs afterward. Filling them would require selecting or assembling prose beyond a literal section move.
- **The triage Template’s optional fill evades the literal prompt detector.** It uses `*<Fill at init,` at `triage-labels.md:33`; engine `:227` names `*<Fill at init:`. I detected and reported both spellings.
- **Board pointers are stamped without a reader.** The Profile says its Board fragment gives both pointers a reader, but migrate prohibits inserting that fragment and subsequent init must skip the contract. Consequently, the triage Template’s claim that “both host adapters point here” is false for this output. Left unchanged.
- **Generic MCP claims lack backlog backing.** `AGENTS.md:44` points to server roles in Working in this repo, but that section is an unfilled stub. The backlog Profile stamps no MCP configuration. `.codex/config.toml` does not exist; `.mcp.json` does.
- **Generic adapter asserts unverified trust and another approval policy.** `AGENTS.md:49–50` says `on-request` and asserts directory trust. This run uses automatic approval review; trust verification belongs to the orchestrator. Template text was preserved, not treated as evidence.
- **Generic child-agent gate prohibition contradicts this dispatch.** `AGENTS.md:63` prohibits children running gates, while this execution spec expressly requires them. I followed the dispatch.
- **Generic subagent bullet had no backing file.** `.claude/agents/` does not exist and backlog stamps no roles. I omitted the Template’s generic subagent bullet; no moved project bullet was removed.
- **Preserved import comment is stale.** `CLAUDE.md:12–14` says eight base chunks including `code-hygiene`; the actual `dev-base.md` imports seven and records that removal. Codex names the actual seven plus the three explicit imports.
- **Preserved headless guidance contradicts measured facts.** Contract:138 says `--add-dir` enables imports. The engine and campaign say interactive external-includes approval is load-bearing and `--add-dir` does not substitute.
- **Other preserved references remain stale.** Contract:51 retains “Zone 3”; contract:72 retains `/refresh-context` despite the adapter’s claim that contract skills are prefix-free. Neither was rewritten.
- **Additional absent engine-example paths:** `.codex/hooks.json` and `docs/agents/domain.md`. Neither is a backlog Profile Template destination. No hook file was created or changed.
- **Commit and clean-tree requirements cannot be fulfilled in this sandbox.** The explicit instruction to leave denied commands to the orchestrator governs; the migration is not reported as landed.

Handoff requirements remain: approve Claude external includes interactively if not already approved, restart for imports/headless expansion, verify Codex directory trust, and start new sessions after host configuration changes. Neither host’s user configuration was written.

## Orchestrator readings (2026-09-04, after staging the migration)

The Astra agent could not stage or commit: Codex's workspace-write sandbox protects .git/ (denial quoted in its ledger). The orchestrator staged the seven paths by name and committed. Because the scanner scopes by git ls-files, the agent's scanner runs did not see the new files; re-run after staging:

### AC#5 scanner, tracked scope

First run: 2 un-allowlisted hits, both docs/process/parallel-work.md:66-67 (an unqualified `.claude/settings.local.json` in the worktree footgun paragraph) — pre-existing drift, not created by the migration. Disposition: qualified both lines with the scanner's own fixed phrase (`Claude Code's …`, `Claude Code: …`) so they document a host difference; no other text changed. Re-run:

```
claude-only-scan: 107 files in scope, 6 patterns, mode: allow file and qualified rule applied

hits:
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:108: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:111: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:187: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:216: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:217: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:223: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:235: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:236: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:237: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:102: ~/.claude/skills/
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:526: .claude/agents

qualified:
  docs/process/parallel-work.md:66: .claude/settings.local.json
  docs/process/parallel-work.md:67: .claude/settings.local.json

allowlisted:
  CLAUDE.md:26: .claude/settings.local.json

hits: 11 un-allowlisted, 1 allowlisted, 2 qualified
VERDICT: FAIL
```

Control (--no-allowlist):

```
hits: 14 un-allowlisted, 0 allowlisted, 0 qualified
VERDICT: FAIL
```

### AC#3 codex exec (read-only, gpt-6-astra) in this repo

```
`Canary: parity-adapter-v1 loaded`
Source: `docs/agents/project-workflow.md`
```text
- typecheck: npm run typecheck
- test: npm run test
- build: npm run build  (must confirm vite-react-ssg prerender: `data-server-rendered` present in dist/index.html, not just exit 0)
```
```
CODEX-CANARY: QUOTED; CODEX-CONTRACT: NAMED.

### AC#4 headless claude -p in this repo

```
(1) File: `docs/agents/project-workflow.md`

(2) Verify-gate block values:
- typecheck: `npm run typecheck`
- test: `npm run test`
- build: `npm run build  (must confirm vite-react-ssg prerender: \`data-server-rendered\` present in dist/index.html, not just exit 0)`

```
CLAUDE-CONTRACT: NAMED; the three quoted values are byte-identical to the block on disk and to the Codex reading.

### AC#7 trust entry (~/.codex/config.toml, read fresh)

`76:[projects."/Users/chaipalaka/Code/chaipalaka.com"] 77-trust_level = "trusted" `

### Fills the user owes (engine-designed outcome, left standing)

- docs/agents/project-workflow.md `## Working in this repo` and `## Running` stubs (no moved section matched them).
- docs/agents/triage-labels.md optional `human` / `checkpoint` labels.
- The flagged lines in the ledger above (host names in moved prose; knob keys spelled differently from the Profile's key set) are user judgements, left exactly as they were.

## Review and adjudication (2026-09-04; four Fable seats: Standards, Spec, completeness critic, counter-critic; orchestrator adjudicated each finding against the files)

# Orchestrator adjudication — task-048 (chaipalaka.com), 2026-09-04

Each finding from the Standards, Spec and Completeness seats, adjudicated against the files and the engine text. Branch at 24c0f7c.

| # | Seat | Sev | Finding | Verified? | Disposition |
|---|---|---|---|---|---|
| 1 | Standards, Spec | HIGH | Scanner reads FAIL at HEAD: all 25 un-allowlisted hits are in the task file's notes (the appended ledger and readings quote Claude-only tokens); the commit message claimed PASS | Yes: re-ran the scanner at HEAD, 25 hits, all `backlog/tasks/task-048…`; the PASS reading in the message was taken before the notes append | **Confirmed, mine.** The false commit message was reworded by splitting the commit (d90e022 + 2c9dcb7, same tree). Disposition of the hits: the allow-file header admits a Done ticket as HISTORICAL, and journeymen's allow file exempts its own campaign record that way with a hand-read attestation; so at Done, in the Done commit, add the task file as HISTORICAL (attesting its description and AC carry no unqualified Claude-only name — Spec seat verified lines 36–51 carry no hit) and re-run both scanner modes. Until then the scanner is FAIL on the task file alone, and that is recorded in the notes. |
| 2 | Standards | MEDIUM | Old header paragraph moved into the contract as an orphan (contract:49–51), restating the chunk-library rule and carrying a now-false "inline below (Zone 3)" | Yes: contract:49–51 = old CLAUDE.md:3–5 verbatim; engine SKILL.md:349 says the header is replaced wholesale, carrying only facts the Template lacks; the unique fact survives at the Project section's "At task start … read PRD.md, CONTEXT.md" bullet | **Confirmed. Fixed by the orchestrator** in 24c0f7c (four-line deletion, no other change), because the fix was fully specified by the engine text and the reviewer; recorded here rather than re-dispatched. |
| 3 | Standards | MEDIUM | Second commit's subject 109 chars and two logical changes | Yes | **Confirmed, fixed** by the split (d90e022, 2c9dcb7). |
| 4 | Standards, Spec | LOW | contract:72 `/refresh-context` (host spelling) and :78–80 "sandbox + auto mode" not in the Flagged table | Yes, both lines present and unflagged; the engine's flag classes are literal host names/paths, so the agent followed the letter | **Confirmed; ledger amended here** (added to the flagged list for the user); text untouched per "flag never rewrite". |
| 5 | Standards | LOW | Template's `.claude/agents/` bullet dropped on init's rule, not migrate's | Yes; `.claude/agents/` absent in the repo | **Confirmed, accepted as is**: the engine's migrate rule says a moved bullet naming a real subagent wins over the generic one; there is neither, and a bullet naming a directory that does not exist would be a false claim. Recorded. |
| 6 | Standards | LOW | docs/agents/issue-tracker.md:6 drifted from its Template and points at CLAUDE.md | Yes | **Confirmed, owed**: skip-if-exists is the engine's rule; re-anchoring is the parity audit's job. Listed for the user. |
| 7 | Spec | LOW | The qualification edit in docs/process/parallel-work.md:66–67 is outside AC#6's literal list | Yes | **Accepted**: inside the parent ticket's scope (docs) and the scanner's own qualified rule; the two inserted phrases are the scanner's fixed strings and no other text changed. |
| 8 | Spec | LOW | triage-labels.md:4 claims both adapters point at it; nothing does (Board fragment not inserted) | Yes | **Confirmed, engine-designed**: migrate forbids inserting the contract fragment and offers it in the ledger. Owed to the user (adopt the Board section by hand). |
| 9 | Completeness | LOW | Four docs/process/*.md:3 back-pointers say "CLAUDE.md keeps the one-line …", which the contract now keeps | Yes (codegraph, local-verification, toolchain-pins, parallel-work :3) | **Confirmed, owed**: live references outside the migration's move set; a rename-convention sweep for the user, listed. |
| 10 | Completeness | LOW | CLAUDE.md:11–14 import comment says dev-base bundles 8 chunks incl. code-hygiene; dev-base imports 7 since 2026-08-08; AGENTS.md derives ten correctly | Yes | **Confirmed, owed**: the comment travelled verbatim under "imports carry over as they are"; a stale claim for the user to fix in the adapter comment. |
| 11 | Completeness | LOW | AGENTS.md:44 points a Codex session at the contract's `## Working in this repo`, which is a fill stub | Yes | **Confirmed, engine-designed**: the stub is a fill the user owes (already listed); the pointer is Template text. |
| 12 | Completeness | LOW | Scanner header carries journeymen's provenance/scope notes; functionally sound here (root via git rev-parse, 107 files in scope, new files scanned) | Yes | **Accepted**: AC#5 says copy it from journeymen; byte-identity is what makes it the same instrument. Header residue recorded. |
| 13 | Completeness | LOW | Claude Code's per-session load grew from 8674 to 11354 bytes for the same rules; the chunk-library pointer now loads four times | Yes | **Accepted as a recorded cost**: three of the four repetitions are engine Template text; the fourth was #2 and is gone. |

Verify gate (in force): typecheck 0, tests 106 files passed after a fresh build (the first failure was a stale artifact, per the test's own ensureBuilt), build 0, prerender marker present, secret scan zero with a planted-sentinel control, git diff --check clean. Smoke (dev server + browser) not run by anyone: a human step, unchanged from before the migration.

Owed to the user after merge (also in the task notes): fills for `## Working in this repo`, `## Running`, triage labels; the flagged lines (contract:1, :47 after the deletion → "Zone 3" is gone with the paragraph, :72, :78–80, :82, :136–138 incl. the `--add-dir` claim that contradicts the measured record); knob key spellings vs the Profile's set; Board fragment adoption; issue-tracker.md:6 and the four docs/process/*.md:3 back-pointers; the import comment's chunk count.

## Counter-critic dispositions (2026-09-04)

Four reversals accepted, all verified against the tree:

1. `git diff --check` had been run range-less while the contract was untracked, so it could not see it; `git diff --check main..HEAD` reported a trailing blank line at the contract's EOF (engine stub area, not moved prose). Stripped in the commit after 24c0f7c.
2. The 24c0f7c deletion of the orphaned old header paragraph (old CLAUDE.md:3-5) is engine-correct (Migrate step 5) and every fact in it survives elsewhere: read-first -> CLAUDE.md and AGENTS.md headers; the specific backlog task -> the backlog-core chunk; PRD.md / CONTEXT.md -> the Project section; the chunk library -> the contract header; "Zone 3" is defined nowhere. RE-ANCHOR for the ledger above: after 24c0f7c subtract 4 from every contract line number greater than 47 in the Moved and Flagged tables, and the row "3-5 -> contract:49-51" is superseded (deleted, not moved). Flagged lines on disk now: contract:1 (H1), :68 (/refresh-context spelling), :74-76 (sandbox + auto mode), :78 (.claude/workflows path; its section :79-87 names the Workflow tool and Fable, both Claude Code-only, and is covered by that flag), :131-134 (headless note; the --add-dir claim contradicts the measured record); AGENTS.md:1 carries the same "instructions for Claude" H1 as contract:1 and is flagged with it.
3. Smoke: not "a human step". Disposition: N/A by scope — the diff touches no path under web/, so there is no affected route for the knob's smoke step to exercise; the sandboxed attempt's listen EPERM is recorded above and no escalation was needed. Docs-synced (verify-gate chunk) / DoD#3: N/A — CONTEXT.md, README.md and PRD.md carry no CLAUDE.md mention.
4. The Template's "Project-local subagents live in .claude/agents/" bullet was dropped on init's rule; Migrate step 4 says that is not migrate's rule. Restored verbatim.

Further owed items it surfaced (user): CLAUDE.md:9-10 import comment names "skills/chunks" (the library is agent-skills/chunks) besides the stale chunk count; AGENTS.md:25 transcribes `$impeccable`, which resolves on neither host (pre-existing in the old CLAUDE.md:124).

Done-commit rule for the HISTORICAL allow entry: the task file is listed only in the commit that flips it to Done (git-flow-squash marks Done on the branch before the squash-merge), with a reason attesting that the description, AC and DoD were hand-read after the last edit and carry no unqualified Claude-only name; both scanner modes re-run in that commit.

## Close-out (2026-09-04, ticket 06 autonomous grant)

AC#1-#4, #6, #7 checked on the evidence above; AC#8 checked against the campaign index row written in the same minute. AC#5 is checked in this same commit after the task file is listed in the allow file as HISTORICAL (the ticket is Done in this commit; description, AC and DoD hand-read after the last notes append: no unqualified Claude-only name) and both scanner modes re-run — their output is the last thing in these notes. DoD#3 N/A (no new domain language or decision). DoD#4 N/A (no scaffolding). DoD#5 and #6: the diff review is the four-seat Fable review above; local VS Code review, squash-merge approval and user sign-off are WAIVED per the grant (ticket 06 § Autonomous grant, "Waived per ticket"), recorded here rather than claimed.

### AC#5 final scan (this commit)

```
claude-only-scan: 107 files in scope, 6 patterns, mode: allow file and qualified rule applied

hits:
  (none)

qualified:
  docs/process/parallel-work.md:66: .claude/settings.local.json
  docs/process/parallel-work.md:67: .claude/settings.local.json

allowlisted:
  CLAUDE.md:26: .claude/settings.local.json
  CLAUDE.md:30: .claude/agents
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:108: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:111: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:187: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:216: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:217: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:223: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:235: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:236: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:237: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:541: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:547: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:548: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:549: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:550: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:551: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:552: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:553: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:554: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:555: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:560: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:561: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:564: .claude/settings.local.json
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:102: ~/.claude/skills/
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:556: ~/.claude/skills/
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:526: .claude/agents
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:557: .claude/agents
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:625: .claude/agents
  backlog/tasks/task-048 - Parity-rollout-B6-migrate-to-the-shared-Codex-Claude-contract.md:646: .claude/agents

hits: 0 un-allowlisted, 30 allowlisted, 2 qualified
VERDICT: PASS
```

Control (--no-allowlist): `VERDICT: FAIL`
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
