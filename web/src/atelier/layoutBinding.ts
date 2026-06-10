/**
 * Layout live binding — the glue between the AtelierStore and a mounted
 * scatter route. Registers the route's layout axis (schema generated from
 * the baseline layout), reads its Baseline from the imported layout module,
 * and publishes the working RouteLayout through the layout-override seam
 * (card/layoutOverride.ts) on every store change; Page does the rest.
 * Dispose clears the override so the route falls back to source.
 *
 * The override seam is injected so the lifecycle tests without React; the
 * panel wires the real setLayoutOverride in (one binding per route at a
 * time — see useAtelier.ensureLayoutBinding).
 */

import type { RouteLayout } from '../routes/routeLayout'
import type { AtelierStore } from './atelierStore'
import {
    layoutAxis,
    layoutSchemaFor,
    layoutFromValues,
    valuesFromLayout,
} from './schemas/layout'

export interface LayoutBindingDeps {
    store: AtelierStore
    route: string
    /** The route's source layout — the Baseline and the card-order anchor. */
    layout: RouteLayout
    override: { set(layout: RouteLayout | null): void }
}

export interface LayoutBinding {
    /** Post write-back the regenerated source equals the working values, so
     * adopt them as the new Baseline (the tokensBinding pattern). */
    writeBackReconcile(): void
    dispose(): void
}

export function createLayoutBinding(deps: LayoutBindingDeps): LayoutBinding {
    const { store, route, layout, override } = deps
    const axis = layoutAxis(route)

    store.registerAxis(axis, layoutSchemaFor(layout))
    store.reconcileBaseline(axis, valuesFromLayout(layout))

    function apply() {
        const working = store.get().axes[axis]
        if (!working) return
        override.set(layoutFromValues(working, layout))
    }

    const unsubscribe = store.subscribe(apply)
    apply()

    return {
        writeBackReconcile() {
            const working = store.get().axes[axis]
            if (working) store.reconcileBaseline(axis, working)
        },
        dispose() {
            unsubscribe()
            override.set(null)
        },
    }
}
