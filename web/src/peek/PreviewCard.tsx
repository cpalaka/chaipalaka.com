import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { usePeek } from './PeekContext'
import { peekTuning } from './peekTuning'
import type { PhysicsHandle } from '../physics/PhysicsWorld'
import type { PreviewEntry } from './PeekStore'
import './Peek.css'

// Pad past the viewport edge before a falling preview is considered "cleared".
const CLEAR_PAD = 100

/**
 * One ephemeral preview. Two phases:
 *  - **held**: a fixed DOM card centred beside its source word (no physics body —
 *    it "holds still"; full physics arrives only at pin, slice 4).
 *  - **falling**: on dismiss it becomes a transient sensor body kicked along the
 *    route's cardinal gravity, despawned the moment it clears the viewport or the
 *    bounded `fallMs` lifetime elapses (never settles).
 *
 * Reduced-motion short-circuits the fall: the preview is removed instantly.
 */
export function PreviewCard({ entry }: { entry: PreviewEntry }) {
    const world = usePhysicsWorld()
    const peek = usePeek()
    const reduced = usePrefersReducedMotion()
    const elRef = useRef<HTMLElement | null>(null)
    const handleRef = useRef<PhysicsHandle | null>(null)

    // Centre the held card on its anchor (measure height once it has rendered).
    useLayoutEffect(() => {
        const el = elRef.current
        if (!el || entry.phase !== 'held') return
        const h = el.offsetHeight
        el.style.transform = `translate(${entry.center.x - entry.width / 2}px, ${entry.center.y - h / 2}px)`
    }, [entry.phase, entry.center.x, entry.center.y, entry.width])

    useEffect(() => {
        if (entry.phase !== 'falling') return
        const el = elRef.current
        if (!el) return
        if (reduced) {
            peek.remove(entry.id)
            return
        }

        const w = entry.width
        const h = el.offsetHeight || 160
        const handle = world.registerById(
            entry.id,
            { x: entry.center.x, y: entry.center.y },
            { width: w, height: h },
            {
                onTransform: ({ x, y }) => {
                    el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px)`
                },
            },
        )
        handleRef.current = handle
        // Sensor: fall straight through the box edges / floor, never settle.
        world.setSensor(handle, true)
        // Snap-kick along the route's cardinal gravity so the exit feels deliberate.
        const g = world.getGravityVector()
        const gLen = Math.hypot(g.x, g.y) || 1
        world.setVelocity(handle, {
            x: (g.x / gLen) * peekTuning.fallKick,
            y: (g.y / gLen) * peekTuning.fallKick,
        })

        const startedAt = performance.now()
        let raf = requestAnimationFrame(function check() {
            const hdl = handleRef.current
            if (hdl === null || !world.has(hdl)) return
            const p = world.getPosition(hdl)
            const vw = window.innerWidth
            const vh = window.innerHeight
            const cleared =
                p.y - h / 2 > vh + CLEAR_PAD ||
                p.y + h / 2 < -CLEAR_PAD ||
                p.x - w / 2 > vw + CLEAR_PAD ||
                p.x + w / 2 < -CLEAR_PAD
            if (cleared || performance.now() - startedAt > peekTuning.fallMs) {
                peek.remove(entry.id)
                return
            }
            raf = requestAnimationFrame(check)
        })

        return () => {
            cancelAnimationFrame(raf)
            const hdl = handleRef.current
            if (hdl !== null && world.has(hdl)) world.unregister(hdl)
            handleRef.current = null
        }
    }, [entry.phase, entry.id, entry.center.x, entry.center.y, entry.width, reduced, world, peek])

    const cls = [
        'peek-preview',
        'physics-card',
        entry.phase === 'falling' ? 'peek-preview--falling' : null,
        reduced ? 'peek-preview--reduced' : null,
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <article
            ref={(el) => {
                elRef.current = el
            }}
            className={cls}
            data-peek-id={entry.id}
            data-peek-kind={entry.kind}
            data-peek-side={entry.side}
            style={{ width: entry.width }}
        >
            <div data-card-header className="peek-preview__bar">
                {entry.kind === 'portal' ? (entry.title ?? 'Link') : 'Note'}
            </div>
            {entry.kind === 'portal' ? (
                <a className="peek-preview__body" href={entry.href}>
                    {entry.lead ?? entry.title}
                </a>
            ) : (
                <div
                    className="peek-preview__body"
                    // Trusted: authored repo content lifted from the rendered Pocket floor.
                    dangerouslySetInnerHTML={{ __html: entry.bodyHtml ?? '' }}
                />
            )}
        </article>
    )
}
