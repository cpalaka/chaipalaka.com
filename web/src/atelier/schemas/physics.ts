/**
 * Hand-curated Physics-axis schema over web/src/physics/physicsTuning.ts.
 *
 * Defaults read from the live physicsTuning import — never copied literals —
 * so the schema's stale-data fallback tracks the source. Ranges are curated
 * to the regime that works (matter.js response is nonlinear), not
 * mathematically pretty bounds: tetherStiffness spans decades, so it gets a
 * log-scale slider whose floor is true near-zero (1e-9 — 1e-4 still reads
 * as rigid).
 *
 * Gravity *direction* is per-route and lives in the arrangement axis, not
 * here (spec, Axis 2).
 */

import { defineTuning } from '../../canvas/scenes/paramSchema'
import { physicsTuning } from '../../physics/physicsTuning'
import type { PhysicsTuning } from '../../physics/physicsTuning'
import type { AxisValues } from '../atelierStore'

export const PHYSICS_SCHEMA = defineTuning({
    world: {
        kind: 'group',
        label: 'World',
        fields: {
            gravityY: { kind: 'range', default: physicsTuning.gravityY, min: 0, max: 3, step: 0.05, label: 'Gravity' },
            buoyancyGain: { kind: 'range', default: physicsTuning.buoyancyGain, min: 0, max: 5, step: 0.1, label: 'Buoyancy gain' },
        },
    },
    tether: {
        kind: 'group',
        label: 'Tether',
        fields: {
            stiffness: { kind: 'range', scale: 'log', default: physicsTuning.tetherStiffness, min: 1e-9, max: 1e-3, step: 0.01, label: 'Stiffness' },
            slackFactor: { kind: 'range', default: physicsTuning.slackFactor, min: 0.8, max: 1, step: 0.005, label: 'Slack factor' },
        },
    },
    interaction: {
        kind: 'group',
        label: 'Interaction',
        fields: {
            flingScale: { kind: 'range', default: physicsTuning.flingVelocityScale, min: 0, max: 40, step: 1, label: 'Fling scale' },
            flingPauseMs: { kind: 'range', default: physicsTuning.flingPauseMs, min: 0, max: 300, step: 10, label: 'Fling pause' },
            exitKick: { kind: 'range', default: physicsTuning.exitKick, min: 0, max: 40, step: 1, label: 'Exit kick' },
        },
    },
    transitions: {
        kind: 'group',
        label: 'Transitions',
        fields: {
            pourInBaseDelayMs: { kind: 'range', default: physicsTuning.pourInBaseDelayMs, min: 0, max: 3000, step: 50, label: 'Pour-in delay' },
            pourInStaggerMs: { kind: 'range', default: physicsTuning.pourInStaggerMs, min: 0, max: 400, step: 10, label: 'Pour-in stagger' },
            pourInTweenMs: { kind: 'range', default: physicsTuning.pourInTweenMs, min: 100, max: 2000, step: 50, label: 'Pour-in tween' },
            pourInHardCeilingMs: { kind: 'range', default: physicsTuning.pourInHardCeilingMs, min: 500, max: 6000, step: 100, label: 'Pour-in ceiling' },
            stringCutHardCeilingMs: { kind: 'range', default: physicsTuning.stringCutHardCeilingMs, min: 500, max: 6000, step: 100, label: 'String-cut ceiling' },
            anchorSlideDurationMs: { kind: 'range', default: physicsTuning.anchorSlideDurationMs, min: 100, max: 2000, step: 50, label: 'Anchor slide' },
            decoupledOverlapMs: { kind: 'range', default: physicsTuning.decoupledOverlapMs, min: 0, max: 1000, step: 25, label: 'Decoupled overlap' },
            reducedMotionMs: { kind: 'range', default: physicsTuning.reducedMotionMs, min: 50, max: 600, step: 10, label: 'Reduced motion' },
        },
    },
})

/** Dot-joined schema leaf path → physicsTuning key (the tokens idiom). */
export const PHYSICS_BINDINGS: Record<string, keyof PhysicsTuning> = {
    'world.gravityY': 'gravityY',
    'world.buoyancyGain': 'buoyancyGain',
    'tether.stiffness': 'tetherStiffness',
    'tether.slackFactor': 'slackFactor',
    'interaction.flingScale': 'flingVelocityScale',
    'interaction.flingPauseMs': 'flingPauseMs',
    'interaction.exitKick': 'exitKick',
    'transitions.pourInBaseDelayMs': 'pourInBaseDelayMs',
    'transitions.pourInStaggerMs': 'pourInStaggerMs',
    'transitions.pourInTweenMs': 'pourInTweenMs',
    'transitions.pourInHardCeilingMs': 'pourInHardCeilingMs',
    'transitions.stringCutHardCeilingMs': 'stringCutHardCeilingMs',
    'transitions.anchorSlideDurationMs': 'anchorSlideDurationMs',
    'transitions.decoupledOverlapMs': 'decoupledOverlapMs',
    'transitions.reducedMotionMs': 'reducedMotionMs',
}

function getAtPath(values: AxisValues, path: string): unknown {
    let node: unknown = values
    for (const segment of path.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined
        node = (node as AxisValues)[segment]
    }
    return node
}

/**
 * Flattens working values into the POST /__atelier/write physics payload —
 * every physicsTuning key, since the generator regenerates the file whole.
 */
export function physicsPayload(values: AxisValues): Record<string, number> {
    const out: Record<string, number> = {}
    for (const [path, key] of Object.entries(PHYSICS_BINDINGS)) {
        out[key] = getAtPath(values, path) as number
    }
    return out
}

/** AtelierStore axis key for the Physics axis. */
export const PHYSICS_AXIS = 'physics'
