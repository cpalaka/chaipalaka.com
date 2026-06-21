---
id: DRAFT-008
title: v2 ladder — recursive previewability (peek inside an un-pinned preview)
status: Draft
assignee: []
created_date: '2026-06-21 01:15'
labels:
  - claude-generated
  - v2
  - physics
  - ladder
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A Portal/Pocket link inside a held (not-yet-pinned) PREVIEW card should also be peekable/keepable — recursive previewability in ALL card states, not just pinned. Today (task-027) recursion only works once the parent is PINNED: pin/recursion.ts resolvePinHost deliberately returns 'suppress' for a trigger inside a [data-peek-id] preview, so a link in a held preview is inert. Chai wants it live in every state.

Ungrilled — the edge cases task-027 punted on (grill these before promoting to a task):

1. Single-held-preview invariant collision. PeekStore allows ONE held preview at a time — opening a new source dismisses the prior held one (it falls). Peeking a link INSIDE the held preview would dismiss the very preview the link lives in. Needs a nested/stacked held-preview model or a different dismissal rule.

2. No parent body to rope a kept child to. A held preview has NO physics body (it 'holds still' as fixed DOM; a body exists only in the falling state). If you KEEP a link inside a held preview, the child pin has no parent CARD to tether to. Options: cascade-keep (keeping the inner link first auto-pins the outer preview, then ropes the child to it), or anchor the child to its source word instead. Decision needed.

3. Ephemerality / orphaning. A preview falls on hover-end / scroll-away. If a child was peeked/kept from it, the parent's dismissal must either cascade-dismiss descendants or orphan them. Lifecycle coupling between a transient parent and its descendants is undefined.

4. Hover-bridge & dismiss timing. The safe-triangle bridge + dwell + scroll-away dismiss are tuned for word->card. preview->preview needs its own bridge/grace so moving the cursor from the outer preview into a child preview doesn't dismiss the outer one.

5. Depth model across states. task-027 caps nesting at ONE level for PINNED cards (resolvePinHost off the data-pin-parent marker). Recursive previewability needs a depth model spanning both preview and pinned states (and a decision on whether the one-level cap still applies, and to which state).

Source: task-027 (shipped: link inside a PINNED card peeks/keeps; child ropes to parent card via wireTetherFor 'card'; G5 subtree carry). Current suppression lives in web/src/pin/recursion.ts resolvePinHost.
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
