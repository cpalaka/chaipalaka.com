import { useEffect, useRef } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import { physicsTuning } from '../physics/physicsTuning'
import { computeFlingImpulse } from '../card/flingImpulse'
import { PinGesture } from './pinGesture'
import { trackWord } from './wordAnchor'
import { stepRegime, type Regime } from './scrollRegime'
import { stepWobble, REST, type WobbleState } from './wobble'
import { pinTuning } from './pinTuning'
import { useMorphSource, HERO_NAME } from '../nav/morph'
import { usePin } from './PinContext'
import { childHandlesOf } from './recursion'
import { wireTetherFor, type TetherHandle } from '../physics/Tether'
import type { PhysicsHandle } from '../physics/PhysicsWorld'
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
 * **Two anchor regimes (slice 5, §5):** while the source word is inside the
 * content box's fold the card is *word-anchored* (above); when the word scrolls
 * past the fold it **auto-parks** to the edge it exited through — a one-way
 * (hysteresis) swap to an edge tether started seamlessly then eased taut (spike
 * G3); a card dragged past an edge parks the same way. **Recall** is *manual*:
 * scrolling the word back lights a distinct click-suggesting highlight on it, and
 * clicking it eases the card home — never automatic, so cards never yo-yo.
 *
 * Reduced-motion: the card is placed (frozen, no sway) but still tracks its word
 * on scroll; park/recall are instant (no ease), no wobble, static highlight
 * (spec §11; AC#4).
 */
export function PinnedCard({ entry }: { entry: PinEntry }) {
    const world = usePhysicsWorld()
    const pin = usePin()
    const reduced = usePrefersReducedMotion()
    const elRef = useRef<HTMLElement | null>(null)
    // Enter = hero morph into the destination box (ADR-0007). Ref-held so the
    // gesture's onClick closure calls the latest navigator without re-running the
    // (physics-heavy) gesture effect.
    const { isMorphing, enter, onBodyClick } = useMorphSource(
        entry.kind,
        entry.href,
    )
    const enterRef = useRef(enter)
    enterRef.current = enter

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

        // A **child pin** (spec §9 recursion) ropes to its PARENT card via the
        // generic card-parent Tether (`wireTetherFor` 'card' — NOT a word-anchor,
        // NOT the removed NotesChain). A **root pin** instead gets a word-anchor
        // proxy + runtime word tether (anchor = the word's centre). The handle and
        // (root) length are mutable: auto-park / recall swap the rope.
        const isChild = entry.parentId !== undefined
        let first: { anchor: Vec2; delta: Vec2 } | null = null
        let anchorHandle: PhysicsHandle | undefined
        let wordRest = 0
        let tetherHandle: TetherHandle | undefined
        if (isChild) {
            // The parent mounted first, so its body is registered; if it has since
            // gone, the child just hangs ropeless (only reachable via parent loss).
            const parentHandle = world.getHandleById(entry.parentId!)
            if (parentHandle !== undefined) {
                tetherHandle = wireTetherFor(world, parentHandle, 'card', cardHandle, {
                    x: entry.center.x,
                    y: entry.center.y,
                })
            }
        } else {
            first = trackWord(null, word.getBoundingClientRect())
            const startAnchor = first
                ? first.anchor
                : { x: entry.center.x, y: entry.center.y - h }
            anchorHandle = world.registerAnchor(startAnchor)
            wordRest = Math.hypot(
                entry.center.x - startAnchor.x,
                entry.center.y - startAnchor.y,
            )
            tetherHandle = world.tether.add(anchorHandle, cardHandle, wordRest)
        }

        // Mark the source bonded (blocks a re-peek that would double-pin it). The
        // wobble host is root-only: wrap the word's contents in a single
        // inline-block span so a transform animates without touching the real text
        // (SR/selection/copy) or the word's own layout box (the anchor measures the
        // un-wobbled <a>, so there is no feedback loop). A child has no word regime,
        // so it is marked but never wrapped (wobble deferred to the design pass).
        word.classList.add('pin-word')
        let wobbleSpan: HTMLSpanElement | null = null
        let wob: WobbleState = REST
        if (!isChild) {
            wobbleSpan = document.createElement('span')
            wobbleSpan.className = 'pin-wobble'
            while (word.firstChild) wobbleSpan.appendChild(word.firstChild)
            word.appendChild(wobbleSpan)
        }

        // Reduced motion: place the card (frozen, no sway); it still tracks scroll.
        if (reduced) world.setDragging(cardHandle, true)

        // --- Scroll-regime state (slice 5 — task-024) ------------------------
        // Plain closures, kept off the React render path (transient per-frame
        // values): `regime` is the word ⇄ edge anchor state, `prevAnchor` feeds
        // the translate-pair, `curLen` the live tether rest length, `easeTarget`
        // its goal while a snap/recall ease runs (null = settled), `recallable`
        // whether the parked word is back in the fold, `hot` the hover state.
        const boxEl = document.querySelector('[data-content-box]')
        let regime: Regime = 'word'
        let prevAnchor = first ? first.anchor : null
        let curLen = wordRest
        let easeTarget: number | null = null
        let recallable = false
        let hot = false

        // The fold is the content box's visible region (viewport space); absent
        // (no box) or non-finite (mid-transform, G4) → no parking this frame.
        const readFold = (): { top: number; bottom: number } | null => {
            const r = boxEl?.getBoundingClientRect()
            return r && Number.isFinite(r.top) && Number.isFinite(r.bottom)
                ? { top: r.top, bottom: r.bottom }
                : null
        }
        const ropePath = () =>
            document.querySelector(`path[data-tether-handle="${tetherHandle}"]`)

        // Auto-park / drag-to-edge: swap the word tether for an edge tether,
        // started at the card's live distance (seamless, overshoot ≈ 0 — spike
        // finding 4) then eased to taut (G3). Reduced-motion teleports the frozen
        // card instead, since a static body can't be pulled by the rope.
        const parkAt = (next: 'parked-top' | 'parked-bottom'): void => {
            if (tetherHandle === undefined) return // root pins always have one
            const edgeHandle =
                next === 'parked-top'
                    ? world.contentBoxTopHandle
                    : world.contentBoxBottomHandle
            if (edgeHandle === undefined) return // no box edge → stay word-anchored
            const cardPos = world.getPosition(cardHandle)
            const edgePos = world.getPosition(edgeHandle)
            const edgeAnchor = world.getAnchor(edgeHandle)
            world.tether.remove(tetherHandle)
            curLen = Math.abs(cardPos.y - edgeAnchor.y)
            tetherHandle = world.tether.add(edgeHandle, cardHandle, curLen, {
                x: cardPos.x - edgePos.x,
                y: edgeAnchor.y - edgePos.y,
            })
            regime = next
            const parkRest = h / 2 + pinTuning.parkGapPx
            if (reduced) {
                world.setPosition(cardHandle, {
                    x: cardPos.x,
                    y: edgeAnchor.y + parkRest,
                })
                curLen = parkRest
                world.tether.setLength(tetherHandle, curLen)
                easeTarget = null
            } else {
                easeTarget = parkRest
            }
            if (hot) ropePath()?.classList.add('string-layer__string--hot')
        }

        // Recall (manual, hysteresis): only when parked AND the word is back in
        // the fold. Re-anchor to the word and ease home; reduced-motion snaps.
        const recall = (): void => {
            if (regime === 'word' || !recallable) return
            if (anchorHandle === undefined || tetherHandle === undefined) return
            const t = trackWord(null, word.getBoundingClientRect())
            if (!t) return
            world.tether.remove(tetherHandle)
            world.setPosition(anchorHandle, t.anchor)
            const cardPos = world.getPosition(cardHandle)
            curLen = Math.hypot(cardPos.x - t.anchor.x, cardPos.y - t.anchor.y)
            tetherHandle = world.tether.add(anchorHandle, cardHandle, curLen)
            regime = 'word'
            prevAnchor = t.anchor
            recallable = false
            word.classList.remove('pin-word--recallable')
            if (reduced) {
                world.setPosition(cardHandle, {
                    x: t.anchor.x,
                    y: t.anchor.y + wordRest,
                })
                curLen = wordRest
                world.tether.setLength(tetherHandle, curLen)
                easeTarget = null
            } else {
                easeTarget = wordRest
            }
            if (hot) ropePath()?.classList.add('string-layer__string--hot')
        }

        const resolveChildHandle = (id: string): PhysicsHandle | undefined => {
            const hh = world.getHandleById(id)
            return hh !== undefined && world.has(hh) ? hh : undefined
        }

        // Per-frame, before forces: regime step → translate-pair (G1) while
        // word-anchored, or a parked hold; then the length ease and the wobble. A
        // child has no word regime (anchorHandle undefined) and skips all of this;
        // it is carried instead by its parent's G5 subtree translate below.
        const stopTick = world.onBeforeTick((dt) => {
            if (anchorHandle === undefined || tetherHandle === undefined) return
            const tracked = trackWord(prevAnchor, word.getBoundingClientRect())
            if (tracked) {
                const fold = readFold()
                if (regime === 'word') {
                    // Word-anchored: translate-pair (G1, no anchor-delta clamp).
                    world.setPosition(anchorHandle, tracked.anchor)
                    if (tracked.delta.x !== 0 || tracked.delta.y !== 0) {
                        world.translate(cardHandle, tracked.delta)
                        // G5: carry the whole bonded subtree by the SAME delta —
                        // pairing only the parent would yank each child off its
                        // card-to-card rope (spike: detach 2490px → 35px).
                        for (const childHandle of childHandlesOf(
                            pin.snapshot(),
                            entry.id,
                            resolveChildHandle,
                        )) {
                            world.translate(childHandle, tracked.delta)
                        }
                    }
                    prevAnchor = tracked.anchor
                    if (fold) {
                        const step = stepRegime(
                            regime,
                            tracked.anchor.y,
                            fold,
                            pinTuning.foldMarginPx,
                        )
                        if (step.justParked) {
                            parkAt(step.regime as 'parked-top' | 'parked-bottom')
                        }
                    }
                } else {
                    // Parked: the card hangs from the edge — do NOT translate it.
                    // Keep prevAnchor fresh so a later recall re-bootstraps cleanly
                    // and offer recall once the word scrolls back into the fold.
                    prevAnchor = tracked.anchor
                    if (fold) {
                        const step = stepRegime(
                            regime,
                            tracked.anchor.y,
                            fold,
                            pinTuning.foldMarginPx,
                        )
                        if (step.recallable !== recallable) {
                            recallable = step.recallable
                            word.classList.toggle('pin-word--recallable', recallable)
                        }
                    }
                }
            }
            // Snap-to-edge / ease-home: relax the tether length toward its goal.
            if (easeTarget !== null) {
                const k = Math.min(1, pinTuning.snapEaseRate * (dt / 16.667))
                curLen += (easeTarget - curLen) * k
                if (Math.abs(curLen - easeTarget) < 0.5) {
                    curLen = easeTarget
                    easeTarget = null
                }
                world.tether.setLength(tetherHandle, curLen)
            }
            if (!reduced && wobbleSpan && world.has(cardHandle)) {
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
            hot = on
            el.classList.toggle('pin-card--hot', on)
            word.classList.toggle('pin-word--hot', on)
            ropePath()?.classList.toggle('string-layer__string--hot', on)
        }
        const onEnter = () => setHot(true)
        const onLeave = () => setHot(false)
        el.addEventListener('pointerenter', onEnter)
        el.addEventListener('pointerleave', onLeave)
        word.addEventListener('pointerenter', onEnter)
        word.addEventListener('pointerleave', onLeave)

        // Clicking a recallable word recalls its parked card. Capture-phase so it
        // pre-empts the link's navigation / the peek trigger; a no-op otherwise.
        const onWordClick = (e: MouseEvent) => {
            if (regime !== 'word' && recallable) {
                e.preventDefault()
                e.stopPropagation()
                recall()
            }
        }
        // Recall is a word-anchored-regime affordance — root pins only.
        if (!isChild) word.addEventListener('click', onWordClick, true)

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
                // Drag-to-edge: releasing the card past a fold edge re-anchors it
                // there — the manual counterpart of auto-park (spec §5).
                // Drag-to-edge parking is a root affordance; a child stays roped
                // to its parent card (never re-anchors to a box edge).
                const fold = readFold()
                if (!isChild && regime === 'word' && fold) {
                    const pos = world.getPosition(cardHandle)
                    if (pos.y < fold.top - pinTuning.foldMarginPx) {
                        parkAt('parked-top')
                        return
                    }
                    if (pos.y > fold.bottom + pinTuning.foldMarginPx) {
                        parkAt('parked-bottom')
                        return
                    }
                }
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
            onClick: () => enterRef.current(),
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
            word.removeEventListener('click', onWordClick, true)
            setHot(false)
            if (tetherHandle !== undefined) world.tether.remove(tetherHandle)
            if (world.has(cardHandle)) world.unregister(cardHandle)
            if (anchorHandle !== undefined && world.has(anchorHandle)) {
                world.unregister(anchorHandle)
            }
            // Unwrap the wobble span (root only), restoring the word's text nodes.
            if (wobbleSpan) {
                while (wobbleSpan.firstChild) {
                    word.insertBefore(wobbleSpan.firstChild, wobbleSpan)
                }
                wobbleSpan.remove()
            }
            word.classList.remove('pin-word', 'pin-word--hot', 'pin-word--recallable')
        }
        // entry.id is the stable identity; other entry fields are captured once at
        // pin. `pin` is the stable store from context (no re-run).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [world, pin, entry.id, reduced])

    return (
        <article
            ref={(el) => {
                elRef.current = el
            }}
            className="physics-card pin-card"
            data-pin-id={entry.id}
            data-pin-kind={entry.kind}
            data-pin-parent={entry.parentId}
            style={isMorphing ? { viewTransitionName: HERO_NAME } : undefined}
        >
            <div data-card-header className="pin-card__bar">
                {entry.kind === 'portal' ? (entry.title ?? 'Link') : 'Note'}
            </div>
            {entry.kind === 'portal' ? (
                <a
                    className="pin-card__body"
                    href={entry.href}
                    onClick={onBodyClick}
                >
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
