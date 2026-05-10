import { Outlet } from 'react-router-dom'
import { BackgroundCanvas } from '../canvas/BackgroundCanvas'
import { CANVAS_ONLY_BUNDLE_MARKER } from '../lib/canvas-only-marker'
import { PhysicsProvider } from '../physics/PhysicsContext'
import { ControlsPanel } from '../controls/ControlsPanel'
import { FrameBar } from '../canvas/FrameBar'
import { useFrameEdge } from '../canvas/useFrameEdge'
import './CanvasLayout.css'

export default function CanvasLayout() {
    const { edge } = useFrameEdge()
    return (
        <PhysicsProvider>
            <div
                data-layout="canvas"
                data-canvas-marker={CANVAS_ONLY_BUNDLE_MARKER}
                data-frame-edge={edge}
            >
                <BackgroundCanvas />
                <ControlsPanel />
                <FrameBar />
                <Outlet />
            </div>
        </PhysicsProvider>
    )
}
