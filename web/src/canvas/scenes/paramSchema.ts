export type SceneFieldDef =
    | {
          kind: 'number'
          default: number
          min: number
          max: number
          step: number
          label: string
          remount?: true
      }
    | {
          kind: 'range'
          default: number
          min: number
          max: number
          step: number
          label: string
          remount?: true
      }
    | {
          kind: 'color'
          default: string
          label: string
          remount?: true
      }

export type SceneParamSchema = Record<string, SceneFieldDef>

// The Atelier's TuningSchema is a superset of the scene DSL: the same three
// scene kinds plus enum/boolean. Scene schemas stay on the narrow types so
// the scene Tuner never has to render kinds it has no widget for.
export type TuningFieldDef =
    | SceneFieldDef
    | {
          kind: 'boolean'
          default: boolean
          label: string
          remount?: true
      }
    | {
          kind: 'enum'
          default: string
          options: readonly string[]
          label: string
          remount?: true
      }
    | {
          kind: 'group'
          label: string
          fields: Record<string, TuningFieldDef>
      }

export type TuningSchema = Record<string, TuningFieldDef>

export function defineSceneParams<S extends SceneParamSchema>(s: S): S {
    return s
}

// `const` type parameter so enum option literals survive inference.
export function defineTuning<const S extends TuningSchema>(s: S): S {
    return s
}

type FieldValue<F extends TuningFieldDef> = F extends {
    kind: 'group'
    fields: infer G extends TuningSchema
}
    ? ValuesOf<G>
    : F extends { kind: 'enum'; options: readonly (infer O extends string)[] }
      ? O
      : F extends { kind: 'boolean' }
        ? boolean
        : F extends { kind: 'color' }
          ? string
          : number

export type ValuesOf<S extends TuningSchema> = {
    -readonly [K in keyof S]: FieldValue<S[K]>
}

export type ParamsOf<S extends SceneParamSchema> = ValuesOf<S>

export function defaultsOf<S extends TuningSchema>(s: S): ValuesOf<S> {
    const out = {} as ValuesOf<S>
    for (const key of Object.keys(s) as (keyof S)[]) {
        const f = s[key]!
        out[key] = (f.kind === 'group' ? defaultsOf(f.fields) : f.default) as ValuesOf<S>[typeof key]
    }
    return out
}

type WithKey<F> = F extends TuningFieldDef ? F & { key: string } : never
export type SceneFieldDescriptor = WithKey<SceneFieldDef>
export type TuningFieldDescriptor = WithKey<TuningFieldDef>

export function fieldsOf(s: SceneParamSchema): SceneFieldDescriptor[]
export function fieldsOf(s: TuningSchema): TuningFieldDescriptor[]
export function fieldsOf(s: TuningSchema): TuningFieldDescriptor[] {
    return Object.keys(s).map((key) => ({ key, ...s[key]! }) as TuningFieldDescriptor)
}
