/**
 * Physics live binding — the glue between the AtelierStore and the running
 * world. Registers the physics axis, reads its Baseline from the mutable
 * physicsTuning literal, and assigns working values back onto it on every
 * store change. The read-at-use rule (physicsTuning.ts) does the rest: a
 * slider edit lands on the very next tick of a running PhysicsWorld.
 *
 * The tuning object is injected so the whole lifecycle tests against a
 * copy; the React layer wires the real physicsTuning in.
 */

import type { PhysicsTuning } from '../physics/physicsTuning'
import type { AtelierStore, AxisValues } from './atelierStore'
import { PHYSICS_AXIS, PHYSICS_BINDINGS, PHYSICS_SCHEMA } from './schemas/physics'

export interface PhysicsBindingDeps {
    store: AtelierStore
    tuning: PhysicsTuning
}

export interface PhysicsBinding {
    /** Post write-back the regenerated source equals the working values, so
     * adopt them as the new Baseline (the tokensBinding pattern). */
    writeBackReconcile(): void
    dispose(): void
}

function getAtPath(values: AxisValues, path: string): unknown {
    let node: unknown = values
    for (const segment of path.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined
        node = (node as AxisValues)[segment]
    }
    return node
}

/** physicsTuning keys → the schema's nested values shape, via the bindings. */
function tuningToValues(tuning: PhysicsTuning): AxisValues {
    const out: AxisValues = {}
    for (const [path, key] of Object.entries(PHYSICS_BINDINGS)) {
        const [group, leaf] = path.split('.') as [string, string]
        const node = (out[group] ??= {}) as AxisValues
        node[leaf] = tuning[key]
    }
    return out
}

export function createPhysicsBinding(deps: PhysicsBindingDeps): PhysicsBinding {
    const { store, tuning } = deps

    store.registerAxis(PHYSICS_AXIS, PHYSICS_SCHEMA)
    store.reconcileBaseline(PHYSICS_AXIS, tuningToValues(tuning))

    function apply() {
        const working = store.get().axes[PHYSICS_AXIS]
        if (!working) return
        for (const [path, key] of Object.entries(PHYSICS_BINDINGS)) {
            const value = getAtPath(working, path)
            if (typeof value === 'number') tuning[key] = value
        }
    }

    const unsubscribe = store.subscribe(apply)
    apply()

    return {
        writeBackReconcile() {
            const working = store.get().axes[PHYSICS_AXIS]
            if (working) store.reconcileBaseline(PHYSICS_AXIS, working)
        },
        dispose() {
            unsubscribe()
            const baseline = store.get().baselines[PHYSICS_AXIS]
            if (!baseline) return
            for (const [path, key] of Object.entries(PHYSICS_BINDINGS)) {
                const value = getAtPath(baseline, path)
                if (typeof value === 'number') tuning[key] = value
            }
        },
    }
}
