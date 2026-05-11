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
