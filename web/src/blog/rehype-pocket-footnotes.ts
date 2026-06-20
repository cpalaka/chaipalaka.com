import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Element, ElementContent } from 'hast'

/**
 * Rewrites GFM footnotes into the v2 **Pocket** static floor: each footnote
 * definition becomes a no-JS `<details>` disclosure carrying a `data-pocket-id`
 * card-lift hook (the seam the link ladder lifts into a Pocket card, spec §11).
 *
 * Runs on hast, so the SAME transform serves both the page MDX pipeline and the
 * RSS generator — one authored footnote renders one disclosure everywhere.
 *
 * Input (remark-gfm → remark-rehype):
 *   <sup><a href="#user-content-fn-1" …>1</a></sup>           (inline reference)
 *   <section data-footnotes><h2 …>Footnotes</h2><ol>
 *     <li id="user-content-fn-1"><p>note … <a data-footnote-backref>↩</a></p></li>
 *   </ol></section>
 *
 * Output: the inline `<sup>` real anchor is preserved; the `<ol>` of `<li>`
 * definitions becomes a list of `<details class="pocket" data-pocket-id="N">`.
 */
export const rehypePocketFootnotes: Plugin<[], Root> = () => (tree) => {
    visit(tree, 'element', (node: Element) => {
        if (node.tagName !== 'section') return
        if (!node.properties || !node.properties.dataFootnotes) return

        const ol = node.children.find(
            (c): c is Element => c.type === 'element' && c.tagName === 'ol',
        )
        if (!ol) return

        const disclosures = ol.children
            .filter(
                (c): c is Element =>
                    c.type === 'element' && c.tagName === 'li',
            )
            .map((li, i) => liToDisclosure(li, i + 1))

        const list: Element = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['pocket-notes'] },
            children: disclosures,
        }

        node.children = node.children.map((c) => (c === ol ? list : c))
        node.properties.className = ['footnotes', 'pocket-footnotes']
    })
}

function liToDisclosure(li: Element, ordinal: number): Element {
    const id = typeof li.properties?.id === 'string' ? li.properties.id : ''
    const pocketId = id.replace(/^user-content-fn-/, '') || String(ordinal)

    const summary: Element = {
        type: 'element',
        tagName: 'summary',
        properties: { className: ['pocket__summary'] },
        children: [{ type: 'text', value: String(ordinal) }],
    }

    const body: Element = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['pocket__body'] },
        children: li.children as ElementContent[],
    }

    return {
        type: 'element',
        tagName: 'details',
        properties: { className: ['pocket'], id, dataPocketId: pocketId },
        children: [summary, body],
    }
}
