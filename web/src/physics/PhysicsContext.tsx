import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'
import { useInRouterContext } from 'react-router-dom'
import { PhysicsWorld } from './PhysicsWorld'
import { useFrameEdge, getFrameEdgeController } from '../canvas/useFrameEdge'
import type { FrameEdge } from '../canvas/useFrameEdge'

export const FRAME_BAR_HEIGHT = 40

export function edgeToInsets(edge: FrameEdge) {
    return edge === 'top'
        ? { top: FRAME_BAR_HEIGHT, bottom: 0 }
        : { top: 0, bottom: FRAME_BAR_HEIGHT }
}

const PhysicsContext = createContext<PhysicsWorld | null>(null)

export function usePhysicsWorld(): PhysicsWorld {
    const w = useContext(PhysicsContext)
    if (!w)
        throw new Error(
            'usePhysicsWorld: must be used inside <PhysicsProvider>',
        )
    return w
}

interface PhysicsProviderProps {
    children: ReactNode
}

// Routed inset effect — only mounts when a <Router> ancestor exists, so
// PhysicsProvider remains usable in router-less unit tests. The effect owns
// the resize listener while routed so the bar-reserved insets are re-applied
// on every resize.
function RoutedInsetsEffect({
    world,
    edge,
}: {
    world: PhysicsWorld
    edge: FrameEdge
}) {
    useEffect(() => {
        if (typeof window === 'undefined') return
        const insets = edgeToInsets(edge)
        const apply = () =>
            world.setViewport(
                { width: window.innerWidth, height: window.innerHeight },
                insets,
            )
        apply()
        window.addEventListener('resize', apply, { passive: true })
        return () => window.removeEventListener('resize', apply)
    }, [world, edge])
    return null
}

export function PhysicsProvider({ children }: PhysicsProviderProps) {
    const { edge } = useFrameEdge()
    const inRouter = useInRouterContext()

    const [world] = useState(() => {
        const initialEdge = getFrameEdgeController().getEdge()
        const initialInsets = edgeToInsets(initialEdge)
        return new PhysicsWorld({
            viewport:
                typeof window !== 'undefined'
                    ? { width: window.innerWidth, height: window.innerHeight }
                    : { width: 1024, height: 768 },
            insets: initialInsets,
            // Drift is the site default (spec §3.2 / AC#2). PageSpec routes
            // still refine mode via usePageDef; PageSpec-less physics routes
            // (blog, /sandbox/cards) rely on this. The constructor keeps its
            // 'gravity' default for direct-construction unit tests.
            mode: 'drift',
        })
    })

    // RAF tick loop — stable across edge changes
    useEffect(() => {
        if (typeof window === 'undefined') return
        let raf = 0
        let last = performance.now()
        const frame = (now: number) => {
            const dt = Math.min(now - last, 50)
            last = now
            world.tick(dt)
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)
        return () => cancelAnimationFrame(raf)
    }, [world])

    // Router-less fallback: apply edge-based insets on edge/resize.
    // When inside a Router, RoutedInsetsEffect owns viewport application instead.
    useEffect(() => {
        if (typeof window === 'undefined') return
        if (inRouter) return
        const apply = () =>
            world.setViewport(
                { width: window.innerWidth, height: window.innerHeight },
                edgeToInsets(edge),
            )
        apply()
        window.addEventListener('resize', apply, { passive: true })
        return () => window.removeEventListener('resize', apply)
    }, [world, edge, inRouter])

    return (
        <PhysicsContext.Provider value={world}>
            {inRouter ? <RoutedInsetsEffect world={world} edge={edge} /> : null}
            {children}
        </PhysicsContext.Provider>
    )
}
