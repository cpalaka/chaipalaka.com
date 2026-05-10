import { useEffect, useRef } from 'react'
import { usePhysicsWorld } from './PhysicsContext'
import { registry as pretextRegistry } from '../text/registry'
import type { PhysicsHandle } from './PhysicsWorld'
import './PhysicsCard.css'

export type CardInteractionMode = 'anchored' | 'locked' | 'free'

export interface PhysicsCardProps {
    text: string
    fontKey: string
    maxWidth: number
    anchor: { x: number; y: number }
    children?: React.ReactNode
    header?: React.ReactNode
    width?: number
    height?: number
    variant?: string
    className?: string
    style?: React.CSSProperties
    physicsHandleRef?: React.MutableRefObject<PhysicsHandle | null>
    interactionMode?: CardInteractionMode
}

const CARD_PADDING_PX = 24

export function PhysicsCard({
    text,
    fontKey,
    maxWidth,
    anchor,
    children,
    header,
    width: explicitW,
    height: explicitH,
    variant,
    className,
    style,
    physicsHandleRef,
    interactionMode = 'free',
}: PhysicsCardProps) {
    const world = usePhysicsWorld()
    const elRef = useRef<HTMLElement | null>(null)
    const handleRef = useRef<PhysicsHandle | null>(null)
    // Keep a ref to the current anchor so the registration effect can read the
    // latest value without taking it as a dependency (avoids re-registering on
    // every resize tick while the spring update is handled separately).
    const anchorRef = useRef(anchor)
    anchorRef.current = anchor

    // Registration: only re-runs when text content or font changes.
    useEffect(() => {
        const el = elRef.current
        if (!el) return

        const { x, y } = anchorRef.current
        let w: number
        let h: number
        if (explicitW !== undefined && explicitH !== undefined) {
            w = explicitW
            h = explicitH
        } else {
            const measured = pretextRegistry.measure(text, fontKey, maxWidth)
            w = measured.width + CARD_PADDING_PX * 2
            h = measured.height + CARD_PADDING_PX * 2
        }

        el.style.width = `${w}px`
        el.style.height = `${h}px`
        el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px)`

        const handle = world.register(
            { x, y },
            { width: w, height: h },
            {
                onTransform: ({ x: px, y: py, rotation }) => {
                    el.style.transform = `translate(${px - w / 2}px, ${py - h / 2}px) rotate(${rotation}rad)`
                },
            },
        )
        handleRef.current = handle
        if (physicsHandleRef) physicsHandleRef.current = handle

        let dragging = false
        let lastX = 0
        let lastY = 0
        let lastT = 0
        let velX = 0
        let velY = 0
        const FLING_VELOCITY_SCALE = 16
        const FLING_PAUSE_MS = 50

        const onPointerDown = (e: PointerEvent) => {
            if (interactionMode !== 'free') return
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
            world.unregister(handle)
            handleRef.current = null
            if (physicsHandleRef) physicsHandleRef.current = null
            el.removeEventListener('pointerdown', onPointerDown)
            window.removeEventListener('pointermove', onPointerMove)
            window.removeEventListener('pointerup', onPointerUp)
        }
    }, [world, text, fontKey, maxWidth])

    // Anchor update: moves the spring target when the grid re-flows (e.g. resize).
    useEffect(() => {
        if (handleRef.current === null) return
        world.setAnchor(handleRef.current, anchor)
    }, [world, anchor.x, anchor.y])

    // Interaction mode change: update physics state when mode prop changes.
    useEffect(() => {
        if (handleRef.current === null) return
        world.setSensor(handleRef.current, interactionMode === 'locked')
        world.setMode(handleRef.current, interactionMode === 'free' ? 'playground' : 'breathing')
    }, [world, interactionMode])

    const cls = ['physics-card', className].filter(Boolean).join(' ')

    return (
        <article
            ref={elRef}
            className={cls}
            data-variant={variant}
            data-interaction-mode={interactionMode}
            style={style}
        >
            {header != null && (
                <div data-card-header>{header}</div>
            )}
            {children ?? text}
        </article>
    )
}
