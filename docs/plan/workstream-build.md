# Workstream — Build

Code. Routes, physics, responsive layout, canvas. The stream with the most hours
and the clearest verification story.

**Pieces:** WP-03 lifelog · WP-04 `/about` · WP-07 responsive foundation ·
WP-08 mobile rail · WP-10 `/claude` (build half) · WP-13 fat tethers
**Budget:** ≈76 h of the ≈155 h scope total.

---

## Sequence

```
M1   ADR-0012 gate ──→ WP-03 lifelog composed canvas  ──┐
                       WP-04 /about route             ──┴─→ WP-05 design → CAPSTONE

M2   WP-07 responsive foundation  ──→  WP-08 mobile pin rail [CUT-7]

M4   WP-10 /claude  [CUT-2]
     WP-13 fat tethers [CUT-1]
```

**The ordering rule that matters:** WP-07 before WP-08 before the M3 capstone.
Responsive layout is *spine*, not design — building a desktop-only shape and then
retrofitting mobile means designing twice, and the capstone is the thing the plan
protects.

---

## Standing practice for this stream

Project rules, restated here because this is the stream that trips them.

- **React skills before any `.tsx`.** `vercel-react-best-practices` before writing
  or modifying any component or hook, even a small JSX edit;
  `vercel-composition-patterns` for reusable component APIs;
  `vercel-react-view-transitions` for morph work — with its `<ViewTransition>`
  sections treated as **not applicable** (ADR-0007 pins react-router 6.30
  `viewTransition`).
- **TDD where there is runtime behaviour.** Pure modules, adapters, geometry,
  physics — failing test first. The authoritative required-coverage roster is
  `PRD.md` "### Modules with tests". Scaffolding skips it.
- **CodeGraph before grep.** `.codegraph/` is present on this machine. Treat
  `impact`/`affected` output as a **superset** and prune it by checking whether the
  symbol genuinely crosses each dependent's interface.
- **Visual/feel work runs solo, in the main session — never a background
  subagent.** A subagent's screenshot never reaches the orchestrator, so a
  visually-AC'd task would pass unverified. WP-03's composition, WP-07 and WP-08
  are all in this bucket.
- **agent-browser gotchas.** `set viewport` explicitly (the default ~1280×577
  clips fixed chrome — check `innerHeight` before calling anything a render bug).
  `close --all` before each `open`: the `errors` buffer is cumulative and
  `--clear` is a no-op. SSR/hydration failures surface on `errors`, not `console`.
  Reduced motion is `set media reduced-motion` then `reload`; the
  `prefers-reduced-motion reduce` form silently no-ops — confirm via `matchMedia`.
  Gesture tests drive **synthetic PointerEvents in one async eval**: CDP
  `mouse move` may not fire `pointerover`, and a 0-dt drag inflates fling ~16×.
- **Physics feel is verified per-frame or by a conserved invariant**, never by a
  single-frame snapshot — a soft system is mid-settle one frame after any action.
  A frozen-body unit test is the authoritative proof.
- **Verify a modulated style at its range extremes**, not at its live value — a
  value-driven CSS variable can invert only at the boundary. Directly relevant to
  WP-07: a value that reads fine at 1280 px can invert at 390 px.

---

## WP-03 · `/lifelog` → composed canvas · M1 · 12–19 h

**The gate comes first.** ADR-0012 is drafted, reviewed and signed off **before any
build hour** — a box-less `/lifelog` departs from ADR-0005 decision 1, and ADR-0011
says that carve-out "becomes its own decision". Do not start the rewrite on an
unratified premise.

The shape to copy is `/lab` (ADR-0011): box-less, under `CanvasLayout`, an authored
card set, no content box. **Not** `ContentBoxLayout`. Verified current state:
`routes/Lifelog.tsx` still imports `card/Page` and `pageSpecFromLayout` — genuinely
the v1 scatter shape.

**The three things that make or break it:**

1. **The ruled mechanism — STRUNG short ropes** (Chai's O1, 2026-07-26): every
   composed card tethers to an authored static anchor so its wander is *bounded*
   (CONTEXT.md **Strung**; ADR-0010 dec. 3), with route `driftScale` low but **> 0**
   so the cards stay alive. **The real design work is the anchor topology**: a
   tether's length is *derived* from `distance(parentAnchorPos, cardLayoutPos)`, so
   a card placed mid-viewport needs its own static anchor or it gets a long rope
   and a loose composition. Author it and record it — task-033 AC#4.
   *Fallback if the topology proves unworkable in build:* `driftScale: 0`, which
   zeroes the run-and-tumble impulse (`PhysicsWorld.ts:800`) and binary-gates prose
   repel off (`:853`) for one field and no engine change — a mechanism change
   inside ADR-0012, not a re-plan ([`open-questions.md`](open-questions.md) §T2).
2. **Fix the spawn-kick ordering gap — the class, not the instance.**
   `CardImpl.tsx:90` computes `prefersReducedMotion() ? 0 : SPAWN_KICK *
   world.getDriftScale()`, and the comments at `:13–18` and `:87–89` say why:
   `usePageDef` has not zeroed `driftScale` at spawn time (`CardLayer` precedes
   `Outlet`). `PhysicsWorld.driftScale` defaults to `1` (`:102`). Two viable fixes
   — order the `driftScale` set ahead of card registration, or add a second
   synchronous read at the spawn site the way the reduced-motion branch does.
   **Prefer the former**: the latter is exactly the instance-fix that left this
   class behind in task-042.04.
3. **The idle test is the acceptance criterion.** Card centres move **< 2 px**
   between t=0 and t=5 min. That single check proves the K1 composition-vs-drift
   collision is resolved rather than merely argued — and under STRUNG it is the
   stronger claim, since bounded drift must be bounded *tightly enough to hold the
   composition*, not merely prevented.

**`driftScale` is authored route-side, NEVER in an Atelier-regenerated
`.layout.ts`** (drift spec D7) — whole-file regen silently drops it and the failure
is invisible. `Lab.layout.ts:6` carries the same warning.

The four widgets (`/api/books`, `now-playing`, `films`, `github`) move into card
content with their fetches unchanged. No new adapters — T4's default minimum.

**Docs that move in the same branch:** v2 spec §8 route table, `CONTEXT.md` lifelog
language, task-033's description. Project rule: a slice's design change updates the
spec in the same commit, unconditionally.

---

## WP-04 · `/about` · M1 · 4–6 h

Fourth instance of a working pattern (`ContentBoxLayout` + `ReadingSubstrate`,
`resting: 'quiet'`). Route entry, component, prerender, no-JS floor, Portal links.
Verified: no `/about` exists in `App.tsx` today. The bio copy is WP-06 and is on
this piece's critical path.

Verify `dist/about/index.html` carries both the prose and `data-server-rendered`.
Note: component-level `import './x.css'` code-splits and never loads for no-JS —
anything the pre-hydration floor needs belongs in `base.css`.

---

## WP-07 · Responsive layout foundation · M2 · 13–20 h · **hard floor, never cut**

**Starting position, verified:** `web/src` contains **seven** `@media` blocks, of
which exactly one is a layout query (`contentbox/ReadingSubstrate.css:21`,
`max-width: 640px`). The other six are `prefers-reduced-motion` (×4) and
`prefers-color-scheme` (×2). **There is no responsive system to extend.**

Touch *gestures* are in better shape than layout: `PeekTriggers` and `PortalNav`
branch on `matchMedia('(hover: hover)')` for tap-to-peek, and `pinGesture` is
PointerEvent-based so press-hold works on touch. That is why this piece is scoped
to layout and WP-08 takes the interaction model.

**Scope:** a breakpoint layer in tokens · content box and reading substrate at
narrow widths · frame-bar thumb-reach (PRD story 44 — no implementation today) ·
the composed `/lifelog` at phone width · `/stuff/flash` player sizing.

**Verification:** agent-browser at `set viewport 390 844` in the **main session**,
one screenshot per route, plus one pass on a real phone against the deployed build.

**Blocks:** WP-08, WP-11.

---

## WP-08 · Mobile pinned-card rail + touch model · M2 · 9–14 h · **CUT-7**

Spec §4's mobile spatial model: word-anchored floating cards are desktop-only;
previews collect at a bottom rail/sheet; pinned cards live on that bottom edge,
recall-able to their word's scroll position.

**Verified net-new:** `rail` appears **nowhere** in `web/src`. The brief records it
as "a comment in `PeekTriggers.tsx:138`", but that line's comment reads "mobile tap
→ bottom overlay" — the task-022 mobile bottom overlay is the real precedent, and
the rail generalises it.

Carries the **`armPressMs` reconcile**: `pinTuning.armPressMs = 200` (verified) vs
PRD story 42's ~350 ms mobile long-press. One is wrong; decide, and amend whichever
loses.

**Depends on WP-01** — auto-park/recall is exactly what task-035 documents as
flaky. Build on it only after its verdict.

**CUT-7 degradation:** mobile pins reuse the shipped box-edge park regime
(task-024). Keep still functions; it is just less considered. If cut, record the
spec §4 divergence in the same branch.

---

## WP-10 · `/claude` route (build half) · M4 · **CUT-2**

Documents copied into `content/claude/` with a simple index — not a build-time pull
from `~/Claude/`, which would break a clean clone of a public repo (T10).

**ADR-0008 applies in full**: Portal links as real `<a href>`, content present in
the prerendered HTML before any JS runs, a real no-JS floor. Prerender + sitemap is
the mechanical half only.

---

## WP-13 · Fat-line tethers · M4 · **CUT-1**

Scheduled last and cut first. If it survives to build, its first deliverable is
resolving the technique fork (SDF capsule in task-038's metaball field vs a
separate TSL node-material fat line) and recording it — an ADR if load-bearing.
`StringLayer` remains the no-WebGPU/JS-enabled fallback; `NoJsFallback` remains the
no-JS floor (ADR-0004).

New canvas work is **WebGPU/TSL-exclusive with a first-class static fallback**
(ADR-0009). R3F v9's async `gl` factory rejection reaches **no error boundary** —
catch in the factory and use `renderer.onDeviceLost`.

---

## Build-stream risks

- **The pin/auto-park subsystem is the plan's most-touched unverified area.** WP-08
  builds on it, task-035 documents four bugs in it, and nobody has checked whether
  drift fixed them. WP-01 is the mitigation and it runs first.
- **Toolchain pins are not to be bumped.** `vite`, `react-router-dom`,
  `vite-react-ssg`, `react`/`react-dom`, `typescript` are pinned by
  `vite-react-ssg`'s peer deps. Any bump is a separate slice
  (`docs/process/toolchain-pins.md`).
- **`bundle-splitting.test.ts` needs a build first** on a fresh worktree — run
  `npm run build` before `npm run test` or the Atelier guard fails on a
  vitest-`NODE_ENV=test` artefact.
- **`physicsTuning.ts` is Atelier whole-file-regenerated** — constants outside the
  schema are dropped on write-back. Read-at-use modules (`driftTuning`,
  `auraTuning`) are the pattern for anything that must survive.
- **Diff the full tree before committing after any Atelier/agent-browser session** —
  write-back can dirty files you did not touch. Never blind `git add -A`; stage by
  explicit path.
