import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import type { Root } from 'mdast'
import { remarkExtractToc } from './remark-extract-toc'

function transform(md: string): Root {
    const processor = unified().use(remarkParse).use(remarkExtractToc)
    const ast = processor.parse(md)
    return processor.runSync(ast) as Root
}

function appendedNode(tree: Root): any {
    return tree.children[tree.children.length - 1]
}

function decodeToc(
    tree: Root,
): Array<{ depth: number; text: string; slug: string }> {
    const node = appendedNode(tree)
    const prefix = 'export const toc = '
    expect(node.value.startsWith(prefix)).toBe(true)
    return JSON.parse(node.value.slice(prefix.length))
}

describe('remarkExtractToc', () => {
    it('extracts headings at multiple depths into the toc', () => {
        const toc = decodeToc(transform('# A\n\n## B\n\n### C\n'))
        expect(toc).toEqual([
            { depth: 1, text: 'A', slug: 'a' },
            { depth: 2, text: 'B', slug: 'b' },
            { depth: 3, text: 'C', slug: 'c' },
        ])
    })

    it('slugifies "Hello World" to "hello-world"', () => {
        const toc = decodeToc(transform('# Hello World\n'))
        expect(toc).toEqual([
            { depth: 1, text: 'Hello World', slug: 'hello-world' },
        ])
    })

    it('appends -1, -2, ... for duplicate heading text', () => {
        const toc = decodeToc(transform('## Notes\n\n## Notes\n\n## Notes\n'))
        expect(toc.map((e) => e.slug)).toEqual(['notes', 'notes-1', 'notes-2'])
    })

    it('flattens inline formatting in heading text', () => {
        const toc = decodeToc(
            transform('## **Bold** and *em* and `code`\n'),
        )
        expect(toc).toHaveLength(1)
        const [entry] = toc
        expect(entry?.text).toBe('Bold and em and code')
        expect(entry?.text).not.toMatch(/[*`]/)
    })

    it('appends an empty toc array when there are no headings', () => {
        const node = appendedNode(
            transform('just a paragraph with no headings.\n'),
        )
        expect(node.value).toBe('export const toc = []')
    })

    it('attaches an ExportNamedDeclaration estree node declaring `toc`', () => {
        const node = appendedNode(transform('# A\n'))
        const estree = node.data.estree
        expect(estree.type).toBe('Program')
        expect(estree.body[0].type).toBe('ExportNamedDeclaration')
        const decl = estree.body[0].declaration
        expect(decl.declarations[0].id.name).toBe('toc')
    })
})
