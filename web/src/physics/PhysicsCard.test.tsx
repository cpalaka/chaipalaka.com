import { describe, test, expect, afterEach } from 'vitest'
import { act, render, cleanup } from '@testing-library/react'
import { PhysicsProvider, usePhysicsWorld } from './PhysicsContext'
import { PhysicsCard } from './PhysicsCard'
import { CardRegistryProvider } from '../transitions/CardRegistry'
import { PhysicsLayer } from '../transitions/PhysicsLayer'
import type { PhysicsWorld } from './PhysicsWorld'

afterEach(() => {
    cleanup()
})

function fireRealPointerDown(el: Element) {
    const ev = new Event('pointerdown', {
        bubbles: true,
        cancelable: true,
    }) as Event & { clientX: number; clientY: number; pointerId: number }
    ev.clientX = 50
    ev.clientY = 50
    ev.pointerId = 1
    el.dispatchEvent(ev)
}

function renderWith(children: React.ReactNode) {
    return render(
        <PhysicsProvider>
            <CardRegistryProvider>
                <PhysicsLayer />
                {children}
            </CardRegistryProvider>
        </PhysicsProvider>,
    )
}

describe('PhysicsCard — draggable prop', () => {
    test('default (draggable=true) sets cursor to grabbing on pointerdown', () => {
        const { container } = renderWith(
            <PhysicsCard
                id="default-drag"
                text="default"
                width={120}
                height={80}
                anchor={{ x: 100, y: 100 }}
            />,
        )
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        expect(article).toBeTruthy()
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        expect(article.style.cursor).toBe('grabbing')
    })

    test('trail prop wires a second tether (e.g. ceiling-strung card also tethered to floor)', async () => {
        let captured: PhysicsWorld | null = null
        function Probe() {
            captured = usePhysicsWorld()
            return null
        }
        await act(async () => {
            render(
                <PhysicsProvider>
                    <CardRegistryProvider>
                        <PhysicsLayer />
                        <Probe />
                        <PhysicsCard
                            id="dual-tether"
                            text="dual"
                            width={120}
                            height={80}
                            anchor={{ x: 200, y: 200 }}
                            parent="ceiling"
                            trail="floor"
                        />
                    </CardRegistryProvider>
                </PhysicsProvider>,
            )
            // Give the registry/PhysicsLayer pipeline a frame to wire tethers.
            await new Promise((r) => requestAnimationFrame(() => r(null)))
        })
        const world = captured! as PhysicsWorld
        const records = world.tether.records()
        // One tether to ceiling, one to floor — both share the same child
        // body but use different parents.
        expect(records).toHaveLength(2)
        const parents = records.map((r) => r.parent).sort()
        expect(parents).toEqual([world.ceilingHandle, world.floorHandle].sort())
    })

    test('draggable={false} does NOT set cursor to grabbing on pointerdown', () => {
        const { container } = renderWith(
            <PhysicsCard
                id="no-drag"
                text="frozen"
                width={120}
                height={80}
                anchor={{ x: 100, y: 100 }}
                draggable={false}
            />,
        )
        const article = container.querySelector(
            'article.physics-card',
        ) as HTMLElement
        expect(article).toBeTruthy()
        article.setPointerCapture = () => {}
        fireRealPointerDown(article)
        expect(article.style.cursor).not.toBe('grabbing')
    })
})
