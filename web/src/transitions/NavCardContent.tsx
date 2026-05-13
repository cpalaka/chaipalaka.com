import type { CSSProperties } from 'react'

export interface NavCardContentProps {
    target: 'prev' | 'next'
    /** Section index this control navigates TO (1-based, for aria-label). */
    targetSectionIndex: number
    /** Total section count, for aria-label. */
    sectionCount: number
    onActivate: () => void
}

const buttonStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    font: 'inherit',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
}

export function NavCardContent({
    target,
    targetSectionIndex,
    sectionCount,
    onActivate,
}: NavCardContentProps) {
    const label =
        target === 'prev'
            ? `Previous section, ${targetSectionIndex} of ${sectionCount}`
            : `Next section, ${targetSectionIndex} of ${sectionCount}`
    const glyph = target === 'prev' ? '↑ back' : 'next ↓'

    return (
        <button
            type="button"
            aria-label={label}
            onClick={onActivate}
            style={buttonStyle}
        >
            {glyph}
        </button>
    )
}
