import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'
import type { Root, Element } from 'hast'

/**
 * Classifies prose links by destination so the v2 link styling (and, later, the
 * ladder) can tell a **Portal** from an external link (spec §3 / §13):
 *   - internal / relative href → `data-link-type="portal"`
 *   - absolute http(s) (or protocol-relative) href → `data-link-type="external"`,
 *     plus `target="_blank"` + `rel="noopener noreferrer"` for a safe new tab.
 *
 * In-page anchors (`#…` — table-of-contents links, footnote references and
 * backrefs, heading autolinks) are left untouched: they navigate within the
 * document, not to a destination page. Pocket footnotes are disclosures, not
 * anchors, so they are unaffected.
 */
export const rehypeLinkTypes: Plugin<[], Root> = () => (tree) => {
    visit(tree, 'element', (node: Element) => {
        if (node.tagName !== 'a') return
        const href = node.properties?.href
        if (typeof href !== 'string' || href.startsWith('#')) return

        if (/^(https?:)?\/\//i.test(href)) {
            node.properties.dataLinkType = 'external'
            node.properties.target = '_blank'
            node.properties.rel = 'noopener noreferrer'
        } else {
            node.properties.dataLinkType = 'portal'
        }
    })
}
