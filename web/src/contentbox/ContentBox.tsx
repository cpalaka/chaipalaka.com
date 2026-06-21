import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { HERO_NAME, useMorphDestination } from '../nav/morph'
import './ContentBox.css'

// Fixed pixel size, shared with the foreground card anchor math so cards can be
// placed relative to the (CSS-centred) box edges. A fixed size means the box
// only recentres on resize — it never changes size — which is what keeps its
// edges viewport-fixed and guardrail G6 a resize-only concern.
export const CONTENT_BOX_WIDTH = 680
export const CONTENT_BOX_HEIGHT = 480

interface ContentBoxProps {
    children: ReactNode
    // Optional per-route override of the standard box size. Defaults to
    // CONTENT_BOX_WIDTH/HEIGHT; a route passes this only for an exception. (Card
    // anchor math still reads the consts — thread the resolved size through when
    // the first overriding route actually lands. task-036.)
    size?: { width?: number; height?: number }
}

/**
 * The v2 content box: a fixed, solid, scrollable prose surface centred over the
 * background shader — the middle of the three depth planes (shader / box /
 * cards). Its screen rectangle is pushed into the physics world as non-colliding
 * sensor edges: foreground cards pass through the border but can still tether /
 * pin to its top and bottom edges (task-036).
 */
export function ContentBox({ children, size }: ContentBoxProps) {
    const world = usePhysicsWorld()
    const ref = useRef<HTMLDivElement>(null)
    const { pathname } = useLocation()

    // The box claims the shared hero name ONLY while it is the in-flight morph
    // destination (the page just arrived at) — never on the source page, where
    // it would collide with the clicked card's name (both are the same persistent
    // ContentBox element). The browser then pairs the old clicked-card snapshot
    // with the new box snapshot and morphs. (`useViewTransitionState` can't be
    // used here — it matches both the from- and to-location; see nav/morph.ts.)
    const isMorphDestination = useMorphDestination()

    // Focus-follow: on a route change (NOT the initial load — don't steal focus)
    // move focus to the destination box's heading, mirroring the spike. Runs one
    // frame after the route commits so the new prose is in the DOM. preventScroll
    // keeps the focus call from fighting the morph animation.
    const firstMount = useRef(true)
    useEffect(() => {
        if (firstMount.current) {
            firstMount.current = false
            return
        }
        const raf = requestAnimationFrame(() => {
            ref.current
                ?.querySelector<HTMLHeadingElement>('h1')
                ?.focus({ preventScroll: true })
        })
        return () => cancelAnimationFrame(raf)
    }, [pathname])

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const sync = () => {
            const r = el.getBoundingClientRect()
            world.setContentBox({
                x: r.x,
                y: r.y,
                width: r.width,
                height: r.height,
            })
        }
        sync()
        // Box edges are viewport-fixed: only a resize moves the box (it
        // recentres), never a scroll — so there is no scroll listener (the G6
        // carve-out). The resize move is translate-paired in setContentBox.
        window.addEventListener('resize', sync, { passive: true })
        return () => {
            window.removeEventListener('resize', sync)
            world.setContentBox(null)
        }
    }, [world])

    return (
        <div
            ref={ref}
            className="content-box"
            data-content-box
            style={{
                width: size?.width ?? CONTENT_BOX_WIDTH,
                height: size?.height ?? CONTENT_BOX_HEIGHT,
                viewTransitionName: isMorphDestination ? HERO_NAME : undefined,
            }}
        >
            <div className="content-box__scroll">{children}</div>
        </div>
    )
}
