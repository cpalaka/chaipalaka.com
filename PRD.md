# chaipalaka.com — v1 PRD

Synthesized from the design grilling captured in `grillmedoc.md`. Ready for implementation.

## Problem Statement

The site owner wants a personal home on the internet at `chaipalaka.com` that doubles as a portfolio of frontend craft. Existing personal-site frameworks treat the page as a passive document; the owner wants the site to *be* an artifact — visibly experimental, physics-driven, generative — without sacrificing the everyday utility of a blog, a portfolio, and a public lifelog. Hosting and DNS are already provisioned (Hetzner CX22 at `178.105.87.102`, AWS Route 53 for DNS, Caddy serving `/var/www/chaipalaka` with automatic TLS), but no application code exists yet.

The site must succeed on three axes simultaneously, and each axis tends to pull against the others:

1. **Aesthetic identity** — physics-affected foreground cards over interchangeable generative-art backgrounds, expressive enough that the site itself reads as a portfolio piece.
2. **Content utility** — a blog, a portfolio of Flash-era stick-figure animations, and a "lifelog" surfacing live signals (now-playing, currently reading, recently watched, recent code activity), each with a real URL, real text, real RSS, real shareability.
3. **Graceful degradation** — readable on mobile, on touch, on reduced-motion, on no-WebGL, on screen readers, in plain-text-reader mode for long-form posts.

The PRD resolves the architecture and interaction model that lets all three axes coexist.

## Solution

A statically-generated React site (Vite + `vite-ssg`) deployed to the existing Hetzner box, with a small Bun backend running alongside Caddy to mediate live data sources. The site has two layout shells — a canvas-mode shell that mounts a persistent R3F generative-art background, a matter.js-driven foreground of physics cards, and a persistent **frame bar** (taskbar) at the top or bottom of the viewport, and a plain-mode shell for long-form reading that ships zero WebGL. Every navigation between canvas-mode routes is a physics transition; specific shared-element morphs (portfolio thumbnail growing into the detail page) use the React 19 View Transition API; minimize/restore between a card and a chip in the frame bar uses a FLIP morph (Web Animations API). Live data (last.fm, Letterboxd, GitHub) flows through `/api/*` endpoints proxied to the Bun service, which holds API keys and serves stale-while-revalidate cached responses so the lifelog feels alive even when third parties misbehave. Content (blog posts, books, notes, portfolio metadata) lives as MDX in a `content/` directory in the same git repo. Drafts stay on localhost; production is deployed via a local `make deploy` Makefile that `rsync`s build artifacts to the server. Visual identity is a Swiss-grid restrained brutalism — IBM Plex Sans throughout (16px / line-height 1.3 / letter-spacing −0.01em) with JetBrains Mono reserved for code blocks, a fixed three-color palette with one accent (`#e60000`), 4px solid card borders with 4px radius and a soft drop-shadow, 24px padding/gap. Color mode is a user-toggleable binary (light: `#f8f8f8` / `#000` / `#e60000`; dark: `#0a0a0a` / `#f8f8f8` / `#e60000`) that respects `prefers-color-scheme` on first visit and persists overrides in `localStorage`. Everything remains skinnable through CSS custom properties so the owner can iterate without touching component code.

Daily notes and lifelog annotations appear as first-class cards strung to their parent lifelog card via visible string connectors — they hang or float under gravity, reusing the same physics primitives that make the rest of the site feel alive. The frame bar carries the site name, current-page indicator, section nav, a strip of minimized-card chips, and a settings menu through which the visitor toggles the active background, switches theme, and picks the frame edge (top/bottom). Gravity is always on; each route declares its own gravity direction.

## User Stories

### Visitor / general

1. As a first-time visitor, I want the homepage to load fast and tell me what this site is, so that I can decide in seconds whether to keep exploring.
2. As a visitor, I want to see a persistent generative-art background behind the content, so that the site has visual personality without me having to seek it out.
3. As a visitor, I want to switch between four different generative-art backgrounds via a discreet control, so that I can pick the one that suits my mood.
4. As a visitor, I want my background choice to persist across navigation and page reloads, so that I don't have to re-pick it every time.
5. As a visitor, I want the foreground content to be composed of cards that subtly bob, tilt toward my cursor, and respond to clicks with a springy press, so that the page feels alive rather than static.
6. As a visitor, I want to drag a card and see it swing like a pendulum when I release it, settling naturally at its taut string position, so that the physics feels real and satisfying.
7. As a visitor, I want to push cards into each other and see them collide, so that the physics feels physically real, not decorative.
8. As a visitor, I see cards hanging from a ceiling and feel gravity's effect, with each section of the site having its own gravitational character — the home page is grounded, the 404 page floats everything away.
9. As a visitor, I want navigating to a new route to feel physically directional — cards exit toward gravity, new cards settle in from their anchors, so that navigation reinforces the site's physical metaphor.
10. As a visitor, I want a persistent frame bar (taskbar) along the top or bottom of the viewport that carries the site name, current-page indicator, section nav, minimized-card strip, and a settings menu, so that the chrome stays accessible from every route without competing with the physics foreground.
12. As a visitor, I want to choose whether the frame bar sits at the top or the bottom of the viewport, and have that preference persist, so that the chrome doesn't fight my reading habits.
13. As a visitor, I want the frame bar to stay accessible at all times (it sits outside the physics world as DOM chrome), so that I never end up stuck in a state I can't navigate out of.
14. As a visitor, I want the 404 page to feel physically wrong — cards floating upward and piling against the ceiling — so that the failure case is immediately legible as an error without a wall of text.
15. As a visitor, I want page transitions between canvas-mode routes to be physics-driven (cards drift offscreen, new cards drop in), so that navigation reinforces the site's physical metaphor.
16. As a visitor, I want forward navigations and back navigations to feel directionally distinct, so that the site implicitly tells me which way I'm going.

### Reader / blog

17. As a reader, I want to find a blog at `/blog` with a list of posts in reverse-chronological order, so that I can find the latest writing.
18. As a reader, I want each blog post at its own URL (`/blog/<slug>`), so that I can share specific posts.
19. As a reader, I want every blog post to have a "Read in plain mode" link, so that I can opt out of the canvas/physics chrome for long reads.
20. As a reader in plain mode, I want zero WebGL, zero physics, and a reading-optimized layout with a sticky table-of-contents sidebar, so that I can focus on the writing.
21. As a reader in plain mode, I want the URL to be `/blog/<slug>/read`, so that I can bookmark or share the canvas-free version specifically.
22. As a reader, I want syntax-highlighted code blocks rendered server-side, so that code samples are legible immediately without a client-side highlighter loading.
23. As a reader, I want images in posts to be lazy-loaded, so that long posts with many figures don't stall my connection.
24. As a reader, I want a working RSS feed at `/rss.xml` with full post bodies, so that I can subscribe in my reader of choice.
25. As a reader, I want OpenGraph metadata on every post, so that links to my posts render with previews on social platforms.
26. As a reader, I want live React widgets to be embeddable inline in MDX (e.g., a `<NowPlaying />` widget mid-post), so that the writing can pull from live data when relevant.

### Portfolio visitor

27. As a portfolio visitor, I want to find Flash animations at `/portfolio`, so that I can browse the site owner's archived work.
28. As a portfolio visitor, I want each animation to play in-browser via Ruffle without me installing anything, so that I can actually watch the work.
29. As a portfolio visitor, I want each piece to have a dedicated route with description, year, and any retrospective notes, so that I get context, not just the artifact.
30. As a portfolio visitor, I want clicking a portfolio thumbnail to morph it into the hero of the detail page (shared-element transition), so that the navigation feels deliberate and elegant.
31. As a portfolio visitor, I want the portfolio index cards to be detached from any string (gravity acts, they fling and fall when dragged), so that the index itself reflects the playful subject matter.
32. As a portfolio visitor, I want Ruffle's WASM payload only to load when I'm on a portfolio route, so that visitors never browsing portfolio pages don't pay its bundle cost.

### Lifelog visitor

33. As a lifelog visitor, I want to find a `/lifelog` page that surfaces five sources at once: now-playing music, currently-reading books, recently-watched films, recent GitHub activity, and a stream of free-form daily notes, so that I get a sense of what the site owner is up to.
34. As a lifelog visitor, I want a dashboard-of-cards default view, so that each source has its own visual presence.
35. As a lifelog visitor, I want a "feed view" toggle that merges everything chronologically, so that I can read the site like a journal when I want to.
36. As a lifelog visitor, I want notes to appear as small balloon cards strung to their parent lifelog card via a visible string (straight when taut, sagging when slack), so that I can see "this commentary belongs to that book."
37. *(removed — superseded by the strings model; notes are first-class balloon cards in the standard physics world; no soft cap or inline-expand affordance. See ADR 0001.)*
38. *(removed — note ordering is now determined by `CardLayout` for the route; no per-position recency rule. See ADR 0001.)*
39. As a lifelog visitor, I want lifelog cards to keep showing their last-known value when an upstream source is broken or slow, so that the page never has gaping holes.
40. As a lifelog visitor, I want to see a small "stale" hint when data is being served from cache after an upstream failure, so that I know the timing isn't necessarily live.

### Mobile visitor

41. As a mobile visitor, I want vertical scrolling to never be hijacked by accidental card drags, so that I can read the site normally.
42. As a mobile visitor, I want to long-press (~350ms) a card to "grab" it, then drag it freely while my finger is down, so that I can still play with the physics.
43. As a mobile visitor, I want a brief scale-up + shadow-lift animation at the moment the long-press triggers, so that I can feel when the grab succeeded.
44. As a mobile visitor, I want the frame bar (and its settings menu) to be thumb-reachable, so that I can access toggles one-handed.
45. As a mobile visitor, I want the same content shape as the desktop site (no separate "mobile site"), so that my experience isn't second-class.

### Accessibility

46. As a visitor with `prefers-reduced-motion: reduce`, I want all physics perturbation to drop to zero so cards sit still at their anchors, so that I can use the site without vestibular distress.
47. As a reduced-motion visitor, I want the generative-art background swapped for a pre-rendered static gradient, so that nothing in my peripheral vision is animating.
48. As a reduced-motion visitor, I want route transitions to become instant cross-fades rather than physics motions, so that I'm never thrown by an animation I didn't ask for.
49. As a screen-reader user, I want the WebGL canvas marked `aria-hidden="true"`, so that decorative content doesn't pollute my reading.
50. As a screen-reader user, I want every card's content to live in semantic DOM (`<article>`, `<a>`, `<h1>`, etc.) regardless of physics-driven visual position, so that reading order is determined by structure, not pixels.
51. As a screen-reader user, I want note cards nested as an `<aside aria-label="notes">` inside their parent's `<article>`, so that the relationship is announced as a group.
52. As a keyboard user, I want Tab order to follow the DOM order of cards, so that I navigate predictably regardless of physics positions.
53. As a keyboard user, I want a high-contrast custom focus ring (the default browser ring is invisible against R3F backgrounds), so that I always know where focus is.
54. *(removed — there is no expanded notes-chain to collapse; notes are regular balloon cards. `Esc` still closes the settings menu, declared in the Frame bar section.)*
55. As a visitor on a browser without WebGL, I want the foreground physics to keep working and the background to swap to a static gradient, so that most of the experience survives.
56. As a visitor whose WebGL context is lost mid-session, I want the background to fall back gracefully to a static gradient without a page reload, so that the site keeps working.

### Theme

57. As a visitor on a system with `prefers-color-scheme: light`, I want the site to default to a light theme, so that it respects my OS preference.
58. As a visitor, I want a manual theme toggle in the frame bar's settings menu, so that I can override the system default.
59. As a visitor, I want my theme override to persist, so that I don't have to re-pick it.
60. *(removed — accent is now a fixed `#e60000` in both color modes; backgrounds are visually independent from the foreground palette. See "Visual identity" below.)*

### Site owner / authoring

61. As the site owner, I want to write a blog post by creating a `content/blog/<yyyy-mm-dd>-<slug>/index.mdx` directory with frontmatter and co-located images, so that all assets for one post live in one place.
62. As the site owner, I want frontmatter to be zod-validated at build time, so that missing required fields fail the build rather than silently broken posts.
63. As the site owner, I want to mark a post `draft: true` and have it visible only on `npm run dev`, so that I can write in progress without leaking work-in-progress.
64. As the site owner, I want a small library of MDX components — `<Callout>`, `<Figure>`, `<Video>`, `<NowPlaying>`, `<BookCard>`, `<RuffleEmbed>` — available in any MDX file, so that I can compose rich posts without per-post setup.
65. As the site owner, I want to add a book by creating a `content/books/<slug>.mdx` with status (`reading` / `finished` / `abandoned` / `want-to-read`), so that the lifelog books card stays current with one file edit.
66. As the site owner, I want to add a daily free-form note by creating a `content/notes/<yyyy-mm-dd>-<slug>.md` with `parent: null` frontmatter, so that the daily-notes feed updates with one file.
67. As the site owner, I want to attach a note to a specific book/film/track by setting `parent: book:<slug>` (or `letterboxd:<id>`, `lastfm:<mbid>`) in the note's frontmatter, so that annotation reuses the same authoring system as standalone notes.
68. As the site owner, I want a `make deploy` command that builds the frontend, builds the backend, `rsync`s artifacts to the Hetzner box, and SSH-restarts the API systemd unit, so that deploying is one command.
69. As the site owner, I want a separate `make assets-sync` command for syncing large media (SWFs, video, music) to `/var/www/chaipalaka/assets/`, so that media changes don't have to ride with code deploys.
70. As the site owner, I want secrets in `/etc/chaipalaka.env` on the server (root-owned, mode 600), referenced by the systemd unit's `EnvironmentFile=`, so that no secrets ever live in git.
71. As the site owner, I want the source repo public on GitHub, so that the site itself becomes part of the portfolio.
72. As the site owner, I want the visual design to be configurable via CSS custom properties (theme, accent, type scale, spacing) so that I can iterate on aesthetics by editing one stylesheet, not component code.

### RSS / search-engine / sharer

73. As an RSS subscriber, I want full post bodies in the feed, so that I can read in my reader without bouncing back to the site.
74. As a search engine crawler, I want a `/sitemap.xml` listing all canonical routes, so that I can index the site efficiently.
75. As a search engine crawler, I want every blog and portfolio page to ship pre-rendered HTML with title, description, and OG tags, so that previews and snippets work without executing JavaScript.
76. As someone sharing a link, I want every page to resolve to a URL with a real `<title>` and `og:image`, so that the link previews on Slack/Twitter/Bluesky.

## Implementation Decisions

### Architecture

- **SSG with client-side hydration.** Vite + React + TypeScript, prerendered via `vite-ssg`. Output is a static `dist/` directory served by Caddy's existing `file_server` block. No SSR runtime.
- **Two layout shells:**
  - `CanvasLayout` — wraps Home, Portfolio, Lifelog, Socials, Blog index, Blog post (canvas variant). Mounts a persistent R3F `<Canvas>` once, a matter.js physics world, and the persistent frame bar (taskbar). Foreground swaps per route; the frame bar and `<Canvas>` do not re-mount across canvas-mode navigations.
  - `PlainLayout` — wraps reader-mode URLs (`/blog/<slug>/read`). No WebGL, no physics. Bundle for these routes excludes Three.js / matter.js entirely via route-level dynamic imports.
- **Plain-mode links use real `<a>` (not React Router `<Link>`)** to force a document fetch and prevent the canvas-mode JS bundle from ever loading on plain pages.
- **Persistent canvas across canvas-mode navigations.** The `<Canvas>` lives at the `CanvasLayout` level; navigation between canvas routes does not re-mount it. Foreground cards re-lay out per route.
- **Conventional URL routing.** Each section is its own route (`/`, `/portfolio`, `/portfolio/<slug>`, `/blog`, `/blog/<slug>`, `/blog/<slug>/read`, `/lifelog`, `/links`). No spatial-canvas / desk-metaphor navigation.

### Foreground physics — `PhysicsWorld`, `PhysicsCard`, `CardLayout`

- **Chrome-level physics.** Cards are physics-affected containers; text inside them lays out as normal DOM. The card's *position and rotation* are physics-driven; the *content within* is HTML.
- **DOM cards over WebGL background.** Cards are real HTML elements (`<article>`, `<a>`, etc.) positioned per frame via `transform: translate(x, y) rotate(θ)` where the values come from matter.js. The R3F canvas runs as a separate background layer (full-viewport, z-index below the card layer). The two layers don't physically interact.
- **Physics anchor positions are the *initial* layout.** Each `PhysicsCard` computes a CSS-grid anchor position; matter.js spawns the body at that anchor. Subtractive fallbacks across all degradation modes work the same way (no physics → just the grid).
- **`PhysicsWorld` module** owns the matter.js engine, gravity vector, the static ceiling/floor/wall bodies, and the registration table. Public interface: `register(anchor, opts) → handle`, `unregister(handle)`, `setGravityDirection('down'|'up'|'left'|'right')`, `setPosition(handle, vec)`, `setVelocity(handle, vec)`, `setAnchor(handle, vec)`, `applyImpulse(handle, vector)`, `linkBodies(a, b, opts) → linkHandle`, `unlinkBodies(linkHandle)`. Implementation hides matter.js entirely. The `setStatic` and `setSensor` methods are internal (no longer part of the public API).
- **Card interaction states — STRUNG or DETACHED:**
  - `strung` — body has a `Tether` constraint connecting it (transitively through other cards) to the ceiling or floor static body. Gravity acts but the rope holds the card near its layout position. Dragging a strung card pulls it in an arc; releasing lets it swing as a pendulum until friction settles it.
  - `detached` — body has no tether. Gravity acts unopposed; the card falls (or floats, if a balloon) until it hits a wall.
- **String topology is design-time per route.** No UI for creating or destroying strings at runtime. Each route declares a `PageDef` specifying each card's `parent` (`'ceiling' | 'floor' | <cardId>`) and `kind`. The padlock icon is removed.
- **Buoyancy is per card-type.** `kind: 'note'` → balloon (per-tick force opposite gravity). All other kinds → heavy (falls with gravity). Per-instance override allowed. Balloon cards strung from the floor float upward to their taut string length; heavy cards strung from the ceiling hang downward.
- **Layout determines string length.** String length for each card = `distance(parentAnchorPos, cardLayoutPos)`. Cards rest at their `CardLayout` positions — the load-bearing "anchor positions ARE the layout" principle is preserved.
- **Aspirational idle perturbation.** Subtle behaviors — idle bob, hover-tilt toward cursor, springy click-press feedback (see user story 5) — are kept as future scope; the current implementation is drag/pendulum-release only.
- **Card pre-sizing via pretext.** Each card's text size is precomputed via `PretextRegistry.measure()` before the body is registered with matter.js, so the body has correct dimensions from the start and we never call `getBoundingClientRect()` per card.

### Touch / mobile

- Long-press-to-grab, ~350ms threshold (tunable). Below threshold, the gesture passes through to scroll. At threshold, the card scales up slightly + lifts a shadow as a "you've grabbed it" cue, then drag begins.
- Same strung/detached interaction model as desktop. Strung cards swing as pendulums on release; long-press resumes drag.

### Frame bar + minimize — `FrameBar`, `MinimizedRegistry`

The frame bar is the persistent app-shell chrome. It replaces the original "controls panel as a physics card" idea: settings live in a dropdown menu attached to the frame bar instead of in a draggable card, and the frame bar itself is DOM chrome, not a physics body.

- **Position.** Anchored to the top *or* bottom edge of the viewport (user-configurable, persisted in `localStorage` under e.g. `chaipalaka.frame.edge`). Full-width, fixed height (~40px). Sits above the physics layer (z-index above cards) but is not part of the physics world.
- **Contents, left-to-right (or top-to-bottom on mobile if needed):**
  1. Site name (`chaipalaka`).
  2. Current-page indicator (e.g., `/blog`, `/lifelog/books/<slug>`), updated on route change.
  3. Section nav (`/`, `/blog`, `/lifelog`, `/portfolio`).
  4. **Minimized-card strip** — chips for every currently-minimized card across the whole session (not per-route).
  5. Settings menu — dropdown anchored to the right end with: background picker, color-mode toggle, frame-edge toggle.
- **`FrameBar` component** lives in `CanvasLayout` (canvas-mode shell only). Plain mode does not show a frame bar.
- **`MinimizedRegistry` module** owns the list of minimized cards and the parent/child string relationships for cascade behavior. Public interface: `minimize(cardId, snapshot) → void`, `restore(cardId) → snapshot`, `list() → entry[]`, `subscribe(listener) → unsubscribe`, `registerRelationship(parentId, childId) → void`. Cascade: minimizing a parent recursively minimizes all strung children. Persists across route changes (a minimized lifelog card stays minimized when navigating to `/blog`). Does **not** persist across page reloads in v1 — minimized cards re-mount in their normal position on reload.
- **Per-card minimize button.** A `−` icon in the card header calls `MinimizedRegistry.minimize(id, { fromRect, content })`. The card's DOM is removed; its chip appears in the strip with the card's identifying label/icon.
- **FLIP morph (Web Animations API).** On minimize: capture the card's `getBoundingClientRect()`, render the chip in its destination, then animate the chip from the card's source rect back to its identity transform — `~340ms` `cubic-bezier(0.4, 0, 0.2, 1)`. Restore is the reverse: capture chip rect, render the card in its destination, animate the card from the chip's source rect.
- **Accessibility.** Frame bar is `<header role="banner">` with `<nav aria-label="Section nav">` and an `aria-live="polite"` minimized-strip region announcing minimize/restore. Settings menu is keyboard-navigable; `Esc` closes it.
- **Gravity is always on.** Each route declares a `gravity` direction (`'down' | 'up' | 'left' | 'right'`). Default direction is `'down'`; magnitude is 0.7 (tunable). There is no user-toggle.
- **Static walls (closed viewport box).** Three static bodies are always present: **ceiling** (at y = frameBarHeight, just below the frame bar), **floor** (at y = viewport.height), and two invisible **side walls** (x = 0, x = viewport.width). All resize-aware. Detached heavy cards pile on the floor; detached balloon cards pile under the ceiling; side walls keep all cards on-screen.
- **Physics world is viewport-locked.** The walls match the visible viewport dimensions, not the document dimensions; scrolling moves the document but the physics world stays a fixed-size box.
- **The frame bar is outside the physics world.** It's DOM chrome anchored to the top/bottom edge — not a physics body — so the settings menu is always reachable.
- **Cascade-minimize rule.** Minimizing a card that has strung children minimizes the entire subtree atomically. The chip in the frame bar shows a `+N` badge when the subtree size is > 1. Restore re-mounts the full subtree.

### Strings — `Tether`, `StringLayer`

- **Design-time tree topology.** Each card has at most one parent: `'ceiling'`, `'floor'`, or another card's id. Multiple children per card are allowed. Topology is declared in the route's `PageDef`; there is no runtime UI for creating or destroying strings.
- **Inextensible rope semantics.** A tether can be slack (card closer to anchor than length) or taut (card at exactly the max length). The rope only pulls — it never pushes. `Tether` is built on the existing `linkBodies` primitive; the rope behavior is approximated via a per-tick pull-only force (applied only when `distance > length`).
- **Layout determines string length.** `len = distance(parentAnchorPos, cardLayoutPos)`. Cards rest at their `CardLayout` positions when taut. This preserves the load-bearing "anchor positions ARE the layout" principle.
- **Buoyancy.** `kind: 'note'` cards are balloons (per-tick force opposite gravity direction). All other kinds are heavy. A balloon strung to the floor floats upward to its taut length; a heavy card strung to the ceiling hangs down to its taut length.
- **`<StringLayer>` SVG component.** Rendered as an SVG overlay below the card layer. Draws each active tether: a straight line when taut; a cubic bezier with downward sag when slack (sag magnitude proportional to the slack amount). Stroke: `var(--color-fg)`, ~1px, semi-transparent.
- **Drag behavior.** Dragging a strung card pulls it within its rope radius. Releasing preserves velocity — the card swings as a pendulum and friction settles it. Dragging a detached card lets it fling freely.
- **Subtree minimize.** Minimizing a parent card minimizes its entire strung subtree atomically (see cascade-minimize rule in the Frame bar section).

### Backgrounds — `BackgroundGallery`

- Four R3F scenes for v1, all conforming to a uniform interface (`<BackgroundScene mountedAt={canvas} />`):
  1. Fragment-shader flow field / noise.
  2. Particle / instanced-mesh system.
  3. Geometric / algorithmic (L-system, reaction-diffusion, or recursive subdivision — TBD during implementation).
  4. Audio-reactive driven by last.fm now-playing (album-art palette extraction + tempo/intensity-driven displacement).
- **User-toggleable gallery** with persistence in `localStorage`. Switching triggers a fade-swap. Inactive scenes are unmounted (lazy-loaded via dynamic `import()`) so only the active one is in memory.
- **Accent is fixed.** The foreground accent is pinned to `#e60000` in both color modes (see Visual identity); backgrounds are visually independent from the foreground palette and do not override the accent variable.
- **Static gradient fallback** pre-rendered to PNG at build time, one per scene. Used for reduced-motion and no-WebGL fallbacks.

### Route transitions — `TransitionDirector`

Designed 2026-05-12. Slice 21 ships T1/T2/T3 (cross-route); slice 21b ships T4 (within-page sections); slice 22 ships `shared-element-morph`.

- **Hybrid mechanism per case.** Not a single transition system:
  - **Canvas → canvas (route-level):** physics-driven via three primitives composed by `TransitionDirector`:
    - `string-cut-drop` (decoupled exit, T1) — direct ceiling tethers are cut; chains fall as units under always-on gravity; balloons mirror by rising via buoyancy; phantom floor at `viewport.height + maxCardHeight + 100`; per-card cleanup at viewport-bottom with 1200ms ceiling.
    - `pour-in-drop` (decoupled enter, T2) — cards spawn at `(layoutX, -cardHeight - stagger)` with downward impulse + slack tether already attached; chain-order stagger (~80ms per child) reads as "the chain is being lowered"; balloons enter from below; settle via tether tautness with intentional chain-ripple.
    - `anchor-slide` (coupled, T3 horizontal in slice 21, T4 vertical in slice 21b) — each strung card's parent anchor is tween'd along `axis × sign` via existing `PhysicsWorld.setAnchor`; tether enforcement drags the card; one PhysicsWorld holds both card sets briefly during the ~700ms tween; destination-side wall removed for the duration.
  - **Within-page section pagination (canvas):** the vertical presentation of `anchor-slide` (slice 21b). Hash-fragment routing (`#sN`); per-route opt-in via PageDef `sections` field; ceiling collision in sensor mode during T4 so cards pass through the visible top edge. Next/back are `kind: 'nav'` PhysicsCards strung with very short floor tethers.
  - **Shared-element morph (slice 22, e.g., portfolio thumbnail → detail hero):** React 19 `<ViewTransition name>` as a fourth primitive (`shared-element-morph`) declared on an edge. Director implicitly composes it with default T1+T2 around it, auto-excluding the morphing pair. Browsers without `document.startViewTransition` fall back to plain T1+T2.
  - **Card minimize ↔ restore (chip ↔ card):** FLIP morph via Web Animations API. Capture source rect → set destination state → animate the inverse transform back to identity, ~340ms `cubic-bezier(0.4, 0, 0.2, 1)`. (Shipped, slice 28.)
  - **Canvas ↔ plain mode:** instant (real document navigation via `<a>`).
  - **Plain ↔ plain:** instant.

- **Dispatch is route-pair-keyed, not direction-keyed.** Each `PageDef` declares its own *decoupled* `exit` / `enter`; *coupled* transitions (single coordinated motion involving both old and new card sets) are declared in a separate edge table. Resolution order on route change: (1) edge match → coupled, (2) else `from.exit + to.enter` (decoupled, 200ms overlap), (3) else history-direction default (forward/back → T1+T2; sibling → `anchor-slide` horizontal).

- **History-direction is a parameter, not the dispatch key.** Forward / back / sibling is computed from history index via `useNavigationType()` (~30 lines). Some transitions consume it (`anchor-slide` reads it for sign); others ignore it (T1/T2/T4 don't care).

- **Card lifecycle is PhysicsWorld-mediated.** PhysicsWorld is the source of truth for card presence; route components register/unregister on mount/unmount. The director defers `unregister()` calls during a transition until exit motion completes. A `<PhysicsLayer>` mounted at app root holds rendered card DOM via React portal, so route subtree unmount does not destroy the visual until the handle is unregistered.

- **Public interface.** `useTransitionDirector({ pageDefs, edges })` mounted at app root auto-wires on `useLocation`; `useTransitionContext().runTransition({ from, to })` as an escape hatch (mainly nav-card buttons in slice 21b).

- **PageDef extensions:** `transitions?: { exit?, enter? }` (decoupled overrides), `siblingOrder?: 'left' | 'right'` (anchor-slide sibling fallback), and `sections?` (slice 21b — `mode: 'author' | 'auto-chain'`).

- **Reduced-motion:** all transitions become ~150ms instant cross-fade; no impulses, no morphs, no `startViewTransition`. Live `matchMedia('(prefers-reduced-motion: reduce)')` listener flips behavior on toggle.

- **Failure handling:** production gracefully aborts the transition and falls back to instant route-swap; dev (`import.meta.env.DEV`) throws so error boundaries surface broken transitions loudly during authoring.

### Backend — `APIServer`, `CacheLayer`, adapters

- **Bun service** running as a systemd unit on `localhost:3000`. Caddy reverse-proxies `/api/*` to it via one Caddyfile block. API keys read from `/etc/chaipalaka.env` (root-owned, mode 600).
- **Endpoints:**
  - `/api/now-playing` — last.fm now-playing — cache 30s
  - `/api/recent-tracks` — last.fm recent tracks — cache 5m
  - `/api/books` — Goodreads RSS (`currently-reading` + `read` shelves, `GOODREADS_USER_ID` env var) — cache 30m
  - `/api/films` — Letterboxd RSS for the user — cache 1h, parsed server-side
  - `/api/github` — GitHub events API — cache 5m (TBD)
  - `/api/notes?parent=<id>|standalone=1` — sourced from `content/notes/*.md` — cache 1h
- **`CacheLayer` module** (deep): generic stale-while-revalidate cache with per-key TTL + last-good fallback. Public interface: `get(key, fetcher, opts) → value`, `set(key, value)`. Uses an in-memory map for v1; `stale: true` flag on responses where the upstream failed and we're serving last-good. No SQLite for v1.
- **Adapter modules** (`LastFmAdapter`, `LetterboxdAdapter`, `GitHubAdapter`): each wraps one third-party source and normalizes its responses into a domain type (`Track`, `Film`, `Activity`). They are the only places that know the third-party's shape; everything else consumes the domain types.
- **Content readers** (`MDXBookReader`, `NotesReader`): read the corresponding `content/` subdirectory, parse frontmatter via the same zod schema used by the build pipeline, return sorted/filtered records.

### Content authoring

- **Co-located post directories.** `content/blog/<yyyy-mm-dd>-<slug>/index.mdx` plus any small co-located images (PNG/JPG/SVG <1MB). Filename date prefix is for natural sorting and date hygiene; canonical date is in frontmatter.
- **Frontmatter schema (blog), zod-validated:**
  ```yaml
  title: string
  description: string
  date: ISO date
  tags: string[]
  draft: boolean (default false)
  og_image: string (relative path to image, optional)
  ```
- **Drafts** (`draft: true`) are excluded from the production build; visible only via `npm run dev`. No deployed-but-hidden draft URLs.
- **Books schema:**
  ```yaml
  title, author: string
  status: "reading" | "finished" | "abandoned" | "want-to-read"
  started, finished?: ISO date
  cover?: string (relative path)
  rating?: number
  ```
  MDX body optional (long-form review/notes).
- **Notes schema:**
  ```yaml
  ts: ISO datetime
  parent?: "book:<slug>" | "letterboxd:<id>" | "lastfm:<mbid>" | "github:<event-id>" | null
  ```
  Body is plaintext / basic markdown.
- **Slug** is derived from filename (after stripping date prefix); not a separate frontmatter field.
- **MDX plugins:** `shiki` via `rehype-pretty-code` for syntax highlighting; `rehype-slug` + `rehype-autolink-headings` for heading anchors; build-time TOC generation. Image processing is **simple for v1** — author pre-compresses; no sharp pipeline yet (deferred).
- **Custom MDX component library:** `<Callout type="note|warn|aside">`, `<Figure>`, `<Video>`, `<NowPlaying />` (live last.fm widget), `<BookCard slug>` (lifelog widget reused), `<RuffleEmbed src>`. Live React components in MDX are explicitly allowed.

### Repo + deploy

- **Single public GitHub repo** with the following top-level directories:
  - `web/` — Vite + React frontend
  - `api/` — Bun backend
  - `content/` — MDX (blog, books, portfolio, notes)
  - `deploy/` — Caddyfile, systemd unit, deploy scripts
  - `assets/` — gitignored; large media synced separately
- **Side projects** (future): each in its own GitHub repo, deployed to its own `/var/www/<project>/` directory, served via one Caddy block per `<project>.chaipalaka.com` subdomain. No infrastructure built for this in v1.
- **Deploy via `make deploy`** from the local machine: builds `web` (vite-ssg) + `api` (bun build), `rsync`s artifacts to Hetzner, SSH-restarts the systemd unit. CI/CD via GitHub Actions deferred.
- **Secrets:** `/etc/chaipalaka.env` on the server, never in git.

### Visual identity

The aesthetic is **Swiss-grid restrained brutalism**: high-contrast, fixed three-color palette per mode, hard 4px borders, minimal radius, generous whitespace, no decorative gradients/textures.

- **Color mode is a user-toggleable binary** (light / dark), persisted in `localStorage` via the frame bar's settings menu. On first visit (no stored preference), the site honors `prefers-color-scheme` to pick the initial mode. CSS custom properties throughout; light mode is a different set of variable values, not a parallel stylesheet.
- **Palette (fixed, three colors per mode):**
  - **Light:** bg `#f8f8f8`, fg `#000`, accent `#e60000`
  - **Dark:** bg `#0a0a0a`, fg `#f8f8f8`, accent `#e60000`
  - The accent (`#e60000`) is identical across both modes and does *not* shift based on the active background.
- **Typography:**
  - **Body / headings / UI chrome:** IBM Plex Sans, 16px base, line-height 1.3, letter-spacing −0.01em.
  - **Code blocks (`<pre>`/`<code>` in blog posts):** JetBrains Mono.
  - Both self-hosted, subset to Latin Extended.
- **Card styling (baked-in tokens):** 4px solid border (color = `--color-fg`), 4px corner radius, soft drop shadow `0 4px 16px rgba(0, 0, 0, 0.4)`, 24px padding, 24px gap between content rows.
- **Aesthetic configurability is a first-class constraint.** All design tokens live in CSS custom properties (`--color-bg`, `--color-fg`, `--color-accent`, `--font-body`, `--font-mono`, `--space-{0..n}`, `--radius-{...}`, `--shadow-{...}`). Components reference variables, not literals. The site owner can re-skin without touching component code.

### Domain extras

- **RSS** at `/rss.xml`, build-time generated, full post bodies, blog only (not portfolio / lifelog / notes).
- **Sitemap** at `/sitemap.xml`, build-time generated, all canonical routes included with appropriate priority (plain-mode reader URLs included alongside their canvas counterparts).
- **404 page** in `CanvasLayout` declares `gravity: 'up'` in its `PageDef` — cards float upward and pile against the ceiling, making the failure state physically legible. Surfaces a headline card, 3–4 recent blog post cards, 1 featured portfolio card, and a "did you mean ___" link card. No minimize button on 404 cards (ephemeral).
- **OpenGraph metadata** populated per page from MDX frontmatter (`title`, `description`, `og_image`). For v1, `og_image` is manually authored. Auto-generation (Satori or similar) deferred.
- **Analytics** deferred. Will revisit (likely self-hosted GoatCounter or Umami on the same Hetzner box).
- **Comments** explicitly skipped. Footer link to email/Bluesky for feedback.

### Error / edge states

- **Backend down** (`/api/*` unreachable): cards on `/lifelog` show their last-cached value or a small "—" placeholder. No error toasts.
- **WebGL context lost:** caught via `webglcontextlost` event; background swaps to the static gradient fallback (the same one used for reduced-motion and no-WebGL). No page reload.
- **Specific upstream source failed** (last.fm down, Letterboxd RSS broken, GitHub rate-limited): `CacheLayer` returns last-good with `stale: true`. The frontend shows a small "stale" hint on the affected card.

## Testing Decisions

### What makes a good test in this codebase

- **Test external behavior, not implementation details.** A test that asserts "after registering a body and calling tick() N times, the body's position approaches the anchor with damping" is good. A test that asserts "matter.js was called with these specific arguments" is bad — it locks in implementation that should be free to change.
- **Deterministic where possible.** Physics tests pin a fixed timestep and seed; cache tests inject a fake clock. No "wait 100ms then check."
- **Adapters are tested with recorded fixtures**, not live network calls. One representative response per third-party endpoint is checked into the test corpus.
- **Pure functions are preferred.** `CardLayout` returns positions from inputs; tests assert positions for various viewport sizes and content shapes. No DOM mocking required.
- **No integration tests for v1.** Component-level interaction (drag a card, see it move) is verified by manual development. Adding a Playwright suite is deferred until the site has enough surface area to justify the maintenance cost.

### Modules with tests

The bolded deep modules from the design pass — these are the ones where regressions are silent and expensive, and where isolation makes tests cheap to write.

**Frontend:**

- **`PhysicsWorld`** — register/unregister round-trips; `setGravityDirection` correctly sets the gravity vector for all four cardinal directions; a body without a tether falls toward gravity and is caught by the floor/ceiling wall; `linkBodies` / `unlinkBodies` round-trips; impulse and velocity setters move the body in the expected direction; cascade-minimize subtree enumeration is correct.
- **`CardLayout`** — pure function over content + viewport size + measurement input; assert grid positions for various breakpoints, content lengths, and card counts; assert that anchor positions are stable across re-renders with the same input.
- **`Tether` / `StringLayer`** — tether is slack when card distance < string length and taut when at length; pull-only force applied correctly (no push force when slack); balloon buoyancy force magnitude matches heavy gravity magnitude at steady state; `StringLayer` bezier control points produce correct sag direction for slack tethers; cascade-minimize enumerates the full subtree.
- **`TransitionDirector`** — dispatch resolution order (edge table → PageDef `exit`/`enter` → history-direction default); history-direction classification (forward/back/sibling) from history index; `string-cut-drop` cuts only direct ceiling tethers and balloons rise symmetrically; `pour-in-drop` chain-order stagger; `anchor-slide` parent-anchor tween produces the expected position curve for both `axis: 'horizontal'` and `axis: 'vertical'`; reduced-motion path bypasses physics; orphaned-card portal survives route unmount; `shared-element-morph` dispatches `startViewTransition` only when both routes declare matching `<ViewTransition name>` and auto-excludes the morphing pair from T1/T2.
- **`PretextRegistry`** — registered fonts are queryable; `measure()` returns dimensions consistent with what the same text would actually take in the DOM (verified once via a snapshot test, then trusted).

**Backend:**

- **`CacheLayer`** — TTL expiry triggers a refetch; refetch failure returns last-good with `stale: true`; concurrent gets for the same key coalesce to one fetch (no thundering herd); `set()` overrides last-good cleanly.
- **`LastFmAdapter`** — given a recorded last.fm response fixture, returns the expected normalized `Track[]`; handles the "no track currently playing" edge case (last.fm returns the last played track without a `nowplaying` flag).
- **`LetterboxdAdapter`** — given a recorded RSS fixture, returns the expected `Film[]`; handles malformed entries (one bad item shouldn't break the rest).
- **`GitHubAdapter`** — given a recorded GitHub events fixture, returns the expected `Activity[]`; rate-limit responses are surfaced as recoverable errors (not crashes).
- **`MDXBookReader`** — frontmatter parsing matches the zod schema; sort order honors status priority then date; missing required fields produce a validation error rather than a silent empty result.
- **`NotesReader`** — filtering by `parent` returns only matching notes; filtering by `standalone=1` returns only `parent: null` notes; combined-source queries are merged in chronological order.

### Prior art

There is no prior art in this repo (it's empty). Tests should be set up with:

- **Vitest** as the test runner for both frontend and backend (Bun also runs Vitest). Single tool across the stack.
- **Recorded fixtures** in `__fixtures__/` next to the relevant adapter test.
- **Deterministic time** via Vitest's `vi.useFakeTimers()` for cache tests.

## Out of Scope

- **CI/CD pipeline.** Local `make deploy` for v1; GitHub Actions migration deferred.
- **Comments.** Skipped entirely; mailto/Bluesky link in footer is the contact surface.
- **On-site search.** Overkill for v1 content volume.
- **Analytics.** Deferred; likely self-hosted GoatCounter or Umami later.
- **Auto-generated OpenGraph images.** Manual `og_image` per post for v1; Satori-style generation later.
- **Full image processing pipeline** (sharp, AVIF/WebP variants, LQIP). Author pre-compresses for v1.
- **Side-project subdomains.** Deferred — pattern is decided (each its own repo, own Caddy block at `<project>.chaipalaka.com`) but no infrastructure built.
- **Authentication / private content.** Public-only; if anything sensitive surfaces, keep it out via authoring (not via auth).
- **Storygraph integration** as an alternative to Goodreads. Goodreads RSS is the live source in v1.
- **Spotify integration** (in lieu of last.fm). Spotify requires user-OAuth refresh tokens which can't be browser-side; last.fm covers the use case.
- **Audio-reactive shader's full ambition** (BPM analysis, Spotify track-feature analysis). v1 audio-reactive uses last.fm now-playing + album-art palette extraction only; deeper audio-feature analysis later.
- **Comments / annotations from visitors** on the lifelog. Notes are owner-authored only.
- **Subdomain wildcard routing logic in the app.** Caddy handles per-subdomain routing; the app doesn't need to know about side projects.
- **A separate "mobile site."** Same codebase, responsive, with the touch adaptations specified in the degradation matrix.
- **Service worker / offline.** Not needed for v1.
- **Internationalization.** English only.
- **A CMS or admin UI.** All authoring is through the file system + git.

## Further Notes

- The repo currently contains only `grillmedoc.md` (the original brief) and now this `PRD.md`. It is **not yet a git repository**; first task in implementation is `git init` + `gh repo create chaipalaka.com --public`.
- Hetzner CX22 at `178.105.87.102` has Caddy serving `/var/www/chaipalaka` with auto-TLS via Let's Encrypt; no application code is deployed yet. The Caddyfile will need one new `reverse_proxy /api/* localhost:3000` block when the Bun service ships.
- DNS in Route 53 already has wildcard A record (`*` → `178.105.87.102`), so future side-project subdomains require no DNS changes — only a new Caddy block on the server.
- The site owner intends to iterate on visual aesthetic personally; the implementation should optimize for re-skinnability over visual polish at handoff.
- The "physics anchor positions ARE the layout" principle is load-bearing across multiple decisions (degradation, mobile, reduced-motion, screen-reader). Implementation should preserve it: every fallback subtracts perturbation, never replaces the layout. In the strings model this is preserved by deriving each tether's length from `distance(parentAnchorPos, cardLayoutPos)` — cards rest at their `CardLayout` positions when taut.
- Pretext (`@chenglou/pretext`) is the text-measurement layer; it does not replace DOM text. All accessibility decisions assume real DOM text.
- React 19's `<ViewTransition>` is used **narrowly**, only for shared-element morphs (portfolio thumbnail → detail hero). Bulk transitions are physics-driven; do not retrofit ViewTransition onto general route changes.
