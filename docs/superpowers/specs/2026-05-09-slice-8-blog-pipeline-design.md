# Slice 8: Blog Pipeline Design

**Issue:** #8 — Blog tracer: one MDX post → index, canvas-mode, plain-mode, RSS, sitemap  
**Date:** 2026-05-09  
**Status:** Approved

---

## Overview

Establish the entire blog content pipeline end-to-end with one placeholder post. MDX files in `content/blog/` become prerendered React routes, a validated RSS feed, and a sitemap entry — all at build time, zero client-side processing.

---

## 1. MDX Pipeline (vite.config.ts additions)

Packages added to `web/`:

| Package | Purpose |
|---|---|
| `@mdx-js/rollup` | Transforms `.mdx` → React component in Vite |
| `@mdx-js/react` | `MDXProvider` for component overrides |
| `remark-frontmatter` | Recognises YAML frontmatter in MDX files |
| `remark-mdx-frontmatter` | Exports frontmatter as `export const frontmatter = {...}` |
| `rehype-pretty-code` + `shiki` | Build-time syntax highlighting, zero client JS |
| `rehype-slug` | Adds `id` attributes to headings |
| `rehype-autolink-headings` | Wraps headings in anchor links |
| `gray-matter` | Frontmatter parsing in Node context (Vite plugin only) |

Custom rehype plugin **`rehypeExtractToc`** (written in-repo, ~30 lines): traverses the post's heading AST nodes and injects `export const toc = [{ depth, text, slug }]` into every MDX file. No runtime dependency.

### Frontmatter zod schema

```ts
const PostFrontmatter = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string().date(),
  tags: z.array(z.string()),
  draft: z.boolean().default(false),
  og_image: z.string().optional(),
})
```

Missing required fields throw at import time → build fails with a useful error.

---

## 2. Post Loading Utility (`web/src/blog/posts.ts`)

- `import.meta.glob('../../../content/blog/**/index.mdx', { eager: true })` loads all posts at build time
- Each module exposes: default (React component), `frontmatter`, `toc`
- Slug derived from directory name: strip leading `YYYY-MM-DD-` prefix
- In production (`import.meta.env.PROD`), posts with `draft: true` are excluded
- Module exports a sorted array of `Post` objects (reverse-chronological by `date`)

TypeScript type declaration for MDX modules added to `web/src/vite-env.d.ts`.

---

## 3. Routes

Added to `web/src/App.tsx`:

### `/blog` → `BlogIndex` (CanvasLayout)
- Lists all non-draft posts reverse-chronological
- One `PhysicsCard` per post: title, description, date, tags
- `CardLayout` computes anchor positions

### `/blog/:slug` → `BlogPost` (CanvasLayout)
- Single `PhysicsCard` containing the full MDX post body
- `overflow-y: auto` + `max-height` so long posts scroll within the card
- `<a href="/blog/${slug}/read">Read in plain mode</a>` at the top — plain `<a>`, not `<Link>`, to force a full document load and exclude canvas JS from the plain bundle

### `/blog/:slug/read` → `BlogPostReader` (PlainLayout)
- Two-column layout: sticky TOC sidebar (left) + post body (right)
- TOC items are plain `<a href="#slug">` anchor links
- No physics, no canvas, no Three.js/matter.js in this bundle

### Static path generation
`vite.config.ts` gains an `ssgOptions.includedRoutes` async function that reads all non-draft post slugs (via `fs.glob` on `content/blog/`) and returns the full list of paths to prerender:

```
['/', '/blog', '/blog/hello-world', '/blog/hello-world/read', ...]
```

This is how vite-react-ssg knows which URLs to render for dynamic routes — not a per-route `getStaticPaths`.

---

## 4. MDX Components (`web/src/blog/components/`)

Available in every MDX file via `<MDXProvider>` wrapping blog routes. No per-post imports needed.

| Component | Element | Notes |
|---|---|---|
| `<Callout type="note\|warn\|aside">` | `<aside role="note">` | Colored left-border block |
| `<Figure src caption credit?>` | `<figure>` | `<img loading="lazy">` + `<figcaption>` |
| `<Video src caption?>` | `<video controls>` | Optional `<figcaption>` |

---

## 5. Placeholder Post

`content/blog/2026-05-09-hello-world/index.mdx`

- Exercises all three MDX components
- One co-located image `cover.png` referenced as `![](./cover.png)` — verifies image resolution works
- `draft: false` so it appears in production builds

---

## 6. Vite Plugin — Feeds (`web/src/blog/vite-plugin-feeds.ts`)

Hooks `closeBundle` (Node.js context, runs during the Vite build). Reads MDX source files from disk via Node `fs` — not `import.meta.glob`, which is browser-only. Uses `gray-matter` to parse frontmatter and `@mdx-js/mdx` `compile()` + React `renderToStaticMarkup` to convert each post body to an HTML string.

**`dist/rss.xml`** — RSS 2.0, full post bodies. Includes `<title>`, `<link>`, `<description>`, `<pubDate>` per item. Drafts excluded (checked via `draft` frontmatter field).

**`dist/sitemap.xml`** — All canonical routes:
- `/`
- `/blog`
- `/blog/<slug>` for each non-draft post
- `/blog/<slug>/read` for each non-draft post

Plugin is added to `vite.config.ts` plugins array, runs unconditionally during build (not dev).

---

## 7. Testing

TDD for the pure-function core of `posts.ts`:

- Slug derivation from directory name (strips date prefix correctly)
- Draft filtering: draft posts excluded in prod, included in dev
- Zod validation: missing required field produces a validation error (not a silent empty result)
- Sort order: posts returned reverse-chronological by date

Tests live in `web/src/blog/posts.test.ts`, run with `npm run test`.

---

## 8. Build Verification Checklist (per CLAUDE.md)

- `npm run typecheck` — no type errors
- `npm run test` — all blog utility tests pass
- `npm run build` — completes without error; `dist/rss.xml` and `dist/sitemap.xml` present
- `dist/blog/index.html` contains `data-server-rendered="true"` and post titles
- `dist/blog/hello-world/index.html` prerendered
- `dist/blog/hello-world/read/index.html` prerendered
- Plain-mode bundle (`read/`) does not include Three.js or matter.js chunks (check `dist/` filenames)
- RSS validates as RSS 2.0
- Sitemap includes all four route types

---

## Out of Scope for This Slice

- `<NowPlaying />`, `<BookCard />`, `<RuffleEmbed />` MDX components (arrive in their respective slices)
- OpenGraph image auto-generation (manual `og_image` per post)
- Image processing pipeline (sharp, AVIF/WebP) — author pre-compresses
- Pagination on `/blog` index
- Tag filtering pages (`/blog/tags/<tag>`)
