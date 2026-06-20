import { usePeekEntries } from './PeekContext'
import { PreviewCard } from './PreviewCard'

/**
 * The foreground plane that paints active peek previews, above the content box.
 * Mounted once in the v2 layout, alongside CardLayer.
 */
export function PeekLayer() {
    const entries = usePeekEntries()
    return (
        <div data-peek-layer="">
            {entries.map((entry) => (
                <PreviewCard key={entry.id} entry={entry} />
            ))}
        </div>
    )
}
