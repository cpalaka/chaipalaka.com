import { useEffect, useRef } from 'react'
import { usePhysicsWorld } from './PhysicsContext'
import { registry as pretextRegistry } from '../text/registry'
import type { PhysicsHandle } from './PhysicsWorld'
import './PhysicsCard.css'

export interface PhysicsCardProps {
  text: string
  fontKey: string
  maxWidth: number
  anchor: { x: number; y: number }
}

const CARD_PADDING_PX = 24

export function PhysicsCard({ text, fontKey, maxWidth, anchor }: PhysicsCardProps) {
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
    const measured = pretextRegistry.measure(text, fontKey, maxWidth)
    const w = measured.width + CARD_PADDING_PX * 2
    const h = measured.height + CARD_PADDING_PX * 2

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

    let dragging = false
    let lastX = 0
    let lastY = 0
    let lastT = 0
    let velX = 0
    let velY = 0
    const FLING_VELOCITY_SCALE = 16
    const FLING_PAUSE_MS = 50

    const onPointerDown = (e: PointerEvent) => {
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

  return (
    <article ref={elRef} className="physics-card">
      {text}
    </article>
  )
}
