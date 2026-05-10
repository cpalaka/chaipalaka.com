import type { CardInteractionMode } from '../../physics/PhysicsCard'

const MODES: Array<{ value: CardInteractionMode; label: string; title: string }> = [
    { value: 'anchored', label: 'A', title: 'Anchored — springs back, no drag' },
    { value: 'locked', label: 'L', title: 'Locked — removed from physics, behind canvas' },
    { value: 'free', label: 'F', title: 'Free — drag and stays where placed' },
]

interface CardHeaderProps {
    mode: CardInteractionMode
    onChange: (mode: CardInteractionMode) => void
}

export function CardHeader({ mode, onChange }: CardHeaderProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                marginLeft: 'auto',
            }}
        >
            {MODES.map(({ value, label, title }) => (
                <button
                    key={value}
                    type="button"
                    title={title}
                    data-active={mode === value ? 'true' : 'false'}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onChange(value)}
                    style={{
                        background: mode === value ? 'var(--card-fg, currentColor)' : 'none',
                        color: mode === value ? 'var(--card-bg, canvas)' : 'var(--card-fg, currentColor)',
                        border: 'none',
                        padding: '1px 5px',
                        fontFamily: 'inherit',
                        fontSize: 9,
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.05em',
                        opacity: mode === value ? 1 : 0.5,
                        lineHeight: 1.6,
                    }}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}
