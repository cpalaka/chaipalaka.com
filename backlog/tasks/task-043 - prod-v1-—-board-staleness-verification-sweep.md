---
id: TASK-043
title: prod-v1 — board staleness verification sweep
status: To Do
assignee: []
created_date: '2026-07-27 01:36'
labels:
  - claude-generated
  - prod-v1
  - ops
milestone: prod-v1
dependencies: []
priority: high
ordinal: 36010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
M0 (exit 2026-08-02), about 5 h. THE FIRST ITEM IN THE PROD-V1 PLAN — everything downstream is scheduled against board claims, and brief A11 establishes that staleness is systemic and unquantified while exactly one instance is confirmed.

Give each of the 19 board items (10 open tasks + 9 drafts) a dated verdict: live / stale / partly stale / premise unchecked. Three items get real work rather than a glance.

This task output is a TRIGGER, not a document: see docs/plan/risk-cut-register.md TRIGGER-A. It is the only item whose result can invalidate the plan around it.

Plan: docs/plan/workstream-ops.md WP-01, open-questions.md T5/T14.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every one of the 19 board items carries a dated verdict in its notes (via --append-notes, never --notes which replaces the field). Drafts have no CLI edit verb, so draft verdicts land in docs/plan/board-accounting.md instead — record them there, and say so.
- [ ] #2 TASK-035 four symptoms re-tested INDIVIDUALLY against current main, UNDER DRIFT. Chai belief that they are stale is tagged [leaning], not [decided], and nobody has checked; they were observed on /test/box during task-028 dev review, BEFORE the drift conversion landed (042.01-.04, 2026-07-01 to 07-03), so drift may have fixed all, some or none. Verify per-frame or by a conserved invariant — NEVER a single-frame snapshot, since a soft system is mid-settle one frame after any action. A frozen-body unit test is the authoritative proof.
- [ ] #3 CONFIRM OR REFUTE, do not inherit: the brief carries an unverified interviewer reading that PinnedCard.parkAt reduced-motion branch places a top-parked card at edgeAnchor.y + parkRest, INSIDE the box over the prose, while the non-reduced path lets prose repel settle it outside. Report which it is.
- [ ] #4 DRAFT-006 premise adjudicated. It complains that a parked card hangs and swings as a live physics pendulum off the box, but ADR-0010 set engine gravity to zero on every route and no route declares gravity — there is no pendulum. Decide whether the underlying concern (parked-card FEEL under drift, a different question) survives, and record kill-vs-rewrite as a proposal for Chai. Do NOT silently kill it, and do not promote it without this verdict.
- [ ] #5 If ANY task-035 symptom reproduces: TRIGGER-A fires CUT-1 (drops task-039, freeing about 18 h) and the escalation goes to Chai at the 2026-08-02 checkpoint. NEVER absorbed silently — CUT-1 reverses a preference Chai stated in brief Q15.
- [ ] #6 Findings that constrain another task are PINNED ONTO IT: hard requirements as --ac on the dependent task, pointers as --append-notes. Never --desc or --notes, which clobber. Name this task as the source.
- [ ] #7 Runs SOLO in the main session — agent-browser screenshots never reach an orchestrator from a subagent, so a visually-verified finding would pass unverified. close --all before each open (the errors buffer is cumulative and --clear is a no-op); set viewport explicitly, the default is about 1280x577 and clips fixed chrome; SSR/hydration failures surface on errors, not console.
- [ ] #8 Timeboxed at 5 h. If the sweep runs long, report what was covered and what was not rather than silently truncating — an unswept item is "premise unchecked", which is itself a useful verdict.
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
