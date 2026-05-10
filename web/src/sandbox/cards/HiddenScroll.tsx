import { useRef, useEffect, type ReactNode } from 'react'
import type { ScrollIndicatorStyle } from './state'

interface HiddenScrollProps {
    children: ReactNode
    indicator: ScrollIndicatorStyle
    className?: string
    style?: React.CSSProperties
}

export function HiddenScroll({
    children,
    indicator,
    className = '',
    style,
}: HiddenScrollProps) {
    const innerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = innerRef.current
        if (!el || indicator !== 'progress-line') return

        const update = () => {
            const pct =
                el.scrollHeight - el.clientHeight > 0
                    ? el.scrollTop / (el.scrollHeight - el.clientHeight)
                    : 0
            el.style.setProperty('--scroll-progress', String(pct))
        }
        el.addEventListener('scroll', update, { passive: true })
        update()
        return () => el.removeEventListener('scroll', update)
    }, [indicator])

    const indicatorClass =
        indicator === 'gradient-fade'
            ? 'scroll-indicator-fade'
            : indicator === 'dot'
              ? 'scroll-indicator-dot'
              : indicator === 'arrow'
                ? 'scroll-indicator-arrow'
                : indicator === 'progress-line'
                  ? 'scroll-indicator-progress'
                  : ''

    return (
        <div
            className={`hidden-scroll-wrapper ${indicatorClass} ${className}`}
            style={style}
        >
            <div ref={innerRef} className="hidden-scroll-inner">
                {children}
            </div>
        </div>
    )
}
