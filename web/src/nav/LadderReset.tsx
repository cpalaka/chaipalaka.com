import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { usePeek } from '../peek/PeekContext'
import { usePin } from '../pin/PinContext'

/**
 * Resets the link ladder (all preview + pinned **Card**s) on a route change.
 *
 * Peek/pin cards are strung to source words on the *current* page and live in
 * the persistent layer, so a client-side navigation (the v2 **hero morph** /
 * physical default) does NOT unmount them the way the old full-page reload did —
 * they would ghost onto the destination route. Clearing on a `pathname` change
 * restores the reset-on-nav behaviour (persisted per-route pins are task-028).
 *
 * Runs after the navigation commits, so it never races the morph: the morph
 * animates captured snapshots, and by then the entering card has already yielded
 * its `view-transition-name` to the destination box (see `useMorphSource`).
 */
export function LadderReset() {
    const { pathname } = useLocation()
    const peek = usePeek()
    const pin = usePin()
    const firstMount = useRef(true)

    useEffect(() => {
        if (firstMount.current) {
            firstMount.current = false
            return
        }
        peek.clear()
        pin.clear()
    }, [pathname, peek, pin])

    return null
}
