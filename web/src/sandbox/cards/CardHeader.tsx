interface CardHeaderProps {
    onMinimize?: () => void
}

export function CardHeader({ onMinimize }: CardHeaderProps) {
    if (!onMinimize) return null
    return (
        <button
            type="button"
            title="Minimize"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onMinimize}
            style={{
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                cursor: 'pointer',
                color: 'var(--card-fg, currentColor)',
                opacity: 0.55,
                fontSize: 18,
                lineHeight: 1,
                fontFamily: 'inherit',
            }}
        >
            −
        </button>
    )
}
