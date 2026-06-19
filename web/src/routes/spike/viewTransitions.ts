/**
 * task-019 spike — feature-detect the browser-native View Transitions API.
 *
 * react-router's `viewTransition` Link prop already guards on this internally
 * and falls back to an instant navigation when the API is absent, so the morph
 * degrades for free. This helper exists so the spike's own enhancement code can
 * make the same branch (and so the fallback decision is unit-testable without a
 * real browser).
 */
export function supportsViewTransitions(
    doc: { startViewTransition?: unknown } | undefined = typeof document !==
    'undefined'
        ? document
        : undefined,
): boolean {
    return typeof doc?.startViewTransition === 'function'
}
