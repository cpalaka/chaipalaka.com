import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// buildSitemap moved to src/site-routes.ts in task-044 — the sitemap is a
// function of the route set, not of the post list, and is now written by
// `ssgOptions.onFinished`. Its tests moved with it.
import { escapeXml, buildRss, vitePluginFeeds } from './vite-plugin-feeds'

describe('escapeXml', () => {
    it('escapes the five core XML entities', () => {
        expect(escapeXml('a & b < c > d "e"')).toBe(
            'a &amp; b &lt; c &gt; d &quot;e&quot;',
        )
    })

    it('returns input unchanged when there are no special chars', () => {
        expect(escapeXml('plain text 123')).toBe('plain text 123')
    })

    it('escapes ampersands before other entities (no double-escape)', () => {
        expect(escapeXml('&lt;')).toBe('&amp;lt;')
    })
})

describe('buildRss', () => {
    const base = 'https://example.com'

    it('emits an empty channel when given no posts', async () => {
        const xml = await buildRss([], base)
        expect(xml).toContain('<channel>')
        expect(xml).toContain('<title>chaipalaka.com</title>')
        expect(xml).toContain(`<link>${base}</link>`)
        expect(xml).not.toContain('<item>')
    })

    it('renders the post body as HTML (not raw markdown) in content:encoded', async () => {
        const xml = await buildRss(
            [
                {
                    slug: 'hello',
                    title: 'A & B',
                    description: 'd',
                    date: '2026-01-15',
                    body: '# body',
                },
            ],
            base,
        )
        expect(xml).toContain('<title>A &amp; B</title>')
        expect(xml).toContain(`<link>${base}/blog/hello</link>`)
        expect(xml).toContain(
            `<pubDate>${new Date('2026-01-15').toUTCString()}</pubDate>`,
        )
        expect(xml).toContain('<guid isPermaLink="true">')
        expect(xml).toContain('<content:encoded><![CDATA[<h1>body</h1>]]>')
    })

    it('renders Pocket footnotes as disclosure HTML in the feed', async () => {
        const xml = await buildRss(
            [
                {
                    slug: 'fn',
                    title: 'Notes',
                    description: 'd',
                    date: '2026-01-15',
                    body: 'A claim[^1].\n\n[^1]: The note body.\n',
                },
            ],
            base,
        )
        expect(xml).toContain('<details')
        expect(xml).toContain('data-pocket-id="1"')
        expect(xml).toContain('The note body.')
        // raw footnote markdown must not survive into the feed
        expect(xml).not.toContain('[^1]')
    })
})

describe('vitePluginFeeds (lifecycle)', () => {
    let root: string
    let webDir: string
    let outDir: string
    let contentDir: string
    let originalCwd: string

    beforeEach(() => {
        originalCwd = process.cwd()
        root = mkdtempSync(join(tmpdir(), 'feeds-'))
        webDir = join(root, 'web')
        outDir = join(webDir, 'dist')
        contentDir = join(root, 'content', 'blog')
        mkdirSync(webDir, { recursive: true })
        mkdirSync(outDir, { recursive: true })
        mkdirSync(contentDir, { recursive: true })
        process.chdir(webDir)
    })

    afterEach(() => {
        process.chdir(originalCwd)
        rmSync(root, { recursive: true, force: true })
    })

    function writePost(
        dirName: string,
        frontmatter: Record<string, unknown>,
        body = 'hello body\n',
    ): void {
        const fmLines = Object.entries(frontmatter)
            .map(([k, v]) =>
                typeof v === 'string' ? `${k}: "${v}"` : `${k}: ${v}`,
            )
            .join('\n')
        const raw = `---\n${fmLines}\n---\n${body}`
        const postDir = join(contentDir, dirName)
        mkdirSync(postDir, { recursive: true })
        writeFileSync(join(postDir, 'index.mdx'), raw, 'utf-8')
    }

    async function runClose(mode: 'production' | 'development'): Promise<void> {
        const plugin = vitePluginFeeds({ baseUrl: 'https://example.com' }) as any
        plugin.configResolved({ build: { outDir }, mode })
        await plugin.closeBundle()
    }

    it('writes rss.xml with the post slug stripped of the date prefix', async () => {
        writePost('2026-01-15-hello', {
            title: 'Hello',
            description: 'desc',
            date: '2026-01-15',
        })
        await runClose('production')

        const rssPath = join(outDir, 'rss.xml')
        expect(existsSync(rssPath)).toBe(true)

        const rss = readFileSync(rssPath, 'utf-8')
        expect(rss).toContain('<title>Hello</title>')
        expect(rss).toContain('<link>https://example.com/blog/hello</link>')
    })

    it('no longer writes sitemap.xml — ssgOptions.onFinished owns it (task-044)', async () => {
        writePost('2026-01-15-hello', {
            title: 'Hello',
            description: 'desc',
            date: '2026-01-15',
        })
        await runClose('production')
        expect(existsSync(join(outDir, 'sitemap.xml'))).toBe(false)
    })

    it('orders rss items by date descending', async () => {
        writePost('2026-01-15-early', {
            title: 'Early',
            description: 'd',
            date: '2026-01-15',
        })
        writePost('2026-06-01-late', {
            title: 'Late',
            description: 'd',
            date: '2026-06-01',
        })
        await runClose('production')

        const rss = readFileSync(join(outDir, 'rss.xml'), 'utf-8')
        const lateIdx = rss.indexOf('<title>Late</title>')
        const earlyIdx = rss.indexOf('<title>Early</title>')
        expect(lateIdx).toBeGreaterThan(-1)
        expect(earlyIdx).toBeGreaterThan(-1)
        expect(lateIdx).toBeLessThan(earlyIdx)
    })

    it('filters draft posts out in production mode', async () => {
        writePost('2026-01-15-pub', {
            title: 'Published',
            description: 'd',
            date: '2026-01-15',
        })
        writePost('2026-02-01-wip', {
            title: 'Wip',
            description: 'd',
            date: '2026-02-01',
            draft: true,
        })
        await runClose('production')

        const rss = readFileSync(join(outDir, 'rss.xml'), 'utf-8')
        expect(rss).toContain('<title>Published</title>')
        expect(rss).not.toContain('<title>Wip</title>')
        // The sitemap half of this assertion moved to content-slugs.test.ts —
        // drafts are now filtered where the slug list is built (task-044).
    })

    it('includes draft posts when mode is not production', async () => {
        writePost('2026-01-15-pub', {
            title: 'Published',
            description: 'd',
            date: '2026-01-15',
        })
        writePost('2026-02-01-wip', {
            title: 'Wip',
            description: 'd',
            date: '2026-02-01',
            draft: true,
        })
        await runClose('development')

        const rss = readFileSync(join(outDir, 'rss.xml'), 'utf-8')
        expect(rss).toContain('<title>Published</title>')
        expect(rss).toContain('<title>Wip</title>')
    })
})
