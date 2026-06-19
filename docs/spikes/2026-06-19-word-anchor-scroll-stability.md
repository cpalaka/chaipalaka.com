# Spike: v2 word-anchor scroll stability

**Date:** 2026-06-19
**Task:** task-018 (gate — no production word-anchor code ships until this is green)
**Spec:** `docs/superpowers/specs/2026-06-18-v2-gwern-physics-design.md` §5
**ADR:** `docs/adr/0006-word-anchored-tethers.md` (this spike resolves its gate)
**Status of the code:** throwaway. The harness (`web/src/physics/spikes/*.spike.test.ts`)
was run to produce the numbers below and **deleted before commit** — this
document is the only artifact. Re-deriving is cheap: the recipes are all here.

---

## Verdict: **GO** ✅

A pinned, full-physics card tethered to a moving source word survives fast
scroll (trackpad fling, mobile momentum, dropped-frame catch-up) and the
word→edge auto-park hand-off **without the tether exploding or NaN-ing** — but
**not via the defense the spec/ADR named primary.** The spike inverts the
priority and adds three guardrails the production slices (4/5/8) must honour.

The documented fallback (lock vertical during scroll, sway at rest) is **not
needed**; translate-pair gives full-physics tracking.

---

## How it was measured

Reused the **real `PhysicsWorld` + `Tether`** (the gated one-sided overshoot
spring: `force = overshoot × tetherStiffness × mass`, `tetherStiffness = 1.75e-5`)
driven headlessly through synthetic scroll profiles. A pinned card (280×180,
mass ≈ 50.4) hangs from a static "word anchor" proxy by a rope of rest length
220. The card is a matter **sensor** so the rope/integrator is measured in
isolation from viewport-edge collisions — boundary jamming and off-screen
scroll are **auto-park's** job, not the rope's (an early run proved the naive
"failure" is dominated by the card jamming on the ceiling once its word leaves
the fold, which auto-park exists to prevent).

Scroll travel is held to ≈1 viewport because the word-anchored regime hands off
to edge-anchored (auto-park) the moment the word leaves the fold — that bounds
the rope's real exposure. Conclusions were **adversarially re-verified**: five
independent skeptics each tried to break the chosen approach from a distinct
failure lens; every proposed failure and its fix was reproduced in-harness.

---

## Finding 0 — the force-spring never numerically explodes on its own

Even **fully undefended**, every realistic on-screen profile (steady 800 px/s,
fling 8000 px/s, mobile momentum 6000 px/s, instant 900 px single-frame jump,
dropped-frame 900 px @ dt 50 ms, reverse fling) stays **NaN-free and bounded**.
The naive failure is purely **visual**: the card lags up to ~1.3 viewports
behind its word and slowly crawls back. The "i111 explosion" is a visual yank +
boundary jamming, **not** a numerical divergence. A naive dt-stress survives
**dt = 500 ms** with no NaN.

→ The production rAF `dt ≤ 50 ms` clamp is a **feel** guard, not a stability
guard. (`Tether.applyRopeForces` already guards `d === 0` before the unit-vector
divide, so degenerate coincident geometry cannot NaN either.)

---

## The chosen approach (refines ADR-0006 decision #3)

### 1. `translate-pair` is THE primary stability mechanism

Every frame, before `world.tick`:

```
word        = getBoundingClientRect(sourceWord)   // viewport coords; FINITE-CHECK it (see G4)
scrollDelta = word − prevWord                      // how far the word moved this frame
anchor      = word                                 // anchor TRACKS the real word exactly
Matter.Body.translate(cardBody, scrollDelta)       // move the card by the SAME delta
                                                   // (preserves velocity → sway survives)
```

Anchor and card shift by the same delta, so the **rope vector is invariant
under scroll** → overshoot/force stay at rest values at *any* scroll speed.

| profile (pair, no clamp) | maxOvershoot | maxSpeed | card↔word detach | rope-top lag |
|---|---|---|---|---|
| hold (rest) | 68 | 1.9 | 289 | 0 |
| fling 8000 px/s | **68** | **1.9** | **289** | **0** |
| mobile momentum 6000 px/s | 68 | 1.9 | 289 | 0 |
| instant 900 px / 1 frame | 68 | 1.9 | 289 | 0 |
| dropped-frame 900 px @ dt50 | 69 | 1.9 | 289 | 0 |

A fling reads identically to standing still. (Naive, for contrast: detach
875–1174 px, speed 55–62.)

### 2. DROP the per-frame anchor-delta clamp from the word-anchored regime

ADR-0006 named the clamp "the **primary defense** (not a backstop)." The data
says the opposite:

- It barely dents overshoot (a heavy, soft-roped card still lags even a
  40-px/frame-throttled anchor).
- It **breaks the core invariant**: throttling the anchor makes the **rope-top
  lag the real word by 250–860 px** during fast scroll — the rope visibly
  disconnects from the word it is supposed to point at (`anchorLag` 280 under
  clamp vs **0** under pair).

The clamp's stated purpose — "a pathological single frame cannot spike the
overshoot" — is **already provided by translate-pair**, and better: on a 3000-px
single-frame jump, pair keeps overshoot at 68. Keep at most a **finite/NaN guard**
on the anchor position; do **not** throttle anchor motion. (The clamp keeps one
legitimate role — the static-edge resize case, G3.)

### 3. Velocity-coupled damping is OPTIONAL polish and MUST be clamped — **the most important guardrail**

`pair` alone is fully stable. The spec's "viscous during scroll, alive at rest"
damping is a feel nicety, but the obvious implementation is a **latent NaN bomb**:

`frictionAir = 0.005 + 0.0008·|scrollDelta|` is **unclamped**, and matter.js
applies friction as `velocity *= (1 − frictionAir·dt/baseDelta)`,
`baseDelta = 16.667`. Once `frictionAir·dt/baseDelta > 2` the multiplier drops
**below −1** and the "damping" **inverts into a sign-flipping geometric velocity
amplifier** — faster scroll = *more* amplification, the exact opposite of intent.

| dt | inversion threshold `|scrollDelta|` | reachable by |
|---|---|---|
| 16.667 ms | > 2494 px/frame | programmatic `scrollTo`, 120 Hz fling, a11y fast-scroll |
| **50 ms** (the prod clamp) | **> 827 px/frame** | **a fast trackpad fling on a long page during a dropped frame** |

Reproduced in-harness: sustained 900 px/frame @ dt 50 → speed **1.6e9**, detach
**2.6e9** (→ NaN with more frames). **Fix:** cap the effective `frictionAir`
(≤ ~0.2 keeps the factor positive even at dt 50; with gain 0.0008 it saturates at
|scrollDelta| ≈ 244 px/frame — viscous, never inverting). Verified: capped → detach
274, bounded. **`pair` alone → detach 274, bounded** — so if in doubt, ship pair
with *no* velocity-damping and add a clamped version only as a tuned feel pass.

### 4. Auto-park / recall must be one-way (hysteresis) **and** relax the parked length to taut

The one-shot hand-off is **seamless**: choosing the new edge-tether length at the
card's live position makes post-swap overshoot ≈ 0, so the swap **releases** a
little sway tension (~0.04) rather than adding any — *less* than the card's own
resting rope tension (~0.06). No force pop, no NaN.

But re-tethering **every frame** (a word dithering ±1 px across the park line)
with `newLen = max(REST, currentDistance)` makes the rope **permanently slack**
(`d ≤ length` by construction → the one-sided rope applies zero force) → the card
**free-falls** (detach → **8501 px**). Two mitigations, both required:

- **Hysteresis / one-way park** (already mandated by the spec: auto-park is a
  one-way exit; recall is *manual*). Latching the swap → detach **83 px**.
- After the seamless snap, **ease the parked length back to REST** so the card is
  actually *held* at the edge, not left dangling on a slack rope.

### 5. Recursion (slice 8): translate the whole bonded **subtree**, not just the pinned card

A child hanging off a pinned parent via a **card-to-card rope (no length clamp)**
is not scroll-tracked by pairing only the parent: the parent's `translate`
violates the child's rope by `|scrollDelta|` each frame → child yanked off
(detach **2490 px**; diverges at dt 50). Translating parent **+ all descendants**
by the same scroll delta keeps the child glued (detach **35 px**).

---

## Guardrails the production slices MUST honour (summary)

| # | Guardrail | Slice |
|---|---|---|
| G1 | `translate-pair` is the stability mechanism; anchor tracks the real word (no motion clamp) | 4/5 |
| G2 | If velocity-damping is used, **cap `frictionAir` ≤ ~0.2** (never let `frictionAir·dt/baseDelta` approach 2). Prefer shipping pair with no damping first. | 5 |
| G3 | Auto-park is **one-way (hysteresis)**; the parked re-tether length **eases to REST** (taut), never left at `max(REST, dist)` (slack) | 5 |
| G4 | **Finite-check `getBoundingClientRect`** before feeding `scrollDelta` (an ancestor mid-CSS-transform / `display:none` yields ±Infinity → NaN in one frame) | 5 |
| G5 | Recursion pairs the **whole subtree**, not just the pinned card | 8 |
| G6 | Static-edge (i111) on **resize**: clamp the floor/ceiling move per frame, or translate-pair edge-anchored cards with their edge. In v2 the box edges are viewport-fixed so this does **not** bite during scroll — resize only. (naive 80 px/frame ceiling move → 4650 px yank; clamped 10 px/frame → 380 px.) | 1/5 |

---

## Adversarial pass — what was tried and what held

Five independent skeptics, distinct lenses. **Three found real defects (all in
the *auxiliary* pieces, none in translate-pair's geometry); two confirmed the
core holds.**

| Lens | Outcome |
|---|---|
| floating-point / NaN | **Real:** unclamped damping inversion → NaN (→ G2, G4). The `d===0` rope guard holds; NaN only enters via friction. |
| resonance / energy pumping | **Core holds:** translate-pair co-translates vertically while the swing mode is horizontal, so a periodic drive cannot pump the pendulum (θ-amplitude decays to 0 at the fundamental, T/2, and harmonics). The only break was the *same* friction-inversion term (→ G2). |
| dropped-frame / tab-resume | **Real:** at the dt 50 clamp the friction-inversion threshold is only 827 px/frame, reachable by a real fling (→ G2). The dt-clamp itself gives zero protection — the friction coefficient is driven by `scrollDelta`, which nothing clamped. |
| auto-park threshold thrash | **Real:** per-frame re-tether → permanently slack rope → free-fall (→ G3). |
| multi-card recursion | **Real:** parent-only pairing yanks the child (→ G5). |

---

## Reproduction (the throwaway harness, recreate if needed)

`web/src/physics/spikes/wordAnchorScroll.spike.test.ts` — matrix (profiles ×
{none, clamp, pair, pair+damp}), the force-spring-never-NaNs assertion, the
dt-stress, and the auto-park hand-off. `…/adversarial.spike.test.ts` — F1 damping
inversion + clamp fix, F2 park thrash + hysteresis, F3 recursion + subtree fix.
Run: `npx vitest run src/physics/spikes/*.spike.test.ts`. All numbers above are
from these against matter-js 0.20 in happy-dom. Card modeled as a sensor;
`physicsTuning` read live (no copied literals).
