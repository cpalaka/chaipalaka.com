import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'

const srOnly: CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
}

/**
 * A persistent SR route-change announcer. The data router does NOT auto-announce
 * navigations (ADR-0007 spike), and a **hero morph**'s `::view-transition`
 * snapshot must not swallow the announcement. This region lives in the layout so
 * it *persists* across child route swaps — the text updates in place on nav,
 * which is what makes a screen reader announce it. The a11y tree reads the live
 * DOM, not the VT snapshot image, so the morph leaves the announcement intact.
 *
 * Announces the destination's `<h1>` (read one frame after the route commits, so
 * the new content is in the DOM), falling back to the pathname.
 */
export function RouteAnnouncer() {
    const { pathname } = useLocation()
    const [message, setMessage] = useState('')
    const firstMount = useRef(true)

    useEffect(() => {
        if (firstMount.current) {
            firstMount.current = false
            return
        }
        const raf = requestAnimationFrame(() => {
            const heading = document.querySelector('h1')
            setMessage(heading?.textContent?.trim() || pathname)
        })
        return () => cancelAnimationFrame(raf)
    }, [pathname])

    return (
        <div role="status" aria-live="polite" style={srOnly}>
            {message}
        </div>
    )
}
