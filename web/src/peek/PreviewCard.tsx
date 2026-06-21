import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { physicsTuning } from '../physics/physicsTuning'
import { computeFlingImpulse } from '../card/flingImpulse'
import { usePin } from '../pin/PinContext'
import { PinGesture } from '../pin/pinGesture'
import { pinTuning } from '../pin/pinTuning'
import { usePeek } from './PeekContext'
import { peekTuning } from './peekTuning'
import { useMorphSource, HERO_NAME } from '../nav/morph'
import type { PhysicsHandle } from '../physics/PhysicsWorld'
import type { PreviewEntry } from './PeekStore'
import './Peek.css'

function inRect(x: number, y: number, r: DOMRect): boolean {
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

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
    const pin = usePin()
    const reduced = usePrefersReducedMotion()
    const elRef = useRef<HTMLElement | null>(null)
    const handleRef = useRef<PhysicsHandle | null>(null)
    // Enter = the top ladder rung: a client-side hero morph into the destination
    // box (ADR-0007). Held in a ref so the gesture's onClick closure always calls
    // the latest navigator without re-running the gesture effect.
    const { isMorphing, enter, onBodyClick } = useMorphSource(
        entry.kind,
        entry.href,
    )
    const enterRef = useRef(enter)
    enterRef.current = enter

    // Centre the held card on its anchor (measure height once it has rendered).
    useLayoutEffect(() => {
        const el = elRef.current
        if (!el || entry.phase !== 'held') return
        const h = el.offsetHeight
        el.style.transform = `translate(${entry.center.x - entry.width / 2}px, ${entry.center.y - h / 2}px)`
    }, [entry.phase, entry.center.x, entry.center.y, entry.width])

    // The **Keep** gesture (spec §4): press-hold the title bar to arm, drag the
    // preview into the page, release to pin it into a persistent `PinnedCard`
    // strung to its source word. A quick release (before arm) enters; sliding off
    // the bar before arm aborts. Click-vs-press-hold is the `PinGesture`'s job.
    useEffect(() => {
        const el = elRef.current
        if (entry.phase !== 'held' || !el) return
        const bar = el.querySelector<HTMLElement>('[data-card-header]')
        if (!bar) return

        let armed = false
        let barRect: DOMRect | null = null
        let tx = 0
        let ty = 0
        let lastX = 0
        let lastY = 0
        let lastT = 0
        let lastDx = 0
        let lastDy = 0
        let lastDt = 0
        let upT = 0

        const gesture = new PinGesture({
            armPressMs: pinTuning.armPressMs,
            armMovePx: pinTuning.armMovePx,
            onArm: () => {
                armed = true
                el.classList.add('peek-preview--keeping')
                tx = entry.center.x - entry.width / 2
                ty = entry.center.y - el.offsetHeight / 2
            },
            onDrag: (dx, dy) => {
                tx += dx
                ty += dy
                el.style.transform = `translate(${tx}px, ${ty}px)`
            },
            onDrop: () => {
                const rect = el.getBoundingClientRect()
                const impulse = reduced
                    ? { vx: 0, vy: 0 }
                    : computeFlingImpulse(
                          { dx: lastDx, dy: lastDy, dtMs: lastDt },
                          upT - lastT,
                          {
                              scale: physicsTuning.flingVelocityScale,
                              pauseMs: physicsTuning.flingPauseMs,
                          },
                      )
                if (entry.sourceEl) {
                    pin.pin({
                        sourceEl: entry.sourceEl,
                        kind: entry.kind,
                        parentId: entry.parentId,
                        center: {
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2,
                        },
                        width: entry.width,
                        height: rect.height,
                        vx: impulse.vx,
                        vy: impulse.vy,
                        title: entry.title,
                        lead: entry.lead,
                        href: entry.href,
                        bodyHtml: entry.bodyHtml,
                    })
                }
                peek.remove(entry.id)
            },
            onClick: () => enterRef.current(),
            onAbort: () => el.classList.remove('peek-preview--keeping'),
        })

        const onBarDown = (e: PointerEvent) => {
            if ((e.target as Element | null)?.closest('a, button')) return
            e.preventDefault()
            barRect = bar.getBoundingClientRect()
            armed = false
            lastX = e.clientX
            lastY = e.clientY
            lastT = e.timeStamp
            lastDx = lastDy = lastDt = 0
            try {
                el.setPointerCapture(e.pointerId)
            } catch {
                /* pointer may not be capturable; the gesture works regardless */
            }
            gesture.down(e.clientX, e.clientY)
        }
        const onMove = (e: PointerEvent) => {
            lastDx = e.clientX - lastX
            lastDy = e.clientY - lastY
            lastDt = e.timeStamp - lastT
            lastX = e.clientX
            lastY = e.clientY
            lastT = e.timeStamp
            if (!armed && barRect && !inRect(e.clientX, e.clientY, barRect)) {
                gesture.leaveBar()
                return
            }
            gesture.move(e.clientX, e.clientY)
        }
        const onUp = (e: PointerEvent) => {
            upT = e.timeStamp
            try {
                el.releasePointerCapture(e.pointerId)
            } catch {
                /* capture may already be released */
            }
            gesture.up()
        }

        bar.addEventListener('pointerdown', onBarDown)
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        return () => {
            gesture.cancel()
            bar.removeEventListener('pointerdown', onBarDown)
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
        }
    }, [entry, peek, pin, reduced])

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
            style={{
                width: entry.width,
                viewTransitionName: isMorphing ? HERO_NAME : undefined,
            }}
        >
            <div data-card-header className="peek-preview__bar">
                {entry.kind === 'portal' ? (entry.title ?? 'Link') : 'Note'}
            </div>
            {entry.kind === 'portal' ? (
                <a
                    className="peek-preview__body"
                    href={entry.href}
                    onClick={onBodyClick}
                >
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
