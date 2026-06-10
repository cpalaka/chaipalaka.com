/**
 * Chain live binding — the glue between the AtelierStore and the chain
 * routes. Mirrors physicsBinding, with one extra step: chain layout is
 * pull-based, so after assigning working values onto the layoutTuning
 * literal the binding notifies, and subscribed chain routes rebuild and
 * re-partition (see layoutTuning.ts).
 *
 * The tuning object and notify are injected so the lifecycle tests against
 * a copy; the React layer wires the real layoutTuning + notifyLayoutTuning.
 */

import type { LayoutTuning } from '../layout/layoutTuning'
import type { AtelierStore } from './atelierStore'
import { CHAIN_AXIS, CHAIN_SCHEMA } from './schemas/chain'

export interface ChainBindingDeps {
    store: AtelierStore
    tuning: LayoutTuning
    notify: () => void
}

export interface ChainBinding {
    /** Post write-back the regenerated source equals the working values, so
     * adopt them as the new Baseline (the tokensBinding pattern). */
    writeBackReconcile(): void
    dispose(): void
}

const KEYS = Object.keys(CHAIN_SCHEMA) as (keyof LayoutTuning)[]

export function createChainBinding(deps: ChainBindingDeps): ChainBinding {
    const { store, tuning, notify } = deps

    store.registerAxis(CHAIN_AXIS, CHAIN_SCHEMA)
    store.reconcileBaseline(CHAIN_AXIS, { ...tuning })

    function apply() {
        const working = store.get().axes[CHAIN_AXIS]
        if (!working) return
        for (const key of KEYS) {
            const value = working[key]
            if (typeof value === 'number') tuning[key] = value
        }
        notify()
    }

    const unsubscribe = store.subscribe(apply)
    apply()

    return {
        writeBackReconcile() {
            const working = store.get().axes[CHAIN_AXIS]
            if (working) store.reconcileBaseline(CHAIN_AXIS, working)
        },
        dispose() {
            unsubscribe()
            const baseline = store.get().baselines[CHAIN_AXIS]
            if (!baseline) return
            for (const key of KEYS) {
                const value = baseline[key]
                if (typeof value === 'number') tuning[key] = value
            }
            notify()
        },
    }
}
