/**
 * A primitive runner is a state machine driven by external frame ticks.
 * Each call to step() advances by dtMs and returns `true` once complete.
 *
 * The runner is allowed to perform setup work on its first call to step()
 * (e.g. cut tethers, drop floor, set initial impulses).
 */
export type PrimitiveStep = (dtMs: number) => boolean
