export interface FlipOptions {
    duration?: number
    easing?: string
    opacityFrom?: number
    endTransform?: string
}

export function flipMorph(
    fromRect: DOMRect,
    targetEl: HTMLElement,
    opts: FlipOptions = {},
): Animation {
    const toRect = targetEl.getBoundingClientRect()
    const dx = fromRect.left - toRect.left
    const dy = fromRect.top - toRect.top
    const scaleX = fromRect.width / toRect.width
    const scaleY = fromRect.height / toRect.height
    const {
        duration = 340,
        easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
        opacityFrom = 0.85,
        endTransform = 'translate(0, 0) scale(1, 1)',
    } = opts

    return targetEl.animate(
        [
            {
                transform: `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`,
                transformOrigin: '0 0',
                opacity: String(opacityFrom),
            },
            {
                transform: endTransform,
                transformOrigin: '0 0',
                opacity: '1',
            },
        ],
        { duration, easing },
    )
}
