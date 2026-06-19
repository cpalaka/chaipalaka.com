---
id: TASK-019
title: v2 spike — hero-morph transition approach
status: Done
assignee: []
created_date: '2026-06-19 07:53'
updated_date: '2026-06-19 09:30'
labels:
  - claude-generated
  - v2
  - spike
  - transitions
milestone: v2
dependencies: []
documentation:
  - docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md
priority: high
ordinal: 9010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Throwaway spike choosing the hero-morph mechanism (spec section 10, ADR-0007). There is no ViewTransition in React 19.2.6 stable and no existing morph in web/src. Compare: (a) browser-native document.startViewTransition (no React dep); (b) react experimental ViewTransition (a toolchain-pin change against the vite-react-ssg discipline); (c) the existing canvas/flip.ts FLIP. Verify the chosen approach works under vite-react-ssg prerender + react-router-dom v6 client nav, degrades where unsupported, and preserves focus + SR route-change announcement. Output: chosen mechanism + a minimal proof.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A card-to-box morph runs on a real client navigation under the prod build/prerender
- [x] #2 Unsupported-browser fallback (no morph, plain nav) verified
- [x] #3 Focus + SR route-change announcement preserved across the morph
- [x] #4 Chosen mechanism recorded with rationale
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Chosen mechanism: (a) browser-native View Transitions API via react-router 6.30 viewTransition Link prop + useViewTransitionState. Rejected (b) react@experimental <ViewTransition> (needs react@canary — collides with vite-react-ssg pins; verified React 19.2.6 stable exports no ViewTransition); kept (c) canvas/flip.ts FLIP as an enhanced fallback only (single-element, can't crossfade two contents). Throwaway proof in web/src/routes/spike/ (routes /spike/morph[/:id]) — delete with the retirement/build-out slice. Verified on the PROD vite-react-ssg build via vite preview in Chromium: AC#1 morph fires on a real client nav (startViewTransition called once; dest box carries shared view-transition-name; spike index prerenders); AC#2 fallback — with startViewTransition removed, plain client nav, no morph, no error; AC#3 focus→dest <h1> + persistent aria-live route announcer fire across BOTH the morph and the fallback. Gate: typecheck + test (96 files/757) + build green, prerender data-server-rendered present, secret grep 0. Decision recorded in ADR-0007 (spike-result section) + CONTEXT.md. CARRY-FORWARD for the retirement slice: the data router does NOT auto-announce route changes — must ship a real route announcer; reduced-motion handled per-motion in CSS (ADR-0008), no central TransitionDirector.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Chose (a) the browser-native View Transitions API (react-router 6.30 `viewTransition` Link prop + `useViewTransitionState`) for the v2 hero morph. Rejected (b) react@experimental <ViewTransition> (needs react@canary, collides with vite-react-ssg pins) and kept (c) canvas/flip.ts FLIP as an enhanced fallback only. Verified on the prod vite-react-ssg build in Chromium: morph on a real client nav (prerender-safe), plain-nav fallback when startViewTransition is absent, and focus->dest <h1> + a persistent aria-live route announcer across BOTH the morph and the fallback. Decision recorded in ADR-0007 + CONTEXT.md; throwaway proof in web/src/routes/spike/ (delete with the retirement/build-out slice). Squash-merged to main after sign-off.
<!-- SECTION:FINAL_SUMMARY:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 web/: npm run typecheck + test + build green (prerender check: data-server-rendered in dist/index.html)
- [x] #2 Secret-leak grep from repo root: zero matches
- [x] #3 CONTEXT.md / docs/adr/ updated for new domain language or decisions (or N/A)
- [x] #4 Debug/scaffolding instrumentation reverted (no stray console.log)
- [x] #5 Branch handed off for local diff review in VS Code; squash-merge to main only after explicit approval
- [x] #6 User sign-off received — explicit approval before Done
<!-- DOD:END -->
