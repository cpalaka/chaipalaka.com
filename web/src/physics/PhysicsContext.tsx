import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'
import { PhysicsWorld } from './PhysicsWorld'
import { useFrameEdge, getFrameEdgeController } from '../canvas/useFrameEdge'
import { CardRegistryProvider } from '../transitions/CardRegistry'
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

export function PhysicsProvider({ children }: PhysicsProviderProps) {
    const { edge } = useFrameEdge()

    const [world] = useState(() => {
        const initialEdge = getFrameEdgeController().getEdge()
        return new PhysicsWorld({
            viewport:
                typeof window !== 'undefined'
                    ? { width: window.innerWidth, height: window.innerHeight }
                    : { width: 1024, height: 768 },
            insets: edgeToInsets(initialEdge),
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

    // Viewport + insets — re-applies when edge changes or window resizes
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

    return (
        <PhysicsContext.Provider value={world}>
            <CardRegistryProvider>{children}</CardRegistryProvider>
        </PhysicsContext.Provider>
    )
}
