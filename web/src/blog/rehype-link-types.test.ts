import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import { toHtml } from 'hast-util-to-html'
import type { Root } from 'hast'
import { rehypeLinkTypes } from './rehype-link-types'

async function render(md: string): Promise<string> {
    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeLinkTypes)
    const tree = (await processor.run(processor.parse(md))) as Root
    return toHtml(tree)
}

describe('rehypeLinkTypes', () => {
    it('marks an internal link as a Portal', async () => {
        const html = await render('A [Portal](/blog/other).\n')
        expect(html).toContain('href="/blog/other"')
        expect(html).toContain('data-link-type="portal"')
        expect(html).not.toContain('target=')
    })

    it('marks an external link and makes it a safe new-tab link', async () => {
        const html = await render('An [external](https://example.com).\n')
        expect(html).toContain('data-link-type="external"')
        expect(html).toContain('rel="noopener noreferrer"')
        expect(html).toContain('target="_blank"')
    })

    it('preserves a markdown link title — the authored note an external card reads (task-029)', async () => {
        const html = await render(
            'See [gwern.net](https://gwern.net "the reading-craft this borrows from").\n',
        )
        expect(html).toContain('data-link-type="external"')
        // The peek layer lifts the note from the title attribute (Option C):
        expect(html).toContain('title="the reading-craft this borrows from"')
    })

    it('leaves in-page anchors (TOC, footnote refs) unclassified', async () => {
        const html = await render(
            'See [section](#intro) and a note[^1].\n\n[^1]: n.\n',
        )
        // heading/footnote/in-page anchors stay plain — no Portal/external badge
        expect(html).not.toContain('data-link-type')
    })
})
