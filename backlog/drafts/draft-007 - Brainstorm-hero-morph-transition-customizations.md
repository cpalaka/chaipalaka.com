---
id: DRAFT-007
title: Brainstorm hero-morph transition customizations
status: Draft
assignee: []
created_date: '2026-06-20 22:41'
labels:
  - claude-generated
  - v2
  - transitions
  - design
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Customization surface for the v2 hero-morph (and the physical-default crossfade), captured from a 2026-06-20 Q&A after the morph landed (task-025). Today the morph is the browser-native shared-element View Transition DEFAULT — we only assign the shared `view-transition-name: morph-hero` (card -> box) and tune the group duration/easing in base.css; zero custom keyframes. This draft parks the options to make it FEEL designed. Likely folds into the task-030 capstone design pass, or becomes its own slice.

Pseudo-element tree (every rule must live in head-loaded base.css; component CSS code-splits and will not apply to the transition overlay):
::view-transition-group(morph-hero) -> ::view-transition-image-pair(morph-hero) -> ::view-transition-old(morph-hero) / ::view-transition-new(morph-hero)

Options, cheapest to most involved:
- Timing/easing on ::view-transition-group(morph-hero) (current: 340ms, standard ease). Try a springy bezier, a delay.
- Tune the content fade: target ::view-transition-old(morph-hero) and ::view-transition-new(morph-hero) separately (old fades faster, new fades in later, blur via filter, clip-path wipe, mix-blend-mode; asymmetric is fine).
- object-fit on old/new: the card and box have very different aspect ratios, so the default scales the card snapshot to the box shape (a slight stretch). object-fit contain/cover is the main knob for a clean size jump.
- Custom group keyframes: give the group its own animation-name/@keyframes for an arc, scale-overshoot, or rotation (trades away the automatic old->new rect interpolation, so more work).
- Morph sub-elements: give the card title and the box h1 their own shared name (e.g. morph-hero-title) so the title flies into place independently; multiple named pairs animate together for a layered morph.
- Directional variants (forward vs back) need transition types (addTransitionType), which react-router viewTransition boolean does not pass; drive document.startViewTransition more directly.
- JS / Web Animations after transition.ready: el.animate(..., { pseudoElement: ::view-transition-group(morph-hero) }) for springs / motion paths CSS cannot express.
- Physical default: ::view-transition-old(root) / ::view-transition-new(root) is a plain crossfade now; could become a directional slide.

Reduced-motion stays gated (animation none) regardless. References: ADR-0007 (mechanism + as-built), CONTEXT.md (Hero morph / Physical default), web/src/nav/morph.ts, web/src/styles/base.css. Promote to a task once AC are written (per draft discipline).
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
