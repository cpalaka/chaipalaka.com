import { Canvas } from '@react-three/fiber'
import { useState, type ComponentType } from 'react'
import {
    defaultsOf,
    fieldsOf,
    type SceneParamSchema,
} from '../../canvas/scenes/paramSchema'
import { TunePanel } from './TunePanel'

type Params = Record<string, unknown>

interface Props {
    schema: SceneParamSchema
    Scene: ComponentType<{ params?: Params }>
}

function remountKey(schema: SceneParamSchema, params: Params): string | undefined {
    const remountKeys = Object.keys(schema).filter((k) => schema[k]!.remount === true)
    if (remountKeys.length === 0) return undefined
    return remountKeys.map((k) => String(params[k])).join('|')
}

export function Tuner({ schema, Scene }: Props) {
    const [params, setParams] = useState<Params>(() => defaultsOf(schema))

    function handleChange(patch: Partial<Params>) {
        setParams((prev) => ({ ...prev, ...patch }))
    }

    function handleDump() {
        console.log('Tuner params:', JSON.stringify(params, null, 2))
    }

    const canvasKey = remountKey(schema, params)
    const bg = params.colorA as string | undefined
    const fields = fieldsOf(schema)

    return (
        <div style={{ width: '100vw', height: '100vh', background: bg ?? '#000' }}>
            <Canvas
                key={canvasKey}
                gl={{ antialias: false, powerPreference: 'low-power' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
            >
                <Scene params={params} />
            </Canvas>
            <TunePanel
                fields={fields}
                params={params}
                onChange={handleChange}
                onDump={handleDump}
            />
        </div>
    )
}
