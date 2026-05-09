import { useEffect, useRef } from 'react'
import { usePhysicsWorld } from './PhysicsContext'
import { registry as pretextRegistry } from '../text/registry'
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

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const measured = pretextRegistry.measure(text, fontKey, maxWidth)
    const w = measured.width + CARD_PADDING_PX * 2
    const h = measured.height + CARD_PADDING_PX * 2

    el.style.width = `${w}px`
    el.style.height = `${h}px`
    el.style.transform = `translate(${anchor.x - w / 2}px, ${anchor.y - h / 2}px)`

    const handle = world.register(
      anchor,
      { width: w, height: h },
      {
        onTransform: ({ x, y, rotation }) => {
          el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${rotation}rad)`
        },
      },
    )

    let dragging = false
    let lastX = 0
    let lastY = 0
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault()
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture(e.pointerId)
      el.style.cursor = 'grabbing'
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      const cur = world.getPosition(handle)
      world.setPosition(handle, { x: cur.x + dx, y: cur.y + dy })
      lastX = e.clientX
      lastY = e.clientY
    }
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return
      dragging = false
      el.releasePointerCapture(e.pointerId)
      el.style.cursor = 'grab'
    }

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      world.unregister(handle)
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [world, text, fontKey, maxWidth, anchor.x, anchor.y])

  return (
    <article ref={elRef} className="physics-card">
      {text}
    </article>
  )
}
