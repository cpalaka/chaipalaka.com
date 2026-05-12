import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Color, ShaderMaterial, Vector2 } from 'three'
import type { BackgroundScene } from '../types'
import rawManifest from './manifest.json'

interface ManifestEntry {
    id: string
    accentColor: string
    fallbackColors: [string, string]
    fallbackPng: string
}
const manifest = rawManifest as ManifestEntry[]
const SCENE_ID = 'geometric-voronoi'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

const MAX_SITES = 64

export interface VoronoiParams {
    count: number
    driftSpeed: number
    edgeWidth: number
    colorA: string
    colorBorder: string
    colorB: string
}

export const DEFAULT_PARAMS: VoronoiParams = {
    count: 24,
    driftSpeed: 0.04,
    edgeWidth: 0.006,
    colorA: '#0d1520',
    colorBorder: '#4ab0cc',
    colorB: '#1a2a38',
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  #define MAX_SITES ${MAX_SITES}

  uniform vec2 uResolution;
  uniform vec2 uSites[MAX_SITES];
  uniform int uCount;
  uniform float uEdgeWidth;
  uniform vec3 uColorA;
  uniform vec3 uColorBorder;
  uniform vec3 uColorB;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv = (vUv - 0.5) * asp;

    float d1 = 1.0e9;
    float d2 = 1.0e9;
    int nearest = 0;

    for (int i = 0; i < MAX_SITES; i++) {
      if (i >= uCount) break;
      vec2 site = (uSites[i] - 0.5) * asp;
      float d = length(uv - site);
      if (d < d1) { d2 = d1; d1 = d; nearest = i; }
      else if (d < d2) { d2 = d; }
    }

    // Edge: where two cells almost meet
    float edge = smoothstep(uEdgeWidth * 0.5, uEdgeWidth * 1.5, d2 - d1);
    edge = 1.0 - edge;

    // Subtle fill tint per cell
    float tint = hash(vec2(float(nearest) * 17.3, float(nearest) * 31.7)) * 0.12;
    vec3 fill = mix(uColorA, uColorB, tint);

    gl_FragColor = vec4(mix(fill, uColorBorder, edge), 1.0);
  }
`

export function VoronoiScene({ params }: { params?: Partial<VoronoiParams> }) {
    const resolved = { ...DEFAULT_PARAMS, ...params }
    const { scene } = useThree()

    // Site positions and velocities in [0,1]x[0,1]
    const { positions, velocities } = useMemo(() => {
        const positions = new Float32Array(MAX_SITES * 2)
        const velocities = new Float32Array(MAX_SITES * 2)
        let rng = 0xabcd1234
        const rand = () => { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return (rng >>> 0) / 0xffffffff }
        for (let i = 0; i < MAX_SITES; i++) {
            positions[i * 2] = rand()
            positions[i * 2 + 1] = rand()
            const angle = rand() * Math.PI * 2
            velocities[i * 2] = Math.cos(angle)
            velocities[i * 2 + 1] = Math.sin(angle)
        }
        return { positions, velocities }
    }, [])

    // Pre-allocated Vector2 array for the uniform (updated in-place each frame)
    const sitesUniform = useMemo(() =>
        Array.from({ length: MAX_SITES }, () => new Vector2()), [])

    const uniforms = useMemo(() => ({
        uResolution: { value: new Vector2(1, 1) },
        uSites: { value: sitesUniform },
        uCount: { value: resolved.count },
        uEdgeWidth: { value: resolved.edgeWidth },
        uColorA: { value: new Color(resolved.colorA) },
        uColorBorder: { value: new Color(resolved.colorBorder) },
        uColorB: { value: new Color(resolved.colorB) },
    }), [])

    const matRef = useRef<ShaderMaterial>(null)

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uCount) mat.uniforms.uCount.value = resolved.count
        if (mat.uniforms.uEdgeWidth) mat.uniforms.uEdgeWidth.value = resolved.edgeWidth
    }, [resolved.count, resolved.edgeWidth])

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uColorA) mat.uniforms.uColorA.value.set(resolved.colorA)
        if (mat.uniforms.uColorBorder) mat.uniforms.uColorBorder.value.set(resolved.colorBorder)
        if (mat.uniforms.uColorB) mat.uniforms.uColorB.value.set(resolved.colorB)
    }, [resolved.colorA, resolved.colorBorder, resolved.colorB])

    useEffect(() => {
        const prev = scene.background
        scene.background = new Color(resolved.colorA)
        return () => { scene.background = prev }
    }, [resolved.colorA, scene])

    const countRef = useRef(resolved.count)
    const speedRef = useRef(resolved.driftSpeed)
    useEffect(() => { countRef.current = resolved.count }, [resolved.count])
    useEffect(() => { speedRef.current = resolved.driftSpeed }, [resolved.driftSpeed])

    const lastTimeRef = useRef(0)

    useFrame((state) => {
        const mat = matRef.current
        if (!mat) return

        const t = state.clock.elapsedTime
        const dt = Math.min(t - lastTimeRef.current, 0.05)
        lastTimeRef.current = t

        const count = countRef.current
        const speed = speedRef.current

        for (let i = 0; i < count; i++) {
            let px = positions[i * 2] as number
            let py = positions[i * 2 + 1] as number
            let vx = velocities[i * 2] as number
            let vy = velocities[i * 2 + 1] as number

            px += vx * speed * dt
            py += vy * speed * dt

            if (px < 0 || px > 1) { vx = -vx; px = Math.max(0, Math.min(1, px)) }
            if (py < 0 || py > 1) { vy = -vy; py = Math.max(0, Math.min(1, py)) }

            positions[i * 2] = px
            positions[i * 2 + 1] = py
            velocities[i * 2] = vx
            velocities[i * 2 + 1] = vy

            ;(sitesUniform[i] as Vector2).set(px, py)
        }

        if (mat.uniforms.uResolution)
            mat.uniforms.uResolution.value.set(state.size.width, state.size.height)
    })

    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={matRef}
                uniforms={uniforms}
                vertexShader={VERTEX_SHADER}
                fragmentShader={FRAGMENT_SHADER}
                depthTest={false}
                depthWrite={false}
            />
        </mesh>
    )
}

const isDegraded =
    typeof window !== 'undefined' &&
    (window.devicePixelRatio < 1.5 || navigator.hardwareConcurrency < 4)

function VoronoiGallery() {
    return <VoronoiScene params={isDegraded ? { count: 16 } : undefined} />
}

export const geometricVoronoiScene: BackgroundScene = {
    id: meta.id,
    Component: VoronoiGallery,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors as readonly [string, string],
    fallbackPng: meta.fallbackPng,
}
