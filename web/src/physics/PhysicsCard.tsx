import { useEffect, useRef } from 'react'
import { usePhysicsWorld } from './PhysicsContext'
import { useIsMinimized, useMinimizedRegistry } from '../canvas/useMinimizedRegistry'
import { flipMorph } from '../canvas/flip'
import type { PhysicsHandle, TetherHandle } from './PhysicsWorld'
import type { Buoyancy, ParentRef } from './PageDef'
import './PhysicsCard.css'

export interface PhysicsCardProps {
    text: string
    width: number
    height: number
    anchor: { x: number; y: number }
    children?: React.ReactNode
    header?: React.ReactNode
    variant?: string
    className?: string
    style?: React.CSSProperties
    physicsHandleRef?: React.MutableRefObject<PhysicsHandle | null>
    cardRef?: React.MutableRefObject<HTMLElement | null>
    minimizable?: boolean
    id?: string
    label?: string
    kind?: string
    parent?: ParentRef
    buoyancy?: Buoyancy
}

export function PhysicsCard({
    text,
    width,
    height,
    anchor,
    children,
    header,
    variant,
    className,
    style,
    physicsHandleRef,
    cardRef,
    minimizable = false,
    id,
    label,
    kind = 'card',
    parent,
    buoyancy,
}: PhysicsCardProps) {
    const world = usePhysicsWorld()
    const elRef = useRef<HTMLElement | null>(null)
    const handleRef = useRef<PhysicsHandle | null>(null)
    const anchorRef = useRef(anchor)
    anchorRef.current = anchor
    const tetherHandleRef = useRef<TetherHandle | null>(null)

    const registry = useMinimizedRegistry()
    const isMinimized = useIsMinimized(minimizable ? id : undefined)

    useEffect(() => {
        if (isMinimized) return
        const el = elRef.current
        if (!el) return

        const { x, y } = anchorRef.current
        const w = width
        const h = height

        // Spawn 20px in gravity direction so the card visibly settles to anchor on load.
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

        const handle = id
            ? world.registerById(id, { x: sx, y: sy }, { width: w, height: h }, {
                onTransform: ({ x: px, y: py, rotation }) => {
                    el.style.transform = `translate(${px - w / 2}px, ${py - h / 2}px) rotate(${rotation}rad)`
                },
            })
            : world.register(
                { x: sx, y: sy },
                { width: w, height: h },
                {
                    onTransform: ({ x: px, y: py, rotation }) => {
                        el.style.transform = `translate(${px - w / 2}px, ${py - h / 2}px) rotate(${rotation}rad)`
                    },
                },
            )
        handleRef.current = handle
        if (physicsHandleRef) physicsHandleRef.current = handle

        if (buoyancy) world.setBuoyancy(handle, buoyancy)

        // Wire tether if parent declared
        let rafId = 0
        const wireTether = (parentHandle: number) => {
            const parentPos = world.getPosition(parentHandle)
            const ca = anchorRef.current
            const length = Math.hypot(ca.x - parentPos.x, ca.y - parentPos.y)
            tetherHandleRef.current = world.tether(parentHandle, handle, length)
        }
        if (parent) {
            const parentHandle =
                parent === 'ceiling' ? world.ceilingHandle
                : parent === 'floor' ? world.floorHandle
                : world.getHandleById(parent)
            if (parentHandle != null) {
                wireTether(parentHandle)
            } else {
                rafId = requestAnimationFrame(() => {
                    const ph = world.getHandleById(parent)
                    if (ph == null) {
                        console.warn(`PhysicsCard: parent "${parent}" not found after one frame; tether skipped`)
                        return
                    }
                    wireTether(ph)
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
            if ((e.target as Element | null)?.closest('[data-card-header], a, button')) return
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

        el.addEventListener('pointerdown', onPointerDown)
        window.addEventListener('pointermove', onPointerMove)
        window.addEventListener('pointerup', onPointerUp)

        return () => {
            cancelAnimationFrame(rafId)
            if (tetherHandleRef.current !== null) {
                world.untether(tetherHandleRef.current)
                tetherHandleRef.current = null
            }
            world.unregister(handle)
            handleRef.current = null
            if (physicsHandleRef) physicsHandleRef.current = null
            el.removeEventListener('pointerdown', onPointerDown)
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
        }
    }, [world, width, height, isMinimized])

    useEffect(() => {
        if (handleRef.current === null) return
        world.setAnchor(handleRef.current, anchor)
    }, [world, anchor.x, anchor.y])

    useEffect(() => {
        if (isMinimized || !id || !minimizable) return
        const el = elRef.current
        if (!el) return
        const fromChipRect = registry.consumeRestoreRect(id)
        if (!fromChipRect) return
        const endTransform = el.style.transform
        requestAnimationFrame(() => {
            flipMorph(fromChipRect, el, { opacityFrom: 0.5, endTransform })
        })
    }, [isMinimized, id, minimizable, registry])

    if (isMinimized) return null

    function handleMinimize() {
        const el = elRef.current
        if (!el || !id) return
        const fromRect = el.getBoundingClientRect()
        registry.minimize(id, { label: label ?? text, kind, fromRect })
    }

    const showHeader = header != null || minimizable
    const cls = ['physics-card', className].filter(Boolean).join(' ')

    return (
        <article
            ref={(el) => {
                elRef.current = el
                if (cardRef) cardRef.current = el
            }}
            className={cls}
            data-variant={variant}
            style={style}
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
