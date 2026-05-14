import { describe, test, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { Card } from '../card/Card'
import { StringLayer } from './StringLayer'

describe('StringLayer', () => {
    // Regression for: opening /sandbox/strings crashed with "Maximum update depth exceeded"
    // because getSnapshot returned a fresh array each call. The fix uses getTetherList(),
    // which returns a stable reference until the tether set changes.
    test('mounts under PhysicsProvider without triggering an infinite render loop', () => {
        expect(() =>
            render(
                <PhysicsProvider>
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
                </PhysicsProvider>,
            ),
        ).not.toThrow()
        cleanup()
    })
})
