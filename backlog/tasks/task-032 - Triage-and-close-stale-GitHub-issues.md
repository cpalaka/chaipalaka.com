---
id: TASK-032
title: Triage and close stale GitHub issues
status: To Do
assignee: []
created_date: '2026-06-19 08:14'
updated_date: '2026-07-27 01:20'
labels:
  - claude-generated
  - chore
  - housekeeping
  - prod-v1
milestone: prod-v1
dependencies: []
priority: low
ordinal: 22010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub issues are retired for new work (all forward work is on the backlog.md board); issues #1-#150 are the frozen v1 historical record. Triage the remaining OPEN GitHub issues and close out anything obsolete/superseded, with a closing note pointing to backlog.md where relevant, so the tracker reflects 'v1 archived; new work on the board.' Anything still genuinely actionable should be migrated to a backlog task or kept open with a stated reason. Note: gh write calls fail TLS in the sandbox (OSStatus -26276) — run gh issue close with dangerouslyDisableSandbox per call.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Remaining open v1 issues triaged; obsolete ones closed with a pointer to backlog.md
- [ ] #2 Any still-actionable issue migrated to a backlog task or explicitly kept open with a reason
- [ ] #3 Issue tracker reflects 'v1 archived; new work on the backlog board'
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PROD-V1 (2026-07-26, docs/plan/): SCHEDULED M4 (2026-09-14 to 2026-09-26), about 2.5 h. Picked MUST in brief Q14. Parked in the launch window with TASK-031 for the same reason. Recorded gotchas: every gh WRITE is human-gated (git-confirm-destructive), and gh HTTPS write calls fail TLS in the sandbox with OSStatus -26276 — run each with the sandbox disabled, per call. GitHub issues #1-150 are frozen as the historical v1 record; close obsolete ones with a pointer to the board, never reopen or create.
<!-- SECTION:NOTES:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
