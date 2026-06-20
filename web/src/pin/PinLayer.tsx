import { usePinEntries } from './PinContext'
import { PinnedCard } from './PinnedCard'

/**
 * The foreground plane that paints **pinned cards** (the kept rung), above the
 * content box and below previews. Mounted once in the v2 layout, alongside
 * CardLayer / PeekLayer.
 */
export function PinLayer() {
    const entries = usePinEntries()
    return (
        <div data-pin-layer="">
            {entries.map((entry) => (
                <PinnedCard key={entry.id} entry={entry} />
            ))}
        </div>
    )
}
