import type { Plugin } from 'vite'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import { toHtml } from 'hast-util-to-html'
import type { Root } from 'hast'
import { rehypePocketFootnotes } from './rehype-pocket-footnotes'
import { rehypeLinkTypes } from './rehype-link-types'

const mdProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypePocketFootnotes)
    .use(rehypeLinkTypes)

/**
 * Compiles a post's markdown body to HTML for the RSS `<content:encoded>`, using
 * the SAME Pocket-footnote + link-type transforms as the page (spec §11) so one
 * authored footnote renders one disclosure everywhere. MDX JSX components
 * (`<Callout>`, `<Figure>`, …) are not evaluated here — a feed reader has no React
 * runtime — so they drop out rather than ship as raw source. Footnotes and links,
 * being plain markdown, survive as real HTML.
 */
export async function compileBodyToHtml(body: string): Promise<string> {
    const tree = (await mdProcessor.run(mdProcessor.parse(body))) as Root
    return toHtml(tree)
}

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

export async function buildRss(
    posts: PostMeta[],
    baseUrl: string,
): Promise<string> {
    const items = (
        await Promise.all(
            posts.map(async (p) => {
                const link = `${baseUrl}/blog/${p.slug}`
                const pubDate = new Date(p.date).toUTCString()
                const content = await compileBodyToHtml(p.body)
                return `
  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${link}</link>
    <description>${escapeXml(p.description)}</description>
    <pubDate>${pubDate}</pubDate>
    <guid isPermaLink="true">${link}</guid>
    <content:encoded><![CDATA[${content}]]></content:encoded>
  </item>`
            }),
        )
    ).join('')

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

// `sitemap.xml` used to be written here, from a hardcoded `['/', '/blog']`.
// It now lives in src/site-routes.ts and is written by `ssgOptions.onFinished`,
// which is the first point in the build where the real route tree is known
// (task-044 AC#4).

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
                await buildRss(posts, options.baseUrl),
                'utf-8',
            )
            console.log(
                `[feeds] rss.xml written (${posts.length} post${posts.length === 1 ? '' : 's'})`,
            )
        },
    }
}
