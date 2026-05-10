import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { visit } from 'unist-util-visit'
import { valueToEstree } from 'estree-util-value-to-estree'
import type { Plugin } from 'unified'
import type { Root } from 'mdast'

export const remarkExtractToc: Plugin<[], Root> = () => (tree) => {
    const slugger = new GithubSlugger()
    const toc: Array<{ depth: number; text: string; slug: string }> = []

    visit(tree, 'heading', (node) => {
        const text = toString(node)
        const slug = slugger.slug(text)
        toc.push({ depth: node.depth, text, slug })
    })

    // Appends: export const toc = [...] to the compiled MDX output
    tree.children.push({
        type: 'mdxjsEsm',
        value: `export const toc = ${JSON.stringify(toc)}`,
        data: {
            estree: {
                type: 'Program',
                sourceType: 'module',
                body: [
                    {
                        type: 'ExportNamedDeclaration',
                        declaration: {
                            type: 'VariableDeclaration',
                            kind: 'const',
                            declarations: [
                                {
                                    type: 'VariableDeclarator',
                                    id: { type: 'Identifier', name: 'toc' },
                                    init: valueToEstree(toc),
                                },
                            ],
                        },
                        specifiers: [],
                        source: null,
                    },
                ],
            },
        },
    } as any)
}
