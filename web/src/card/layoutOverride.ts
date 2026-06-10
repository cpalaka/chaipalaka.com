/**
 * Layout-override seam — the Atelier arrangement axis's path into a live
 * route. The layout binding publishes the working RouteLayout here; Page
 * swaps it in for its static pageDef, so anchors, parents, kinds, and
 * gravity all flow through the existing Card → registry → CardImpl →
 * usePageDef machinery. Cleared (null) when the binding disposes.
 *
 * The override applies only when its card-id set matches the mounted
 * pageDef's — a stale override from another route never crosses over.
 *
 * Lives in production code (not atelier/) so prod never imports atelier
 * modules — the prod-bundle guard's import direction. In prod it just
 * stays null.
 */

import { createSubscribable } from '../state/subscribable'
import type { Subscribable } from '../state/subscribable'
import { pageSpecFromLayout } from '../routes/routeLayout'
import type { RouteLayout } from '../routes/routeLayout'
import type { PageSpec } from '../physics/PageSpec'

const layoutOverride = createSubscribable<RouteLayout | null>(null)

export function getLayoutOverride(): Subscribable<RouteLayout | null> {
    return layoutOverride
}

export function setLayoutOverride(layout: RouteLayout | null): void {
    layoutOverride.set(layout)
}

export function applyLayoutOverride(
    pageDef: PageSpec,
    override: RouteLayout | null,
): PageSpec {
    if (!override) return pageDef
    const defIds = new Set(pageDef.cards.map((c) => c.id))
    const overrideIds = override.cards.map((c) => c.id)
    if (
        overrideIds.length !== defIds.size ||
        !overrideIds.every((id) => defIds.has(id))
    ) {
        return pageDef
    }
    return { ...pageSpecFromLayout(override), sections: pageDef.sections }
}
