---
id: DRAFT-006
title: v2 — rework parked (edge-anchored) card feel
status: Draft
assignee: []
created_date: '2026-06-20 20:31'
labels:
  - claude-generated
  - v2
  - physics
  - design
  - high-priority
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Source: task-024 (v2 scroll regimes). The parked / edge-anchored state ships in task-024 as specced (spec section 6 / ADR-0006): a pinned card parks by tethering to the content box top/bottom edge, where it hangs and swings as a live physics pendulum off the box. Chai finds the card-dangling-off-the-box behaviour unintended (glossed over in brainstorming).

GRILL the redesign before promotion: what should 'parked' look and feel like instead? Candidates to explore — a quiet dock/stow, a tab or edge indicator, reduced/no pendulum swing, a non-physics parked representation. Then update spec sections 5-6 and amend ADR-0006.

Proposed ACs (finalise at the grill):
1. A parked pinned card reads as intentionally stowed, not a card physically hanging off the content-box edge.
2. The new parked behaviour is decided and recorded (spec 5/6 + ADR-0006 amendment).
3. Recall (manual click) and reduced-motion still work; task-018 guardrails G1/G3/G4 preserved.

PRIORITY: HIGH; MILESTONE: v2 — set on promotion (drafts carry no priority/milestone via CLI; signalled here + the high-priority label).
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [ ] #2 Secret-leak grep from repo root: zero matches
- [ ] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [ ] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [ ] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [ ] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
