import { useState, useEffect } from 'react'
import { PhysicsProvider } from '../../physics/PhysicsContext'
import { PhysicsCard } from '../../physics/PhysicsCard'
import { StringLayer } from '../../canvas/StringLayer'

function computeLayout(w: number, h: number) {
    return {
        heavyCeiling:    { x: Math.round(w * 0.15), y: Math.round(h * 0.35) },
        balloonFloor1:   { x: Math.round(w * 0.35), y: Math.round(h * 0.60) },
        balloonFloor2:   { x: Math.round(w * 0.50), y: Math.round(h * 0.60) },
        parentMixed:     { x: Math.round(w * 0.75), y: Math.round(h * 0.30) },
        childHeavy:      { x: Math.round(w * 0.75), y: Math.round(h * 0.55) },
        childBalloon:    { x: Math.round(w * 0.75), y: Math.round(h * 0.15) },
        childHeavy2:     { x: Math.round(w * 0.75), y: Math.round(h * 0.70) },
        detached:        { x: Math.round(w * 0.35), y: Math.round(h * 0.20) },
    }
}

const CARD_W = 120
const CARD_H = 50

export default function Strings() {
    const [layout, setLayout] = useState(() =>
        typeof window !== 'undefined'
            ? computeLayout(window.innerWidth, window.innerHeight)
            : computeLayout(1280, 800),
    )

    useEffect(() => {
        const onResize = () =>
            setLayout(computeLayout(window.innerWidth, window.innerHeight))
        window.addEventListener('resize', onResize, { passive: true })
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <PhysicsProvider>
                <StringLayer />

                {/* Scenario 1: heavy card hanging from ceiling */}
                <PhysicsCard
                    id="heavy-ceiling"
                    text="Ceiling hang"
                    width={CARD_W}
                    height={CARD_H}
                    anchor={layout.heavyCeiling}
                    parent="ceiling"
                    buoyancy="heavy"
                    label="Ceiling hang"
                />

                {/* Scenario 2a: balloon tethered to floor */}
                <PhysicsCard
                    id="balloon-floor-1"
                    text="Balloon 1"
                    width={CARD_W}
                    height={CARD_H}
                    anchor={layout.balloonFloor1}
                    parent="floor"
                    buoyancy="balloon"
                />

                {/* Scenario 2b: balloon tethered to floor */}
                <PhysicsCard
                    id="balloon-floor-2"
                    text="Balloon 2"
                    width={CARD_W}
                    height={CARD_H}
                    anchor={layout.balloonFloor2}
                    parent="floor"
                    buoyancy="balloon"
                />

                {/* Scenario 3: parent with 3 mixed children */}
                <PhysicsCard
                    id="parent-mixed"
                    text="Parent"
                    width={CARD_W}
                    height={CARD_H}
                    anchor={layout.parentMixed}
                    parent="ceiling"
                    buoyancy="heavy"
                    label="Parent (mixed)"
                />
                <PhysicsCard
                    id="child-heavy"
                    text="Child heavy"
                    width={CARD_W}
                    height={CARD_H}
                    anchor={layout.childHeavy}
                    parent="parent-mixed"
                    buoyancy="heavy"
                />
                <PhysicsCard
                    id="child-balloon"
                    text="Child balloon"
                    width={CARD_W}
                    height={CARD_H}
                    anchor={layout.childBalloon}
                    parent="parent-mixed"
                    buoyancy="balloon"
                />
                <PhysicsCard
                    id="child-heavy-2"
                    text="Child heavy 2"
                    width={CARD_W}
                    height={CARD_H}
                    anchor={layout.childHeavy2}
                    parent="parent-mixed"
                    buoyancy="heavy"
                />

                {/* Scenario 4: detached heavy — falls to floor */}
                <PhysicsCard
                    id="detached"
                    text="Detached"
                    width={CARD_W}
                    height={CARD_H}
                    anchor={layout.detached}
                />
            </PhysicsProvider>
        </div>
    )
}
