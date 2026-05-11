import { z } from 'zod'

const NoteSchema = z.object({
    date: z.string().date(),
    parent: z.string().nullable().default(null),
})

export interface NoteFrontmatter {
    date: string
    parent: string | null
}

export interface Note {
    slug: string
    frontmatter: NoteFrontmatter
    body: string
}

export function deriveNoteSlug(globKey: string): string {
    const filename = globKey.split('/').at(-1) ?? ''
    return filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.mdx?$/, '')
}

export function validateNoteFrontmatter(raw: unknown): NoteFrontmatter {
    return NoteSchema.parse(raw)
}

export function filterAndSortNotes(
    notes: Note[],
    filter?: { parent?: string | null },
): Note[] {
    let result = notes
    if (filter !== undefined && 'parent' in filter) {
        result = notes.filter((n) => n.frontmatter.parent === filter.parent)
    }
    return result
        .slice()
        .sort((a, b) =>
            b.frontmatter.date.localeCompare(a.frontmatter.date),
        )
}

type NoteModule = {
    frontmatter: unknown
    default?: unknown
}

export function listNotes(filter?: { parent?: string | null }): Note[] {
    const modules = import.meta.glob<NoteModule>(
        '../../../content/notes/*.mdx',
        { eager: true },
    )
    const all: Note[] = Object.entries(modules).map(([path, mod]) => ({
        slug: deriveNoteSlug(path),
        frontmatter: validateNoteFrontmatter(mod.frontmatter),
        body: '',
    }))
    return filterAndSortNotes(all, filter)
}
