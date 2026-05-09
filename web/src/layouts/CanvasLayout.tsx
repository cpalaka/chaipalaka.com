import { Outlet } from 'react-router-dom'
import { BackgroundCanvas } from '../canvas/BackgroundCanvas'
import { CANVAS_ONLY_BUNDLE_MARKER } from '../lib/canvas-only-marker'
import { PhysicsProvider } from '../physics/PhysicsContext'

export default function CanvasLayout() {
  return (
    <PhysicsProvider>
      <div data-layout="canvas" data-canvas-marker={CANVAS_ONLY_BUNDLE_MARKER}>
        <BackgroundCanvas />
        <Outlet />
      </div>
    </PhysicsProvider>
  )
}
