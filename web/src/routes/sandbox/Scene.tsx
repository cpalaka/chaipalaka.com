import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSceneEntry, type SceneId } from '../../canvas/scenes/registry'
import type { SceneParamSchema } from '../../canvas/scenes/paramSchema'
import { Tuner } from '../../sandbox/particles/Tuner'

type TunableModule = {
    Scene: React.ComponentType<{ params?: Record<string, unknown> }>
    SCHEMA: SceneParamSchema
}

export default function SandboxScene() {
    const { id } = useParams<{ id: string }>()
    const entry = id ? getSceneEntry(id as SceneId) : undefined
    const tunable = entry?.tunable ? entry : undefined
    const [mod, setMod] = useState<TunableModule | null>(null)

    useEffect(() => {
        if (!tunable) {
            setMod(null)
            return
        }
        let cancelled = false
        tunable.loader().then((m) => {
            if (!cancelled) setMod(m)
        })
        return () => {
            cancelled = true
        }
    }, [tunable])

    if (!tunable) return <NoTunerPanel id={id} />
    if (!mod) return <LoadingPanel />
    return <Tuner schema={mod.SCHEMA} Scene={mod.Scene} />
}

const fullScreen: React.CSSProperties = {
    width: '100vw',
    height: '100vh',
    background: '#0a0a12',
    color: '#c8dde8',
    fontFamily: 'monospace',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: 24,
    boxSizing: 'border-box',
}

function NoTunerPanel({ id }: { id?: string }) {
    return (
        <div style={fullScreen}>
            <div>
                Scene <code style={{ color: '#5fb6c4' }}>{id ?? '(missing)'}</code> has
                no tunable schema.
            </div>
        </div>
    )
}

function LoadingPanel() {
    return <div style={fullScreen}>Loading scene…</div>
}
