import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
    Color,
    DataTexture,
    FloatType,
    OrthographicCamera,
    PlaneGeometry,
    Mesh,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    Vector2,
    WebGLRenderTarget,
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
const SCENE_ID = 'geometric-reaction-diffusion'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

import { defineSceneParams, defaultsOf, type ParamsOf } from './paramSchema'

export const SCHEMA = defineSceneParams({
    simRes:        { kind: 'number', default: 128,   min: 64,   max: 512,  step: 64,   label: 'Sim resolution', remount: true },
    feed:          { kind: 'range',  default: 0.026, min: 0.01, max: 0.08, step: 0.001, label: 'Feed (F)' },
    kill:          { kind: 'range',  default: 0.058, min: 0.04, max: 0.08, step: 0.001, label: 'Kill (K)' },
    diffA:         { kind: 'range',  default: 0.55,  min: 0.1,  max: 2.0,  step: 0.05, label: 'Diff A' },
    diffB:         { kind: 'range',  default: 0.25,  min: 0.05, max: 1.5,  step: 0.05, label: 'Diff B' },
    stepsPerFrame: { kind: 'number', default: 4,     min: 1,    max: 12,   step: 1,    label: 'Steps/frame' },
    seedCount:     { kind: 'number', default: 10,    min: 1,    max: 60,   step: 1,    label: 'Seed blobs', remount: true },
    colorA:        { kind: 'color',  default: '#ffd6d6', label: 'Background color' },
    colorB:        { kind: 'color',  default: '#d0b9df', label: 'Pattern color' },
})

export type ReactionDiffusionParams = ParamsOf<typeof SCHEMA>
export const DEFAULT_PARAMS = defaultsOf(SCHEMA)

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

const SIM_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uState;
  uniform vec2 uTexelSize;
  uniform float uFeed;
  uniform float uKill;
  uniform float uDiffA;
  uniform float uDiffB;

  void main() {
    vec2 uv = vUv;
    vec4 s = texture2D(uState, uv);
    float a = s.r;
    float b = s.g;

    vec2 t = uTexelSize;

    // 9-point Laplacian for better isotropy
    float lapA =
        0.05 * (texture2D(uState, uv + vec2(-t.x,-t.y)).r +
                texture2D(uState, uv + vec2( t.x,-t.y)).r +
                texture2D(uState, uv + vec2(-t.x, t.y)).r +
                texture2D(uState, uv + vec2( t.x, t.y)).r)
      + 0.20 * (texture2D(uState, uv + vec2(-t.x, 0.0)).r +
                texture2D(uState, uv + vec2( t.x, 0.0)).r +
                texture2D(uState, uv + vec2( 0.0,-t.y)).r +
                texture2D(uState, uv + vec2( 0.0, t.y)).r)
      - 1.0  * a;

    float lapB =
        0.05 * (texture2D(uState, uv + vec2(-t.x,-t.y)).g +
                texture2D(uState, uv + vec2( t.x,-t.y)).g +
                texture2D(uState, uv + vec2(-t.x, t.y)).g +
                texture2D(uState, uv + vec2( t.x, t.y)).g)
      + 0.20 * (texture2D(uState, uv + vec2(-t.x, 0.0)).g +
                texture2D(uState, uv + vec2( t.x, 0.0)).g +
                texture2D(uState, uv + vec2( 0.0,-t.y)).g +
                texture2D(uState, uv + vec2( 0.0, t.y)).g)
      - 1.0  * b;

    float abb = a * b * b;
    float newA = clamp(a + uDiffA * lapA - abb + uFeed * (1.0 - a), 0.0, 1.0);
    float newB = clamp(b + uDiffB * lapB + abb - (uFeed + uKill) * b, 0.0, 1.0);

    gl_FragColor = vec4(newA, newB, 0.0, 1.0);
  }
`

const DISPLAY_SHADER = /* glsl */ `
  precision mediump float;
  varying vec2 vUv;

  uniform sampler2D uState;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    float b = texture2D(uState, vUv).g;
    float t = smoothstep(0.05, 0.45, b);
    gl_FragColor = vec4(mix(uColorA, uColorB, t), 1.0);
  }
`

function createSeedTexture(res: number, seedCount: number): DataTexture {
    const data = new Float32Array(res * res * 4)
    for (let i = 0; i < res * res; i++) {
        data[i * 4] = 1.0  // A = 1
        data[i * 4 + 1] = 0.0 // B = 0
    }
    // Deterministic seed blobs
    let rng = 0xdeadbeef
    const rand = () => { rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5; return (rng >>> 0) / 0xffffffff }
    for (let s = 0; s < seedCount; s++) {
        const cx = Math.floor(rand() * res)
        const cy = Math.floor(rand() * res)
        const r = 4 + Math.floor(rand() * 6)
        for (let dy = -r; dy <= r; dy++) {
            for (let dx = -r; dx <= r; dx++) {
                if (dx * dx + dy * dy <= r * r) {
                    const x = ((cx + dx) % res + res) % res
                    const y = ((cy + dy) % res + res) % res
                    data[(y * res + x) * 4] = 0.0
                    data[(y * res + x) * 4 + 1] = 1.0
                }
            }
        }
    }
    const tex = new DataTexture(data, res, res, RGBAFormat, FloatType)
    tex.needsUpdate = true
    return tex
}

export function ReactionDiffusionScene({ params }: { params?: Partial<ReactionDiffusionParams> }) {
    const resolved = { ...DEFAULT_PARAMS, ...params }
    const { scene } = useThree()

    const [rtA, rtB] = useMemo(() => {
        const res = resolved.simRes
        const a = new WebGLRenderTarget(res, res, { type: FloatType, format: RGBAFormat, depthBuffer: false })
        const b = new WebGLRenderTarget(res, res, { type: FloatType, format: RGBAFormat, depthBuffer: false })
        return [a, b] as const
    }, [resolved.simRes])

    useEffect(() => () => { rtA.dispose(); rtB.dispose() }, [rtA, rtB])

    const seedTexture = useMemo(() => createSeedTexture(resolved.simRes, resolved.seedCount), [resolved.simRes, resolved.seedCount])
    useEffect(() => () => seedTexture.dispose(), [seedTexture])

    // Separate Three.js scene for the simulation ping-pong passes
    const simScene = useMemo(() => new Scene(), [])
    const simCamera = useMemo(() => new OrthographicCamera(-1, 1, 1, -1, 0, 1), [])

    const simMaterial = useMemo(() => new ShaderMaterial({
        uniforms: {
            uState: { value: null },
            uTexelSize: { value: new Vector2(1 / resolved.simRes, 1 / resolved.simRes) },
            uFeed: { value: resolved.feed },
            uKill: { value: resolved.kill },
            uDiffA: { value: resolved.diffA },
            uDiffB: { value: resolved.diffB },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: SIM_SHADER,
        depthTest: false,
        depthWrite: false,
    }), [])

    useEffect(() => {
        const geo = new PlaneGeometry(2, 2)
        const mesh = new Mesh(geo, simMaterial)
        simScene.add(mesh)
        return () => { geo.dispose(); simScene.remove(mesh) }
    }, [simScene, simMaterial])

    useEffect(() => () => simMaterial.dispose(), [simMaterial])

    // Sync simulation params to uniforms
    useEffect(() => {
        const u = simMaterial.uniforms
        if (u.uFeed) u.uFeed.value = resolved.feed
        if (u.uKill) u.uKill.value = resolved.kill
    }, [resolved.feed, resolved.kill, simMaterial])

    useEffect(() => {
        const u = simMaterial.uniforms
        if (u.uDiffA) u.uDiffA.value = resolved.diffA
        if (u.uDiffB) u.uDiffB.value = resolved.diffB
    }, [resolved.diffA, resolved.diffB, simMaterial])

    // Display material (lives in the R3F scene graph via JSX)
    const displayUniforms = useMemo(() => ({
        uState: { value: null },
        uColorA: { value: new Color(resolved.colorA) },
        uColorB: { value: new Color(resolved.colorB) },
    }), [])
    const dispMatRef = useRef<ShaderMaterial>(null)

    useEffect(() => {
        const mat = dispMatRef.current
        if (!mat) return
        if (mat.uniforms.uColorA) mat.uniforms.uColorA.value.set(resolved.colorA)
        if (mat.uniforms.uColorB) mat.uniforms.uColorB.value.set(resolved.colorB)
    }, [resolved.colorA, resolved.colorB])

    useEffect(() => {
        const prev = scene.background
        scene.background = new Color(resolved.colorA)
        return () => { scene.background = prev }
    }, [resolved.colorA, scene])

    // readIdx: which RT (0=rtA, 1=rtB) holds the most recent sim state.
    // -1 means "use seedTexture for the first pass".
    const rtsRef = useRef([rtA, rtB])
    const readIdxRef = useRef(-1)

    useEffect(() => {
        rtsRef.current = [rtA, rtB]
        readIdxRef.current = -1  // restart sim on RT rebuild
    }, [rtA, rtB, seedTexture])

    const seedTexRef = useRef(seedTexture)
    useEffect(() => { seedTexRef.current = seedTexture }, [seedTexture])

    const stepsRef = useRef(resolved.stepsPerFrame)
    useEffect(() => { stepsRef.current = resolved.stepsPerFrame }, [resolved.stepsPerFrame])

    useFrame(({ gl }) => {
        const rts = rtsRef.current
        const steps = stepsRef.current

        for (let i = 0; i < steps; i++) {
            const readIdx = readIdxRef.current
            const writeIdx = readIdx === -1 ? 0 : 1 - readIdx
            const src = readIdx === -1 ? seedTexRef.current : (rts[readIdx] as WebGLRenderTarget).texture
            if (simMaterial.uniforms.uState) simMaterial.uniforms.uState.value = src

            const writeRT = rts[writeIdx] as WebGLRenderTarget
            gl.setRenderTarget(writeRT)
            gl.render(simScene, simCamera)
            readIdxRef.current = writeIdx
        }

        gl.setRenderTarget(null)

        const dispMat = dispMatRef.current
        const rIdx = readIdxRef.current
        if (dispMat && rIdx !== -1 && dispMat.uniforms.uState) {
            dispMat.uniforms.uState.value = (rts[rIdx] as WebGLRenderTarget).texture
        }
    })

    return (
        <mesh frustumCulled={false}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={dispMatRef}
                uniforms={displayUniforms}
                vertexShader={VERTEX_SHADER}
                fragmentShader={DISPLAY_SHADER}
                depthTest={false}
                depthWrite={false}
            />
        </mesh>
    )
}

const isDegraded =
    typeof window !== 'undefined' &&
    (window.devicePixelRatio < 1.5 || navigator.hardwareConcurrency < 4)

function ReactionDiffusionGallery() {
    return <ReactionDiffusionScene params={isDegraded ? { stepsPerFrame: 2 } : undefined} />
}

export const geometricReactionDiffusionScene: BackgroundScene = {
    id: meta.id,
    Component: ReactionDiffusionGallery,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors as readonly [string, string],
    fallbackPng: meta.fallbackPng,
}

export { ReactionDiffusionScene as Scene }
