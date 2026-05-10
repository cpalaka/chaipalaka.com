interface CardHeaderProps {
    locked: boolean
    onChange: (locked: boolean) => void
}

export function CardHeader({ locked, onChange }: CardHeaderProps) {
    return (
        <button
            type="button"
            title={locked ? 'Locked — click to free' : 'Free — click to lock'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onChange(!locked)}
            style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                padding: '4px 6px',
                cursor: 'pointer',
                color: 'var(--card-fg, currentColor)',
                opacity: locked ? 1 : 0.45,
                display: 'flex',
                alignItems: 'center',
                lineHeight: 1,
            }}
        >
            {locked ? (
                <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden="true">
                    {/* Closed shackle */}
                    <path
                        d="M3 6V4.5a3.5 3.5 0 0 1 7 0V6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Body */}
                    <rect x="1" y="6" width="11" height="7.5" rx="1.5" fill="currentColor" />
                    {/* Keyhole */}
                    <circle cx="6.5" cy="9.5" r="1.2" fill="var(--card-bg, canvas)" />
                </svg>
            ) : (
                <svg width="13" height="14" viewBox="0 0 13 14" fill="none" aria-hidden="true">
                    {/* Open shackle (swung to the right) */}
                    <path
                        d="M3 6V4.5a3.5 3.5 0 0 1 7 0"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Body */}
                    <rect
                        x="1"
                        y="6"
                        width="11"
                        height="7.5"
                        rx="1.5"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        fill="none"
                    />
                    {/* Keyhole */}
                    <circle cx="6.5" cy="9.5" r="1.2" fill="currentColor" />
                </svg>
            )}
        </button>
    )
}
