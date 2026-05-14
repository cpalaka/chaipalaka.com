import { useRef } from 'react'
import { useCardRegistryEntries } from './CardRegistry'
import { CardImpl } from './CardImpl'

export function CardLayer() {
    const entries = useCardRegistryEntries()
    const containerRef = useRef<HTMLDivElement | null>(null)
    return (
        <div ref={containerRef} data-physics-layer="">
            {entries.map((entry) => (
                <CardImpl key={entry.id} entry={entry} />
            ))}
        </div>
    )
}
