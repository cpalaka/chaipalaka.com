import { useEffect, useRef, useSyncExternalStore } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import './StringLayer.css'

export function StringLayer() {
    const world = usePhysicsWorld()
    const svgRef = useRef<SVGSVGElement | null>(null)
    const pathRefs = useRef<Map<string, SVGPathElement>>(new Map())

    // Re-render only when the SET of tethers changes (mount/unmount of strung cards)
    const tethers = useSyncExternalStore(
        (cb) => world.subscribeTetherSetChange(cb),
        () => world.getTethers(),
        () => world.getTethers(),
    )

    // Per-frame mutation of path `d` attributes — no React re-renders
    useEffect(() => {
        const svg = svgRef.current
        if (!svg) return
        const g = world.getGravityVector()
        const gLen = Math.hypot(g.x, g.y)
        const gx = gLen > 0 ? g.x / gLen : 0
        const gy = gLen > 0 ? g.y / gLen : 1

        let raf = 0
        const frame = () => {
            const views = world.getTethers()
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
    }, [world, tethers])

    return (
        <svg ref={svgRef} className="string-layer" aria-hidden="true">
            {tethers.map((_, i) => (
                <path
                    key={i}
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
