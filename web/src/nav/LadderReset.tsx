import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { usePeek } from '../peek/PeekContext'
import { usePersistedPins } from '../pin/usePersistedPins'

/**
 * Resets the link ladder on a route change. Peek/pin cards are strung to source
 * words on the *current* page and live in the persistent layer, so a client-side
 * navigation (the v2 **hero morph** / physical default) does NOT unmount them the
 * way the old full-page reload did — they would ghost onto the destination route.
 *
 * **Previews** are ephemeral, so they are simply cleared on every `pathname`
 * change here. **Pinned cards** now have a per-route persistence lifecycle
 * (save → clear → restore on nav, plus reload), owned by `usePersistedPins`
 * (task-028) — so that half of the reset lives there, not in this effect.
 *
 * Runs after the navigation commits, so it never races the morph: the morph
 * animates captured snapshots, and by then the entering card has already yielded
 * its `view-transition-name` to the destination box (see `useMorphSource`).
 */
export function LadderReset() {
    const { pathname } = useLocation()
    const peek = usePeek()
    const firstMount = useRef(true)

    usePersistedPins()

    useEffect(() => {
        if (firstMount.current) {
            firstMount.current = false
            return
        }
        peek.clear()
    }, [pathname, peek])

    return null
}
