import type { ReactNode } from 'react'
import type { TocEntry } from '../blog/types'
import './ReadingSubstrate.css'

interface ReadingSubstrateProps {
    title: string
    toc: TocEntry[]
    /** Optional byline / meta row rendered between the title and the body. */
    meta?: ReactNode
    /** The reading body — MDX for a post, arbitrary prose elsewhere. */
    children: ReactNode
}

/**
 * The generic gwern-style reading shell: a sticky table of contents beside a
 * prose column. Presentational and effect-free so it prerenders as the no-JS
 * floor. Generalized out of the blog plain reader (BlogPostReader) so the v2
 * content box and the plain reader share one substrate.
 */
export function ReadingSubstrate({
    title,
    toc,
    meta,
    children,
}: ReadingSubstrateProps) {
    return (
        <main className="reader">
            <nav className="reader__toc" aria-label="Table of contents">
                <h2>Contents</h2>
                <ol>
                    {toc.map((entry) => (
                        <li key={entry.slug} data-depth={entry.depth}>
                            <a href={`#${entry.slug}`}>{entry.text}</a>
                        </li>
                    ))}
                </ol>
            </nav>

            <article className="reader__body">
                <h1>{title}</h1>
                {meta}
                {children}
            </article>
        </main>
    )
}
