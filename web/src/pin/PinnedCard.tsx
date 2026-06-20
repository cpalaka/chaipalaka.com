import { useEffect, useRef } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { physicsTuning } from '../physics/physicsTuning'
import { computeFlingImpulse } from '../card/flingImpulse'
import { PinGesture } from './pinGesture'
import { trackWord } from './wordAnchor'
import { stepWobble, REST, type WobbleState } from './wobble'
import { pinTuning } from './pinTuning'
import type { PinEntry } from './PinStore'
import './Pin.css'

interface Vec2 {
    x: number
    y: number
}

function clampMag(v: Vec2, max: number): Vec2 {
    const m = Math.hypot(v.x, v.y)
    if (m <= max || m === 0) return v
    const k = max / m
    return { x: v.x * k, y: v.y * k }
}

function inRect(x: number, y: number, r: DOMRect): boolean {
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

/**
 * One **pinned card** (the kept rung, spec §4/§5): a persistent full-physics card
 * strung to its source word by a **runtime-created tether** (ADR-0006 — the first
 * user-created tether; v1's are PageDef-authored).
 *
 * On mount it registers a card body, a static **word-anchor proxy** at the source
 * word, and the tether between them, then tracks the word every frame with
 * **translate-pair** (spike G1: anchor follows the word exactly, card shifted by
 * the same delta — no motion clamp; G4: a non-finite rect skips the frame). The
 * source word **wobbles** (a transform-only spring on a single wrapping span — not
 * pretext; real DOM text untouched). Title-bar press-hold re-drags the card; the
 * body click enters; hovering the card or word lights the whole **bonded trio**.
 *
 * Reduced-motion: the card is placed (frozen, no sway) but still tracks its word
 * on scroll; no wobble, static highlight (spec §11; AC#4).
 */
export function PinnedCard({ entry }: { entry: PinEntry }) {
    const world = usePhysicsWorld()
    const reduced = usePrefersReducedMotion()
    const elRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        const el = elRef.current
        if (!el) return
        const word = entry.sourceEl as HTMLElement
        const w = entry.width
        const h = entry.height

        el.style.width = `${w}px`
        el.style.height = `${h}px`
        el.style.transform = `translate(${entry.center.x - w / 2}px, ${entry.center.y - h / 2}px)`

        const cardHandle = world.registerById(
            entry.id,
            { x: entry.center.x, y: entry.center.y },
            { width: w, height: h },
            {
                onTransform: ({ x, y, rotation }) => {
                    el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${rotation}rad)`
                },
            },
        )
        if (entry.vx || entry.vy) {
            world.setVelocity(cardHandle, { x: entry.vx ?? 0, y: entry.vy ?? 0 })
        }

        // Word-anchor proxy + runtime tether (anchor = the word's centre).
        const first = trackWord(null, word.getBoundingClientRect())
        const startAnchor = first
            ? first.anchor
            : { x: entry.center.x, y: entry.center.y - h }
        const anchorHandle = world.registerAnchor(startAnchor)
        const length = Math.hypot(
            entry.center.x - startAnchor.x,
            entry.center.y - startAnchor.y,
        )
        const tetherHandle = world.tether.add(anchorHandle, cardHandle, length)

        // Wobble host: wrap the word's contents in a single inline-block span so a
        // transform animates without touching the real text (SR/selection/copy)
        // and without moving the word's own layout box (the anchor measures the
        // un-wobbled <a>, so there is no feedback loop).
        const wobbleSpan = document.createElement('span')
        wobbleSpan.className = 'pin-wobble'
        while (word.firstChild) wobbleSpan.appendChild(word.firstChild)
        word.appendChild(wobbleSpan)
        word.classList.add('pin-word')
        let wob: WobbleState = REST

        // Reduced motion: place the card (frozen, no sway); it still tracks scroll.
        if (reduced) world.setDragging(cardHandle, true)

        // Per-frame, before forces: translate-pair (G1) + wobble.
        let prevAnchor = first ? first.anchor : null
        const stopTick = world.onBeforeTick((dt) => {
            const tracked = trackWord(prevAnchor, word.getBoundingClientRect())
            if (tracked) {
                world.setPosition(anchorHandle, tracked.anchor)
                if (tracked.delta.x !== 0 || tracked.delta.y !== 0) {
                    world.translate(cardHandle, tracked.delta)
                }
                prevAnchor = tracked.anchor
            }
            if (!reduced && world.has(cardHandle)) {
                const vel = world.getVelocity(cardHandle)
                const drive = clampMag(
                    {
                        x: vel.x * pinTuning.wobbleDriveGain,
                        y: vel.y * pinTuning.wobbleDriveGain,
                    },
                    pinTuning.wobbleMaxDrive,
                )
                wob = stepWobble(wob, drive, dt, {
                    stiffness: pinTuning.wobbleStiffness,
                    damping: pinTuning.wobbleDamping,
                })
                wobbleSpan.style.transform = `translate(${wob.x}px, ${wob.y}px)`
            }
        })

        // Bonded-trio highlight: hovering the card OR the word lights all three.
        const setHot = (on: boolean) => {
            el.classList.toggle('pin-card--hot', on)
            word.classList.toggle('pin-word--hot', on)
            document
                .querySelector(`path[data-tether-handle="${tetherHandle}"]`)
                ?.classList.toggle('string-layer__string--hot', on)
        }
        const onEnter = () => setHot(true)
        const onLeave = () => setHot(false)
        el.addEventListener('pointerenter', onEnter)
        el.addEventListener('pointerleave', onLeave)
        word.addEventListener('pointerenter', onEnter)
        word.addEventListener('pointerleave', onLeave)

        const enter = () => {
            if (entry.kind === 'portal' && entry.href) window.location.href = entry.href
        }

        // Title-bar re-drag gesture (press-hold to grab, body-click to enter).
        const bar = el.querySelector<HTMLElement>('[data-card-header]')
        let barRect: DOMRect | null = null
        let armed = false
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
                world.setDragging(cardHandle, true)
                el.style.cursor = 'grabbing'
            },
            onDrag: (dx, dy) => {
                const cur = world.getPosition(cardHandle)
                world.setPosition(cardHandle, { x: cur.x + dx, y: cur.y + dy })
            },
            onDrop: () => {
                el.style.cursor = ''
                if (reduced) {
                    world.setDragging(cardHandle, true) // stay placed
                    return
                }
                world.setDragging(cardHandle, false)
                const impulse = computeFlingImpulse(
                    { dx: lastDx, dy: lastDy, dtMs: lastDt },
                    upT - lastT,
                    {
                        scale: physicsTuning.flingVelocityScale,
                        pauseMs: physicsTuning.flingPauseMs,
                    },
                )
                world.setVelocity(cardHandle, { x: impulse.vx, y: impulse.vy })
            },
            onClick: () => enter(),
            onAbort: () => {
                el.style.cursor = ''
            },
        })

        const onBarDown = (e: PointerEvent) => {
            if ((e.target as Element | null)?.closest('a, button')) return
            e.preventDefault()
            barRect = bar?.getBoundingClientRect() ?? null
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
            // Pre-arm, sliding off the bar aborts (spec §4); after arm, drag anywhere.
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

        bar?.addEventListener('pointerdown', onBarDown)
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)

        return () => {
            stopTick()
            gesture.cancel()
            bar?.removeEventListener('pointerdown', onBarDown)
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            el.removeEventListener('pointerenter', onEnter)
            el.removeEventListener('pointerleave', onLeave)
            word.removeEventListener('pointerenter', onEnter)
            word.removeEventListener('pointerleave', onLeave)
            setHot(false)
            world.tether.remove(tetherHandle)
            if (world.has(cardHandle)) world.unregister(cardHandle)
            if (world.has(anchorHandle)) world.unregister(anchorHandle)
            // Unwrap the wobble span, restoring the word's original text nodes.
            while (wobbleSpan.firstChild) {
                word.insertBefore(wobbleSpan.firstChild, wobbleSpan)
            }
            wobbleSpan.remove()
            word.classList.remove('pin-word', 'pin-word--hot')
        }
        // entry.id is the stable identity; other entry fields are captured once at pin.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [world, entry.id, reduced])

    return (
        <article
            ref={(el) => {
                elRef.current = el
            }}
            className="physics-card pin-card"
            data-pin-id={entry.id}
            data-pin-kind={entry.kind}
        >
            <div data-card-header className="pin-card__bar">
                {entry.kind === 'portal' ? (entry.title ?? 'Link') : 'Note'}
            </div>
            {entry.kind === 'portal' ? (
                <a className="pin-card__body" href={entry.href}>
                    {entry.lead ?? entry.title}
                </a>
            ) : (
                <div
                    className="pin-card__body"
                    // Trusted: authored repo content lifted from the rendered Pocket floor.
                    dangerouslySetInnerHTML={{ __html: entry.bodyHtml ?? '' }}
                />
            )}
        </article>
    )
}
