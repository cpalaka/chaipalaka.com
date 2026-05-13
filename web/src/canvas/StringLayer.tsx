import { useEffect, useRef, useSyncExternalStore } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import './StringLayer.css'

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
            // Re-read gravity every frame so direction changes are reflected immediately
            const g = world.getGravityVector()
            const gLen = Math.hypot(g.x, g.y)
            const gx = gLen > 0 ? g.x / gLen : 0
            const gy = gLen > 0 ? g.y / gLen : 1

            const views = world.tether.list()
            for (let i = 0; i < views.length; i++) {
                const v = views[i]!
                const key = String(i)
                const pathEl = pathRefs.current.get(key)
                if (!pathEl) continue
                const { parentPos: A, childPos: B, length: L, slack } = v
                let d: string
                if (!slack) {
                    d = `M ${A.x},${A.y} L ${B.x},${B.y}`
                } else {
                    // Cubic bezier with gravity-direction sag
                    const dist = Math.hypot(B.x - A.x, B.y - A.y)
                    const sag = Math.max((L - dist) * 0.5, 0)
                    const c1x = A.x + (B.x - A.x) / 3 + gx * sag
                    const c1y = A.y + (B.y - A.y) / 3 + gy * sag
                    const c2x = A.x + (2 * (B.x - A.x)) / 3 + gx * sag
                    const c2y = A.y + (2 * (B.y - A.y)) / 3 + gy * sag
                    d = `M ${A.x},${A.y} C ${c1x},${c1y} ${c2x},${c2y} ${B.x},${B.y}`
                }
                pathEl.setAttribute('d', d)
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
