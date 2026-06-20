import { useEffect } from 'react'
import { usePhysicalNav } from './morph'

/**
 * Upgrades a direct click on an in-prose **Portal** link (a raw
 * `<a data-link-type="portal">`) from a full page reload to a client-side
 * **physical-default** crossfade nav. The bare word is the lightweight path; the
 * richer **hero morph** stays the **Card**'s "enter" (peek/pin, then click the
 * card).
 *
 * Progressive enhancement: the `<a href>` is untouched, so no-JS users, crawlers,
 * and open-in-new-tab keep working — only an unmodified left-click on a
 * hover-capable (desktop) pointer is intercepted. A touch tap still opens the
 * preview (PeekTriggers owns mobile tap), and a pinned-word recall (PinnedCard's
 * capture-phase handler) pre-empts this via `stopPropagation`/`preventDefault`.
 */
export function PortalNav() {
    const navigate = usePhysicalNav()
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (e.defaultPrevented) return // a recall (or other handler) took it
            if (
                e.button !== 0 ||
                e.metaKey ||
                e.ctrlKey ||
                e.shiftKey ||
                e.altKey
            ) {
                return // let the browser open a new tab / handle modified clicks
            }
            if (!window.matchMedia('(hover: hover)').matches) return // touch → preview
            const link = (e.target as Element | null)?.closest<HTMLAnchorElement>(
                'a[data-link-type="portal"]',
            )
            const href = link?.getAttribute('href')
            if (!href) return
            e.preventDefault()
            navigate(href)
        }
        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [navigate])
    return null
}
