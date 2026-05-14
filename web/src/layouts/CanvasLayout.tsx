import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { BackgroundCanvas } from '../canvas/BackgroundCanvas'
import { CANVAS_ONLY_BUNDLE_MARKER } from '../lib/canvas-only-marker'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { FrameBar } from '../canvas/FrameBar'
import { StringLayer } from '../canvas/StringLayer'
import { useFrameEdge } from '../canvas/useFrameEdge'
import { TransitionDirector } from '../transitions/TransitionDirector'
import { PhysicsLayer } from '../transitions/PhysicsLayer'
import { PageDefRegistryProvider } from '../transitions/PageDefRegistry'
import { pageDefs } from '../routes/pageDefs'
import { edges } from '../transitions/edges'
import './CanvasLayout.css'

export default function CanvasLayout() {
    const { edge } = useFrameEdge()

    useEffect(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('chaipalaka.controls.position')
        }
    }, [])

    return (
        <PhysicsProvider>
            <PageDefRegistryProvider>
                <TransitionDirector pageDefs={pageDefs} edges={edges}>
                    <div
                        data-layout="canvas"
                        data-canvas-marker={CANVAS_ONLY_BUNDLE_MARKER}
                        data-frame-edge={edge}
                    >
                        <BackgroundCanvas />
                        <PhysicsLayer />
                        <StringLayer />
                        <FrameBar />
                        <Outlet />
                    </div>
                </TransitionDirector>
            </PageDefRegistryProvider>
        </PhysicsProvider>
    )
}
