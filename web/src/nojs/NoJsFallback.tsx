import type { ReactNode } from 'react'

// Styling lives in base.css (head-loaded) so the shell is styled for the
// no-JS users it targets — a JS-imported stylesheet would never load for
// them. Canvas sections, as plain anchors. The live site navigates via the
// physics FrameBar (JS-only); without JS these hrefs are the only way to
// move between sections, so the fallback carries its own nav.
const SECTIONS: ReadonlyArray<{ href: string; label: string }> = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/stuff', label: 'Stuff' },
    { href: '/lifelog', label: 'Lifelog' },
]

/**
 * Static, no-JavaScript content shell for a canvas route.
 *
 * Canvas routes register their cards in effects, which prerender skips, so
 * their SSG HTML ships an empty physics layer (issues #84/#85). This block
 * is prerendered with real semantic DOM and is hidden once JS hydrates
 * (CSS gated on the `no-js` <html> class — see base.css). It touches none
 * of the card/registry/physics machinery; it is a parallel read-only view.
 */
export function NoJsFallback({ children }: { children: ReactNode }) {
    return (
        <div data-nojs-fallback className="nojs-fallback">
            <nav className="nojs-fallback__nav" aria-label="Sections">
                {SECTIONS.map((s) => (
                    <a key={s.href} href={s.href}>
                        {s.label}
                    </a>
                ))}
            </nav>
            <main className="nojs-fallback__body">{children}</main>
        </div>
    )
}
