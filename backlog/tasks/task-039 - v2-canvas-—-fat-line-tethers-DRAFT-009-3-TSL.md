---
id: TASK-039
title: 'v2 canvas — fat-line tethers (DRAFT-009 #3, TSL)'
status: To Do
assignee: []
created_date: '2026-06-21 21:50'
labels:
  - claude-generated
  - threejs
  - webgpu
  - v2
  - canvas
milestone: v2
dependencies: []
ordinal: 29010
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Graph edges/tethers between drifting cards, rendered so TENSION is legible. Top-down drift graph: edges are gentle springs with a rest length — stretch = tension (drag a node away and its edges tauten).

CONFIRMED via prototype (prototypes/fat-tethers.html, verified ~60fps): width + color are the dominant tension signals Chai wants — taut = thicker + darker ink, slack = thinner + paler. Monochrome, dead-on the IBM-Plex identity, zero kitsch risk.

CHANGED from DRAFT-009 #3: DROP the dash-crawl (rejected in review). Life + direction instead come from a gloopy/liquid treatment consistent with the #1 SDF aura — the tether reads as a stretching liquid filament (cf. the lava-toy 'tethers become stretching liquid filaments'), not a dashed line.

TECHNIQUE FORK (decide at build, after the rewrite + the #1 renderer exist): (A) render the tether as an SDF capsule in the SAME metaball field as #1 — gloop is native, width = capsule radius by tension, unifies the renderer (LEADING candidate given the gloopy direction); or (B) a separate TSL node-material fat-line with a gloopy shader pass. Both are TSL — NOT WebGL2 Line2 (WebGPURenderer rejects its ShaderMaterial LineMaterial; the #3 drop-in-Line2 premise is dead).

DATA: endpoint + per-edge tension (length vs rest) from the POST-REWRITE physics layer per frame. Old StringLayer.tsx is gravity-era, may not survive — reuse IF it does, else source from the new graph model. Verify.

DEPENDENCY (tracked by Chai, not a board task): gated on the gravity -> top-down-drift physics rewrite. Sibling to task-038 and likely SHARES a renderer with it (fork A).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tethers render via TSL (NOT WebGL2 Line2); the technique fork (SDF capsule in the #1 field vs separate node-material fat-line) is resolved and recorded (ADR if load-bearing)
- [ ] #2 Tension (current length vs spring rest length) drives width + color (taut = thicker + darker; slack = thinner + paler); NO dash-crawl
- [ ] #3 Life/direction via a gloopy/liquid filament treatment consistent with #1 — not dashes
- [ ] #4 Endpoint + per-edge tension from the post-rewrite physics layer per frame; buffers reused (no per-frame alloc); resize-tracked
- [ ] #5 Slack edges stay faintly legible at rest (topology readable); monochrome, on-brand (no kitsch)
- [ ] #6 SVG/DOM fallback remains for no-JS and no-WebGPU
- [ ] #7 Visual verification: agent-browser screenshot in main session showing width+color tracking tension on drag
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Prototype: prototypes/fat-tethers.html (width+color confirmed, dash-crawl rejected, ~60fps). Cross-refs: DRAFT-009 #3, sibling task-038 (likely shared SDF renderer per fork A), ADR-0009, task-037. Open tuning (build-time): slack-edge visibility floor — lean toward keeping slack faintly legible. Verify-at-build: TSL line approach (Line2 dead), StringLayer survival.
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
