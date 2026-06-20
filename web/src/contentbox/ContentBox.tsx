import { useEffect, useRef, type ReactNode } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import './ContentBox.css'

// Fixed pixel size, shared with the foreground card anchor math so cards can be
// placed relative to the (CSS-centred) box edges. A fixed size means the box
// only recentres on resize — it never changes size — which is what keeps its
// edges viewport-fixed and guardrail G6 a resize-only concern.
export const CONTENT_BOX_WIDTH = 680
export const CONTENT_BOX_HEIGHT = 480

interface ContentBoxProps {
    children: ReactNode
}

/**
 * The v2 content box: a fixed, solid, scrollable prose surface centred over the
 * background shader — the middle of the three depth planes (shader / box /
 * cards). Its screen rectangle is pushed into the physics world as static walls
 * so foreground cards collide with and tether to its edges.
 */
export function ContentBox({ children }: ContentBoxProps) {
    const world = usePhysicsWorld()
    const ref = useRef<HTMLDivElement>(null)

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
            style={{ width: CONTENT_BOX_WIDTH, height: CONTENT_BOX_HEIGHT }}
        >
            <div className="content-box__scroll">{children}</div>
        </div>
    )
}
