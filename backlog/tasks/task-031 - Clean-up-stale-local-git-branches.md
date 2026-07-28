---
id: TASK-031
title: Clean up stale local git branches
status: To Do
assignee: []
created_date: '2026-06-19 08:14'
updated_date: '2026-07-28 21:19'
labels:
  - claude-generated
  - chore
  - housekeeping
  - prod-v1
milestone: prod-v1
dependencies: []
priority: low
ordinal: 21010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The local repo carries ~90 stale branches (feat/issue-*, refactor/issue-*, docs/*, test/*, etc.) from v1 development, most orphaned by the 2026-06-09 history rewrite (all pre-rewrite SHAs changed). Audit and delete merged/obsolete local branches, keeping main and any genuinely active work. CAREFUL: the history rewrite means many branches point at pre-rewrite commits no longer reachable from main; confirm each is truly obsolete (merged into main's current history or superseded) before deleting. Local branches only; do not delete remote branches without explicit confirmation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Stale/merged local branches deleted; main and any active branches preserved
- [ ] #2 Each deletion confirmed obsolete (merged or superseded post-history-rewrite), not blind
- [ ] #3 No remote branches deleted without explicit confirmation
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
PROD-V1 (2026-07-26, docs/plan/): SCHEDULED M4 (2026-09-14 to 2026-09-26), about 1.5 h. Picked MUST in brief Q14. Parked in the launch window deliberately — zero dependents, zero-risk local work, and it must not compete with anything load-bearing. Brief §4 fairly notes the plan should not spend hours deleting branches while the pin bug goes unverified; the answer is sequencing, not overriding the triage: the staleness sweep is the FIRST item in the plan and this is nearly the last. Local branches only; each deletion confirmed obsolete post the 2026-06-09 history rewrite, not blind; remote deletions need explicit confirmation.

SWEEP VERDICT 2026-07-28 (task-043): LIVE, with the count corrected. The description says '~90 stale branches'; the measured figure is 83 local branches (git branch --list | wc -l), inclusive of main and the current task branch. The history-rewrite caution in the description stands and was not re-tested.
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
