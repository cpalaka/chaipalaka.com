import { useEffect, useRef, useSyncExternalStore } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import type { PhysicsMode } from '../physics/PhysicsWorld'
import type { TetherView } from '../physics/Tether'
import './StringLayer.css'

/**
 * The SVG `d` for one tether. Under **drift** (and whenever taut) the rope is a
 * straight line — drift has no gravity to sag toward. The cubic-bezier sag is
 * the **dormant gravity-mode** rendering, kept and gated (not deleted) so the
 * gravity path still renders when a route declares `mode:'gravity'`.
 */
export function stringPathD(
    v: TetherView,
    mode: PhysicsMode,
    gx: number,
    gy: number,
): string {
    const { parentPos: A, childPos: B, length: L, slack } = v
    if (mode === 'drift' || !slack) {
        return `M ${A.x},${A.y} L ${B.x},${B.y}`
    }
    // Cubic bezier with gravity-direction sag (dormant gravity mode only).
    const dist = Math.hypot(B.x - A.x, B.y - A.y)
    const sag = Math.max((L - dist) * 0.5, 0)
    const c1x = A.x + (B.x - A.x) / 3 + gx * sag
    const c1y = A.y + (B.y - A.y) / 3 + gy * sag
    const c2x = A.x + (2 * (B.x - A.x)) / 3 + gx * sag
    const c2y = A.y + (2 * (B.y - A.y)) / 3 + gy * sag
    return `M ${A.x},${A.y} C ${c1x},${c1y} ${c2x},${c2y} ${B.x},${B.y}`
}

/**
 * The `--tension` custom-property value (0..1) that drives a tether's stroke
 * width + opacity. Tension styling is a **drift-only** feature (spec §3.6):
 * under the dormant gravity mode this returns 0, so the base rule renders the
 * preserved v1 constant (1px / 0.4). Under drift it clamps the continuous
 * {@link TetherView.tension} (0 at rest, unbounded above) into [0,1]. Set
 * inline per path; the `.string-layer__string--hot` bonded-trio highlight sets
 * fixed width/opacity and wins by source order, so this never fights the hover
 * highlight.
 */
export function tensionStyleValue(tension: number, mode: PhysicsMode): number {
    if (mode !== 'drift') return 0
    return Math.max(0, Math.min(1, tension))
}

export function StringLayer() {
    const world = usePhysicsWorld()
    const svgRef = useRef<SVGSVGElement | null>(null)
    const pathRefs = useRef<Map<string, SVGPathElement>>(new Map())

    // Re-render only when the SET of tethers changes (mount/unmount of strung cards).
    // records() returns a cached frozen array — stable reference until add/remove,
    // safe for useSyncExternalStore. list() (called per-RAF below) returns fresh
    // positions and would cause an infinite re-render loop here.
    const records = useSyncExternalStore(
        (cb) => world.tether.subscribeChange(cb),
        () => world.tether.records(),
        () => world.tether.records(),
    )

    // Per-frame mutation of path `d` attributes — no React re-renders
    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return

        let raf = 0
        const frame = () => {
            // Read mode per-frame (getMode is O(1), non-reactive) so a route's
            // drift/gravity flips within one frame. Gravity direction is only
            // needed for the dormant sag branch.
            const mode = world.getMode()
            let gx = 0
            let gy = 1
            if (mode === 'gravity') {
                const g = world.getGravityVector()
                const gLen = Math.hypot(g.x, g.y)
                gx = gLen > 0 ? g.x / gLen : 0
                gy = gLen > 0 ? g.y / gLen : 1
            }

            const views = world.tether.list()
            for (let i = 0; i < views.length; i++) {
                const v = views[i]!
                const key = String(i)
                const pathEl = pathRefs.current.get(key)
                if (!pathEl) continue
                pathEl.setAttribute('d', stringPathD(v, mode, gx, gy))
                // Slack→taut modulation of stroke width + opacity (the SVG preview
                // of task-039's tension language) — drift only; gravity mode keeps
                // the v1 constant. Driven via a CSS custom property so the --hot
                // bonded-trio highlight still wins.
                pathEl.style.setProperty(
                    '--tension',
                    String(tensionStyleValue(v.tension, mode)),
                )
            }
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(raf)
    }, [world, records])

    return (
        <svg ref={svgRef} className="string-layer" aria-hidden="true">
            {records.map((rec, i) => (
                <path
                    key={rec.handle}
                    data-tether-handle={String(rec.handle)}
                    ref={(el) => {
                        if (el) pathRefs.current.set(String(i), el)
                        else pathRefs.current.delete(String(i))
                    }}
                    className="string-layer__string"
                />
            ))}
        </svg>
    )
}
