/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkMdxImages from 'remark-mdx-images'
import remarkGfm from 'remark-gfm'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import { remarkExtractToc } from './src/blog/remark-extract-toc'
import { rehypePocketFootnotes } from './src/blog/rehype-pocket-footnotes'
import { rehypeLinkTypes } from './src/blog/rehype-link-types'
import { vitePluginFeeds } from './src/blog/vite-plugin-feeds'
import { vitePluginAtelier } from './src/atelier/vite-plugin-atelier'
import {
    buildSitemap,
    prerenderRoutes,
    sitemapRoutes,
} from './src/site-routes'
import { getContentSlugs } from './src/content-slugs'
import { stat, writeFile } from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import { join, resolve, extname } from 'node:path'
import type { Plugin } from 'vite'

const MIME: Record<string, string> = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.wasm': 'application/wasm',
    '.json': 'application/json',
    '.map': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.swf': 'application/x-shockwave-flash',
    '.css': 'text/css',
}

function serveLocalAssets(): Plugin {
    return {
        name: 'serve-local-assets',
        configureServer(server) {
            const assetsRoot = resolve(process.cwd(), '..', 'assets')
            server.middlewares.use('/assets', async (req, res, next) => {
                if (!req.url) return next()
                const rel = decodeURIComponent(req.url.split('?')[0]!)
                const full = join(assetsRoot, rel)
                if (!full.startsWith(assetsRoot)) return next()
                try {
                    const st = await stat(full)
                    if (!st.isFile()) return next()
                    res.setHeader(
                        'Content-Type',
                        MIME[extname(full)] ?? 'application/octet-stream',
                    )
                    res.setHeader('Content-Length', String(st.size))
                    createReadStream(full).pipe(res)
                } catch {
                    next()
                }
            })
        },
    }
}

// vite preview serves dist with an SPA fallback: a directory URL without a
// trailing slash (/stuff) misses dist/stuff/index.html and falls through to
// dist/index.html — the Home prerender — so hydration fails with React #418.
// Production Caddy (file_server) instead 308-redirects /stuff -> /stuff/.
// Mirror that redirect here so preview smoke checks behave like prod
// (task-015). Preview-only; no effect on dev or build output.
function previewDirRedirect(): Plugin {
    return {
        name: 'preview-dir-redirect',
        configurePreviewServer(server) {
            const outDir = resolve(process.cwd(), 'dist')
            server.middlewares.use((req, res, next) => {
                const path = req.url?.split('?')[0] ?? ''
                if (
                    path === '' ||
                    path.endsWith('/') ||
                    extname(path) !== '' ||
                    !existsSync(join(outDir, path, 'index.html'))
                ) {
                    return next()
                }
                res.statusCode = 308
                res.setHeader('Location', path + '/')
                res.end()
            })
        },
    }
}

/** Canonical host — Caddy 301s www -> apex (ADR-0013). Feeds and sitemap agree. */
const SITE_BASE_URL = 'https://chaipalaka.com'

/**
 * The sitemap's URL list, filled in by `includedRoutes` and consumed by
 * `onFinished`. One derivation feeds both, which is what stops the prerender
 * set and the sitemap from drifting apart (task-044 AC#4). It is a module
 * variable rather than a return value because those are the only two build
 * hooks that see the real route tree, and they cannot pass values to each
 * other. `onFinished` runs only after `includedRoutes`, so it is never stale.
 */
let sitemapUrls: string[] = []

export default defineConfig({
    build: {
        assetsDir: '_app',
    },
    plugins: [
        {
            enforce: 'pre',
            ...mdx({
                remarkPlugins: [
                    remarkFrontmatter,
                    remarkMdxFrontmatter,
                    remarkMdxImages,
                    remarkGfm,
                    remarkExtractToc,
                ],
                rehypePlugins: [
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: 'wrap' }] as any,
                    [rehypePrettyCode, { theme: 'github-dark' }] as any,
                    rehypePocketFootnotes,
                    rehypeLinkTypes,
                ],
            }),
        },
        react(),
        vitePluginFeeds({ baseUrl: SITE_BASE_URL }),
        vitePluginAtelier(),
        serveLocalAssets(),
        previewDirRedirect(),
    ],
    server: {
        fs: {
            allow: ['..'],
        },
        proxy: {
            '/api': 'http://localhost:3000',
        },
    },
    ssgOptions: {
        script: 'async',
        formatting: 'none',
        dirStyle: 'nested',
        // Derived wholesale from the route tree SSG hands us rather than
        // filtered off the paths it discovered: `/test/*` and `/sandbox/*` stay
        // reachable in `npm run dev` but never ship (decision O5), `/lab` stays
        // public (ADR-0011), `/stuff/flash/:slug` is expanded from content so
        // nothing public is client-only, and `/404` is prerendered so Caddy has
        // an error page to serve (ADR-0013). See src/site-routes.ts.
        async includedRoutes(_paths, routes) {
            const contentRoot = resolve(process.cwd(), '..', 'content')
            const isProd = process.env.NODE_ENV === 'production'
            const [blogSlugs, flashSlugs] = await Promise.all([
                getContentSlugs(join(contentRoot, 'blog'), {
                    isProd,
                    stripDatePrefix: true,
                }),
                getContentSlugs(join(contentRoot, 'stuff', 'flash'), {
                    isProd,
                }),
            ])
            sitemapUrls = sitemapRoutes(routes, blogSlugs, flashSlugs)
            return prerenderRoutes(routes, blogSlugs, flashSlugs)
        },
        // The sitemap is written here, not in the feeds plugin: this is the
        // first hook that runs after the route set is resolved.
        async onFinished(dir) {
            await writeFile(
                join(dir, 'sitemap.xml'),
                buildSitemap(sitemapUrls, SITE_BASE_URL),
                'utf-8',
            )
            console.log(
                `[sitemap] ${sitemapUrls.length} URLs written to sitemap.xml`,
            )
        },
    },
    test: {
        environment: 'happy-dom',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        setupFiles: ['./vitest.setup.ts'],
        passWithNoTests: true,
    },
})
