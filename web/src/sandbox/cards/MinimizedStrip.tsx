import type { RefObject } from 'react'
import type { AnimMechanism } from './state'

interface MinimizedCard {
    id: string
    label: string
    kind: string
}

const MOCK_MINIMIZED: MinimizedCard[] = [
    { id: 'note-1', label: 'Daily note', kind: 'note' },
    { id: 'blog-1', label: 'Blog post', kind: 'blog-post' },
    { id: 'port-1', label: 'Portfolio', kind: 'portfolio' },
]

interface MinimizedStripProps {
    hasPlayground: boolean
    animMechanism: AnimMechanism
    onRestorePlayground: () => void
    chipRef?: RefObject<HTMLButtonElement | null>
}

export function MinimizedStrip({
    hasPlayground,
    animMechanism,
    onRestorePlayground,
    chipRef,
}: MinimizedStripProps) {
    const allCards = hasPlayground
        ? [{ id: 'playground', label: 'Playground', kind: 'playground' }, ...MOCK_MINIMIZED]
        : MOCK_MINIMIZED

    return (
        <div className="frame-bar__minimized-strip">
            {allCards.map((card) => (
                <button
                    key={card.id}
                    ref={card.id === 'playground' ? chipRef : null}
                    className="frame-bar__mini-card"
                    onClick={card.id === 'playground' ? onRestorePlayground : undefined}
                    title={`Restore: ${card.label}`}
                    style={
                        card.id === 'playground' && animMechanism === 'vt'
                            ? { viewTransitionName: 'playground-card' }
                            : undefined
                    }
                >
                    <span style={{ fontSize: 8 }}>
                        {card.kind === 'note' ? '📝' : card.kind === 'blog-post' ? '📄' : card.kind === 'portfolio' ? '🖼' : '⬜'}
                    </span>
                    {card.label}
                </button>
            ))}
        </div>
    )
}
