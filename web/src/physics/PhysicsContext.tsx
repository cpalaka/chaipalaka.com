import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { PhysicsWorld } from './PhysicsWorld'

const PhysicsContext = createContext<PhysicsWorld | null>(null)

export function usePhysicsWorld(): PhysicsWorld {
  const w = useContext(PhysicsContext)
  if (!w) throw new Error('usePhysicsWorld: must be used inside <PhysicsProvider>')
  return w
}

interface PhysicsProviderProps {
  children: ReactNode
}

export function PhysicsProvider({ children }: PhysicsProviderProps) {
  const [world] = useState(
    () =>
      new PhysicsWorld({
        viewport:
          typeof window !== 'undefined'
            ? { width: window.innerWidth, height: window.innerHeight }
            : { width: 1024, height: 768 },
      }),
  )

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

  return <PhysicsContext.Provider value={world}>{children}</PhysicsContext.Provider>
}
