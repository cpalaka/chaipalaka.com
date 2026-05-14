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

export function defineSceneParams<S extends SceneParamSchema>(s: S): S {
    return s
}

type FieldValue<F extends SceneFieldDef> = F['kind'] extends 'color' ? string : number

export type ParamsOf<S extends SceneParamSchema> = {
    [K in keyof S]: FieldValue<S[K]>
}

export function defaultsOf<S extends SceneParamSchema>(s: S): ParamsOf<S> {
    const out = {} as ParamsOf<S>
    for (const key of Object.keys(s) as (keyof S)[]) {
        out[key] = s[key]!.default as ParamsOf<S>[typeof key]
    }
    return out
}

type WithKey<F> = F extends SceneFieldDef ? F & { key: string } : never
export type SceneFieldDescriptor = WithKey<SceneFieldDef>

export function fieldsOf<S extends SceneParamSchema>(s: S): SceneFieldDescriptor[] {
    return Object.keys(s).map((key) => ({ key, ...s[key]! }) as SceneFieldDescriptor)
}
