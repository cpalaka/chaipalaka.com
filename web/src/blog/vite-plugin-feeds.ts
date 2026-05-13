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

export function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

async function collectPosts(
    contentDir: string,
    isProd: boolean,
): Promise<PostMeta[]> {
    const entries = await readdir(contentDir, { withFileTypes: true })
    const metas = await Promise.all(
        entries
            .filter((e) => e.isDirectory())
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
    return (metas.filter(Boolean) as PostMeta[]).sort((a, b) =>
        b.date.localeCompare(a.date),
    )
}

export function buildRss(posts: PostMeta[], baseUrl: string): string {
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

export function buildSitemap(posts: PostMeta[], baseUrl: string): string {
    const staticRoutes = ['/', '/blog']
    const dynamicRoutes = posts.flatMap((p) => [
        `/blog/${p.slug}`,
        `/blog/${p.slug}/read`,
    ])
    const urls = [...staticRoutes, ...dynamicRoutes]
        .map((route) => `  <url>\n    <loc>${baseUrl}${route}</loc>\n  </url>`)
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

            await writeFile(
                join(outDir, 'rss.xml'),
                buildRss(posts, options.baseUrl),
                'utf-8',
            )
            await writeFile(
                join(outDir, 'sitemap.xml'),
                buildSitemap(posts, options.baseUrl),
                'utf-8',
            )

            console.log(
                `[feeds] rss.xml + sitemap.xml written (${posts.length} post${posts.length === 1 ? '' : 's'})`,
            )
        },
    }
}
