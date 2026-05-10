import { useRef, type MutableRefObject } from 'react'
import { usePhysicsWorld } from '../../physics/PhysicsContext'
import type { PhysicsHandle } from '../../physics/PhysicsWorld'
import type { ResizeMode } from './state'

const SNAP_GRID = 8
const MIN_SIZE = 80

interface ResizeHandlesProps {
    physicsHandleRef: MutableRefObject<PhysicsHandle | null>
    width: number
    height: number
    anchor: { x: number; y: number }
    resizeMode: ResizeMode
    snapToGrid: boolean
    springDuringResize: boolean
    onResizeCommit: (newSize: { width: number; height: number }, newAnchor: { x: number; y: number }) => void
}

type HandleDir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const CORNER_DIRS: HandleDir[] = ['nw', 'ne', 'sw', 'se']
const ALL_DIRS: HandleDir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

export function ResizeHandles({
    physicsHandleRef,
    width,
    height,
    anchor,
    resizeMode,
    snapToGrid,
    springDuringResize,
    onResizeCommit,
}: ResizeHandlesProps) {
    const world = usePhysicsWorld()
    const dragState = useRef<{
        dir: HandleDir
        startX: number
        startY: number
        startW: number
        startH: number
        startAnchor: { x: number; y: number }
    } | null>(null)

    const dirs = resizeMode === '4-corner' ? CORNER_DIRS : ALL_DIRS

    function snap(v: number): number {
        return snapToGrid ? Math.round(v / SNAP_GRID) * SNAP_GRID : v
    }

    function onPointerDown(dir: HandleDir, e: React.PointerEvent) {
        e.stopPropagation()
        e.preventDefault()
        dragState.current = {
            dir,
            startX: e.clientX,
            startY: e.clientY,
            startW: width,
            startH: height,
            startAnchor: { ...anchor },
        }
        ;(e.target as Element).setPointerCapture(e.pointerId)
    }

    function onPointerMove(e: React.PointerEvent) {
        const ds = dragState.current
        if (!ds) return
        const handle = physicsHandleRef.current
        if (!handle) return

        const dx = e.clientX - ds.startX
        const dy = e.clientY - ds.startY
        const { dir, startW, startH, startAnchor } = ds

        let newW = startW
        let newH = startH
        let newAX = startAnchor.x
        let newAY = startAnchor.y

        // Horizontal
        if (dir.includes('e')) {
            newW = Math.max(MIN_SIZE, snap(startW + dx))
            newAX = startAnchor.x - startW / 2 + newW / 2
        } else if (dir.includes('w')) {
            newW = Math.max(MIN_SIZE, snap(startW - dx))
            newAX = startAnchor.x + startW / 2 - newW / 2
        }
        // Vertical
        if (dir.includes('s')) {
            newH = Math.max(MIN_SIZE, snap(startH + dy))
            newAY = startAnchor.y - startH / 2 + newH / 2
        } else if (dir.includes('n')) {
            newH = Math.max(MIN_SIZE, snap(startH - dy))
            newAY = startAnchor.y + startH / 2 - newH / 2
        }

        if (springDuringResize) {
            world.setAnchor(handle, { x: newAX, y: newAY })
        } else {
            world.setSize(handle, { width: newW, height: newH })
            world.setPosition(handle, { x: newAX, y: newAY })
            world.setAnchor(handle, { x: newAX, y: newAY })
        }
    }

    function onPointerUp(e: React.PointerEvent) {
        const ds = dragState.current
        if (!ds) return
        const handle = physicsHandleRef.current
        dragState.current = null

        if (!handle) return

        const dx = e.clientX - ds.startX
        const dy = e.clientY - ds.startY
        const { dir, startW, startH, startAnchor } = ds

        let newW = startW
        let newH = startH
        let newAX = startAnchor.x
        let newAY = startAnchor.y

        if (dir.includes('e')) {
            newW = Math.max(MIN_SIZE, snap(startW + dx))
            newAX = startAnchor.x - startW / 2 + newW / 2
        } else if (dir.includes('w')) {
            newW = Math.max(MIN_SIZE, snap(startW - dx))
            newAX = startAnchor.x + startW / 2 - newW / 2
        }
        if (dir.includes('s')) {
            newH = Math.max(MIN_SIZE, snap(startH + dy))
            newAY = startAnchor.y - startH / 2 + newH / 2
        } else if (dir.includes('n')) {
            newH = Math.max(MIN_SIZE, snap(startH - dy))
            newAY = startAnchor.y + startH / 2 - newH / 2
        }

        world.setSize(handle, { width: newW, height: newH })
        world.setPosition(handle, { x: newAX, y: newAY })
        world.setAnchor(handle, { x: newAX, y: newAY })
        onResizeCommit({ width: newW, height: newH }, { x: newAX, y: newAY })
    }

    return (
        <div
            className="resize-handles"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
        >
            {dirs.map((dir) => (
                <div
                    key={dir}
                    className="resize-handle"
                    data-dir={dir}
                    onPointerDown={(e) => onPointerDown(dir, e)}
                />
            ))}
        </div>
    )
}
