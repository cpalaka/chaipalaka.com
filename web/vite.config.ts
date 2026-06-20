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
import { readdir, readFile, stat } from 'node:fs/promises'
import { createReadStream, existsSync } from 'node:fs'
import { join, resolve, extname } from 'node:path'
import matter from 'gray-matter'
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

async function getBlogSlugs(): Promise<string[]> {
    try {
        const contentDir = resolve(process.cwd(), '..', 'content', 'blog')
        const entries = await readdir(contentDir, { withFileTypes: true })
        const isProd = process.env.NODE_ENV === 'production'
        const slugs = await Promise.all(
            entries
                .filter((e) => e.isDirectory())
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
        vitePluginFeeds({ baseUrl: 'https://chaipalaka.com' }),
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
        async includedRoutes(paths) {
            const slugs = await getBlogSlugs()
            const blogPaths = slugs.flatMap((slug) => [
                `/blog/${slug}`,
                `/blog/${slug}/read`,
            ])
            const { TUNABLE_SCENE_IDS } =
                await import('./src/canvas/scenes/registry')
            const sandboxScenePaths = TUNABLE_SCENE_IDS.map(
                (id) => `/sandbox/scenes/${id}`,
            )
            return [...paths, ...blogPaths, ...sandboxScenePaths].filter(
                (p) =>
                    !p.startsWith('/sandbox/') ||
                    p.startsWith('/sandbox/scenes/'),
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
