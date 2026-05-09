import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { detectWebGL } from './detect-webgl'
import { backgroundScenes } from './scenes'
import './BackgroundCanvas.css'

type Mode = 'pending' | 'webgl' | 'fallback'

const ACTIVE_SCENE_ID = 'flow-shader'

export function BackgroundCanvas() {
  const scene = backgroundScenes.find((s) => s.id === ACTIVE_SCENE_ID)
  const [mode, setMode] = useState<Mode>('pending')
  const canvasElRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    setMode(detectWebGL(document) ? 'webgl' : 'fallback')
  }, [])

  useEffect(() => {
    if (mode !== 'webgl') return
    const el = canvasElRef.current
    if (!el) return
    const onLost = (e: Event) => {
      e.preventDefault()
      setMode('fallback')
    }
    el.addEventListener('webglcontextlost', onLost)
    return () => el.removeEventListener('webglcontextlost', onLost)
  }, [mode])

  if (!scene) return null
  if (mode === 'pending') return null

  if (mode === 'fallback') {
    return (
      <div className="background-canvas-layer" aria-hidden="true">
        <img
          className="background-canvas-fallback"
          src={scene.fallbackPng}
          alt=""
          decoding="async"
        />
      </div>
    )
  }

  const SceneComponent = scene.Component
  return (
    <div className="background-canvas-layer" aria-hidden="true">
      <Canvas
        gl={{ antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
        onCreated={(state) => {
          canvasElRef.current = state.gl.domElement
        }}
      >
        <SceneComponent />
      </Canvas>
    </div>
  )
}
