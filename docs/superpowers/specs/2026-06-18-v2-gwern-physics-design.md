# chaipalaka.com v2 — gwern × physics-toy redesign

**Status:** Draft for review · **Tracked by:** task-017
**Provenance:** brainstorming + docs-aware grilling session, 2026-06-18 (Chai +
Claude), then hardened by a six-lens adversarial review that cross-checked every
repo claim against the actual `web/src` (the review corrected several
"reuse-the-existing-X" claims that were false; see the corrections woven through
§5, §11, §13, §14).

This document is the captured design direction for AC#1 of task-017; §13 is AC#2;
§18 is the AC#3 draft (no backlog tasks created until Chai's explicit go).

Read alongside `PRD.md` (v1 product spec — still authoritative for the
content/utility axes), `CONTEXT.md` (domain glossary — new terms in §19), and
`docs/adr/` (existing decisions; new ADRs in §20).

> **Reality-check legend.** Because the first draft over-claimed reuse, every
> "reuse" assertion below is tagged **[reuse]** (verified-present in `web/src`),
> **[extend]** (a real primitive exists but must be generalized/inverted), or
> **[new]** (greenfield — no repo support today). Build-cost honesty is the point.

---

## 1. The pivot in one paragraph

v1 treated the whole page as the artifact: a swarm of physics cards over a
generative background, "the site IS the toy." v2 keeps the toy but **relocates
it from the substrate into the interaction**. Each route is now a fixed,
readable **content box** (gwern-style: dense, typography-forward, calm) floating
over the generative shader. The play moves into one unified mechanic — a **link
ladder** (peek → keep → enter) where any meaningful link can be peeked as a
preview card, kept as a persistent physics toy strung to the very word it came
from, or entered as a full page. gwern's link-popups and footnotes supply the
reading-craft; the physics supplies the life. This is **more of an art project
than gwern.net** — aesthetic is the point, not a by-product of function. Adopt
typographic craft/density on the reading surface; reject density-as-furniture
(backlink graphs, similar-link clutter, metadata blocks) — that is the line
between "calm" (§1) and "dense" (§3/§13).

## 2. The governing principle (load-bearing)

> **The full physics-toy experience takes precedence. Progressive enhancement is
> an additive floor, never a ceiling on the toy.**

The accessible static document is the *source of truth* (§11), but building it
must never water down the pointer/JS toy. This costs the toy nothing:
1. the static layer is a **parallel fallback render** — the enhanced experience
   reads *from* it but is not *limited* by it;
2. the rule is "no *content* lives only in cards" — physics-only **decoration/
   flourish is still fully allowed**;
3. **reduced-motion is the user's own opt-out**, not a downgrade-for-all;
4. keyboard/no-JS/SR users were never getting a drag-toy anyway — giving them a
   clean read *adds* an audience without subtracting from the toy's.

Caveat the review surfaced: this principle must not be used to *defer* the
accessibility work the interaction model itself creates (focus management, SR
semantics, reduced-motion gating). The toy wins on the enhanced layer **and** the
floor is fully built; §11 makes the floor's new-build cost explicit.

## 3. The interaction model — the link ladder

Every meaningful link is **one object at three escalating commitment levels**:

| Rung | Verb | What it is | Trigger (desktop) |
|------|------|-----------|-------------------|
| **peek** | preview | an ephemeral preview card, stiff-anchored to its word | hover (dwell ~200–300ms) |
| **keep** | pin | the card made persistent — a full-physics toy strung to its word | press-hold the title bar → drag into page |
| **enter** | navigate | go to the full page (hero morph) | click the card body |

"Sub-page" vs "hanging card" is **not** an authored per-link choice — it is *how
far the visitor pushed the same object up the ladder*.

### Two preview/link types — Portal vs Pocket

A **Portal** is a link with a destination — peek it, keep it, or step *through* it.
A **Pocket** is self-contained — a footnote / aside / definition whose card *is*
the content, with nowhere to step through to.

| | **Portal** | **Pocket** |
|---|---|---|
| Has a destination page? | yes | no |
| Ladder | peek → keep → enter | peek → keep (no enter) |
| Content | a **lead/summary** of the target | the **whole note** (the card *is* the content) |
| Examples | another essay, a portfolio piece, a section index | footnotes, asides, definitions |
| Static floor | a real `<a href>` | a real inline disclosure (§11) |

gwern makes the same split (annotations/abstracts for article-popups; full text
for footnotes). Pocket has *nowhere to enter*.

## 4. Gesture grammar

### The card is the actor; the word is a handle

The preview spawns **side-positioned** (beside the word, not over it — keeps the
source sentence visible, the reading-first promise), with a **hover-bridge** so
the cursor can travel from word to card without dismissing it. Consequence: **on
the pointer layer the card is always the click/action target; the word is never a
navigation target** — it is only a hover-trigger, then a recall-handle once a card
is parked. (Keyboard/static layer inverts this — see §11; the word *is* the real
`<a>` nav target there. Both are intentional; do not strip nav off the word for
keyboard users.)

### Desktop

- **peek** — hover the link; after a short dwell (**~200–300ms**, with the cursor
  held reasonably **still — movement < ~4px during the dwell window** so a reading
  pause that micro-moves the cursor over a link does not fire) the preview card
  appears beside the word, **stiff-anchored** (small entrance bounce, then holds
  still so it is a reliable click/grab target — full physics only at pin).
- **hover-bridge** — a **safe-triangle grace region** between word and card (the
  "mega-menu diagonal" pattern): a cursor heading toward the card keeps it alive
  for **~300ms** even off the direct path; if the card flips to the other side or
  above/below on line-wrap or a viewport edge, the bridge follows. Not "an
  invisible rectangle."
- **enter** — click the card *body*. Portal → hero morph (§10). Pocket → see
  Pocket body rule below.
- **keep** — press-hold the **title bar** → an *arm* animation runs → the card
  releases from the word → drag into the page → release to pin. **Concrete
  disambiguation** (so click-to-enter and press-hold-to-arm don't collide on a
  small card): arm fires on **press ≥ ~200ms OR movement > ~6px**; release before
  both = a click (enter); pointer leaving the title bar before arm completes =
  **abort, not drag**. Title-bar **hit height ≥ ~28px** (an invisible hit-pad
  larger than the visual chrome) so previews aren't a sliver. The dwell-progress
  and arm-progress animations are the *visible* disambiguator before commit.
- **dismiss** — hover-end (or scroll-away): the temporary tether is **cut**, the
  card **falls under route gravity and despawns** with a **bounded fall lifetime**
  (despawns fast, never settles). **Scroll-dismiss is suppressed while the pointer
  is over the card or hover-bridge** (a card being reached for survives a stray
  scroll tick), with a small scroll grace threshold. The hover-dwell kills
  sweep-litter at the source; the bounded fall handles the rest.

### Pocket card body rule

Pick one, explicitly: **body-click on a Pocket card is inert; its body is a
passive (scrollable if overflowing) reading region.** Expansion/disclosure of the
note is the *keyboard/static* path (§11), not a pointer toggle — this keeps the
pointer grammar uniform (body = read, title bar = grab) and avoids a second
meaning for body-click.

### Mobile (hover → tap)

- **peek** — tap the link; the preview appears and **stays put**.
- **enter** — the card carries a **mobile-only open button** (Portal only).
- **keep** — long-press the card (same arm animation) → drag to pin.
- **dismiss** — tap anything but the card → cut tether → fall.
- **spatial model** — no side gutters on a full-width column, so word-anchored
  floating cards are **desktop-only**. On mobile a peek is a **non-reflowing
  overlay** — the box never resizes, so the reading text never moves; **previews
  collect at the bottom** of the screen (a bottom rail/sheet), the same edge where
  pinned cards live. The shrink-the-box-to-make-space idea (from the session) is
  **dropped** as the default — resizing the surface you're reading reflows the
  prose out from under your thumb. Pinned cards on mobile live on that **bottom
  edge rail**, recall-able to their word's scroll position.

### The title bar (card chrome) — **[extend], an interaction inversion**

The pin handle is a **window title-bar strip** (macOS/Windows window chrome,
*minus* the traffic-light buttons; consistent with ADR-0002 removing minimize).
It does triple duty: discoverability (reads as "grab here to move me"), the **drag
zone** (press-hold-drag on the bar; body is read/click), and a **label** (target
title for Portal, label for Pocket).

**Honest cost:** this is *not* a chrome reskin. v1's `Card.tsx` exposes only an
optional `header?` prop, and `CardImpl.tsx` today **suppresses** pointer-drag when
the target is inside `[data-card-header]`/`a`/`button` — i.e. **the body is the
drag handle and the header is the no-drag zone, the exact inverse of v2.** Slice 4
must **rewrite the card's pointer state machine** (title bar becomes the
press-hold/arm/drag zone; body becomes a click-to-enter target with click-vs-drag
disambiguation). Reuse is the *header DOM slot*; the interaction role is new.

## 5. Anchoring & scroll regimes

### Word-anchoring + per-word wobble — **[new] wobble, [reuse] pretext for geometry only**

A pinned card tethers to the **exact source word**; the tether *carries meaning*
(gwern's "the link and its content are connected," rendered as a physical rope).

**Correction from the review:** the word-wobble is **not** a pretext feature.
`@chenglou/pretext` (in the bundle, used only by `src/text/measure.ts`) is a pure
**text measurement/layout** library — no DOM nodes, no per-word rendering, no
animation. The wobble is **built from scratch**: wrap the whole anchored word in a
**single `<span>`** and drive a **transform-only** spring/oscillator on it
(never per-glyph). Transform-only + single-span is required so screen readers,
text selection, and copy-paste see **unchanged text** (PRD line 381: "pretext is
the text-measurement layer; it does not replace DOM text; all accessibility
decisions assume real DOM text"). pretext's legitimate role here is **[reuse]**:
its per-word segmentation/geometry (`prepareWithSegments`) helps *locate* a word's
box for anchor placement without forcing layout.

### Two anchor regimes

| Regime | Anchor | Behaviour |
|--------|--------|-----------|
| **word-anchored** | the source word | tracks scroll; word wobbles |
| **edge-anchored** | top/bottom edge | viewport-fixed; the "parked" state — **[reuse]** the existing ceiling/floor parent tether |

**Transitions:** user-drag to the top/bottom threshold → re-anchor to that edge;
**auto-park** when the word scrolls past the fold (parks at the edge it exited
through); **recall** — scroll the word back, it holds a **persistent highlight**,
**click the word → recall** the card (hysteresis ease). Recall is *manual* (never
automatic) so cards never yo-yo.

**Recall discoverability (review P1).** The persistent highlight is the *only*
recall affordance, and a bare highlighted word does nothing until a card is parked
— a mode the user must infer, and color+bold alone reads as emphasis, not a
button. Give the recallable-word highlight a **distinct, click-suggesting
treatment** separate from transient hover-emphasis (a small tether-stub/dot on the
word, or `cursor:pointer` + a subtle pulse on first scroll-back). Feel-AC on slice
5: *a first-time user can recall a parked card without instruction.*

### Runtime tether creation — **[new]**

CONTEXT.md: a Tether is "authored in a **PageDef**; never created or destroyed by
user action." Pinning **creates a tether at runtime from a user gesture** — a
capability v1 explicitly does not have. The card-parent *topology* is
**[reuse]** (see §9), but the runtime-creation path is **[new]** and belongs in
slices 4/5/8 and §17 risks.

### Scroll stability — GATED BY A SPIKE (highest technical risk)

**Corrected mechanism (review P1).** The repo's tether is **not** a
`Matter.Constraint` — it is a hand-rolled **one-sided overshoot spring**
(`src/physics/Tether.ts`: slack below rest length; `force = overshoot ×
tetherStiffness` only when distance > length; `anchorA` is a body-relative offset
resolved each frame — the exact structure behind the prior "moving a parent yanks
every child tether" regression, i111). So there is no constraint that "sees zero
relative motion"; there is a **per-frame force computed from current positions**,
and a single large positional jump injects a **one-frame overshoot→force spike**.

The spike must prove a pinned (full-physics) card tracks fast scroll (trackpad
fling, mobile momentum) and the auto-park hand-off without exploding. Validate, in
order of how load-bearing each is:
1. **Per-frame anchor-delta clamp** — the **primary defense** (not a backstop):
   the anchor may only chase the word so far per frame, catching up over several
   frames, so a pathological frame (dropped frame, backgrounded-tab catch-up)
   cannot spike the overshoot.
2. **Translate the bonded pair together** — move anchor *and* body by the same
   scroll delta so overshoot stays ~constant across the delta.
3. **Scroll-velocity-coupled damping** — heavier/viscous under fast scroll, lively
   at rest ("viscous during scroll, alive at rest"), Atelier-tunable — feel + a
   secondary cushion.
4. **Static-body interaction** — `PhysicsWorld.setViewport` moves the floor/
   ceiling/wall bodies; confirm scroll-tracking those does **not** drag
   edge-anchored cards.

**Coordinate transform (review P2):** the word anchor is **viewport-space**
(`getBoundingClientRect` → matter world coords, both viewport-relative); store the
word's document `scrollY` **only** for the recall/auto-park scroll-position logic.
Per-frame `getBoundingClientRect` reads are **bounded to the few currently-
tethered words** (it forces layout, the thing pretext avoids — acceptable for a
small set; measure the cost in the spike).

**Fallback if the spike fails:** word-anchored cards lock vertical position during
active scroll and only sway after scroll settles. Reference `Tether.ts` and the
i111 regression in the spike doc.

## 6. The content box & three-layer depth

- **One scrollable prose surface per route**, **fixed DOM** — not part of the
  simulation. (A scrollable readable surface and a jostleable physics body are
  near-contradictory; the requirement forces fixed-DOM.)
- Its **edges participate in physics**: cards collide against the box rect (static
  walls) and tether to its top/bottom edges (the edge regime). Physics-*aware*,
  not a physics *body*.
- **Solid (opaque) box.** Translucency-over-a-live-shader was considered and
  **rejected** — text over moving color cannot guarantee the ≥4.5:1 contrast
  "reading wins" requires. The contrast floor must hold **in both light and dark
  themes** (§13 dark-mode row).
- **Three planes of depth:** background = **shader**; middle = **solid content
  box** (shader visible around/behind it in the margins); foreground = **cards**,
  free to **overlap the box edges** for dimensionality. **No CSS `backdrop-blur`
  on cards** — card depth/effects come from solid surfaces + §16 fragment shaders,
  so the "glow/displacement" work cannot regress into the rejected glassmorphism.

## 7. Persistence & per-route resting state

- **Resting state is per-route**, declared in the PageDef: essay routes rest
  **quiet**; index/playful routes rest **populated**. Per-route cardinal gravity
  does the rest.
- **Persistence (phased):**
  - **Now (v2.0): ephemeral, session + per-route** — pins live only on that route
    this visit; reload returns to the PageDef resting state.
  - **Fast-follow (v2.1): persisted per-route** (localStorage) — each route
    remembers the arrangement. Deferred because that is where staleness bugs live.

## 8. Sitemap & route archetypes

**Uniform content-box model + bespoke exceptions.**

| Route | Archetype | Notes |
|-------|-----------|-------|
| `/` (home) | **bespoke landing** in v2 language | populated; balloons; ladder-links to sections are the first cards |
| `/blog`, `/blog/<slug>` | content-box | quiet; the reading heartland; the existing `/read` plain reader is the static floor |
| `/stuff/flash` + pieces | **bespoke** | a Ruffle player, not prose-with-links |
| lifelog signals | content-box | live widgets remain |
| about | content-box | quiet |
| 404 | **bespoke** | the floaty-error identity |

**Balloons vs cards** is just **per-route cardinal gravity** (`up` = balloons,
`down` = hanging cards) plus skin — already a PageDef field.

## 9. Transclusion, recursion, external links

- **Transclusion depth** — Portal preview = a **lead/summary**; Pocket card = the
  **whole note**.
- **Recursion — [reuse] topology, [new] runtime creation.** A child pin tethers to
  the parent card. **Correction:** this is **not** "NotesChain" — NotesChain was
  **removed in ADR-0001 §9** and exists nowhere in `web/src`; do not resurrect it.
  The real primitive is the **generic card-parent Tether**: a `Card` with
  `parent: <parentCardId>` (`Tether.ts` `wireTetherFor` handles `parentKind:
  'card'`; `resolveParent` maps a cardId `ParentRef` to a parent handle). The
  topology is reusable; the runtime-creation path (§5) is new. **One level deep**
  in the first cut; arbitrary depth deferred.
- **External links** — cannot be live-transcluded (cross-origin). Portal-shaped,
  but the preview is an **authored annotation card** (title + source + note);
  *enter* opens the URL in a new tab; visually distinct. Built **after** internal
  transclusion. (Link-rot/archiving is out of scope for now — see §13.)

## 10. Navigation transitions — retire & replace

The v1 physics route-transition system — **[reuse-verified present]**
`TransitionDirector`, `TransitionSpec` (the `TransitionId` union), `dispatch()`,
and `primitives/{anchorSlide,crossFade,pourInDrop,stringCutDrop}` — animated a
foreground *swarm* of cards drifting offscreen on navigation. v2 invalidates that
premise (a v2 page is a content box + sparse pinned cards), so **that subsystem is
retired** (already redesigned three times — #21/#81/#22). (Note: there is no
symbol literally named `TransitionPlan`; the plan-shaped artifact is the
`dispatch()` result + `TransitionSpec` — ADR-3 should enumerate the
`transitions/index.ts` barrel for an exact retirement blast radius.)

Replaced by **one rule at navigation time:**

> **Is there a source element to morph from?**
> → **Yes** (a card you clicked) → **hero morph**.
> → **No** (chrome/browser) → **physical default**.

- **Hero morph — [new], greenfield, spike-gated.** A clicked preview/pinned card
  **expands and reflows into the destination content box**. **Correction:** this
  is **not** "already in the stack." There is **zero** `ViewTransition`/
  `startViewTransition` usage in `web/src`; React is pinned at **19.2.6 stable,
  which does not export `<ViewTransition>`** (it ships only on React's
  experimental/canary channel — adopting it is a toolchain-pin change that
  collides with the `vite-react-ssg` peer-dep discipline in CLAUDE.md). The PRD
  only *specced* the morph (US-30 / slice 22, never built); there is no portfolio
  route; the only morph ever built (slice-28 FLIP) was **deleted by ADR-0002**.
  **A spike must decide the approach:** (a) the browser-native
  `document.startViewTransition` (no React dependency, but verify under
  `vite-react-ssg` prerender + `react-router-dom` v6 client nav, with a
  no-startViewTransition fallback for unsupported browsers); (b) `react@experimental`
  `<ViewTransition>` (toolchain-pin change to scope); or (c) the existing
  `canvas/flip.ts` FLIP rect-tween (no React API, already prerender-safe). The
  spike must also handle **focus + SR route-change announcement** across the morph
  (View Transitions can swallow these).
- **Physical default — [new]** — for **chrome-originated** navigation (frame bar,
  site-name/current-page indicator, browser back/forward, direct URL, any non-card
  link) where there is no source card: a lightweight, directional, gravity-
  flavored slide/crossfade of the content box. Preserves the v1 *spirit* without
  the card-swarm machinery.

## 11. Progressive enhancement & accessibility architecture

**The static prerendered accessible document is the source of truth** — but the
review made clear this is an **escalation beyond ADR-0004**, not merely honoring
it. ADR-0004 established a *per-route* no-JS floor (only `/blog/:slug/read` is
fully prerendered prose today) atop a PRD that is deliberately **client-first
(SSG + client hydration, no SSR runtime)**. v2 makes **every content-box route**
ship full prerendered prose + inline disclosures as the canonical layer — a real
architectural change worth its own ADR (§20).

- **Portal links** = real `<a href>` anchors in the prerendered HTML. **[reuse]**
  the no-JS prerender path (ADR-0004).
- **Pocket content = [new] pipeline.** There is **no footnote infrastructure
  today** — the MDX `remarkPlugins` are `remarkFrontmatter, remarkMdxFrontmatter,
  remarkMdxImages, remarkExtractToc` (no `remark-gfm`, no `remark-footnotes`), and
  there is no `<details>` anywhere. Slice 2 must: add a footnotes remark plugin;
  define the **single authored source node** (one MDX footnote/aside → both the
  in-flow inline render **and** the card-lift data hook); and render Pocket as a
  **disclosure** — a `<button aria-expanded aria-controls>` (or `<details>/
  <summary>`), **not** a styled `<a>`, so SR users hear "expand," not "link."
- **RSS — [new] generator change.** The claim "Pocket content appears in RSS" is
  **false on the current generator**: `src/blog/vite-plugin-feeds.ts` builds
  `<content:encoded>` from the **raw MDX `body` string** (via `gray-matter`), not
  rendered HTML — so a footnote node ships as unrendered source. Pick one in §11
  and name it: **(a)** change the feed generator to compile MDX→HTML for
  `content:encoded` (footnotes/Callouts survive into feeds), or **(b)** scope
  Pocket to plain markdown that survives the raw passthrough and drop the
  "full rendered footnote in RSS" promise. Default recommendation: **(a)**.
- **Keyboard** — Tab to the link, Enter navigates (Portal, the word *is* the `<a>`
  here — the pointer/keyboard actor inversion is intentional, §4); Pocket = the
  disclosure (Enter/Space toggles). The *toy* (drag/pin/recall) is pointer-only
  enhancement; no content is trapped behind it.
- **Reduced-motion — [new] gating, per motion.** Today **only** `TransitionDirector`
  and `BackgroundCanvas` read `prefers-reduced-motion`; **`PhysicsWorld`/`Card`/
  `CardImpl`/`Tether` never do** — once a card is active it sways/falls regardless.
  So "physics disabled under reduced-motion" is **net-new** and must cover **every**
  motion as an explicit AC on its slice: peek = instant placed preview; keep =
  instant pin; recall = instant snap; sway/fall = none (placed); word-wobble =
  static highlight only; morph = crossfade; snap-to-edge/dwell/arm/dissolve =
  instant. A new reduced-motion short-circuit in the sim is required.

> **Resolved — slice 2 / task-021 (the static-floor pipeline, shipped).** The
> "pick one" choices above are decided and built:
> - **Footnote parsing:** `remark-gfm` (GFM `[^1]` syntax) added to the MDX
>   `remarkPlugins`. A custom **`rehype-pocket-footnotes`** plugin then rewrites
>   the footnote hast into the Pocket floor: each definition becomes a
>   `<details class="pocket" data-pocket-id="…">` disclosure (the inline `<sup>`
>   reference anchor is preserved). `data-pocket-id` + `.pocket__body` is the
>   **card-lift hook** slice 4's ladder reads from the DOM.
> - **Disclosure mechanism:** `<details>/<summary>` (chosen over `<button
>   aria-expanded>`) — it toggles with **zero JS**, so the no-JS source-of-truth
>   floor is fully functional; SR exposes native `DisclosureTriangle [expanded]`
>   state. (AC#1's "aria-expanded" = "announces expanded state," met natively.)
> - **Link types:** a custom **`rehype-link-types`** plugin classifies prose
>   `<a>` by href — internal → `data-link-type="portal"`; absolute http(s) →
>   `data-link-type="external"` + `target=_blank rel="noopener noreferrer"` + an
>   out-arrow icon. In-page `#` anchors (TOC/heading/footnote) are left alone.
> - **RSS:** option **(a)** — `vite-plugin-feeds` now compiles the MDX body to
>   HTML (`compileBodyToHtml`, the *same* two rehype plugins) for
>   `content:encoded`, so footnotes render as disclosures in the feed. Custom MDX
>   **JSX components** (`Callout`, `Figure`, …) are **not** evaluated in the feed
>   (no React runtime there) — they drop out rather than ship as raw source.
>   Known limitation; a future follow-up if feed-rendered callouts are wanted.
> - **Responsive sidenote split:** the inline `<details>` floor is the baseline;
>   the desktop margin-sidenote *visual* fidelity is deferred to the capstone
>   design pass (§15), with `.pocket` as the restyle seam.

### Focus & SR semantics (review P1 — was entirely missing)

The interaction model's hardest a11y question. Minimum decisions (the codebase
proves the team does this — `FrameBar` restores focus to its settings button;
`BlogIndex` focus-follows after a section transition):
- **peek** — preview = a non-modal popover; opening does **not** steal focus.
  Keyboard has no hover/dwell, so a Portal/Pocket link needs a **focus-or-Enter**
  trigger for its preview/disclosure, not hover alone.
- **keep (pin)** — decide modal vs non-modal and the pinned card's **tab-order DOM
  position** (it floats visually but content stays in fixed DOM).
- **recall** — focus follows the recalled card.
- **hero morph** — move focus to the **destination content-box heading** (mirror
  `BlogIndex`'s focus-follow); the morph must not swallow the route-change
  announcement.

## 12. Discoverability

- The **title-bar handle is visible on every preview**, so *keep* is never hidden.
- The **populated home page** is the ambient teacher (loads with a card or two
  already pinned and gently swinging).
- **drag-to-pull is an intentional discover-by-poking power gesture** — the
  reward-on-interaction ethos of the inspiration gallery (Rauno, Lynn Fisher).
  **Recall is *not* in this bucket** (§5): a parked card you can't get back is a
  lost object, not a delighter — hence the distinct recall affordance + its
  feel-AC. No mandatory tutorial otherwise.

## 13. gwern.net traits — adopt vs reject (AC#2)

Confidence: high on gwern's documented features and on the repo facts (verified).
This is the deliberate cut, not a clone. Reuse tags reflect §14.

**Adopt — reworked through the physics lens, or already shipped:**

| gwern trait | How v2 takes it |
|---|---|
| Link-popups (hover previews) | the **peek** rung — a stiff-anchored physics preview card, side-positioned with a safe-triangle bridge **[new]** |
| Transclusion (linked content in place) | Portal preview = transcluded lead; the **hero morph** makes transclusion→full-page literal **[new]** |
| Footnotes / sidenotes | **Pocket** cards + their static inline-disclosure floor **[new pipeline]**; pinned Pocket cards *are* physical marginalia |
| **Table of contents** | **already ships** — `remark-extract-toc` + `reader__toc` sidebar (PRD story 20); carries into the content box as per-route nav **[reuse]** |
| **Admonitions / callouts** | **already ships** — `Callout` (`note`/`warn`/`aside` → `<aside role=note>`), reused as-is inside the box, no physics **[reuse]** |
| **Dark / light mode** | **already ships** — frame-bar toggle + `prefers-color-scheme` default (PRD 57/58, `useTheme`); the solid box + contrast floor are evaluated **per theme** **[reuse]** |
| Link-icons (per-link source/type glyph) | **adopt** — folds into the Portal/Pocket/external link-styling system already planned **[new]** |
| Distinct link styling per type | Portal vs Pocket markers; external-link marker **[new]** |
| Recursive popups | recursion, **one level** in v2.0 (child pin = `Card` with `parent:<cardId>`, §9) **[extend]** |
| Restrained, reading-first surface | the **solid box + contrast floor**; shader stays *around* text, never under it |
| Progressive enhancement | §11 — static document as source of truth **[new escalation]** |
| Sidenotes ↔ footnotes responsive collapse | **adopt** — reconcile with §4: desktop = side preview card; mobile = inline disclosure / edge rail. State the media-query split explicitly in slice 2/3 **[new]** |

**Reject — deliberately *not* gwern (each with its reason):**

| gwern trait | Why v2 rejects/diverges |
|---|---|
| Static, motionless "get out of the way" | v2 is an **art project / toy** — motion is the point on the enhanced layer |
| Inert side-panel popups only | previews are **physical objects you grab, pin, and string**, not panels |
| Near-grayscale austerity | v2 keeps the generative **shader** and a live identity (dark-mode handled above, not rejected) |
| Popup as pure reading accelerator | v2's popup is also a **toy** — *keep* and the word-tether have no gwern analogue |
| Infinite popup recursion | capped at one level (chaos/scope) |
| Backlink graphs / similar-links / metadata blocks | density-as-furniture; out of scope for a personal site (this is the line, not TOC — which we adopt) |
| Automatic external-link archiving / link-rot mitigation | out of scope for now — **stated** so the external-annotation cards (§9) knowingly assume a live target |
| Collapsible *prose* sections | scope to footnotes/disclosures only in v2.0; whole-section collapse deferred |
| Density as a virtue in itself | adopt typographic density on the surface; reject information-density furniture (§1) |

**Wide content — assumed absent in v2.0.** We assume content stays within the box
rectangle for the first cut, so this is **not a consideration now**. The
*asymmetric* idea it raised — wide images / visual content deliberately **jutting
out past the box borders** for an off-the-grid look (rather than everything inside
a clean rectangle) — is parked as a post-spine art-direction follow-up (§16).

## 14. v1 reuse vs new build (corrected accounting)

**[reuse] survives as-is or near-as-is:** the **card-parent Tether** topology
(`parent:'card'`); PageDef + per-route cardinal gravity; the ceiling/floor parent
tether (→ edge regime); the **TOC pipeline**, **Callout**, and **dark-mode toggle**
(§13); pretext **as a measurement helper** for word geometry; the Atelier (→
tuning dwell, damping curves, fall lifetime, snap easing); the no-JS prerender
path (ADR-0004).

**[extend] real primitive exists but must change:** the **card header slot** →
title-bar strip + **inverted pointer state machine** (§4); the **blog plain
reader** (`BlogPostReader`/`BlogPost` + MDX render) → generalized into the
content-box static substrate (note: `PlainLayout.tsx` is a ~9-line `<Outlet>`
wrapper — *not* a reading shell; the reusable reading-craft is the blog reader,
not the layout).

**[retired]:** the physics route-transition system (§10).

**[new] greenfield:** the ladder interaction layer (peek/keep/enter state
machine); side-positioned preview + safe-triangle bridge + dwell; the
**runtime-created** word-anchor tether (DOM-rect tracking, scroll-regime
transitions, recall); **per-word wobble** (single-span transform spring — *not*
pretext animation); hero morph + physical default; the **Pocket inline-disclosure
render pipeline** (remark-footnotes → in-flow HTML + RSS + card-lift, none of which
exists today); the **reduced-motion gating of the physics sim**; link-icons /
link-type styling; the content-box chrome (scroll container, solid bg, physics-
aware wall rect).

## 15. Visual design is a first-class phase (with an adjudication rule)

This is **more of an art project than gwern.net** — but the *visual* design is
sequenced **after** the functional spine, not woven into every slice (decided
2026-06-19). Designing the card chrome / preview look before the mechanic moves is
designing in a vacuum; a single impeccable + Claude-design pass over the *working
whole* (the capstone slice, §18) makes one coherent aesthetic decision with full
context. So:

- **Functional slices build on the existing v1 card design** as a placeholder, with
  styling kept **token-separable** (CSS custom properties — the repo's existing
  discipline) so the capstone pass is a clean reskin, not a rewrite.
- **Per-slice the deliverable is *mechanical* feel** — the physics timing of each
  moment (arm, snap, fall, morph), tuned via the **Atelier** — plus functional
  correctness, **not** final aesthetics. Mechanical feel still gets Chai's sign-off
  (does the pin/scroll/morph feel physically right); visual aesthetics do not, yet.
- **The capstone design pass** (§18, final slice) owns the look: card chrome,
  preview/Portal/Pocket styling, box type/color/spacing, the motion vocabulary
  below, and the §16 art-direction.

The feel moments the capstone pass addresses (their *mechanical* timing tuned
per-slice via the Atelier):

| Feel moment | Intent | Anchor (ref · band · sign-off) |
|---|---|---|
| arm / long-press (release-from-word) | tactile "it came loose" | Rauno micro-interactions · ~150–250ms, ease-out-quint · Chai/agent-browser |
| parked snap-to-edge | decisive but soft landing | · ~200–300ms, ease-out-expo · Chai |
| card chrome (title bar, body, outline, highlight states) | window-object that's alive | · static + 1–2px hover lift · Chai |
| dissolve / fall-on-dismiss | quick physical exit, no litter | · bounded < ~600ms · Chai |
| dwell-progress | "keep hovering" hint, barely-there on a real peek | · reveals only after ~120ms · Chai |
| per-word wobble | the word "has weight hanging off it" | · subtle, transform-only · Chai |
| hero morph | preview *becomes* the page | portfolio thumb→detail intent · ~300–450ms · Chai |

## 16. Deferred art-direction follow-ups (post-spine)

- **Fragment-shader effects on cards** — a foreground R3F layer rendering shader
  quads tracking the DOM card rects (same rect-tracking as the word-anchor) for
  dissolve/displacement/glow; SVG `feTurbulence`/`feDisplacementMap` or CSS
  Houdini as no-WebGL fallback. **No `backdrop-blur`** (§6).
- **Background-shader overhaul** — refresh/replace the v1 generative backgrounds.
- **Asymmetric wide media** — let wide images / visual content **jut out past the
  content-box borders** for an off-the-grid, asymmetric look (vs. everything inside
  a clean rectangle); reconcile with the card foreground plane that shares the edge
  space (§6).

Noted, none in the core v2 slices. **Tracked as backlog drafts DRAFT-002
(card fragment shaders), DRAFT-003 (background-shader overhaul), DRAFT-004
(asymmetric wide media)** — split out of the capstone TASK-030 (2026-06-19).

## 17. Open risks & spikes

| Risk | Mitigation |
|---|---|
| **Word-anchor scroll stability** (highest) | **spike gates the commitment** (§5); delta-clamp (primary) + translate-pair + velocity-damping; static-body interaction check; force-spring (not constraint) reasoning; fallback documented |
| **Hero morph approach + a11y** | **spike** (§10): startViewTransition vs react@experimental vs FLIP, under `vite-react-ssg` prerender + RR-v6; focus/SR announcement preserved |
| **Pocket footnote + RSS pipeline** | **[new]** remark-footnotes + single-source node + disclosure semantics + MDX→HTML feed render (§11) — net-new, not reuse |
| **Runtime tether creation** | v1 forbids user-created tethers (§5); new runtime path + lifecycle (create on pin, destroy on dismiss/recall) |
| **Title-bar pointer inversion** | CardImpl pointer state-machine rewrite (§4), not a reskin |
| **Reduced-motion gating of the sim** | net-new per-motion gate (§11) — none exists today |
| **Mobile peek reflow** | default to non-reflow overlay (§4); if shrink, pin scroll-anchor + SR test |
| Perf: shader + sim + wobble + many cards | reuse v1's physics+shader budget; wobble/rect-reads bounded to tethered words; profile in the Atelier |

## 18. Implementation slices (AC#3)

> **STATUS (2026-06-19): the split is live on the backlog board** as **13 tasks**
> (`claude-generated`), created in dependency order (two spikes, then the spine,
> then the capstone design pass). The board is the single source of progress; the
> list below is the rationale, not live state. **Decision: visual/component design
> is deferred to the capstone design-pass slice** (the last task); functional
> slices build on the existing v1 card design, token-separable (§15).

Each motion-bearing slice carries a reduced-motion AC (§11) and a *mechanical*
feel deliverable (§15). Ordering:

0. **Spike: word-anchor scroll stability** (gate — no production word-anchor code
   until green). Also spike the **hero-morph approach** (§10) here or in slice 6.
1. **Content box + three-layer shell** — fixed scrollable prose box, solid, over
   the shader; physics-aware edges; generalize the blog plain reader into the
   static substrate. (Assumes content stays within the box — no wide-media rule in
   v2.0, §13.)
2. **Portal/Pocket content model + static floor [new pipeline]** — add
   remark-footnotes; single authored source → inline **disclosure** (button/
   `<details>`, correct SR role) + card-lift data hook; real anchors; link-type +
   link-icon styling; **MDX→HTML RSS render**; sidenote↔footnote responsive split.
3. **Peek** — dwell-hover (+still threshold), side-positioned stiff preview,
   safe-triangle bridge, transclude the lead; mobile tap + non-reflow overlay;
   dismiss-fall (+scroll-dismiss suppression); dwell-progress + card chrome.
   *(reduced-motion AC; feel AC)*
4. **Keep** — **CardImpl pointer state-machine rewrite** (title-bar arm/drag, body
   click-to-enter, concrete thresholds §4); **runtime tether creation**;
   word-anchor; **per-word wobble (single-span transform spring)**; transient +
   persistent highlight + recall affordance. *(reduced-motion AC; feel AC)*
5. **Scroll regimes** — word↔edge, auto-park, **recall (hysteresis + discoverable
   highlight)**; delta-clamp + velocity-damping from the spike; snap-to-edge.
   *(reduced-motion AC; feel AC)*
6. **Enter / hero morph** — the spiked approach; retire the v1 transition system;
   physical default for chrome-originated nav; **focus-to-heading + SR
   announcement**. *(reduced-motion AC; feel AC)*
7. **Per-route resting + sitemap rollout** — quiet/populated PageDef field; home
   bespoke landing; route archetypes; balloons via cardinal gravity.
8. **Recursion (one level)** — child pins via the **card-parent Tether** (not
   NotesChain), over the runtime-creation path.
9. **v2.1: persisted per-route pins** (localStorage) — fast-follow.
10. **External-link annotation cards** — authored previews.
11. **Full v2 design pass (capstone)** — impeccable + Claude design over the
   working spine: card chrome, preview/Portal/Pocket styling, box type/color/
   spacing, the motion vocabulary, plus the §16 art-direction (card fragment
   shaders, background-shader overhaul). Owner-driven; built only once the spine
   works.

## 19. Domain language additions (for CONTEXT.md)

Add when stable (do not duplicate existing v1 terms): **Ladder** (peek/keep/enter)
+ its rungs; **Portal** (link with a destination) / **Pocket** (self-contained note); **Preview card** (peek, stiff-anchored)
vs **pinned card** (full physics); **word-anchored** / **edge-anchored** regimes;
**auto-park**; **recall**; **hero morph** vs **physical default** (replacing the
retired transition terms); **content box**; **bonded trio** (word + tether + card).
Note explicitly that **NotesChain is retired (ADR-0001 §9)** and the card-parent
**Tether** is the real primitive, so it is not reintroduced.

## 20. ADRs to write

1. **The link ladder & content-box model** — the v2 interaction paradigm and the
   relocation of play from substrate to interaction.
2. **Word-anchored tethers + runtime tether creation + scroll regimes** — the
   DOM-rect anchor type, the force-spring stability approach, the spike gate.
3. **Retire the v1 physics route-transition system** — supersedes #21/#81/#22;
   replaced by morph-or-default; enumerate the `transitions/index.ts` barrel for
   the retirement blast radius.
4. **Progressive-enhancement escalation** — every content-box route becomes a
   prerendered source-of-truth document; this **extends ADR-0004** beyond its
   per-route floor and reverses the PRD's client-first/no-SSR posture for content
   routes (review P1).

(ADR-0004 no-JS fallback and ADR-0002 minimize-removal remain valid and are
referenced, not superseded. ADR-0001 — which removed NotesChain — is cited by §9.)
