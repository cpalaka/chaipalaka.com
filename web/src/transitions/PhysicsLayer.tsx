import { useRef } from 'react'
import { useCardRegistryEntries } from './CardRegistry'
import { PhysicsCardImpl } from './PhysicsCardImpl'

export function PhysicsLayer() {
    const entries = useCardRegistryEntries()
    const containerRef = useRef<HTMLDivElement | null>(null)
    return (
        <div ref={containerRef} data-physics-layer="">
            {entries.map((entry) => (
                <PhysicsCardImpl key={entry.id} entry={entry} />
            ))}
        </div>
    )
}
