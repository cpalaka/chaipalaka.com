import { describe, test, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PhysicsProvider } from './PhysicsContext'
import { PhysicsCard } from './PhysicsCard'

afterEach(() => {
    cleanup()
})

function fireRealPointerDown(el: Element) {
    const ev = new Event('pointerdown', { bubbles: true, cancelable: true }) as Event &
        { clientX: number; clientY: number; pointerId: number }
    ev.clientX = 50
    ev.clientY = 50
    ev.pointerId = 1
    el.dispatchEvent(ev)
}

describe('PhysicsCard — draggable prop', () => {
    test('default (draggable=true) sets cursor to grabbing on pointerdown', () => {
        const { container } = render(
            <PhysicsProvider>
                <PhysicsCard
                    id="default-drag"
                    text="default"
                    width={120}
                    height={80}
                    anchor={{ x: 100, y: 100 }}
                />
            </PhysicsProvider>,
        )
        const article = container.querySelector('article.physics-card') as HTMLElement
        expect(article).toBeTruthy()
        // happy-dom may not implement setPointerCapture; stub it
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        expect(article.style.cursor).toBe('grabbing')
    })

    test('draggable={false} does NOT set cursor to grabbing on pointerdown', () => {
        const { container } = render(
            <PhysicsProvider>
                <PhysicsCard
                    id="no-drag"
                    text="frozen"
                    width={120}
                    height={80}
                    anchor={{ x: 100, y: 100 }}
                    draggable={false}
                />
            </PhysicsProvider>,
        )
        const article = container.querySelector('article.physics-card') as HTMLElement
        expect(article).toBeTruthy()
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        expect(article.style.cursor).not.toBe('grabbing')
    })
})
