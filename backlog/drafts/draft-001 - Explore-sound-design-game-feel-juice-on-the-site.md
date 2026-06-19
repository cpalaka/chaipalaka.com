---
id: DRAFT-001
title: Explore sound design + 'game feel'/juice on the site
status: Draft
assignee: []
created_date: '2026-06-18 22:15'
labels:
  - claude-generated
  - design
  - sound
  - audio
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Ungrilled idea: explore adding sound and sound design to the site, borrowing from video-game 'game feel' and 'juice' concepts (Steve Swink-style game feel, Jan Willem Nijman / Vlambeer juice talks). Candidate surfaces: card drag/release/collision thuds tied to the matter.js physics, tether pluck/twang, route-transition whooshes, hover/click UI ticks, balloon pop on '/'. Open questions to grill before promoting to a task: does audio fit the restrained-brutalist aesthetic at all, or undercut it; opt-in vs. default-on + a mute affordance; respect prefers-reduced-motion / an autoplay-policy-safe gesture gate; tasteful & sparse vs. gimmicky; asset sourcing + size budget; Web Audio synth vs. sample files.
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
