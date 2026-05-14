// Public surface of the transitions subsystem.
//
// Consumers in `layouts/` and `routes/` should import from this barrel —
// it is the declared seam. Direct file imports inside `transitions/`
// itself are fine.
//
// Internals deliberately NOT re-exported: dispatch (and its types),
// classifyDirection, primitives/*, PageDefRegistryAPI.

export { TransitionDirector } from './TransitionDirector'

export {
    PageDefRegistryProvider,
    useRegisterPageDef,
    usePageDefRegistry,
} from './PageDefRegistry'

export { useHashSection } from './useHashSection'

export type { TransitionSpec, TransitionId } from './TransitionSpec'

export { edges } from './transitionOverrides'
