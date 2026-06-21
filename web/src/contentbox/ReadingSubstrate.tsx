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
    // List / landing pages (blog index, home) have no headings, so they pass an
    // empty toc — collapse to a single prose column rather than show an empty
    // "Contents" rail.
    const hasToc = toc.length > 0

    return (
        <main className={hasToc ? 'reader' : 'reader reader--no-toc'}>
            {hasToc && (
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
            )}

            <article className="reader__body">
                {/* tabIndex=-1 so the hero-morph focus-follow (ContentBox) can
                    land focus on the destination heading without adding it to
                    the tab order. */}
                <h1 tabIndex={-1}>{title}</h1>
                {meta}
                {children}
            </article>
        </main>
    )
}
