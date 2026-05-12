import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
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

// === TUNABLE CONSTANTS ===
export interface CursorParams {
    cols: number
    rows: number
    pointSize: number
    repelRadius: number
    repelStrength: number
    returnSpeed: number
    colorA: string
    colorB: string
}

export const DEFAULT_PARAMS: CursorParams = {
    cols: 120,
    rows: 80,
    pointSize: 0.003,
    repelRadius: 0.18,
    repelStrength: 0.06,
    returnSpeed: 4.0,
    colorA: '#0e0816',
    colorB: '#d04ba6',
}

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

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vT;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    float soft = 1.0 - smoothstep(0.3, 1.0, d);
    vec3 color = mix(uColorA, uColorB, vT);
    gl_FragColor = vec4(color, soft * mix(0.5, 1.0, vT));
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
            uColorA: { value: new Color(resolved.colorA) },
            uColorB: { value: new Color(resolved.colorB) },
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
    }, [resolved.repelRadius, resolved.pointSize])

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uColorA) mat.uniforms.uColorA.value.set(resolved.colorA)
        if (mat.uniforms.uColorB) mat.uniforms.uColorB.value.set(resolved.colorB)
    }, [resolved.colorA, resolved.colorB])

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

const DEGRADED_COLS = Math.round(DEFAULT_PARAMS.cols * 0.6)
const DEGRADED_ROWS = Math.round(DEFAULT_PARAMS.rows * 0.6)

function CursorGallery() {
    return (
        <CursorScene
            params={isDegraded ? { cols: DEGRADED_COLS, rows: DEGRADED_ROWS } : undefined}
        />
    )
}

export const particlesCursorScene: BackgroundScene = {
    id: meta.id,
    Component: CursorGallery,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors as readonly [string, string],
    fallbackPng: meta.fallbackPng,
}
