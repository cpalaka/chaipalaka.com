import type { CardActivator } from '../CardRegistry'
import type { PrimitiveStep } from './types'

export interface CrossFadeOpts {
    durationMs?: number
}

export function crossFade(
    element: HTMLElement,
    activator: CardActivator,
    toIds: readonly string[],
    opts: CrossFadeOpts = {},
): PrimitiveStep {
    const durationMs = opts.durationMs ?? 150
    let elapsedMs = 0
    let initialized = false
    return (dtMs) => {
        if (!initialized) {
            element.style.opacity = '0'
            for (const id of toIds) activator.activate(id)
            initialized = true
        }
        elapsedMs += dtMs
        const t = Math.min(elapsedMs / durationMs, 1)
        element.style.opacity = String(t)
        return t >= 1
    }
}
