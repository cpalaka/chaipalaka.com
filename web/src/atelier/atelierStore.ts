import { createSubscribable } from '../state/subscribable'
import { fieldsOf } from '../canvas/scenes/paramSchema'
import type { TuningFieldDef, TuningSchema } from '../canvas/scenes/paramSchema'

export const ATELIER_STORAGE_KEY = 'chaipalaka.atelier'

/** Working values for one axis — the nested record shape of `ValuesOf<schema>`. */
export type AxisValues = Record<string, unknown>

/**
 * Axis keys are flat strings encoding the working-set shape from the atelier
 * spec — `tokens.dark`, `tokens.light`, `physics`, `chain`, `layout.<route>`.
 */
export interface AtelierState {
    /** Current working values per axis. Absent until a baseline arrives. */
    axes: Record<string, AxisValues>
    /** Current source values per axis. Never persisted — re-read each load. */
    baselines: Record<string, AxisValues>
    /** Named snapshots of every axis's working values. */
    sets: Record<string, Record<string, AxisValues>>
    activeSet: string | null
}

export interface AtelierStore {
    get(): AtelierState
    subscribe(listener: (next: AtelierState) => void): () => void
    registerAxis(axis: string, schema: TuningSchema): void
    reconcileBaseline(axis: string, baseline: AxisValues): void
    setValues(axis: string, next: AxisValues): void
    isDirty(axis: string, path: string): boolean
    dirtyPaths(axis: string): string[]
    resetField(axis: string, path: string): void
    resetAxis(axis: string): void
    saveSet(name: string): void
    switchSet(name: string): void
}

export interface AtelierStoreDeps {
    storage: Map<string, string>
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function leafValid(field: Exclude<TuningFieldDef, { kind: 'group' }>, value: unknown): boolean {
    switch (field.kind) {
        case 'number':
        case 'range':
            return typeof value === 'number'
        case 'boolean':
            return typeof value === 'boolean'
        case 'color':
            return typeof value === 'string'
        case 'enum':
            return typeof value === 'string' && field.options.includes(value)
    }
}

/**
 * Conform persisted (possibly stale) values to the schema: keep leaves whose
 * type still fits their field, fall back to the field default otherwise, drop
 * keys the schema no longer knows.
 */
function sanitize(schema: TuningSchema, raw: unknown): AxisValues {
    const rawRecord = isRecord(raw) ? raw : {}
    const out: AxisValues = {}
    for (const field of fieldsOf(schema)) {
        const value = rawRecord[field.key]
        out[field.key] =
            field.kind === 'group'
                ? sanitize(field.fields, value)
                : leafValid(field, value)
                  ? value
                  : field.default
    }
    return out
}

/** The JSON shape stored under {@link ATELIER_STORAGE_KEY} — baselines excluded. */
interface PersistedAtelier {
    axes: Record<string, AxisValues>
    sets: Record<string, Record<string, AxisValues>>
    activeSet: string | null
}

function readPersisted(storage: Map<string, string>): PersistedAtelier {
    const empty: PersistedAtelier = { axes: {}, sets: {}, activeSet: null }
    const json = storage.get(ATELIER_STORAGE_KEY)
    if (!json) return empty
    try {
        const parsed: unknown = JSON.parse(json)
        if (!isRecord(parsed)) return empty
        return {
            axes: isRecord(parsed['axes']) ? (parsed['axes'] as Record<string, AxisValues>) : {},
            sets: isRecord(parsed['sets'])
                ? (parsed['sets'] as Record<string, Record<string, AxisValues>>)
                : {},
            activeSet: typeof parsed['activeSet'] === 'string' ? parsed['activeSet'] : null,
        }
    } catch {
        return empty
    }
}

/** Dot-joined leaf paths of a schema — group fields recurse, all others are leaves. */
function leafPaths(schema: TuningSchema, prefix = ''): string[] {
    return fieldsOf(schema).flatMap((field) =>
        field.kind === 'group'
            ? leafPaths(field.fields, `${prefix}${field.key}.`)
            : [`${prefix}${field.key}`],
    )
}

function getAtPath(values: AxisValues | undefined, path: string): unknown {
    let node: unknown = values
    for (const segment of path.split('.')) {
        if (typeof node !== 'object' || node === null) return undefined
        node = (node as AxisValues)[segment]
    }
    return node
}

/** Copy-on-write set of one leaf — parent records are cloned along the path. */
function setAtPath(values: AxisValues, path: string, value: unknown): AxisValues {
    const [head, ...rest] = path.split('.') as [string, ...string[]]
    if (rest.length === 0) return { ...values, [head]: value }
    const child = values[head]
    const childRecord = typeof child === 'object' && child !== null ? (child as AxisValues) : {}
    return { ...values, [head]: setAtPath(childRecord, rest.join('.'), value) }
}

export function createAtelierStore(deps: AtelierStoreDeps): AtelierStore {
    const schemas = new Map<string, TuningSchema>()
    const persisted = readPersisted(deps.storage)
    // Persisted working values wait here until their axis registers a schema
    // to sanitize against; they re-enter the persisted output untouched so an
    // axis the current session never registers loses nothing.
    const pendingAxes = new Map(Object.entries(persisted.axes))
    const state = createSubscribable<AtelierState>({
        axes: {},
        baselines: {},
        sets: persisted.sets,
        activeSet: persisted.activeSet,
    })

    function requireSchema(axis: string): TuningSchema {
        const schema = schemas.get(axis)
        if (!schema) throw new Error(`AtelierStore: axis "${axis}" is not registered`)
        return schema
    }

    function commit(next: AtelierState) {
        deps.storage.set(
            ATELIER_STORAGE_KEY,
            JSON.stringify({
                axes: { ...Object.fromEntries(pendingAxes), ...next.axes },
                sets: next.sets,
                activeSet: next.activeSet,
            } satisfies PersistedAtelier),
        )
        state.set(next)
    }

    return {
        get: state.get,
        subscribe: state.subscribe,

        registerAxis(axis, schema) {
            schemas.set(axis, schema)
            const raw = pendingAxes.get(axis)
            if (raw !== undefined) {
                pendingAxes.delete(axis)
                const prev = state.get()
                // hydration, not a mutation — nothing new to persist yet
                state.set({ ...prev, axes: { ...prev.axes, [axis]: sanitize(schema, raw) } })
            }
        },

        reconcileBaseline(axis, baseline) {
            const schema = requireSchema(axis)
            const prev = state.get()
            const working = prev.axes[axis]
            const oldBaseline = prev.baselines[axis]
            let nextWorking: AxisValues
            if (!working) {
                // first sight of this axis — source values are the working values
                nextWorking = structuredClone(baseline)
            } else if (!oldBaseline) {
                // working values persisted from a previous session: keep them all;
                // cleanliness vs. the old source is unknowable (baselines are not
                // persisted), so fields whose source moved show as dirty.
                nextWorking = working
            } else {
                // clean fields track the refreshed source; dirty fields keep edits
                nextWorking = working
                for (const path of leafPaths(schema)) {
                    if (getAtPath(working, path) === getAtPath(oldBaseline, path)) {
                        nextWorking = setAtPath(nextWorking, path, getAtPath(baseline, path))
                    }
                }
            }
            commit({
                ...prev,
                axes: { ...prev.axes, [axis]: nextWorking },
                baselines: { ...prev.baselines, [axis]: structuredClone(baseline) },
            })
        },

        setValues(axis, next) {
            requireSchema(axis)
            const prev = state.get()
            commit({
                ...prev,
                axes: { ...prev.axes, [axis]: structuredClone(next) },
            })
        },

        isDirty(axis, path) {
            requireSchema(axis)
            const { axes, baselines } = state.get()
            if (!baselines[axis]) return false
            return getAtPath(axes[axis], path) !== getAtPath(baselines[axis], path)
        },

        dirtyPaths(axis) {
            const schema = requireSchema(axis)
            const { axes, baselines } = state.get()
            if (!baselines[axis]) return []
            return leafPaths(schema).filter(
                (path) => getAtPath(axes[axis], path) !== getAtPath(baselines[axis], path),
            )
        },

        resetField(axis, path) {
            requireSchema(axis)
            const prev = state.get()
            const working = prev.axes[axis]
            const baseline = prev.baselines[axis]
            if (!working || !baseline) return
            commit({
                ...prev,
                axes: { ...prev.axes, [axis]: setAtPath(working, path, getAtPath(baseline, path)) },
            })
        },

        resetAxis(axis) {
            requireSchema(axis)
            const prev = state.get()
            const baseline = prev.baselines[axis]
            if (!baseline) return
            commit({
                ...prev,
                axes: { ...prev.axes, [axis]: structuredClone(baseline) },
            })
        },

        saveSet(name) {
            const prev = state.get()
            commit({
                ...prev,
                sets: { ...prev.sets, [name]: structuredClone(prev.axes) },
                activeSet: name,
            })
        },

        switchSet(name) {
            const prev = state.get()
            const snapshot = prev.sets[name]
            if (!snapshot) throw new Error(`AtelierStore: unknown working set "${name}"`)
            commit({
                ...prev,
                axes: { ...prev.axes, ...structuredClone(snapshot) },
                activeSet: name,
            })
        },
    }
}
