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
import { readdir, readFile, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
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
                    res.setHeader('Content-Type', MIME[extname(full)] ?? 'application/octet-stream')
                    res.setHeader('Content-Length', String(st.size))
                    createReadStream(full).pipe(res)
                } catch {
                    next()
                }
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
                    remarkExtractToc,
                ],
                rehypePlugins: [
                    rehypeSlug,
                    [rehypeAutolinkHeadings, { behavior: 'wrap' }] as any,
                    [rehypePrettyCode, { theme: 'github-dark' }] as any,
                ],
            }),
        },
        react(),
        vitePluginFeeds({ baseUrl: 'https://chaipalaka.com' }),
        serveLocalAssets(),
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
            return [...paths, ...blogPaths].filter(
                (p) => !p.startsWith('/sandbox'),
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
