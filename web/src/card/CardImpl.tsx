import { useEffect, useRef } from 'react'
import { usePhysicsWorld } from '../physics/PhysicsContext'
import { physicsTuning } from '../physics/physicsTuning'
import { resolveParent, wireTetherFor } from '../physics/Tether'
import type { PhysicsHandle } from '../physics/PhysicsWorld'
import type { TetherHandle } from '../physics/Tether'
import type { CardEntry } from './CardRegistry'
import { computeFlingImpulse } from './flingImpulse'
import { computeSpawnOffset } from './spawnOffset'
import './Card.css'

interface CardImplProps {
    entry: CardEntry
}

export function CardImpl({ entry }: CardImplProps) {
    const {
        id,
        parent,
        trail,
        buoyancy,
        anchor,
        spawnOffset,
        content: {
            text,
            width,
            height,
            children,
            header,
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
    const trailTetherHandleRef = useRef<TetherHandle | null>(null)
    // The anchor-change effect below is meant to react to *post-mount*
    // anchor moves (e.g. viewport resize re-layouts). On initial mount its
    // deps trip from undefined → initial value, so without this guard it
    // teleports the body to the anchor and zeroes velocity — wiping out
    // any spawn offset the body just registered with.
    const anchorEffectMountedRef = useRef(false)

    useEffect(() => {
        const el = elRef.current
        if (!el) return

        const w = width
        const h = height

        const { x: gx, y: gy } = computeSpawnOffset(
            anchorRef.current,
            world.getGravityVector(),
            physicsTuning.spawnOffsetPx,
        )
        const sx = gx + (spawnOffset?.x ?? 0)
        const sy = gy + (spawnOffset?.y ?? 0)

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
        let trailRafId = 0
        if (parent) {
            const resolved = resolveParent(world, parent)
            if (resolved !== null) {
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
                    if (retried === null) {
                        console.warn(
                            `Card: parent "${parent}" not found after one frame; tether skipped`,
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
        if (trail) {
            const resolved = resolveParent(world, trail)
            if (resolved !== null) {
                trailTetherHandleRef.current = wireTetherFor(
                    world,
                    resolved.handle,
                    resolved.kind,
                    handle,
                    anchorRef.current,
                )
            } else {
                trailRafId = requestAnimationFrame(() => {
                    const retried = resolveParent(world, trail)
                    if (retried === null) {
                        console.warn(
                            `Card: trail "${trail}" not found after one frame; tether skipped`,
                        )
                        return
                    }
                    trailTetherHandleRef.current = wireTetherFor(
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
        let lastDx = 0
        let lastDy = 0
        let lastDt = 0

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
            lastDx = 0
            lastDy = 0
            lastDt = 0
            world.setDragging(handle, true)
            el.setPointerCapture(e.pointerId)
            el.style.cursor = 'grabbing'
        }
        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return
            const dx = e.clientX - lastX
            const dy = e.clientY - lastY
            lastDx = dx
            lastDy = dy
            lastDt = e.timeStamp - lastT
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
            // Read-at-use per fling event, not captured at mount.
            const impulse = computeFlingImpulse(
                { dx: lastDx, dy: lastDy, dtMs: lastDt },
                e.timeStamp - lastT,
                {
                    scale: physicsTuning.flingVelocityScale,
                    pauseMs: physicsTuning.flingPauseMs,
                },
            )
            world.setVelocity(handle, { x: impulse.vx, y: impulse.vy })
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
            cancelAnimationFrame(trailRafId)
            if (tetherHandleRef.current !== null) {
                world.tether.remove(tetherHandleRef.current)
                tetherHandleRef.current = null
            }
            if (trailTetherHandleRef.current !== null) {
                world.tether.remove(trailTetherHandleRef.current)
                trailTetherHandleRef.current = null
            }
            world.unregister(handle)
            handleRef.current = null
            if (draggable) {
                el.removeEventListener('pointerdown', onPointerDown)
                window.removeEventListener('pointermove', onPointerMove)
                window.removeEventListener('pointerup', onPointerUp)
            }
        }
    }, [world, id, width, height, draggable, parent, trail, buoyancy])

    useEffect(() => {
        if (handleRef.current === null) return
        if (!anchorEffectMountedRef.current) {
            anchorEffectMountedRef.current = true
            return
        }
        world.setAnchor(handleRef.current, anchor)
        if (tetherHandleRef.current !== null && parent) {
            world.tether.remove(tetherHandleRef.current)
            tetherHandleRef.current = null
            const resolved = resolveParent(world, parent)
            if (resolved !== null) {
                tetherHandleRef.current = wireTetherFor(
                    world,
                    resolved.handle,
                    resolved.kind,
                    handleRef.current,
                    anchor,
                )
            }
        }
        if (trailTetherHandleRef.current !== null && trail) {
            world.tether.remove(trailTetherHandleRef.current)
            trailTetherHandleRef.current = null
            const resolved = resolveParent(world, trail)
            if (resolved !== null) {
                trailTetherHandleRef.current = wireTetherFor(
                    world,
                    resolved.handle,
                    resolved.kind,
                    handleRef.current,
                    anchor,
                )
            }
        }
    }, [world, anchor.x, anchor.y, parent, trail])

    const showHeader = header != null
    const cls = ['physics-card', className].filter(Boolean).join(' ')

    return (
        <article
            ref={(el) => {
                elRef.current = el
            }}
            className={cls}
            data-variant={variant}
            data-card-id={id}
            style={
                entry.state === 'spawning'
                    ? { ...style, visibility: 'hidden' }
                    : style
            }
        >
            {showHeader ? <div data-card-header>{header}</div> : null}
            {children ?? text}
        </article>
    )
}
