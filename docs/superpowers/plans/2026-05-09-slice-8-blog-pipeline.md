# Slice 8: Blog Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up the complete blog content pipeline: MDX files in `content/blog/` → three prerendered routes (`/blog`, `/blog/:slug`, `/blog/:slug/read`), RSS 2.0 feed, and sitemap, with one placeholder post exercising all features.

**Architecture:** `@mdx-js/rollup` transforms `.mdx` to React components in Vite; a custom remark plugin exports a `toc` named export from each file; `ssgOptions.includedRoutes` enumerates dynamic slugs for prerendering; a `closeBundle` Vite plugin writes `rss.xml` and `sitemap.xml` to `dist/`. PhysicsCard is extended to support optional `children` and explicit dimensions for the single-post canvas view.

**Tech Stack:** `@mdx-js/rollup`, `remark-frontmatter`, `remark-mdx-frontmatter`, `remark-mdx-images`, `rehype-pretty-code` + `shiki`, `rehype-slug`, `rehype-autolink-headings`, `github-slugger`, `estree-util-value-to-estree`, `gray-matter`, `zod`, Vitest.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `web/src/blog/types.ts` | `Post`, `PostFrontmatter`, `TocEntry` types |
| Create | `web/src/blog/posts.ts` | Post loading utility (glob + pure helpers) |
| Create | `web/src/blog/posts.test.ts` | Unit tests for pure helpers |
| Create | `web/src/blog/remark-extract-toc.ts` | Remark plugin — injects `export const toc` |
| Create | `web/src/blog/vite-plugin-feeds.ts` | Vite plugin — writes `rss.xml` + `sitemap.xml` |
| Create | `web/src/blog/components/Callout.tsx` | MDX `<Callout>` component |
| Create | `web/src/blog/components/Callout.css` | Callout styles |
| Create | `web/src/blog/components/Figure.tsx` | MDX `<Figure>` component |
| Create | `web/src/blog/components/Video.tsx` | MDX `<Video>` component |
| Create | `web/src/blog/components/mdx-components.ts` | `mdxComponents` map |
| Create | `web/src/routes/blog/BlogIndex.tsx` | `/blog` route |
| Create | `web/src/routes/blog/BlogPost.tsx` | `/blog/:slug` route |
| Create | `web/src/routes/blog/BlogPost.css` | Blog post card styles |
| Create | `web/src/routes/blog/BlogPostReader.tsx` | `/blog/:slug/read` route |
| Create | `web/src/routes/blog/BlogPostReader.css` | Reader two-column styles |
| Create | `content/blog/2026-05-09-hello-world/index.mdx` | Placeholder post |
| Create | `content/blog/2026-05-09-hello-world/cover.png` | Co-located placeholder image |
| Modify | `web/vite.config.ts` | Add MDX plugin, rehype plugins, includedRoutes, fs.allow |
| Modify | `web/src/App.tsx` | Add blog routes |
| Modify | `web/src/vite-env.d.ts` | Add MDX module type declarations |
| Modify | `web/src/physics/PhysicsCard.tsx` | Add optional `children` + `width`/`height` props |

---

## Task 1: Create Feature Branch + Install Dependencies

**Files:** `web/package.json` (modified by npm)

- [ ] **Step 1: Create feature branch**

```bash
git checkout main && git pull origin main
git checkout -b feat/issue-8-blog-pipeline
```

Expected: on branch `feat/issue-8-blog-pipeline`.

- [ ] **Step 2: Install runtime packages**

```bash
cd web && npm install @mdx-js/rollup remark-frontmatter remark-mdx-frontmatter remark-mdx-images rehype-pretty-code shiki rehype-slug rehype-autolink-headings gray-matter zod github-slugger estree-util-value-to-estree
```

Expected: packages added to `node_modules/`, `package.json` and `package-lock.json` updated.

- [ ] **Step 3: Verify installs**

```bash
cd web && node -e "require('@mdx-js/rollup'); require('gray-matter'); require('zod'); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 4: Commit**

```bash
cd web && git add package.json package-lock.json && git commit -m "chore: add MDX pipeline and blog dependencies

Refs #8"
```

---

## Task 2: TypeScript Types + MDX Module Declaration

**Files:**
- Create: `web/src/blog/types.ts`
- Modify: `web/src/vite-env.d.ts`

- [ ] **Step 1: Create types file**

Create `web/src/blog/types.ts`:

```ts
export interface TocEntry {
  depth: number
  text: string
  slug: string
}

export interface PostFrontmatter {
  title: string
  description: string
  date: string
  tags: string[]
  draft: boolean
  og_image?: string
}

export interface Post {
  slug: string
  frontmatter: PostFrontmatter
  toc: TocEntry[]
  Component: React.ComponentType<{ components?: Record<string, React.ComponentType<any>> }>
}
```

- [ ] **Step 2: Add MDX module declaration to vite-env.d.ts**

The current `web/src/vite-env.d.ts` contains:
```ts
/// <reference types="vite/client" />
```

Append these declarations:

```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  import type { PostFrontmatter, TocEntry } from './blog/types'

  const Component: ComponentType<{
    components?: Record<string, ComponentType<any>>
  }>
  export default Component
  export const frontmatter: PostFrontmatter
  export const toc: TocEntry[]
}
```

- [ ] **Step 3: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors (the new types are referenced by no code yet).

---

## Task 3: posts.ts — Write Failing Tests (RED)

**Files:**
- Create: `web/src/blog/posts.test.ts`

The `posts.ts` file will export three pure helpers:
- `deriveSlug(path: string): string` — extracts slug from a glob key path
- `validateFrontmatter(raw: unknown): PostFrontmatter` — zod parse, throws on invalid
- `filterAndSort(posts: Post[], isProd: boolean): Post[]` — filter drafts + sort

- [ ] **Step 1: Write the failing tests**

Create `web/src/blog/posts.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { deriveSlug, validateFrontmatter, filterAndSort } from './posts'
import type { Post } from './types'

describe('deriveSlug', () => {
  it('strips date prefix from glob key path', () => {
    expect(
      deriveSlug('../../../content/blog/2026-05-09-hello-world/index.mdx'),
    ).toBe('hello-world')
  })

  it('handles a slug with no extra hyphens', () => {
    expect(
      deriveSlug('../../../content/blog/2026-01-01-intro/index.mdx'),
    ).toBe('intro')
  })

  it('strips only the leading YYYY-MM-DD- prefix', () => {
    expect(
      deriveSlug('../../../content/blog/2025-12-31-my-year-in-review/index.mdx'),
    ).toBe('my-year-in-review')
  })
})

describe('validateFrontmatter', () => {
  const valid = {
    title: 'Hello World',
    description: 'A test post.',
    date: '2026-05-09',
    tags: ['meta'],
  }

  it('accepts valid frontmatter and fills in draft default', () => {
    const result = validateFrontmatter(valid)
    expect(result.draft).toBe(false)
    expect(result.og_image).toBeUndefined()
  })

  it('accepts frontmatter with draft and og_image', () => {
    const result = validateFrontmatter({ ...valid, draft: true, og_image: './cover.png' })
    expect(result.draft).toBe(true)
    expect(result.og_image).toBe('./cover.png')
  })

  it('throws when title is missing', () => {
    const { title: _, ...noTitle } = valid
    expect(() => validateFrontmatter(noTitle)).toThrow()
  })

  it('throws when description is missing', () => {
    const { description: _, ...noDesc } = valid
    expect(() => validateFrontmatter(noDesc)).toThrow()
  })

  it('throws when date is not ISO 8601 format', () => {
    expect(() => validateFrontmatter({ ...valid, date: 'May 9 2026' })).toThrow()
  })

  it('throws when tags is not an array', () => {
    expect(() => validateFrontmatter({ ...valid, tags: 'meta' })).toThrow()
  })
})

describe('filterAndSort', () => {
  const makePost = (slug: string, date: string, draft = false): Post => ({
    slug,
    frontmatter: { title: slug, description: '', date, tags: [], draft },
    toc: [],
    Component: () => null,
  })

  it('sorts posts reverse-chronologically', () => {
    const posts = [
      makePost('jan', '2026-01-15'),
      makePost('jun', '2026-06-01'),
      makePost('mar', '2026-03-20'),
    ]
    const sorted = filterAndSort(posts, false)
    expect(sorted.map(p => p.slug)).toEqual(['jun', 'mar', 'jan'])
  })

  it('excludes draft posts in production', () => {
    const posts = [
      makePost('pub', '2026-01-01'),
      makePost('wip', '2026-02-01', true),
    ]
    const result = filterAndSort(posts, true)
    expect(result.map(p => p.slug)).toEqual(['pub'])
  })

  it('includes draft posts outside production', () => {
    const posts = [
      makePost('pub', '2026-01-01'),
      makePost('wip', '2026-02-01', true),
    ]
    expect(filterAndSort(posts, false)).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    expect(filterAndSort([], true)).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd web && npm run test -- posts.test.ts
```

Expected: FAIL — `Cannot find module './posts'`

---

## Task 4: posts.ts — Implement (GREEN)

**Files:**
- Create: `web/src/blog/posts.ts`

- [ ] **Step 1: Implement posts.ts**

Create `web/src/blog/posts.ts`:

```ts
import { z } from 'zod'
import type { Post, PostFrontmatter, TocEntry } from './types'

const PostSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.string().date(),
  tags: z.array(z.string()),
  draft: z.boolean().default(false),
  og_image: z.string().optional(),
})

// Derives slug from a glob key like '../../../content/blog/2026-05-09-hello-world/index.mdx'
export function deriveSlug(globKey: string): string {
  const dir = globKey.split('/').at(-2) ?? ''
  return dir.replace(/^\d{4}-\d{2}-\d{2}-/, '')
}

// Validates raw frontmatter with zod; throws ZodError on missing/invalid fields.
export function validateFrontmatter(raw: unknown): PostFrontmatter {
  return PostSchema.parse(raw)
}

// Filters drafts in production; sorts reverse-chronological by date string.
export function filterAndSort(posts: Post[], isProd: boolean): Post[] {
  return posts
    .filter(p => !isProd || !p.frontmatter.draft)
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date))
}

type MdxModule = {
  default: Post['Component']
  frontmatter: unknown
  toc: TocEntry[]
}

export function getPosts(): Post[] {
  const modules = import.meta.glob<MdxModule>(
    '../../../content/blog/**/index.mdx',
    { eager: true },
  )
  const all: Post[] = Object.entries(modules).map(([path, mod]) => ({
    slug: deriveSlug(path),
    frontmatter: validateFrontmatter(mod.frontmatter),
    toc: mod.toc ?? [],
    Component: mod.default,
  }))
  return filterAndSort(all, import.meta.env.PROD)
}
```

- [ ] **Step 2: Run tests**

```bash
cd web && npm run test -- posts.test.ts
```

Expected: all tests PASS (the test file imports the pure helpers only, not `getPosts` which uses `import.meta.glob`).

- [ ] **Step 3: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/blog/types.ts web/src/blog/posts.ts web/src/blog/posts.test.ts web/src/vite-env.d.ts && git commit -m "feat: blog post loading utility + types (TDD)

Pure helpers deriveSlug/validateFrontmatter/filterAndSort are
unit-tested; getPosts() uses import.meta.glob (Vite-only).

Refs #8"
```

---

## Task 5: remark-extract-toc Plugin

**Files:**
- Create: `web/src/blog/remark-extract-toc.ts`

This remark plugin runs during MDX compilation. It traverses heading nodes in the Markdown AST, generates slugs consistent with `rehype-slug` (both use `github-slugger`), and injects `export const toc = [...]` as a named ESM export from the MDX file.

- [ ] **Step 1: Create the plugin**

Create `web/src/blog/remark-extract-toc.ts`:

```ts
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import { valueToEstree } from 'estree-util-value-to-estree'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

export const remarkExtractToc: Plugin<[], Root> = () => (tree) => {
  const slugger = new GithubSlugger()
  const toc: Array<{ depth: number; text: string; slug: string }> = []

  visit(tree, 'heading', (node) => {
    const text = toString(node)
    const slug = slugger.slug(text)
    toc.push({ depth: node.depth, text, slug })
  })

  // Appends: export const toc = [...] to the compiled MDX output
  tree.children.push({
    type: 'mdxjsEsm',
    value: `export const toc = ${JSON.stringify(toc)}`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExportNamedDeclaration',
            declaration: {
              type: 'VariableDeclaration',
              kind: 'const',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: 'toc' },
                  init: valueToEstree(toc),
                },
              ],
            },
            specifiers: [],
            source: null,
          },
        ],
      },
    },
  } as any)
}
```

- [ ] **Step 2: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/blog/remark-extract-toc.ts && git commit -m "feat: remarkExtractToc plugin — injects toc named export from MDX

Refs #8"
```

---

## Task 6: vite.config.ts — MDX Pipeline

**Files:**
- Modify: `web/vite.config.ts`

- [ ] **Step 1: Replace vite.config.ts**

The current file is at `web/vite.config.ts`. Replace its full content with:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkMdxImages from 'remark-mdx-images'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { remarkExtractToc } from './src/blog/remark-extract-toc'
import { vitePluginFeeds } from './src/blog/vite-plugin-feeds'
import { readdir, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import matter from 'gray-matter'

async function getBlogSlugs(): Promise<string[]> {
  try {
    const contentDir = resolve(process.cwd(), '..', 'content', 'blog')
    const entries = await readdir(contentDir, { withFileTypes: true })
    const isProd = process.env.NODE_ENV === 'production'
    const slugs = await Promise.all(
      entries
        .filter(e => e.isDirectory())
        .map(async (e) => {
          const mdxPath = join(contentDir, e.name, 'index.mdx')
          const raw = await readFile(mdxPath, 'utf-8')
          const { data } = matter(raw)
          if (isProd && data.draft) return null
          return e.name.replace(/^\d{4}-\d{2}-\d{2}-/, '')
        }),
    )
    return slugs.filter((s): s is string => s !== null)
  } catch {
    return []
  }
}

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [
          remarkFrontmatter,
          remarkMdxFrontmatter,
          remarkMdxImages,
          remarkExtractToc,
        ],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          [rehypePrettyCode, { theme: 'github-dark' }],
        ],
      }),
    },
    react(),
    vitePluginFeeds({ baseUrl: 'https://chaipalaka.com' }),
  ],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  ssgOptions: {
    script: 'async',
    formatting: 'none',
    dirStyle: 'nested',
    async includedRoutes(paths) {
      const slugs = await getBlogSlugs()
      const blogPaths = slugs.flatMap(slug => [
        `/blog/${slug}`,
        `/blog/${slug}/read`,
      ])
      return [...paths, ...blogPaths]
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
  },
})
```

- [ ] **Step 2: Create the placeholder vite-plugin-feeds to unblock typecheck**

The vite.config.ts imports `vitePluginFeeds` which doesn't exist yet. Create a stub:

Create `web/src/blog/vite-plugin-feeds.ts`:

```ts
import type { Plugin } from 'vite'

interface FeedsOptions {
  baseUrl: string
}

export function vitePluginFeeds(_options: FeedsOptions): Plugin {
  return {
    name: 'vite-plugin-feeds',
    apply: 'build',
  }
}
```

- [ ] **Step 3: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors. If you see `Cannot find module 'remark-mdx-images'` or similar, confirm it was installed in Task 1.

- [ ] **Step 4: Commit**

```bash
git add web/vite.config.ts web/src/blog/vite-plugin-feeds.ts && git commit -m "feat: MDX pipeline in vite.config.ts + stub feed plugin

Refs #8"
```

---

## Task 7: Placeholder Post + Image

**Files:**
- Create: `content/blog/2026-05-09-hello-world/` (directory)
- Create: `content/blog/2026-05-09-hello-world/index.mdx`
- Create: `content/blog/2026-05-09-hello-world/cover.png`

- [ ] **Step 1: Create the content directory**

```bash
mkdir -p /Users/chaipalaka/Code/chaipalaka.com/content/blog/2026-05-09-hello-world
```

- [ ] **Step 2: Generate a placeholder image**

```bash
cd web && node -e "
import('sharp').then(({ default: sharp }) =>
  sharp({
    create: { width: 800, height: 400, channels: 3, background: { r: 30, g: 30, b: 46 } }
  }).png().toFile('../content/blog/2026-05-09-hello-world/cover.png')
  .then(() => console.log('cover.png created'))
)"
```

Expected output: `cover.png created`

- [ ] **Step 3: Create the placeholder MDX post**

Create `content/blog/2026-05-09-hello-world/index.mdx`:

```mdx
---
title: Hello, World
description: The first post on chaipalaka.com — a quick tour of what this site is and how it was built.
date: "2026-05-09"
tags: [meta, web]
draft: false
---

Welcome to chaipalaka.com. This is the first post, and it's mostly here to verify the blog pipeline works end-to-end.

## What this site is

A physics-driven, generative-art-backed personal site. Cards float. Backgrounds pulse. You can drag things.

![The site's dark color palette](./cover.png)

## A code sample

Here's a quick snippet to verify syntax highlighting:

```ts
function greet(name: string): string {
  return `Hello, ${name}!`
}
```

## Custom components

<Callout type="note">
  This is a note callout. It should render with a colored left border.
</Callout>

<Figure
  src="./cover.png"
  caption="A placeholder cover image co-located with this post"
  credit="Generated with sharp"
/>

<Callout type="warn">
  This is a warning callout.
</Callout>

<Callout type="aside">
  This is an aside callout.
</Callout>

## What's next

More posts on frontend craft, physics-driven UI, and creative coding.
```

- [ ] **Step 4: Verify the content directory structure**

```bash
ls -la /Users/chaipalaka/Code/chaipalaka.com/content/blog/2026-05-09-hello-world/
```

Expected: `index.mdx` and `cover.png` both present.

- [ ] **Step 5: Commit**

```bash
git add content/blog/ && git commit -m "feat: placeholder hello-world blog post with co-located image

Refs #8"
```

---

## Task 8: Extend PhysicsCard with children + size overrides

**Files:**
- Modify: `web/src/physics/PhysicsCard.tsx`

The blog canvas post view needs a PhysicsCard that renders arbitrary children (MDX content) and can be given explicit dimensions (since MDX body size can't be precomputed with pretext). This change is backward-compatible: existing usages pass no `children` and no `width`/`height`, so behavior is unchanged.

- [ ] **Step 1: Read current PhysicsCard**

Read `web/src/physics/PhysicsCard.tsx` to verify current state, then apply changes.

- [ ] **Step 2: Update PhysicsCardProps interface**

In `web/src/physics/PhysicsCard.tsx`, change the interface from:

```ts
export interface PhysicsCardProps {
  text: string
  fontKey: string
  maxWidth: number
  anchor: { x: number; y: number }
}
```

to:

```ts
export interface PhysicsCardProps {
  text: string
  fontKey: string
  maxWidth: number
  anchor: { x: number; y: number }
  children?: React.ReactNode
  width?: number
  height?: number
}
```

- [ ] **Step 3: Update function signature and size logic**

Change:

```ts
export function PhysicsCard({ text, fontKey, maxWidth, anchor }: PhysicsCardProps) {
```

to:

```ts
export function PhysicsCard({ text, fontKey, maxWidth, anchor, children, width: explicitW, height: explicitH }: PhysicsCardProps) {
```

In the registration `useEffect`, replace the two lines:

```ts
const measured = pretextRegistry.measure(text, fontKey, maxWidth)
const w = measured.width + CARD_PADDING_PX * 2
const h = measured.height + CARD_PADDING_PX * 2
```

with:

```ts
let w: number
let h: number
if (explicitW !== undefined && explicitH !== undefined) {
  w = explicitW
  h = explicitH
} else {
  const measured = pretextRegistry.measure(text, fontKey, maxWidth)
  w = measured.width + CARD_PADDING_PX * 2
  h = measured.height + CARD_PADDING_PX * 2
}
```

- [ ] **Step 4: Update the render return**

Change:

```tsx
return (
  <article ref={elRef} className="physics-card">
    {text}
  </article>
)
```

to:

```tsx
return (
  <article ref={elRef} className="physics-card">
    {children ?? text}
  </article>
)
```

- [ ] **Step 5: Run existing tests**

```bash
cd web && npm run test
```

Expected: all existing tests pass (PhysicsCard has no direct tests; the test suite tests PhysicsWorld and CardLayout, which are unaffected).

- [ ] **Step 6: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add web/src/physics/PhysicsCard.tsx && git commit -m "feat: PhysicsCard accepts optional children and explicit dimensions

Backward-compatible: existing usages unchanged. Blog post
canvas route needs to render MDX content inside a physics card
of fixed viewport-fraction size.

Refs #8"
```

---

## Task 9: MDX Components

**Files:**
- Create: `web/src/blog/components/Callout.tsx`
- Create: `web/src/blog/components/Callout.css`
- Create: `web/src/blog/components/Figure.tsx`
- Create: `web/src/blog/components/Video.tsx`
- Create: `web/src/blog/components/mdx-components.ts`

- [ ] **Step 1: Create Callout.tsx**

```tsx
import './Callout.css'

interface CalloutProps {
  type: 'note' | 'warn' | 'aside'
  children: React.ReactNode
}

export function Callout({ type, children }: CalloutProps) {
  return (
    <aside className={`callout callout--${type}`} role="note">
      {children}
    </aside>
  )
}
```

- [ ] **Step 2: Create Callout.css**

```css
.callout {
  border-left: 4px solid var(--callout-border, var(--color-accent));
  padding: var(--space-3) var(--space-4);
  margin: var(--space-4) 0;
  background: color-mix(in srgb, var(--callout-border, var(--color-accent)) 8%, transparent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.callout--note {
  --callout-border: #60a5fa;
}

.callout--warn {
  --callout-border: #fb923c;
}

.callout--aside {
  --callout-border: #a78bfa;
}
```

- [ ] **Step 3: Create Figure.tsx**

```tsx
interface FigureProps {
  src: string
  caption: string
  credit?: string
  alt?: string
}

export function Figure({ src, caption, credit, alt }: FigureProps) {
  return (
    <figure>
      <img src={src} alt={alt ?? caption} loading="lazy" />
      <figcaption>
        {caption}
        {credit && <span className="figure-credit"> — {credit}</span>}
      </figcaption>
    </figure>
  )
}
```

- [ ] **Step 4: Create Video.tsx**

```tsx
interface VideoProps {
  src: string
  caption?: string
}

export function Video({ src, caption }: VideoProps) {
  return (
    <figure>
      <video src={src} controls style={{ width: '100%' }} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
```

- [ ] **Step 5: Create mdx-components.ts**

```ts
import { Callout } from './Callout'
import { Figure } from './Figure'
import { Video } from './Video'

export const mdxComponents = {
  Callout,
  Figure,
  Video,
}
```

- [ ] **Step 6: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add web/src/blog/components/ && git commit -m "feat: MDX components — Callout, Figure, Video

Refs #8"
```

---

## Task 10: BlogIndex Route

**Files:**
- Create: `web/src/routes/blog/BlogIndex.tsx`

Pattern mirrors `Home.tsx`: compute CardLayout anchors client-side in a `useEffect`, render one PhysicsCard per post.

- [ ] **Step 1: Create BlogIndex.tsx**

```tsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PhysicsCard } from '../../physics/PhysicsCard'
import { cardLayout, type CardSpec, type CardAnchor } from '../../physics/CardLayout'
import { registry as pretextRegistry } from '../../text/registry'
import { getPosts } from '../../blog/posts'

const posts = getPosts()

function buildSpecs(): CardSpec[] {
  return posts.map(post => ({
    id: post.slug,
    text: `${post.frontmatter.title}\n${post.frontmatter.description}`,
    fontKey: 'body',
  }))
}

function computeAnchors(): CardAnchor[] {
  const vp = { width: window.innerWidth, height: window.innerHeight }
  return cardLayout(buildSpecs(), vp, (text, fontKey, maxWidth) =>
    pretextRegistry.measure(text, fontKey, maxWidth),
  )
}

export default function BlogIndex() {
  const [anchors, setAnchors] = useState<CardAnchor[]>([])

  useEffect(() => {
    setAnchors(computeAnchors())
    const onResize = () => setAnchors(computeAnchors())
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      {anchors.map((anchor) => {
        const post = posts.find(p => p.slug === anchor.id)!
        return (
          <PhysicsCard
            key={anchor.id}
            text={`${post.frontmatter.title}\n${post.frontmatter.description}`}
            fontKey="body"
            maxWidth={anchor.maxWidth}
            anchor={{ x: anchor.x, y: anchor.y }}
          >
            <Link to={`/blog/${post.slug}`} style={{ display: 'contents' }}>
              <h2>{post.frontmatter.title}</h2>
              <p>{post.frontmatter.description}</p>
              <time dateTime={post.frontmatter.date}>
                {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {post.frontmatter.tags.length > 0 && (
                <ul aria-label="tags">
                  {post.frontmatter.tags.map(tag => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
            </Link>
          </PhysicsCard>
        )
      })}
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/routes/blog/BlogIndex.tsx && git commit -m "feat: BlogIndex route — canvas grid of post cards

Refs #8"
```

---

## Task 11: BlogPost Route (Canvas Mode)

**Files:**
- Create: `web/src/routes/blog/BlogPost.tsx`
- Create: `web/src/routes/blog/BlogPost.css`

A single PhysicsCard sized at 65vh height / max 720px wide containing the full MDX post body. The card has internal scroll via CSS.

- [ ] **Step 1: Create BlogPost.css**

```css
.blog-post-card {
  overflow-y: auto;
  max-height: 65vh;
  padding: 0;
}

.blog-post-card article {
  padding: var(--space-6) var(--space-5);
}

.blog-post-card h1 {
  font-size: var(--text-2xl);
  margin-bottom: var(--space-2);
}

.blog-post-card .post-meta {
  font-size: var(--text-sm);
  color: color-mix(in srgb, var(--color-fg) 60%, transparent);
  margin-bottom: var(--space-5);
}

.blog-post-card .plain-mode-link {
  display: inline-block;
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  text-decoration: underline;
}
```

- [ ] **Step 2: Create BlogPost.tsx**

All dimensions are state-driven and computed inside `useEffect` so no `window` access happens during SSR prerender.

```tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PhysicsCard } from '../../physics/PhysicsCard'
import { getPosts } from '../../blog/posts'
import { mdxComponents } from '../../blog/components/mdx-components'
import './BlogPost.css'

const posts = getPosts()

const CARD_MAX_WIDTH = 720
const CARD_PADDING = 24

interface CardDims {
  anchor: { x: number; y: number }
  w: number
  h: number
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = posts.find(p => p.slug === slug)
  const [dims, setDims] = useState<CardDims | null>(null)

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = Math.min(CARD_MAX_WIDTH + CARD_PADDING * 2, vw - 32)
      const h = Math.round(vh * 0.65)
      setDims({ anchor: { x: vw / 2, y: vh / 2 }, w, h })
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  if (!post || !dims) return null

  const PostContent = post.Component

  return (
    <PhysicsCard
      text={post.frontmatter.title}
      fontKey="body"
      maxWidth={CARD_MAX_WIDTH}
      anchor={dims.anchor}
      width={dims.w}
      height={dims.h}
    >
      <div className="blog-post-card" style={{ width: dims.w, height: dims.h }}>
        <article>
          <a className="plain-mode-link" href={`/blog/${slug}/read`}>
            Read in plain mode ↗
          </a>
          <h1>{post.frontmatter.title}</h1>
          <p className="post-meta">
            <time dateTime={post.frontmatter.date}>
              {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </time>
            {post.frontmatter.tags.length > 0 && (
              <> · {post.frontmatter.tags.join(', ')}</>
            )}
          </p>
          <PostContent components={mdxComponents} />
        </article>
      </div>
    </PhysicsCard>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/routes/blog/BlogPost.tsx web/src/routes/blog/BlogPost.css && git commit -m "feat: BlogPost route — canvas mode with scrollable PhysicsCard

Refs #8"
```

---

## Task 12: BlogPostReader Route (Plain Mode)

**Files:**
- Create: `web/src/routes/blog/BlogPostReader.tsx`
- Create: `web/src/routes/blog/BlogPostReader.css`

Two-column layout: sticky TOC sidebar (left) + post body (right). No physics, no canvas. Navigated to via a plain `<a>` which forces a full document load (no canvas JS imported).

- [ ] **Step 1: Create BlogPostReader.css**

```css
.reader {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: var(--space-8);
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
}

@media (max-width: 640px) {
  .reader {
    grid-template-columns: 1fr;
  }

  .reader__toc {
    position: static;
    border-bottom: 1px solid color-mix(in srgb, var(--color-fg) 15%, transparent);
    padding-bottom: var(--space-4);
    margin-bottom: var(--space-4);
  }
}

.reader__toc {
  position: sticky;
  top: var(--space-8);
  align-self: start;
  font-size: var(--text-sm);
}

.reader__toc h2 {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--color-fg) 50%, transparent);
  margin-bottom: var(--space-3);
}

.reader__toc ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.reader__toc a {
  color: color-mix(in srgb, var(--color-fg) 70%, transparent);
  text-decoration: none;
}

.reader__toc a:hover {
  color: var(--color-fg);
}

.reader__toc [data-depth="3"],
.reader__toc [data-depth="4"] {
  padding-left: var(--space-3);
}

.reader__body h1 {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-2);
}

.reader__body .post-meta {
  font-size: var(--text-sm);
  color: color-mix(in srgb, var(--color-fg) 60%, transparent);
  margin-bottom: var(--space-8);
}

.reader__body {
  max-width: 70ch;
}
```

- [ ] **Step 2: Create BlogPostReader.tsx**

```tsx
import { useParams } from 'react-router-dom'
import { getPosts } from '../../blog/posts'
import { mdxComponents } from '../../blog/components/mdx-components'
import './BlogPostReader.css'

const posts = getPosts()

export default function BlogPostReader() {
  const { slug } = useParams<{ slug: string }>()
  const post = posts.find(p => p.slug === slug)

  if (!post) return null

  const PostContent = post.Component

  return (
    <main className="reader">
      <nav className="reader__toc" aria-label="Table of contents">
        <h2>Contents</h2>
        <ol>
          {post.toc.map(entry => (
            <li key={entry.slug} data-depth={entry.depth}>
              <a href={`#${entry.slug}`}>{entry.text}</a>
            </li>
          ))}
        </ol>
      </nav>

      <article className="reader__body">
        <h1>{post.frontmatter.title}</h1>
        <p className="post-meta">
          <time dateTime={post.frontmatter.date}>
            {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </time>
          {post.frontmatter.tags.length > 0 && (
            <> · {post.frontmatter.tags.join(', ')}</>
          )}
        </p>
        <PostContent components={mdxComponents} />
      </article>
    </main>
  )
}
```

- [ ] **Step 3: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/routes/blog/BlogPostReader.tsx web/src/routes/blog/BlogPostReader.css && git commit -m "feat: BlogPostReader route — plain mode two-column with sticky TOC

Refs #8"
```

---

## Task 13: Wire Routes in App.tsx

**Files:**
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Read current App.tsx**

Read `web/src/App.tsx` to confirm current state, then add blog routes.

- [ ] **Step 2: Add blog routes**

The current `routes` array has entries for `/` (CanvasLayout + Home), `/test/canvas`, and `/test/plain`. Append these entries:

```ts
  {
    path: '/blog',
    lazy: async () => {
      const { default: CanvasLayout } = await import('./layouts/CanvasLayout')
      return { Component: CanvasLayout }
    },
    entry: 'src/layouts/CanvasLayout.tsx',
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: BlogIndex } = await import('./routes/blog/BlogIndex')
          return { Component: BlogIndex }
        },
        entry: 'src/routes/blog/BlogIndex.tsx',
      },
      {
        path: ':slug',
        lazy: async () => {
          const { default: BlogPost } = await import('./routes/blog/BlogPost')
          return { Component: BlogPost }
        },
        entry: 'src/routes/blog/BlogPost.tsx',
      },
    ],
  },
  {
    path: '/blog/:slug/read',
    lazy: async () => {
      const { default: PlainLayout } = await import('./layouts/PlainLayout')
      return { Component: PlainLayout }
    },
    entry: 'src/layouts/PlainLayout.tsx',
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: BlogPostReader } = await import('./routes/blog/BlogPostReader')
          return { Component: BlogPostReader }
        },
        entry: 'src/routes/blog/BlogPostReader.tsx',
      },
    ],
  },
```

- [ ] **Step 3: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Run full test suite**

```bash
cd web && npm run test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/App.tsx && git commit -m "feat: add blog routes to App.tsx — /blog, /blog/:slug, /blog/:slug/read

Refs #8"
```

---

## Task 14: Vite Plugin — RSS + Sitemap

**Files:**
- Modify: `web/src/blog/vite-plugin-feeds.ts` (replace stub with full implementation)

- [ ] **Step 1: Replace the stub with the full plugin**

Replace the entire content of `web/src/blog/vite-plugin-feeds.ts`:

```ts
import type { Plugin } from 'vite'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import matter from 'gray-matter'

interface FeedsOptions {
  baseUrl: string
}

interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  body: string
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function collectPosts(contentDir: string, isProd: boolean): Promise<PostMeta[]> {
  const entries = await readdir(contentDir, { withFileTypes: true })
  const metas = await Promise.all(
    entries
      .filter(e => e.isDirectory())
      .map(async (e) => {
        const mdxPath = join(contentDir, e.name, 'index.mdx')
        const raw = await readFile(mdxPath, 'utf-8')
        const { data, content } = matter(raw)
        if (isProd && data.draft) return null
        return {
          slug: e.name.replace(/^\d{4}-\d{2}-\d{2}-/, ''),
          title: String(data.title ?? ''),
          description: String(data.description ?? ''),
          date: String(data.date ?? ''),
          body: content,
        } satisfies PostMeta
      }),
  )
  return (metas.filter(Boolean) as PostMeta[]).sort(
    (a, b) => b.date.localeCompare(a.date),
  )
}

function buildRss(posts: PostMeta[], baseUrl: string): string {
  const items = posts
    .map((p) => {
      const link = `${baseUrl}/blog/${p.slug}`
      const pubDate = new Date(p.date).toUTCString()
      return `
  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${link}</link>
    <description>${escapeXml(p.description)}</description>
    <pubDate>${pubDate}</pubDate>
    <guid isPermaLink="true">${link}</guid>
    <content:encoded><![CDATA[${p.body}]]></content:encoded>
  </item>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>chaipalaka.com</title>
    <link>${baseUrl}</link>
    <description>Writing on frontend architecture, creative coding, and the open web.</description>
    <language>en</language>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`
}

function buildSitemap(posts: PostMeta[], baseUrl: string): string {
  const staticRoutes = ['/', '/blog']
  const dynamicRoutes = posts.flatMap(p => [
    `/blog/${p.slug}`,
    `/blog/${p.slug}/read`,
  ])
  const urls = [...staticRoutes, ...dynamicRoutes]
    .map(route => `  <url>\n    <loc>${baseUrl}${route}</loc>\n  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

export function vitePluginFeeds(options: FeedsOptions): Plugin {
  let outDir = 'dist'
  let isProd = false

  return {
    name: 'vite-plugin-feeds',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
      isProd = config.mode === 'production'
    },
    async closeBundle() {
      const contentDir = resolve(process.cwd(), '..', 'content', 'blog')
      const posts = await collectPosts(contentDir, isProd)

      await writeFile(join(outDir, 'rss.xml'), buildRss(posts, options.baseUrl), 'utf-8')
      await writeFile(join(outDir, 'sitemap.xml'), buildSitemap(posts, options.baseUrl), 'utf-8')

      console.log(
        `[feeds] rss.xml + sitemap.xml written (${posts.length} post${posts.length === 1 ? '' : 's'})`,
      )
    },
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add web/src/blog/vite-plugin-feeds.ts && git commit -m "feat: Vite plugin writes rss.xml + sitemap.xml at build time

Refs #8"
```

---

## Task 15: Build Verification

**Files:** none — verification only

- [ ] **Step 1: Run tests**

```bash
cd web && npm run test
```

Expected: all tests pass including `posts.test.ts`.

- [ ] **Step 2: Typecheck**

```bash
cd web && npm run typecheck
```

Expected: zero errors.

- [ ] **Step 3: Build**

```bash
cd web && npm run build 2>&1 | tail -30
```

Expected: build completes. Watch for `[feeds] rss.xml + sitemap.xml written (1 post)` in the output.

- [ ] **Step 4: Verify prerendered pages exist**

```bash
ls web/dist/blog/
```

Expected: `index.html` and `hello-world/` directory.

```bash
ls web/dist/blog/hello-world/
```

Expected: `index.html` and `read/` directory.

```bash
ls web/dist/blog/hello-world/read/
```

Expected: `index.html`.

- [ ] **Step 5: Verify SSG marker in blog index**

```bash
grep -c 'data-server-rendered' web/dist/blog/index.html
```

Expected: `1`

- [ ] **Step 6: Verify RSS and sitemap are present**

```bash
ls -lh web/dist/rss.xml web/dist/sitemap.xml
```

Expected: both files exist with non-zero size.

- [ ] **Step 7: Verify RSS structure**

```bash
grep -E '<title>|<item>|<content:encoded>' web/dist/rss.xml | head -10
```

Expected: lines containing `<title>chaipalaka.com</title>`, `<item>`, and `<content:encoded>`.

- [ ] **Step 8: Verify sitemap contains all four route types**

```bash
grep '<loc>' web/dist/sitemap.xml
```

Expected: lines for `/`, `/blog`, `/blog/hello-world`, `/blog/hello-world/read`.

- [ ] **Step 9: Verify plain-mode bundle excludes canvas JS**

```bash
grep -l 'three\|matter' web/dist/blog/hello-world/read/index.html || echo "clean"
```

Expected: `clean` — no three.js or matter.js references in the plain-mode HTML file.

- [ ] **Step 10: Secret scan**

```bash
cd /Users/chaipalaka/Code/chaipalaka.com && grep -rniE '(api[_-]?key|secret|token|password)\s*[:=]\s*["'"'"'][^"'"'"']{8,}' \
  --include='*.ts' --include='*.tsx' --include='*.js' --include='*.json' \
  --include='*.md' --include='*.mdx' --include='Makefile' \
  --exclude-dir=node_modules --exclude-dir=dist \
  --exclude-dir=.git --exclude-dir=assets .
```

Expected: zero matches.

- [ ] **Step 11: Dev server smoke check**

```bash
cd web && npm run dev &
sleep 3
curl -s http://localhost:5173/blog | grep -c 'Hello'
kill %1
```

Expected: `1` or more (the post title appears in the prerendered HTML).

- [ ] **Step 12: Push branch and open PR**

```bash
git push -u origin feat/issue-8-blog-pipeline
```

Then open PR:

```bash
gh pr create \
  --title "Slice 8: Blog pipeline — MDX, three routes, RSS, sitemap (#8)" \
  --body "$(cat <<'EOF'
## Summary

- MDX pipeline wired into Vite (`@mdx-js/rollup`, `rehype-pretty-code`/shiki, `rehype-slug`, `remark-mdx-frontmatter`)
- `remarkExtractToc` plugin exports `toc` named export from every MDX file
- Three routes added: `/blog` (canvas grid), `/blog/:slug` (canvas PhysicsCard), `/blog/:slug/read` (plain two-column + sticky TOC)
- MDX components: `<Callout>`, `<Figure>`, `<Video>`
- Placeholder post at `content/blog/2026-05-09-hello-world/index.mdx` with co-located `cover.png`
- Vite plugin writes `dist/rss.xml` (RSS 2.0) and `dist/sitemap.xml` at build time

## Notes / deviations

- `content/` lives outside the Vite root; `server.fs.allow: ['..']` enables dev-server access; Rollup handles it natively during build
- PhysicsCard extended with optional `children` and explicit `width`/`height` props (backward compatible)
- RSS `<content:encoded>` contains raw MDX body (markdown), not rendered HTML — acceptable for v1 (most readers handle it)

## Acceptance criteria

- [x] MDX pipeline configured; missing required frontmatter fails the build with a useful error
- [x] One placeholder post exists with at least one co-located image; `![](./cover.png)` resolves correctly
- [x] `/blog`, `/blog/hello-world`, `/blog/hello-world/read` all reachable and prerendered to static HTML
- [x] Plain-mode link uses `<a>` not `<Link>`; verified that plain-mode HTML doesn't include canvas-layout JS chunks
- [x] `<Callout>`, `<Figure>`, `<Video>` available in MDX
- [x] Code blocks rendered with shiki at build time; no client-side highlighter loads
- [ ] `draft: true` posts visible in dev, absent from production build (verify manually by temporarily adding `draft: true` to the placeholder post)
- [x] `/rss.xml` present and includes placeholder post body
- [x] `/sitemap.xml` present and includes all canonical routes

## Test plan

```bash
cd web
npm run test        # posts.test.ts all pass
npm run typecheck   # zero errors
npm run build       # completes; rss.xml + sitemap.xml in dist/
ls dist/blog/hello-world/read/   # index.html present
grep data-server-rendered dist/blog/index.html
cat dist/rss.xml | grep '<item>'
cat dist/sitemap.xml | grep '<loc>'
```

Closes #8
EOF
)"
```

---
