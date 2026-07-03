import { describe, test, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { Card } from '../card/Card'
import { CardRegistryProvider } from '../card/CardRegistry'
import { StringLayer, stringPathD, tensionStyleValue } from './StringLayer'
import type { TetherView } from '../physics/Tether'

const view = (over: Partial<TetherView> = {}): TetherView => ({
    parentPos: { x: 0, y: 0 },
    childPos: { x: 0, y: 50 },
    length: 100,
    slack: true,
    tension: 0,
    ...over,
})

describe('StringLayer', () => {
    // Regression for: opening /sandbox/strings crashed with "Maximum update depth exceeded"
    // because getSnapshot returned a fresh array each call. The fix uses getTetherList(),
    // which returns a stable reference until the tether set changes.
    test('mounts under PhysicsProvider without triggering an infinite render loop', () => {
        expect(() =>
            render(
                <PhysicsProvider>
                    <CardRegistryProvider>
                        <StringLayer />
                        <Card
                            id="parent"
                            text="P"
                            width={80}
                            height={40}
                            anchor={{ x: 100, y: 100 }}
                            parent="ceiling"
                            buoyancy="heavy"
                        />
                        <Card
                            text="C"
                            width={80}
                            height={40}
                            anchor={{ x: 100, y: 200 }}
                            parent="parent"
                            buoyancy="heavy"
                        />
                    </CardRegistryProvider>
                </PhysicsProvider>,
            ),
        ).not.toThrow()
        cleanup()
    })
})

describe('stringPathD — mode-gated straight vs dormant-gravity sag', () => {
    test('drift mode draws a straight line even when the rope is slack', () => {
        const d = stringPathD(view({ slack: true }), 'drift', 0, 1)
        expect(d).toContain('L')
        expect(d).not.toContain('C')
        expect(d).toBe('M 0,0 L 0,50')
    })

    test('gravity mode + slack draws a cubic bezier sagging along gravity', () => {
        // Dormant-mode coverage: this branch is unreachable through PhysicsProvider
        // (which forces drift), so only a direct-call test exercises it.
        const d = stringPathD(view({ slack: true }), 'gravity', 0, 1)
        expect(d).toContain('C')
        // sag = (100 - 50) * 0.5 = 25; downward gravity (gy=1) pushes control-point
        // y below the straight-line interpolant (50/3 ≈ 16.67 → 41.67).
        const firstCtrlY = Number(d.split('C ')[1]!.split(',')[1]!.split(' ')[0])
        expect(firstCtrlY).toBeCloseTo(50 / 3 + 25, 3)
    })

    test('gravity mode + taut draws a straight line (no sag)', () => {
        const d = stringPathD(view({ slack: false }), 'gravity', 0, 1)
        expect(d).not.toContain('C')
        expect(d).toContain('L')
    })

    test('drift mode + taut draws a straight line', () => {
        const d = stringPathD(view({ slack: false }), 'drift', 0, 1)
        expect(d).not.toContain('C')
    })
})

describe('tensionStyleValue — drift clamps tension to [0,1]; gravity is dormant', () => {
    test('rest/slack tension 0 maps to 0 (thin, dim baseline)', () => {
        expect(tensionStyleValue(0, 'drift')).toBe(0)
    })

    test('mid tension passes through and is monotonic under drift', () => {
        expect(tensionStyleValue(0.5, 'drift')).toBeCloseTo(0.5, 5)
        expect(tensionStyleValue(0.5, 'drift')).toBeGreaterThan(
            tensionStyleValue(0.25, 'drift'),
        )
    })

    test('unbounded high tension clamps to 1 under drift', () => {
        expect(tensionStyleValue(5, 'drift')).toBe(1)
    })

    test('dormant gravity mode ignores tension → 0 (keeps the v1 constant 1px/0.4 look)', () => {
        expect(tensionStyleValue(5, 'gravity')).toBe(0)
        expect(tensionStyleValue(0.5, 'gravity')).toBe(0)
    })
})
