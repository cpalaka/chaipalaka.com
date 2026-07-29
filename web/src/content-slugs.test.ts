import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getContentSlugs } from './content-slugs'

describe('getContentSlugs', () => {
    let root: string

    beforeEach(() => {
        root = mkdtempSync(join(tmpdir(), 'slugs-'))
    })

    afterEach(() => {
        rmSync(root, { recursive: true, force: true })
    })

    function writeItem(dirName: string, frontmatter: Record<string, unknown>) {
        const fm = Object.entries(frontmatter)
            .map(([k, v]) => (typeof v === 'string' ? `${k}: "${v}"` : `${k}: ${v}`))
            .join('\n')
        const dir = join(root, dirName)
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, 'index.mdx'), `---\n${fm}\n---\nbody\n`, 'utf-8')
    }

    it('returns each directory as a slug', async () => {
        writeItem('ava', { title: 'a' })
        writeItem('counter', { title: 'c' })
        expect(await getContentSlugs(root, { isProd: true })).toEqual([
            'ava',
            'counter',
        ])
    })

    it('strips the sort-date prefix when asked (content/blog)', async () => {
        writeItem('2026-01-15-hello', { title: 'h' })
        expect(
            await getContentSlugs(root, { isProd: true, stripDatePrefix: true }),
        ).toEqual(['hello'])
    })

    it('leaves the directory name alone when not asked (content/stuff/flash)', async () => {
        writeItem('2026-01-15-hello', { title: 'h' })
        expect(await getContentSlugs(root, { isProd: true })).toEqual([
            '2026-01-15-hello',
        ])
    })

    // Both the prerender set and sitemap.xml are built from this list, so a
    // draft leaking through would publish an unfinished page AND advertise it
    // to crawlers (task-044 AC#4).
    it('drops drafts in production', async () => {
        writeItem('pub', { title: 'p' })
        writeItem('wip', { title: 'w', draft: true })
        expect(await getContentSlugs(root, { isProd: true })).toEqual(['pub'])
    })

    it('keeps drafts outside production, so dev can see them', async () => {
        writeItem('pub', { title: 'p' })
        writeItem('wip', { title: 'w', draft: true })
        expect(await getContentSlugs(root, { isProd: false })).toEqual([
            'pub',
            'wip',
        ])
    })

    it('returns nothing for a directory that does not exist', async () => {
        expect(
            await getContentSlugs(join(root, 'nope'), { isProd: true }),
        ).toEqual([])
    })

    it('ignores loose files next to the item directories', async () => {
        writeItem('ava', { title: 'a' })
        writeFileSync(join(root, 'README.md'), '# notes\n', 'utf-8')
        expect(await getContentSlugs(root, { isProd: true })).toEqual(['ava'])
    })
})
