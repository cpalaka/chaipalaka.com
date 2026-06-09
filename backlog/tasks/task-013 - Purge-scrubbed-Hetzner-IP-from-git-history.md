---
id: TASK-013
title: Purge scrubbed Hetzner IP from git history
status: To Do
assignee: []
created_date: '2026-06-08 23:43'
labels:
  - claude-generated
  - security
  - chore
dependencies:
  - TASK-011
priority: medium
ordinal: 3010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Follow-up to task-011, which scrubbed the Hetzner server IP from the working tree (PRD.md and grillmedoc.md now carry a placeholder). The IP is docs-only (never in frontend or runtime) and is a public infrastructure address, not a credential, but it remains in earlier commits.

Scope: rewrite history to remove the IP from all past commits (git filter-repo or BFG), then force-push main.

Blocking constraint: force-pushing main is OFF-LIMITS without explicit, separate authorization from Chai (see CLAUDE.md). Do not execute until that green-light is given and timing is coordinated. The public GitHub remote also retains the value until the rewrite plus cache/PR purge.

Low urgency (docs-only, public IP). Run as a deliberate, isolated operation, not bundled with feature work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 git log -p across all branches and tags contains zero occurrences of the old Hetzner IP
- [ ] #2 Force-push to main explicitly authorized by Chai before execution
- [ ] #3 Remote GitHub history confirmed clean after the push
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
