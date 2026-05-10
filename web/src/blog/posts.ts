import { z } from 'zod'
import type { Post, PostFrontmatter, TocEntry } from './types'

const PostSchema = z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
    og_image: z.string().optional(),
})

// Derives slug from a glob key like '../../../content/blog/2026-05-09-hello-world/index.mdx'
export function deriveSlug(globKey: string): string {
    const dir = globKey.split('/').at(-2) ?? ''
    return dir.replace(/^\d{4}-\d{2}-\d{2}-/, '')
}

// Validates raw frontmatter with zod; throws ZodError on missing/invalid fields.
export function validateFrontmatter(raw: unknown): PostFrontmatter {
    return PostSchema.parse(raw)
}

// Filters drafts in production; sorts reverse-chronological by date string.
export function filterAndSort(posts: Post[], isProd: boolean): Post[] {
    return posts
        .filter((p) => !isProd || !p.frontmatter.draft)
        .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date))
}

type MdxModule = {
    default: Post['Component']
    frontmatter: unknown
    toc: TocEntry[]
}

export function getPosts(): Post[] {
    const modules = import.meta.glob<MdxModule>(
        '../../../content/blog/**/index.mdx',
        { eager: true },
    )
    const all: Post[] = Object.entries(modules).map(([path, mod]) => ({
        slug: deriveSlug(path),
        frontmatter: validateFrontmatter(mod.frontmatter),
        toc: mod.toc ?? [],
        Component: mod.default,
    }))
    return filterAndSort(all, import.meta.env.PROD)
}
