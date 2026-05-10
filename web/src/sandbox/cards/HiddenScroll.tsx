import type { ReactNode } from 'react'

interface HiddenScrollProps {
    children: ReactNode
    className?: string
    style?: React.CSSProperties
}

export function HiddenScroll({ children, className = '', style }: HiddenScrollProps) {
    return (
        <div
            className={`hidden-scroll-wrapper scroll-indicator-arrow ${className}`}
            style={style}
        >
            <div className="hidden-scroll-inner">
                {children}
            </div>
        </div>
    )
}
