/**
 * Session-scoped Atelier instances (lazy-singleton pattern, like useTheme):
 * the AtelierStore and the tokens live binding, wired to the real document
 * and the production ThemeController. Only the dev-only panel imports this.
 */

import { useController } from '../state/useController'
import { persistentMap } from '../state/persistentMap'
import { createAtelierStore, ATELIER_STORAGE_KEY } from './atelierStore'
import type { AtelierState, AtelierStore } from './atelierStore'
import { createTokensBinding } from './tokensBinding'
import type { TokensBinding } from './tokensBinding'
import { createPhysicsBinding } from './physicsBinding'
import type { PhysicsBinding } from './physicsBinding'
import { physicsTuning } from '../physics/physicsTuning'
import { getThemeController } from '../controls/useTheme'

let storeInstance: AtelierStore | null = null

export function getAtelierStore(): AtelierStore {
    if (!storeInstance) {
        storeInstance = createAtelierStore({
            storage: persistentMap(ATELIER_STORAGE_KEY),
        })
    }
    return storeInstance
}

let bindingInstance: TokensBinding | null = null

export function ensureTokensBinding(): TokensBinding {
    if (!bindingInstance) {
        const ctrl = getThemeController()
        const root = document.documentElement
        // The binding reads Baselines via getComputedStyle the moment the
        // theme changes — before React's useTheme effect has flipped the
        // data-theme attribute. Write the attribute first, both up front and
        // inside the subscription, so reads always see the right stylesheet.
        root.dataset.theme = ctrl.get()
        bindingInstance = createTokensBinding({
            store: getAtelierStore(),
            theme: {
                get: () => ctrl.get(),
                subscribe: (listener) =>
                    ctrl.subscribe((next) => {
                        root.dataset.theme = next
                        listener(next)
                    }),
            },
            style: {
                setProperty: (prop, value) => root.style.setProperty(prop, value),
                removeProperty: (prop) => root.style.removeProperty(prop),
            },
            readToken: (prop) => getComputedStyle(root).getPropertyValue(prop),
        })
    }
    return bindingInstance
}

let physicsBindingInstance: PhysicsBinding | null = null

export function ensurePhysicsBinding(): PhysicsBinding {
    if (!physicsBindingInstance) {
        physicsBindingInstance = createPhysicsBinding({
            store: getAtelierStore(),
            tuning: physicsTuning,
        })
    }
    return physicsBindingInstance
}

export function useAtelierState(): AtelierState {
    return useController(getAtelierStore)
}
