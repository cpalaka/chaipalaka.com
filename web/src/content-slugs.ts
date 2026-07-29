import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'

/**
 * Build-time only — imported by `vite.config.ts`, never by a component.
 *
 * Reads the publishable slugs out of a co-located content directory: one
 * subdirectory per item, each holding an `index.mdx`. Both the prerender set
 * and the sitemap are built from these, so a `draft: true` item that leaked
 * through here would be advertised to crawlers.
 */
export interface ContentSlugOptions {
    /** Drop `draft: true` items. True for a production build. */
    isProd: boolean
    /**
     * Strip a `YYYY-MM-DD-` directory prefix. `content/blog/` carries one for
     * sort order and it is not part of the URL; `content/stuff/flash/` has
     * none, and stripping there would silently corrupt a slug that happened to
     * start with a date.
     */
    stripDatePrefix?: boolean
}

export async function getContentSlugs(
    contentDir: string,
    { isProd, stripDatePrefix = false }: ContentSlugOptions,
): Promise<string[]> {
    try {
        const entries = await readdir(contentDir, { withFileTypes: true })
        const slugs = await Promise.all(
            entries
                .filter((e) => e.isDirectory())
                .map(async (e) => {
                    const raw = await readFile(
                        join(contentDir, e.name, 'index.mdx'),
                        'utf-8',
                    )
                    const { data } = matter(raw)
                    if (isProd && data.draft) return null
                    return stripDatePrefix
                        ? e.name.replace(/^\d{4}-\d{2}-\d{2}-/, '')
                        : e.name
                }),
        )
        return slugs
            .filter((s): s is string => s !== null)
            .sort((a, b) => a.localeCompare(b))
    } catch {
        return []
    }
}
