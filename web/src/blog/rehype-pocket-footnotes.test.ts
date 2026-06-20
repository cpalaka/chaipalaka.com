import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import { toHtml } from 'hast-util-to-html'
import type { Root } from 'hast'
import { rehypePocketFootnotes } from './rehype-pocket-footnotes'

async function render(md: string): Promise<string> {
    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypePocketFootnotes)
    const tree = (await processor.run(processor.parse(md))) as Root
    return toHtml(tree)
}

describe('rehypePocketFootnotes', () => {
    it('renders a footnote definition as a <details> disclosure carrying a card-lift hook', async () => {
        const html = await render('A claim[^1].\n\n[^1]: The note body.\n')

        expect(html).toContain('<details')
        expect(html).toMatch(/class="[^"]*\bpocket\b/)
        expect(html).toContain('data-pocket-id="1"')
        expect(html).toContain('The note body.')
        // the default GFM ordered-list footnote section is replaced
        expect(html).not.toContain('<ol>')
    })

    it('preserves the inline reference as a real anchor targeting the disclosure', async () => {
        const html = await render('A claim[^1].\n\n[^1]: Note.\n')
        // the in-text marker stays a real <a> ...
        expect(html).toContain('<sup><a href="#user-content-fn-1"')
        // ... and the disclosure keeps the matching anchor target id
        expect(html).toMatch(/<details[^>]*id="user-content-fn-1"/)
    })

    it('gives each footnote a distinct card-lift hook', async () => {
        const html = await render(
            'A[^1] and B[^2].\n\n[^1]: First.\n\n[^2]: Second.\n',
        )
        expect(html).toContain('data-pocket-id="1"')
        expect(html).toContain('data-pocket-id="2"')
        expect(html.match(/<details/g) ?? []).toHaveLength(2)
    })

    it('supports named footnote identifiers in the card-lift hook', async () => {
        const html = await render('Text[^note].\n\n[^note]: Named.\n')
        expect(html).toContain('data-pocket-id="note"')
    })

    it('leaves prose without footnotes untouched', async () => {
        const html = await render('Just a paragraph.\n')
        expect(html).not.toContain('<details')
        expect(html).not.toContain('data-footnotes')
    })
})
