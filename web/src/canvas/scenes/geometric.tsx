import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, ShaderMaterial, Vector2 } from 'three'
import type { BackgroundScene } from '../types'
import rawManifest from './manifest.json'

interface SceneManifestEntry {
    id: string
    accentColor: string
    fallbackColors: readonly [string, string]
    fallbackPng: string
}
const manifest = rawManifest as unknown as readonly SceneManifestEntry[]

const SCENE_ID = 'geometric'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Diagonal square grid scrolling with a subtle sine warp.
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv = (vUv - 0.5) * aspect;

    float t = uTime * 0.08;

    // Warp the UV slightly for an organic feel.
    float warpX = sin(uv.y * 4.0 + t * 1.3) * 0.04;
    float warpY = sin(uv.x * 4.0 + t) * 0.04;
    vec2 warped = uv + vec2(warpX, warpY);

    // Diagonal scroll.
    vec2 scrolled = warped + vec2(t, t * 0.7);

    // Grid lines — both axis-aligned and diagonal.
    float cellSize = 0.12;
    vec2 grid = fract(scrolled / cellSize);
    float lineWidth = 0.04;
    float lineX = smoothstep(0.0, lineWidth, grid.x) - smoothstep(1.0 - lineWidth, 1.0, grid.x);
    float lineY = smoothstep(0.0, lineWidth, grid.y) - smoothstep(1.0 - lineWidth, 1.0, grid.y);
    float lines = 1.0 - lineX * lineY;

    // Dim the grid toward the edges.
    float vignette = 1.0 - smoothstep(0.3, 0.8, length(uv));

    float mask = lines * vignette;
    vec3 color = mix(uColorA, uColorB, mask);
    gl_FragColor = vec4(color, 1.0);
  }
`

function Geometric() {
    const ref = useRef<ShaderMaterial>(null)
    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uResolution: { value: new Vector2(1, 1) },
            uColorA: { value: new Color(meta!.fallbackColors[0]) },
            uColorB: { value: new Color(meta!.fallbackColors[1]) },
        }),
        [],
    )
    useFrame((state) => {
        const mat = ref.current
        if (!mat) return
        const u = mat.uniforms
        if (u.uTime) u.uTime.value = state.clock.elapsedTime
        if (u.uResolution)
            u.uResolution.value.set(state.size.width, state.size.height)
    })
    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={ref}
                uniforms={uniforms}
                vertexShader={VERTEX_SHADER}
                fragmentShader={FRAGMENT_SHADER}
                depthTest={false}
                depthWrite={false}
            />
        </mesh>
    )
}

export const geometricScene: BackgroundScene = {
    id: meta.id,
    Component: Geometric,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors,
    fallbackPng: meta.fallbackPng,
}
