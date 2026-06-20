import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { BackgroundCanvas } from '../canvas/BackgroundCanvas'
import { CANVAS_ONLY_BUNDLE_MARKER } from '../lib/canvas-only-marker'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { FrameBar } from '../canvas/FrameBar'
import { StringLayer } from '../canvas/StringLayer'
import { useFrameEdge } from '../canvas/useFrameEdge'
import { CardLayer } from '../card/CardLayer'
import { CardRegistryProvider } from '../card/CardRegistry'
import { RouteAnnouncer } from '../nav/RouteAnnouncer'
import { AtelierGate } from '../atelier/AtelierGate'
import { useController } from '../state/useController'
import { getRedropKey } from './redropKey'
import './CanvasLayout.css'

export default function CanvasLayout() {
    const { edge } = useFrameEdge()
    // Remounts the card layer when the Atelier replays a drop — see
    // redropKey.ts. Stays 0 in prod.
    const redropKey = useController(getRedropKey)

    useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('chaipalaka.controls.position')
        }
    }, [])

    return (
        <PhysicsProvider>
            <CardRegistryProvider>
                <div
                    data-layout="canvas"
                    data-canvas-marker={CANVAS_ONLY_BUNDLE_MARKER}
                    data-frame-edge={edge}
                >
                    <BackgroundCanvas />
                    <CardLayer key={redropKey} />
                    <StringLayer />
                    <FrameBar />
                    <Outlet />
                    <AtelierGate />
                    <RouteAnnouncer />
                </div>
            </CardRegistryProvider>
        </PhysicsProvider>
    )
}
