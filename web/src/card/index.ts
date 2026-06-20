// Public surface of the card subsystem.
//
// Consumers in `routes/` and `layouts/` should import from this barrel — it is
// the declared seam. Direct file imports inside `card/` itself are fine.
//
// Internals deliberately NOT re-exported: CardImpl, CardRegistryStore,
// RegisterArgs, CardRegistryAPI, useCardRegistryEntries. Reach for those
// via direct file imports only if you are inside `card/`.

export { Card } from './Card'
export type { CardProps } from './Card'

export { Page } from './Page'
export type { CardContent } from './Page'

export { CardLayer } from './CardLayer'

export { CardRegistryProvider, useCardRegistry } from './CardRegistry'
export type { CardEntry, CardLifecycle, CardActivator } from './CardRegistry'
