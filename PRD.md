# chaipalaka.com — v1 PRD

Synthesized from the design grilling captured in `grillmedoc.md`. Ready for implementation.

## Problem Statement

The site owner wants a personal home on the internet at `chaipalaka.com` that doubles as a portfolio of frontend craft. Existing personal-site frameworks treat the page as a passive document; the owner wants the site to *be* an artifact — visibly experimental, physics-driven, generative — without sacrificing the everyday utility of a blog, a portfolio, and a public lifelog. Hosting and DNS are already provisioned (Hetzner CX22 at `<HETZNER_IP>`, AWS Route 53 for DNS, Caddy serving `/var/www/chaipalaka` with automatic TLS), but no application code exists yet.

The site must succeed on three axes simultaneously, and each axis tends to pull against the others:

1. **Aesthetic identity** — physics-affected foreground cards over interchangeable generative-art backgrounds, expressive enough that the site itself reads as a portfolio piece.
2. **Content utility** — a blog, a portfolio of Flash-era stick-figure animations, and a "lifelog" surfacing live signals (now-playing, currently reading, recently watched, recent code activity), each with a real URL, real text, real RSS, real shareability.
3. **Graceful degradation** — readable on mobile, on touch, on reduced-motion, on no-WebGL, on screen readers, in plain-text-reader mode for long-form posts.

The PRD resolves the architecture and interaction model that lets all three axes coexist.

## Solution

A statically-generated React site (Vite + `vite-ssg`) deployed to the existing Hetzner box, with a small Bun backend running alongside Caddy to mediate live data sources. The site has two layout shells — a canvas-mode shell that mounts a persistent R3F generative-art background and a matter.js-driven foreground of physics cards, and a plain-mode shell for long-form reading that ships zero WebGL. Every navigation between canvas-mode routes is a physics transition; specific shared-element morphs (portfolio thumbnail growing into the detail page) use the React 19 View Transition API. Live data (last.fm, Letterboxd, GitHub) flows through `/api/*` endpoints proxied to the Bun service, which holds API keys and serves stale-while-revalidate cached responses so the lifelog feels alive even when third parties misbehave. Content (blog posts, books, notes, portfolio metadata) lives as MDX in a `content/` directory in the same git repo. Drafts stay on localhost; production is deployed via a local `make deploy` Makefile that `rsync`s build artifacts to the server. Visual identity is dark-default with a system-respecting light override, Newsreader for body, JetBrains Mono for code, with everything skinnable through CSS custom properties so the owner can iterate on aesthetics without touching component code.

A floating note-chain mechanic — small note cards spring-attached to their parent lifelog/portfolio card via visible curved-bezier connectors — provides an annotation surface that reuses the same physics primitives that make the rest of the site feel alive. A persistent controls panel (itself a gravity-exempt physics card) lets the visitor toggle the active background, switch theme, and flip a "gravity on" gimmick that drops every card to the viewport floor.

## User Stories

### Visitor / general

1. As a first-time visitor, I want the homepage to load fast and tell me what this site is, so that I can decide in seconds whether to keep exploring.
2. As a visitor, I want to see a persistent generative-art background behind the content, so that the site has visual personality without me having to seek it out.
3. As a visitor, I want to switch between four different generative-art backgrounds via a discreet control, so that I can pick the one that suits my mood.
4. As a visitor, I want my background choice to persist across navigation and page reloads, so that I don't have to re-pick it every time.
5. As a visitor, I want the foreground content to be composed of cards that subtly bob, tilt toward my cursor, and respond to clicks with a springy press, so that the page feels alive rather than static.
6. As a visitor, I want to drag any card with my mouse and watch it spring back to its anchor position, so that I can play with the interface without breaking it.
7. As a visitor, I want to push cards into each other and see them collide, so that the physics feels physically real, not decorative.
8. As a visitor, I want a "gravity on" toggle that makes every card fall to the bottom of the viewport and pile up, so that I can mess with the site as a gimmick.
9. As a visitor with gravity on, I want navigating to a new route to drop the new route's cards in from the top of the viewport, so that the chaos remains coherent across navigation.
10. As a visitor, I want my gravity preference to persist, so that I don't have to re-enable it every session.
11. As a visitor, I want a controls panel that's itself a physics card, so that the chrome feels like part of the site rather than bolted on.
12. As a visitor, I want the controls panel to stay accessible even when gravity is on, so that I never end up stuck in a mode I can't escape.
13. As a visitor, I want to drag the controls panel to a different corner if it's blocking content, and have it remember that position.
14. As a visitor, I want a 404 page that drops a few "did you mean ___" cards in playground mode with gravity on, so that the failure case feels like part of the design.
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
31. As a portfolio visitor, I want the portfolio index in playground mode (loose springs, throwable cards), so that the index itself reflects the playful subject matter.
32. As a portfolio visitor, I want Ruffle's WASM payload only to load when I'm on a portfolio route, so that visitors never browsing portfolio pages don't pay its bundle cost.

### Lifelog visitor

33. As a lifelog visitor, I want to find a `/lifelog` page that surfaces five sources at once: now-playing music, currently-reading books, recently-watched films, recent GitHub activity, and a stream of free-form daily notes, so that I get a sense of what the site owner is up to.
34. As a lifelog visitor, I want a dashboard-of-cards default view, so that each source has its own visual presence.
35. As a lifelog visitor, I want a "feed view" toggle that merges everything chronologically, so that I can read the site like a journal when I want to.
36. As a lifelog visitor, I want notes to appear as small floating cards spring-attached to their parent card via a visible curved bezier connector, so that I can see "this commentary belongs to that book."
37. As a lifelog visitor, I want a soft cap of 5 visible notes per parent with the rest expandable inline, so that long-running threads don't blow up the layout.
38. As a lifelog visitor, I want notes ordered with the newest closest to the parent, so that I read the most recent commentary first.
39. As a lifelog visitor, I want lifelog cards to keep showing their last-known value when an upstream source is broken or slow, so that the page never has gaping holes.
40. As a lifelog visitor, I want to see a small "stale" hint when data is being served from cache after an upstream failure, so that I know the timing isn't necessarily live.

### Mobile visitor

41. As a mobile visitor, I want vertical scrolling to never be hijacked by accidental card drags, so that I can read the site normally.
42. As a mobile visitor, I want to long-press (~350ms) a card to "grab" it, then drag it freely while my finger is down, so that I can still play with the physics.
43. As a mobile visitor, I want a brief scale-up + shadow-lift animation at the moment the long-press triggers, so that I can feel when the grab succeeded.
44. As a mobile visitor, I want the controls panel to be thumb-reachable in the bottom-right corner, so that I can access toggles one-handed.
45. As a mobile visitor, I want the same content shape as the desktop site (no separate "mobile site"), so that my experience isn't second-class.

### Accessibility

46. As a visitor with `prefers-reduced-motion: reduce`, I want all physics perturbation to drop to zero so cards sit still at their anchors, so that I can use the site without vestibular distress.
47. As a reduced-motion visitor, I want the generative-art background swapped for a pre-rendered static gradient, so that nothing in my peripheral vision is animating.
48. As a reduced-motion visitor, I want route transitions to become instant cross-fades rather than physics motions, so that I'm never thrown by an animation I didn't ask for.
49. As a screen-reader user, I want the WebGL canvas marked `aria-hidden="true"`, so that decorative content doesn't pollute my reading.
50. As a screen-reader user, I want every card's content to live in semantic DOM (`<article>`, `<a>`, `<h1>`, etc.) regardless of physics-driven visual position, so that reading order is determined by structure, not pixels.
51. As a screen-reader user, I want notes-chain notes nested as an `<aside aria-label="notes">` inside their parent's `<article>`, so that the relationship is announced as a group.
52. As a keyboard user, I want Tab order to follow the DOM order of cards, so that I navigate predictably regardless of physics positions.
53. As a keyboard user, I want a high-contrast custom focus ring (the default browser ring is invisible against R3F backgrounds), so that I always know where focus is.
54. As a keyboard user, I want `Esc` to collapse any expanded notes-chain, so that I can dismiss without mousing.
55. As a visitor on a browser without WebGL, I want the foreground physics to keep working and the background to swap to a static gradient, so that most of the experience survives.
56. As a visitor whose WebGL context is lost mid-session, I want the background to fall back gracefully to a static gradient without a page reload, so that the site keeps working.

### Theme

57. As a visitor on a system with `prefers-color-scheme: light`, I want the site to default to a light theme, so that it respects my OS preference.
58. As a visitor, I want a manual theme toggle in the controls panel, so that I can override the system default.
59. As a visitor, I want my theme override to persist, so that I don't have to re-pick it.
60. As a visitor, I want a single CSS-variable accent color that shifts based on the active background shader, so that the foreground feels coherent with the background even as the background changes.

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
  - `CanvasLayout` — wraps Home, Portfolio, Lifelog, Socials, Blog index, Blog post (canvas variant). Mounts a persistent R3F `<Canvas>` once and a matter.js physics world; foreground swaps per route.
  - `PlainLayout` — wraps reader-mode URLs (`/blog/<slug>/read`). No WebGL, no physics. Bundle for these routes excludes Three.js / matter.js entirely via route-level dynamic imports.
- **Plain-mode links use real `<a>` (not React Router `<Link>`)** to force a document fetch and prevent the canvas-mode JS bundle from ever loading on plain pages.
- **Persistent canvas across canvas-mode navigations.** The `<Canvas>` lives at the `CanvasLayout` level; navigation between canvas routes does not re-mount it. Foreground cards re-lay out per route.
- **Conventional URL routing.** Each section is its own route (`/`, `/portfolio`, `/portfolio/<slug>`, `/blog`, `/blog/<slug>`, `/blog/<slug>/read`, `/lifelog`, `/links`). No spatial-canvas / desk-metaphor navigation.

### Foreground physics — `PhysicsWorld`, `PhysicsCard`, `CardLayout`

- **Chrome-level physics.** Cards are physics-affected containers; text inside them lays out as normal DOM. The card's *position and rotation* are physics-driven; the *content within* is HTML.
- **DOM cards over WebGL background.** Cards are real HTML elements (`<article>`, `<a>`, etc.) positioned per frame via `transform: translate(x, y) rotate(θ)` where the values come from matter.js. The R3F canvas runs as a separate background layer (full-viewport, z-index below the card layer). The two layers don't physically interact.
- **Physics anchor positions ARE the layout.** Each `PhysicsCard` computes a CSS-grid anchor position; matter.js perturbs around the anchor via a spring constraint. Disabling physics means perturbation goes to zero and the grid stays. Subtractive fallbacks across all degradation modes work the same way.
- **`PhysicsWorld` module** owns the matter.js engine, gravity vector, the static viewport-floor body, and the registration table. Public interface: `register(anchor, opts) → handle`, `unregister(handle)`, `setGravity(boolean)`, `applyImpulse(handle, vector)`, `setMode(handle, "breathing" | "playground")`. Implementation hides matter.js entirely.
- **Card modes:**
  - `breathing` (default everywhere) — strong spring constraint to anchor; gentle bobbing on idle, slight tilt toward cursor, springy press-and-release on click. Drag is allowed; on release the card springs back with overshoot/damping.
  - `playground` (per-route opt-in: `/portfolio` index, `/404`, future routes) — spring stiffness near zero. Cards stay where you leave them, drift, can be tossed.
- **Interaction on every card, every route, every mode:** drag, push (via collision from another card), hover-tilt, click-press feedback. The mode controls the spring stiffness, not whether interaction exists.
- **Card pre-sizing via pretext.** Each card's text size is precomputed via `PretextRegistry.measure()` before the body is registered with matter.js, so the body has correct dimensions from the start and we never call `getBoundingClientRect()` per card.

### Touch / mobile

- Long-press-to-grab, ~350ms threshold (tunable). Below threshold, the gesture passes through to scroll. At threshold, the card scales up slightly + lifts a shadow as a "you've grabbed it" cue, then drag begins.
- Same playground/breathing behavior as desktop.

### Gravity toggle

- Persisted in `localStorage`. UI lives in the `ControlsPanel`.
- **ON:** `world.gravity.y = 0.7` (tunable). All card spring constraints relax to near-zero stiffness. A static body at the viewport floor catches falling cards. Physics world is **viewport-locked** — the floor matches the visible viewport bottom, not the document bottom; scrolling moves the document but the physics world stays a fixed-size box.
- **OFF:** gravity returns to zero, springs restore, cards float back to anchors with damping.
- **Route navigation while gravity is ON:** outgoing cards get a downward impulse and fall offscreen; incoming cards spawn above the viewport with momentum and pour in. The "falling-pour transition" is the same code path used for normal route transitions when gravity is on.
- **The `ControlsPanel` is gravity-exempt.** Its body stays static (or has springs that don't relax) so the user can always reach the toggle to turn gravity off.

### Notes chain — `NotesChain`

- **Linear topology.** `parent → newest-note → … → oldest-note`. Each note is spring-attached to the previous body in the chain.
- **Visible curved-bezier connector with sag.** Drawn as a transparent SVG overlay (or onto the same WebGL canvas as the background, depending on what's cheaper). Sag responds to physics state — if gravity is on, connectors hang lower.
- **Soft cap of 5 visible notes** per parent. Beyond 5, a small "+N more" affordance expands the chain inline.
- **Newest closest to parent.** Reading order is parent → newest → oldest as you traverse the chain outward.
- **Notes-chain DOM:** notes nested as `<aside aria-label="notes">` inside the parent's `<article>`. Screen readers see them as a related group.
- Public interface: `addNote(noteData)`, `removeNote(id)`, `getConnectorPath() → SVGPath`, `setExpanded(bool)`.

### Backgrounds — `BackgroundGallery`

- Four R3F scenes for v1, all conforming to a uniform interface (`<BackgroundScene mountedAt={canvas} />`):
  1. Fragment-shader flow field / noise.
  2. Particle / instanced-mesh system.
  3. Geometric / algorithmic (L-system, reaction-diffusion, or recursive subdivision — TBD during implementation).
  4. Audio-reactive driven by last.fm now-playing (album-art palette extraction + tempo/intensity-driven displacement).
- **User-toggleable gallery** with persistence in `localStorage`. Switching triggers a fade-swap. Inactive scenes are unmounted (lazy-loaded via dynamic `import()`) so only the active one is in memory.
- **Accent CSS variable** is set by the active background — `--accent-color` in `:root` shifts as backgrounds change. Foreground theming is monochrome + this single accent, so backgrounds and foregrounds feel coordinated without duplicate config.
- **Static gradient fallback** pre-rendered to PNG at build time, one per scene. Used for reduced-motion and no-WebGL fallbacks.

### Route transitions — `TransitionDirector`

- **Hybrid model.** Not a single transition mechanism — the right tool per case:
  - **Canvas → canvas:** physics-driven. Outgoing cards receive an exit impulse based on **navigation direction** (forward = up/back; back = down/forward; sibling = sideways). Incoming cards spawn offscreen and settle into anchors via their springs.
  - **Shared-element morph (e.g., portfolio thumbnail → portfolio detail hero):** React 19 `<ViewTransition name>` matched across routes. The thumbnail "becomes" the hero; rest of the foreground does the standard physics exit/enter in parallel.
  - **Canvas ↔ plain mode:** instant (real document navigation via `<a>`).
  - **Plain ↔ plain:** instant.
- **Direction tracking.** React Router doesn't expose nav direction; `TransitionDirector` compares history index across navigations. ~30 lines.
- Public interface: `transition(from, to, direction)` orchestrates outgoing impulses, incoming spawns, and ViewTransition dispatch.
- **Reduced-motion:** all transitions become ~150ms instant cross-fades; no impulses, no morphs.

### Backend — `APIServer`, `CacheLayer`, adapters

- **Bun service** running as a systemd unit on `localhost:3000`. Caddy reverse-proxies `/api/*` to it via one Caddyfile block. API keys read from `/etc/chaipalaka.env` (root-owned, mode 600).
- **Endpoints:**
  - `/api/now-playing` — last.fm now-playing — cache 30s
  - `/api/recent-tracks` — last.fm recent tracks — cache 5m
  - `/api/books` — sourced from `content/books/*.mdx` — cache 1h
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

- **Dark default + light override**, with `prefers-color-scheme` respected on first visit and a manual toggle in `ControlsPanel` overriding via `localStorage`. CSS custom properties throughout; light mode is a different set of variable values, not a parallel stylesheet.
- **Typography:** Newsreader (variable serif) for body and headings; JetBrains Mono for code. Self-hosted, subset to Latin Extended.
- **Editorial spacing:** generous whitespace, ~70ch body width, strong type hierarchy.
- **Palette:** monochrome (paper + ink) plus one accent CSS variable shifted by the active background.
- **Aesthetic configurability is a first-class constraint.** All design tokens live in CSS custom properties (`--color-bg`, `--color-fg`, `--color-accent`, `--font-body`, `--font-mono`, `--space-{0..n}`, `--radius-{...}`, `--shadow-{...}`). Components reference variables, not literals. The site owner can re-skin without touching component code.

### Domain extras

- **RSS** at `/rss.xml`, build-time generated, full post bodies, blog only (not portfolio / lifelog / notes).
- **Sitemap** at `/sitemap.xml`, build-time generated, all canonical routes included with appropriate priority (plain-mode reader URLs included alongside their canvas counterparts).
- **404 page** in `CanvasLayout` with `mode="playground"` and gravity-on by default; surfaces a handful of recent blog posts and a featured portfolio piece as cards that pour in.
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

- **`PhysicsWorld`** — register/unregister round-trips; spring-anchored body converges to anchor under fixed timestep; gravity-on/off mode switching swaps stiffness atomically (no half-applied state); impulse application moves the body in the expected direction; the floor body catches falling cards (no escape through the bottom).
- **`CardLayout`** — pure function over content + viewport size + measurement input; assert grid positions for various breakpoints, content lengths, and card counts; assert that anchor positions are stable across re-renders with the same input.
- **`NotesChain`** — adding a note appends at the parent end (newest closest); removing the middle re-stitches the chain; bezier connector path has the expected control points for a given chain configuration; the soft-cap-of-5 hides the right notes and the expand toggle reveals all of them.
- **`TransitionDirector`** — given a from/to route pair and a direction, dispatches the correct sequence of impulses (forward → up; back → down; sibling → sideways); ViewTransition is dispatched only when both routes declare matching `name` props.
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
- **Goodreads / Storygraph integration** for books. Manual MDX is the source of truth.
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
- Hetzner CX22 at `<HETZNER_IP>` has Caddy serving `/var/www/chaipalaka` with auto-TLS via Let's Encrypt; no application code is deployed yet. The Caddyfile will need one new `reverse_proxy /api/* localhost:3000` block when the Bun service ships.
- DNS in Route 53 already has wildcard A record (`*` → `<HETZNER_IP>`), so future side-project subdomains require no DNS changes — only a new Caddy block on the server.
- The site owner intends to iterate on visual aesthetic personally; the implementation should optimize for re-skinnability over visual polish at handoff.
- The "physics anchor positions ARE the layout" principle is load-bearing across multiple decisions (degradation, mobile, reduced-motion, screen-reader). Implementation should preserve it: every fallback subtracts perturbation, never replaces the layout.
- Pretext (`@chenglou/pretext`) is the text-measurement layer; it does not replace DOM text. All accessibility decisions assume real DOM text.
- React 19's `<ViewTransition>` is used **narrowly**, only for shared-element morphs (portfolio thumbnail → detail hero). Bulk transitions are physics-driven; do not retrofit ViewTransition onto general route changes.
