/**
 * Tokens-axis pure logic: read Baselines from computed styles, diff working
 * values against Baselines into inline-style ops, and assemble write-back
 * payloads. The DOM-facing glue lives in tokensBinding.ts; everything here
 * is string/value transformation, tested without a browser.
 *
 * Dirty-only inline application: only fields whose working value differs
 * from the Baseline get an inline property; clean fields get removeProperty
 * so per-field revert and stylesheet theming both fall out naturally.
 */

import { fieldsOf } from '../canvas/scenes/paramSchema'
import type { TuningSchema } from '../canvas/scenes/paramSchema'
import type { AxisValues } from './atelierStore'
import type { TokenBinding } from './schemas/tokens'
// Type-only import — pulling the plugin's runtime would drag node:fs into
// the client bundle.
import type { TokenEdits } from './vite-plugin-atelier'

interface AxisSnapshot {
    working: AxisValues
    baseline: AxisValues
    bindings: Record<string, TokenBinding>
}

/**
 * Assembles the POST /__atelier/write tokens payload from dirty fields.
 * Base tokens are :root declarations, so base dirt joins the dark record.
 */
export function buildTokenEdits(axes: {
    base: AxisSnapshot
    dark: AxisSnapshot
    light: AxisSnapshot
}): TokenEdits {
    const record = (...snapshots: AxisSnapshot[]) => {
        const out: Record<string, string> = {}
        for (const s of snapshots) {
            for (const { prop, value } of diffTokenOps(s.working, s.baseline, s.bindings).set) {
                out[prop] = value
            }
        }
        return out
    }
    return { dark: record(axes.base, axes.dark), light: record(axes.light) }
}

export interface TokenOps {
    set: Array<{ prop: string; value: string }>
    remove: string[]
}

function getAtPath(values: AxisValues, path: string): unknown {
    let node: unknown = values
    for (const segment of path.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined
        node = (node as AxisValues)[segment]
    }
    return node
}

export function serializeTokenValue(value: unknown, binding: TokenBinding): string {
    return typeof value === 'number' ? `${value}${binding.unit}` : String(value)
}

export function diffTokenOps(
    working: AxisValues,
    baseline: AxisValues,
    bindings: Record<string, TokenBinding>,
): TokenOps {
    const ops: TokenOps = { set: [], remove: [] }
    for (const [path, binding] of Object.entries(bindings)) {
        const value = getAtPath(working, path)
        if (value !== getAtPath(baseline, path) && value !== undefined) {
            ops.set.push({ prop: binding.prop, value: serializeTokenValue(value, binding) })
        } else {
            ops.remove.push(binding.prop)
        }
    }
    return ops
}

export function readTokenBaseline(
    schema: TuningSchema,
    bindings: Record<string, TokenBinding>,
    read: (prop: string) => string,
    prefix = '',
): AxisValues {
    const out: AxisValues = {}
    for (const field of fieldsOf(schema)) {
        const path = `${prefix}${field.key}`
        if (field.kind === 'group') {
            out[field.key] = readTokenBaseline(field.fields, bindings, read, `${path}.`)
            continue
        }
        const binding = bindings[path]
        const text = binding ? read(binding.prop).trim() : ''
        if (field.kind === 'color') {
            out[field.key] = text || field.default
        } else {
            const parsed = parseFloat(text)
            out[field.key] = Number.isNaN(parsed) ? field.default : parsed
        }
    }
    return out
}
