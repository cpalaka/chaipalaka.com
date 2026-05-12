import { z } from 'zod'

export interface PieceFrontmatter {
    title: string
    description: string
    category: string
    quality: number
    thumbnail: string
    swf: string
    swf_width: number
    swf_height: number
    tags: string[]
    draft: boolean
}

export interface Piece {
    slug: string
    frontmatter: PieceFrontmatter
    Component: React.ComponentType<{
        components?: Record<string, React.ComponentType<any>>
    }>
}

const PieceSchema = z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    quality: z.number().int().min(1).max(10),
    thumbnail: z.string(),
    swf: z.string(),
    swf_width: z.number().int().positive(),
    swf_height: z.number().int().positive(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
})

export function derivePieceSlug(globKey: string): string {
    return globKey.split('/').at(-2) ?? ''
}

export function validatePieceFrontmatter(raw: unknown): PieceFrontmatter {
    return PieceSchema.parse(raw)
}

export function filterAndGroup(
    pieces: Piece[],
    isProd: boolean,
): Map<string, Piece[]> {
    const filtered = pieces.filter((p) => !isProd || !p.frontmatter.draft)
    const groups = new Map<string, Piece[]>()
    for (const p of filtered) {
        const cat = p.frontmatter.category
        if (!groups.has(cat)) groups.set(cat, [])
        groups.get(cat)!.push(p)
    }
    for (const list of groups.values()) {
        list.sort((a, b) => {
            const dq = b.frontmatter.quality - a.frontmatter.quality
            return dq !== 0 ? dq : a.slug.localeCompare(b.slug)
        })
    }
    return groups
}

type MdxModule = {
    default: Piece['Component']
    frontmatter: unknown
}

export function getPieces(): Piece[] {
    const modules = import.meta.glob<MdxModule>(
        '../../../../content/stuff/flash/**/index.mdx',
        { eager: true },
    )
    return Object.entries(modules).map(([path, mod]) => ({
        slug: derivePieceSlug(path),
        frontmatter: validatePieceFrontmatter(mod.frontmatter),
        Component: mod.default,
    }))
}

export function getPiecesByCategory(): Map<string, Piece[]> {
    return filterAndGroup(getPieces(), import.meta.env.PROD)
}

export function getPieceBySlug(slug: string): Piece | undefined {
    return getPieces().find((p) => p.slug === slug)
}
