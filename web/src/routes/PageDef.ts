import type { PageSpec } from '../physics/PageSpec'

// The v1 transition subsystem (TransitionSpec / TransitionDirector) was retired
// in task-025 (ADR-0007); a route's declarative spec is now just its PageSpec
// (gravity + cards + optional sections). Kept as a named alias so the many
// `PageDef` references across routes stay stable.
export type PageDef = PageSpec
