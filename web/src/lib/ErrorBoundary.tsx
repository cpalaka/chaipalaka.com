import { Component, type ReactNode } from 'react'

interface Props {
    children: ReactNode
    /** Rendered in place of `children` once a descendant throws during render. */
    fallback: ReactNode
    /** Called once, with the caught error, when the boundary trips. Use it to
     *  latch parent state so the throwing subtree is not remounted (and re-thrown)
     *  on the next parent render. */
    onError?: (error: unknown) => void
}

interface State {
    hasError: boolean
}

/**
 * Minimal React error boundary (class — the only way to implement one). Catches
 * a **render-phase** throw in its subtree and shows `fallback` instead of letting
 * it crash the route. task-038 wraps the lazy WebGPU aura scene with it so a
 * render-phase failure in the TSL graph degrades to the static fallback (AC#4).
 *
 * NB: an error boundary does NOT catch an async gl-init rejection — R3F v9 runs
 * its `configure({gl})` in an un-awaited effect, so that rejection is handled at
 * its source (AuraScene's gl factory try/catch), not here.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false }

    static getDerivedStateFromError(): State {
        return { hasError: true }
    }

    componentDidCatch(error: unknown) {
        this.props.onError?.(error)
    }

    render() {
        return this.state.hasError ? this.props.fallback : this.props.children
    }
}
