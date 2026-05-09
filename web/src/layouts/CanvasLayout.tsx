import { Outlet } from 'react-router-dom'
import { CANVAS_ONLY_BUNDLE_MARKER } from '../lib/canvas-only-marker'

export default function CanvasLayout() {
  return (
    <div data-layout="canvas" data-canvas-marker={CANVAS_ONLY_BUNDLE_MARKER}>
      <Outlet />
    </div>
  )
}
