import { useEffect, useRef, useState } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import {
    useIsMinimized,
    useMinimizedRegistry,
} from '../canvas/useMinimizedRegistry'
import { flipMorph } from '../canvas/flip'
import { wireTetherFor } from '../physics/PhysicsCard'
import type {
    PhysicsHandle,
    TetherHandle,
} from '../physics/PhysicsWorld'
import type { PhysicsCardEntry } from './CardRegistry'
import '../physics/PhysicsCard.css'

interface PhysicsCardImplProps {
    entry: PhysicsCardEntry
}

export function PhysicsCardImpl({ entry }: PhysicsCardImplProps) {
    const {
        id,
        parent,
        kind,
        buoyancy,
        anchor,
        content: {
            text,
            width,
            height,
            children,
            header,
            minimizable = false,
            label,
            draggable = true,
            variant,
            className,
            style,
        },
    } = entry

    const world = usePhysicsWorld()
    const elRef = useRef<HTMLElement | null>(null)
    const handleRef = useRef<PhysicsHandle | null>(null)
    const anchorRef = useRef(anchor)
    anchorRef.current = anchor
    const tetherHandleRef = useRef<TetherHandle | null>(null)

    const registry = useMinimizedRegistry()
    const isMinimized = useIsMinimized(minimizable ? id : undefined)

    // Hide the article for the first frame after mount. If this card is the
    // incoming side of a pour-in transition, the pour-in primitive's RAF
    // (scheduled in TransitionDirector's useEffect *before* this impl mounts
    // in the deferred PhysicsLayer re-render) fires first and teleports the
    // body above the viewport. By the time we flip `revealed` true on the
    // next frame, the body is already in its pre-spawn position and the
    // user never sees a paint at the layout anchor. For non-transition
    // mounts (initial page load, post-resize) the cost is one frame of
    // invisibility — imperceptible.
    const [revealed, setRevealed] = useState(false)
    useEffect(() => {
        if (revealed) return
        const raf = requestAnimationFrame(() => setRevealed(true))
        return () => cancelAnimationFrame(raf)
    }, [revealed])

    useEffect(() => {
        if (isMinimized) return
        const el = elRef.current
        if (!el) return

        const { x, y } = anchorRef.current
        const w = width
        const h = height

        const SPAWN_OFFSET = 20
        const g = world.getGravityVector()
        const gLen = Math.hypot(g.x, g.y)
        const gx = gLen > 0 ? g.x / gLen : 0
        const gy = gLen > 0 ? g.y / gLen : 1
        const sx = x + gx * SPAWN_OFFSET
        const sy = y + gy * SPAWN_OFFSET

        el.style.width = `${w}px`
        el.style.height = `${h}px`
        el.style.transform = `translate(${sx - w / 2}px, ${sy - h / 2}px)`

        const handle = world.registerById(
            id,
            { x: sx, y: sy },
            { width: w, height: h },
            {
                onTransform: ({ x: px, y: py, rotation }) => {
                    el.style.transform = `translate(${px - w / 2}px, ${py - h / 2}px) rotate(${rotation}rad)`
                },
            },
        )
        handleRef.current = handle

        if (buoyancy) world.setBuoyancy(handle, buoyancy)

        let rafId = 0
        if (parent) {
            const resolved = resolveParent(world, parent)
            if (resolved.handle != null) {
                tetherHandleRef.current = wireTetherFor(
                    world,
                    resolved.handle,
                    resolved.kind,
                    handle,
                    anchorRef.current,
                )
            } else {
                rafId = requestAnimationFrame(() => {
                    const retried = resolveParent(world, parent)
                    if (retried.handle == null) {
                        console.warn(
                            `PhysicsCard: parent "${parent}" not found after one frame; tether skipped`,
                        )
                        return
                    }
                    tetherHandleRef.current = wireTetherFor(
                        world,
                        retried.handle,
                        retried.kind,
                        handle,
                        anchorRef.current,
                    )
                })
            }
        }

        let dragging = false
        let lastX = 0
        let lastY = 0
        let lastT = 0
        let velX = 0
        let velY = 0
        const FLING_VELOCITY_SCALE = 16
        const FLING_PAUSE_MS = 50

        const onPointerDown = (e: PointerEvent) => {
            if (
                (e.target as Element | null)?.closest(
                    '[data-card-header], a, button',
                )
            )
                return
            e.preventDefault()
            dragging = true
            lastX = e.clientX
            lastY = e.clientY
            lastT = e.timeStamp
            velX = 0
            velY = 0
            world.setDragging(handle, true)
            el.setPointerCapture(e.pointerId)
            el.style.cursor = 'grabbing'
        }
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return
            const dx = e.clientX - lastX
            const dy = e.clientY - lastY
            const dt = Math.max(e.timeStamp - lastT, 1)
            velX = dx / dt
            velY = dy / dt
            const cur = world.getPosition(handle)
            world.setPosition(handle, { x: cur.x + dx, y: cur.y + dy })
            lastX = e.clientX
            lastY = e.clientY
            lastT = e.timeStamp
        }
        const onPointerUp = (e: PointerEvent) => {
            if (!dragging) return
            dragging = false
            world.setDragging(handle, false)
            const sinceLastMove = e.timeStamp - lastT
            if (sinceLastMove > FLING_PAUSE_MS) {
                velX = 0
                velY = 0
            }
            world.setVelocity(handle, {
                x: velX * FLING_VELOCITY_SCALE,
                y: velY * FLING_VELOCITY_SCALE,
            })
            el.releasePointerCapture(e.pointerId)
            el.style.cursor = 'grab'
        }

        if (draggable) {
            el.addEventListener('pointerdown', onPointerDown)
            window.addEventListener('pointermove', onPointerMove)
            window.addEventListener('pointerup', onPointerUp)
        }

        return () => {
            cancelAnimationFrame(rafId)
            if (tetherHandleRef.current !== null) {
                world.untether(tetherHandleRef.current)
                tetherHandleRef.current = null
            }
            world.unregister(handle)
            handleRef.current = null
            if (draggable) {
                el.removeEventListener('pointerdown', onPointerDown)
                window.removeEventListener('pointermove', onPointerMove)
                window.removeEventListener('pointerup', onPointerUp)
            }
        }
    }, [world, id, width, height, isMinimized, draggable, parent, buoyancy])

    useEffect(() => {
        if (handleRef.current === null) return
        world.setAnchor(handleRef.current, anchor)
        if (tetherHandleRef.current !== null && parent) {
            world.untether(tetherHandleRef.current)
            tetherHandleRef.current = null
            const resolved = resolveParent(world, parent)
            if (resolved.handle != null) {
                tetherHandleRef.current = wireTetherFor(
                    world,
                    resolved.handle,
                    resolved.kind,
                    handleRef.current,
                    anchor,
                )
            }
        }
    }, [world, anchor.x, anchor.y, parent])

    useEffect(() => {
        if (isMinimized || !minimizable) return
        const el = elRef.current
        if (!el) return
        const fromChipRect = registry.consumeRestoreRect(id)
        if (!fromChipRect) return
        // Restore-from-chip needs the article visible so flipMorph animates
        // an actual painted element. Bypass the first-frame reveal gate.
        setRevealed(true)
        const endTransform = el.style.transform
        requestAnimationFrame(() => {
            flipMorph(fromChipRect, el, { opacityFrom: 0.5, endTransform })
        })
    }, [isMinimized, id, minimizable, registry])

    if (isMinimized) return null

    function handleMinimize() {
        const el = elRef.current
        if (!el) return
        const fromRect = el.getBoundingClientRect()
        registry.minimize(id, { label: label ?? text, kind, fromRect })
    }

    const showHeader = header != null || minimizable
    const cls = ['physics-card', className].filter(Boolean).join(' ')

    return (
        <article
            ref={(el) => {
                elRef.current = el
            }}
            className={cls}
            data-variant={variant}
            data-card-id={id}
            style={revealed ? style : { ...style, visibility: 'hidden' }}
        >
            {showHeader ? (
                <div data-card-header>
                    {minimizable ? (
                        <button
                            type="button"
                            title="Minimize"
                            className="physics-card__minimize-btn"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={handleMinimize}
                        >
                            −
                        </button>
                    ) : null}
                    {header}
                </div>
            ) : null}
            {children ?? text}
        </article>
    )
}

import type { ParentRef } from '../physics/PageDef'
import type { PhysicsWorld } from '../physics/PhysicsWorld'

type ParentKind = 'ceiling' | 'floor' | 'card'

function resolveParent(
    world: PhysicsWorld,
    p: ParentRef,
): { handle: PhysicsHandle | null; kind: ParentKind } {
    if (p === 'ceiling') return { handle: world.ceilingHandle, kind: 'ceiling' }
    if (p === 'floor') return { handle: world.floorHandle, kind: 'floor' }
    if (p == null) return { handle: null, kind: 'card' }
    const h = world.getHandleById(p)
    return { handle: h ?? null, kind: 'card' }
}
