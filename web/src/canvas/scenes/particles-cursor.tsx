import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    DynamicDrawUsage,
    Float32BufferAttribute,
    ShaderMaterial,
    Vector2,
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
const SCENE_ID = 'particles-cursor'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

import { defineSceneParams, defaultsOf, type ParamsOf } from './paramSchema'

export const SCHEMA = defineSceneParams({
    cols:           { kind: 'number', default: 120,   min: 20,    max: 300, step: 10,     label: 'Columns', remount: true },
    rows:           { kind: 'number', default: 80,    min: 20,    max: 200, step: 10,     label: 'Rows', remount: true },
    pointSize:      { kind: 'range',  default: 0.004, min: 0.001, max: 0.015, step: 0.0005, label: 'Point size' },
    repelRadius:    { kind: 'range',  default: 0.22,  min: 0.05,  max: 0.5,   step: 0.01,   label: 'Repel radius' },
    repelStrength:  { kind: 'range',  default: 0.01,  min: 0.01,  max: 0.2,   step: 0.005,  label: 'Repel strength' },
    returnSpeed:    { kind: 'range',  default: 0.5,   min: 0.5,   max: 15,    step: 0.5,    label: 'Return speed' },
    restBrightness: { kind: 'range',  default: 0.4,   min: 0,     max: 1,     step: 0.05,   label: 'Rest brightness' },
    restAlpha:      { kind: 'range',  default: 0.65,  min: 0,     max: 1,     step: 0.05,   label: 'Rest alpha' },
    colorA:         { kind: 'color',  default: '#0e0816', label: 'Background color' },
    colorB:         { kind: 'color',  default: '#25db00', label: 'Accent color' },
})

export type CursorParams = ParamsOf<typeof SCHEMA>
export const DEFAULT_PARAMS = defaultsOf(SCHEMA)

const VERTEX_SHADER = /* glsl */ `
  attribute vec2 aLattice;  // rest position in NDC [-1,1]
  attribute vec2 aDisplace; // current displacement (updated CPU-side)

  uniform vec2 uPointer;
  uniform float uRepelRadius;
  uniform float uPixelHeight;
  uniform float uPointSize;

  varying float vT;

  void main() {
    vec2 pos = aLattice + aDisplace;
    gl_Position = vec4(pos, 0.0, 1.0);

    float d = length(uPointer - pos);
    vT = 1.0 - smoothstep(0.0, uRepelRadius, d);

    gl_PointSize = uPointSize * uPixelHeight;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform vec3 uColorB;
  uniform float uRestBrightness;
  uniform float uRestAlpha;

  varying float vT;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    float soft = 1.0 - smoothstep(0.3, 1.0, d);
    vec3 color = mix(uColorB * uRestBrightness, uColorB, vT);
    gl_FragColor = vec4(color, soft * mix(uRestAlpha, 1.0, vT));
  }
`

function buildLattice(cols: number, rows: number): BufferGeometry {
    const count = cols * rows
    const lattice = new Float32Array(count * 2)
    const pos = new Float32Array(count * 3) // satisfies THREE.js internal checks

    let i = 0
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            lattice[i * 2] = (col / (cols - 1)) * 2 - 1
            lattice[i * 2 + 1] = (row / (rows - 1)) * 2 - 1
            i++
        }
    }

    const dispAttr = new Float32BufferAttribute(new Float32Array(count * 2), 2)
    dispAttr.usage = DynamicDrawUsage

    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    geo.setAttribute('aLattice', new Float32BufferAttribute(lattice, 2))
    geo.setAttribute('aDisplace', dispAttr)
    return geo
}

export function CursorScene({ params }: { params?: Partial<CursorParams> }) {
    const resolved = { ...DEFAULT_PARAMS, ...params }
    const { scene } = useThree()

    const { cols, rows } = resolved
    const count = cols * rows

    const geo = useMemo(() => buildLattice(cols, rows), [cols, rows])

    const uniforms = useMemo(
        () => ({
            uPointer: { value: new Vector2(999, 999) },
            uRepelRadius: { value: resolved.repelRadius },
            uPixelHeight: { value: 720 },
            uPointSize: { value: resolved.pointSize },
            uColorB: { value: new Color(resolved.colorB) },
            uRestBrightness: { value: resolved.restBrightness },
            uRestAlpha: { value: resolved.restAlpha },
        }),
        [],
    )

    const matRef = useRef<ShaderMaterial>(null)
    // Per-particle displacement (x,y) — updated every frame, uploaded to GPU
    const displaceRef = useRef(new Float32Array(count * 2))
    const pointerRef = useRef(new Vector2(999, 999))
    // Cache lattice array for direct access in the hot loop
    const latticeArrRef = useRef<Float32Array | null>(null)

    useEffect(() => {
        const attr = geo.getAttribute('aLattice')
        latticeArrRef.current = attr.array as Float32Array
        // Reset displacement buffer when geometry changes
        displaceRef.current = new Float32Array(count * 2)
    }, [geo, count])

    useEffect(() => {
        function onMove(e: PointerEvent) {
            const x = (e.clientX / window.innerWidth) * 2 - 1
            const y = -((e.clientY / window.innerHeight) * 2 - 1)
            pointerRef.current.set(x, y)
        }
        window.addEventListener('pointermove', onMove)
        return () => window.removeEventListener('pointermove', onMove)
    }, [])

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uRepelRadius) mat.uniforms.uRepelRadius.value = resolved.repelRadius
        if (mat.uniforms.uPointSize) mat.uniforms.uPointSize.value = resolved.pointSize
        if (mat.uniforms.uRestBrightness) mat.uniforms.uRestBrightness.value = resolved.restBrightness
        if (mat.uniforms.uRestAlpha) mat.uniforms.uRestAlpha.value = resolved.restAlpha
    }, [resolved.repelRadius, resolved.pointSize, resolved.restBrightness, resolved.restAlpha])

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uColorB) mat.uniforms.uColorB.value.set(resolved.colorB)
    }, [resolved.colorB])

    useEffect(() => {
        const prev = scene.background
        scene.background = new Color(resolved.colorA)
        return () => { scene.background = prev }
    }, [resolved.colorA, scene])

    useFrame((state, delta) => {
        const mat = matRef.current
        const lattice = latticeArrRef.current
        if (!mat || !lattice) return

        const disp = displaceRef.current
        const dispAttr = geo.getAttribute('aDisplace')
        const { repelRadius, repelStrength, returnSpeed } = resolved
        const px = pointerRef.current.x
        const py = pointerRef.current.y
        const decay = Math.exp(-returnSpeed * delta)

        for (let i = 0; i < count; i++) {
            const i2 = i * 2
            // noUncheckedIndexedAccess: read into locals, write back with =
            const lx = (lattice[i2] as number)
            const ly = (lattice[i2 + 1] as number)
            let ddx = (disp[i2] as number)
            let ddy = (disp[i2 + 1] as number)

            const cx = lx + ddx
            const cy = ly + ddy
            const dx = cx - px
            const dy = cy - py
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < repelRadius && dist > 1e-6) {
                const force = (1 - dist / repelRadius) * repelStrength
                ddx += (dx / dist) * force
                ddy += (dy / dist) * force
            }

            disp[i2] = ddx * decay
            disp[i2 + 1] = ddy * decay
        }

        const f32 = dispAttr.array as Float32Array
        f32.set(disp)
        dispAttr.needsUpdate = true

        if (mat.uniforms.uPointer) mat.uniforms.uPointer.value.copy(pointerRef.current)
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

function calcDims(scale = 1) {
    if (typeof window === 'undefined') return { cols: 120, rows: 80 }
    return {
        cols: Math.round(window.innerWidth / 10 * scale),
        rows: Math.round(window.innerHeight / 10 * scale),
    }
}

function CursorGallery() {
    const [dims, setDims] = useState(() => calcDims(isDegraded ? 0.6 : 1))

    useEffect(() => {
        function onResize() {
            setDims(calcDims(isDegraded ? 0.6 : 1))
        }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    return <CursorScene params={dims} />
}

export const particlesCursorScene: BackgroundScene = {
    id: meta.id,
    Component: CursorGallery,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors as readonly [string, string],
    fallbackPng: meta.fallbackPng,
}

export { CursorScene as Scene }
