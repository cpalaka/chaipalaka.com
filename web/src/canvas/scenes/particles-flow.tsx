import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    DynamicDrawUsage,
    Float32BufferAttribute,
    ShaderMaterial,
} from 'three'
import type { BackgroundScene } from '../types'
import rawManifest from './manifest.json'

interface ManifestEntry {
    id: string
    accentColor: string
    fallbackColors: [string, string]
    fallbackPng: string
}
const manifest = rawManifest as ManifestEntry[]
const SCENE_ID = 'particles-flow'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

import { defineSceneParams, defaultsOf, type ParamsOf } from './paramSchema'

export const SCHEMA = defineSceneParams({
    count:         { kind: 'number', default: 10000,  min: 1000,   max: 60000, step: 1000,   label: 'Count', remount: true },
    pointSize:     { kind: 'range',  default: 0.0034, min: 0.0005, max: 0.008, step: 0.0001, label: 'Point size' },
    fieldScale:    { kind: 'range',  default: 1.4,    min: 0.3,    max: 5,     step: 0.1,    label: 'Field scale (swirl size)' },
    fieldSpeed:    { kind: 'range',  default: 0.2,    min: 0.005,  max: 0.2,   step: 0.005,  label: 'Field evolution speed' },
    particleSpeed: { kind: 'range',  default: 0.001,  min: 0.001,  max: 0.02,  step: 0.001,  label: 'Particle speed' },
    colorA:        { kind: 'color',  default: '#08608c', label: 'Background color' },
    colorB:        { kind: 'color',  default: '#ffffff', label: 'Accent color' },
})

export type FlowParams = ParamsOf<typeof SCHEMA>
export const DEFAULT_PARAMS = defaultsOf(SCHEMA)

// Fast integer-based value noise. Avoids Math.sin for hot-loop performance.
function fastHash(ix: number, iy: number): number {
    let h = (Math.imul(ix, 0x9e3779b9) ^ Math.imul(iy, 0x85ebca6b)) >>> 0
    h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
    return (h >>> 0) / 0xffffffff
}

function valueNoise(x: number, y: number): number {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy
    // smoothstep
    const ux = fx * fx * (3 - 2 * fx)
    const uy = fy * fy * (3 - 2 * fy)
    const a = fastHash(ix, iy)
    const b = fastHash(ix + 1, iy)
    const c = fastHash(ix, iy + 1)
    const d = fastHash(ix + 1, iy + 1)
    return a + (b - a) * ux + (c - a) * uy + (d - b - c + a) * ux * uy
}

// Two offset noise fields create a pseudo-curl direction vector.
function fieldDx(x: number, y: number, t: number, scale: number): number {
    return valueNoise(x * scale, y * scale + 1.3 + t) * 2 - 1
}
function fieldDy(x: number, y: number, t: number, scale: number): number {
    return valueNoise(x * scale + 5.2, y * scale + t) * 2 - 1
}

const VERTEX_SHADER = /* glsl */ `
  uniform float uPixelHeight;
  uniform float uPointSize;
  varying vec2 vPos;

  void main() {
    vPos = position.xy;
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = uPointSize * uPixelHeight;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying vec2 vPos;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    float soft = 1.0 - smoothstep(0.0, 1.0, d);
    // Colour by x-position for a directional hue shift
    float t = clamp(vPos.x * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = mix(uColorA * 1.6, uColorB, t);
    gl_FragColor = vec4(color, soft * 0.7);
  }
`

function buildParticles(count: number): BufferGeometry {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        pos[i * 3] = Math.random() * 2 - 1
        pos[i * 3 + 1] = Math.random() * 2 - 1
        // z = 0 (unused)
    }
    const posAttr = new Float32BufferAttribute(pos, 3)
    posAttr.usage = DynamicDrawUsage
    const geo = new BufferGeometry()
    geo.setAttribute('position', posAttr)
    return geo
}

export function FlowScene({ params }: { params?: Partial<FlowParams> }) {
    const resolved = { ...DEFAULT_PARAMS, ...params }
    const { scene } = useThree()

    const count = resolved.count
    const geo = useMemo(() => buildParticles(count), [count])

    const uniforms = useMemo(
        () => ({
            uColorA: { value: new Color(resolved.colorA) },
            uColorB: { value: new Color(resolved.colorB) },
            uPixelHeight: { value: 720 },
            uPointSize: { value: resolved.pointSize },
        }),
        [],
    )

    const matRef = useRef<ShaderMaterial>(null)
    const tRef = useRef(0)
    const posArrRef = useRef<Float32Array | null>(null)

    useEffect(() => {
        const attr = geo.getAttribute('position')
        posArrRef.current = attr.array as Float32Array
    }, [geo])

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uColorA) mat.uniforms.uColorA.value.set(resolved.colorA)
        if (mat.uniforms.uColorB) mat.uniforms.uColorB.value.set(resolved.colorB)
    }, [resolved.colorA, resolved.colorB])

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uPointSize) mat.uniforms.uPointSize.value = resolved.pointSize
    }, [resolved.pointSize])

    useEffect(() => {
        const prev = scene.background
        scene.background = new Color(resolved.colorA)
        return () => { scene.background = prev }
    }, [resolved.colorA, scene])

    useFrame((state, delta) => {
        const mat = matRef.current
        const pos = posArrRef.current
        if (!mat || !pos) return

        tRef.current += delta * resolved.fieldSpeed
        const t = tRef.current
        const { fieldScale, particleSpeed } = resolved
        const posAttr = geo.getAttribute('position')

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            const x = (pos[i3] as number)
            const y = (pos[i3 + 1] as number)

            const nx = x + fieldDx(x, y, t, fieldScale) * particleSpeed
            const ny = y + fieldDy(x, y, t, fieldScale) * particleSpeed

            // Wrap at soft boundary — teleport to a random edge-seeded position
            if (nx < -1.05 || nx > 1.05 || ny < -1.05 || ny > 1.05) {
                pos[i3] = Math.random() * 2 - 1
                pos[i3 + 1] = Math.random() * 2 - 1
            } else {
                pos[i3] = nx
                pos[i3 + 1] = ny
            }
        }

        posAttr.needsUpdate = true

        if (mat.uniforms.uPixelHeight)
            mat.uniforms.uPixelHeight.value = state.size.height * state.viewport.dpr
    })

    return (
        <points geometry={geo} frustumCulled={false}>
            <shaderMaterial
                ref={matRef}
                uniforms={uniforms}
                vertexShader={VERTEX_SHADER}
                fragmentShader={FRAGMENT_SHADER}
                blending={AdditiveBlending}
                transparent={true}
                depthTest={false}
                depthWrite={false}
            />
        </points>
    )
}

const isDegraded =
    typeof window !== 'undefined' &&
    (window.devicePixelRatio < 1.5 || navigator.hardwareConcurrency < 4)

function FlowGallery() {
    return <FlowScene params={isDegraded ? { count: 10000 } : undefined} />
}

export const particlesFlowScene: BackgroundScene = {
    id: meta.id,
    Component: FlowGallery,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors as readonly [string, string],
    fallbackPng: meta.fallbackPng,
}

export { FlowScene as Scene }
