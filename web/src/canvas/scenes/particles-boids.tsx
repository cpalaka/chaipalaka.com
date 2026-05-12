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
const SCENE_ID = 'particles-boids'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

// === TUNABLE CONSTANTS ===
export interface BoidsParams {
    count: number
    pointSize: number
    perceptionRadius: number  // neighbourhood radius in NDC
    separationWeight: number
    alignmentWeight: number
    cohesionWeight: number
    maxSpeed: number          // NDC units/sec
    maxForce: number          // acceleration cap, NDC units/sec²
    colorA: string
    colorB: string
}

export const DEFAULT_PARAMS: BoidsParams = {
    count: 5500,
    pointSize: 0.0025,
    perceptionRadius: 0.11,
    separationWeight: 1.1,
    alignmentWeight: 0.2,
    cohesionWeight: 0.1,
    maxSpeed: 0.1,
    maxForce: 1.3,
    colorA: '#0c2036',
    colorB: '#ddba92',
}

// ---- Spatial hash grid for O(N) boid neighbourhood queries ----

class SpatialGrid {
    cellSize: number
    cells: Map<number, number[]>

    constructor(cellSize: number) {
        this.cellSize = cellSize
        this.cells = new Map()
    }

    private key(cx: number, cy: number): number {
        // Pack two small integers into one: grid is ~[-1,1] / cellSize ≈ 25 cells each axis
        return (cx + 64) * 128 + (cy + 64)
    }

    cell(x: number, y: number): [number, number] {
        return [Math.floor(x / this.cellSize), Math.floor(y / this.cellSize)]
    }

    clear(): void {
        this.cells.clear()
    }

    insert(x: number, y: number, idx: number): void {
        const [cx, cy] = this.cell(x, y)
        const k = this.key(cx, cy)
        let arr = this.cells.get(k)
        if (!arr) {
            arr = []
            this.cells.set(k, arr)
        }
        arr.push(idx)
    }

    query(x: number, y: number, radius: number, out: number[]): void {
        out.length = 0
        const [cx, cy] = this.cell(x, y)
        const cr = Math.ceil(radius / this.cellSize)
        for (let dx = -cr; dx <= cr; dx++) {
            for (let dy = -cr; dy <= cr; dy++) {
                const k = this.key(cx + dx, cy + dy)
                const arr = this.cells.get(k)
                if (arr) {
                    for (let i = 0; i < arr.length; i++) {
                        out.push(arr[i] as number)
                    }
                }
            }
        }
    }
}

// ---- Pure boids step (exported for testing) ----
export interface BoidsState {
    px: Float32Array  // x positions
    py: Float32Array  // y positions
    vx: Float32Array  // x velocities (NDC/sec)
    vy: Float32Array  // y velocities (NDC/sec)
    count: number
}

export function boidsStep(
    state: BoidsState,
    dt: number,
    params: BoidsParams,
    grid: SpatialGrid,
): void {
    const { px, py, vx, vy, count } = state
    const { perceptionRadius, separationWeight, alignmentWeight, cohesionWeight, maxSpeed, maxForce } = params
    const r2 = perceptionRadius * perceptionRadius

    // Build spatial grid
    grid.clear()
    for (let i = 0; i < count; i++) {
        grid.insert(px[i] as number, py[i] as number, i)
    }

    const neighbours: number[] = []
    const ax = new Float32Array(count)
    const ay = new Float32Array(count)

    for (let i = 0; i < count; i++) {
        const x = px[i] as number
        const y = py[i] as number
        grid.query(x, y, perceptionRadius, neighbours)

        let sepX = 0, sepY = 0, sepN = 0
        let aliX = 0, aliY = 0
        let cohX = 0, cohY = 0, cohN = 0

        for (let ni = 0; ni < neighbours.length; ni++) {
            const j = neighbours[ni] as number
            if (j === i) continue
            const jx = px[j] as number
            const jy = py[j] as number
            const dx = x - jx
            const dy = y - jy
            const d2 = dx * dx + dy * dy
            if (d2 >= r2 || d2 < 1e-9) continue

            const d = Math.sqrt(d2)
            // Separation — steer away, weighted inversely by distance
            sepX += (dx / d) * (1 - d / perceptionRadius)
            sepY += (dy / d) * (1 - d / perceptionRadius)
            sepN++

            // Alignment — match velocity
            aliX += vx[j] as number
            aliY += vy[j] as number

            // Cohesion — steer toward centre of mass
            cohX += jx
            cohY += jy
            cohN++
        }

        let forceX = 0
        let forceY = 0

        if (sepN > 0) {
            const inv = 1 / sepN
            forceX += sepX * inv * separationWeight
            forceY += sepY * inv * separationWeight
        }
        if (cohN > 0) {
            const inv = 1 / cohN
            // Cohesion: steer toward average position
            const toX = cohX * inv - x
            const toY = cohY * inv - y
            const td = Math.sqrt(toX * toX + toY * toY) || 1
            forceX += (toX / td) * cohesionWeight
            forceY += (toY / td) * cohesionWeight
            // Alignment: match average velocity
            const alen = Math.sqrt(aliX * aliX + aliY * aliY) || 1
            forceX += (aliX / alen) * alignmentWeight
            forceY += (aliY / alen) * alignmentWeight
        }

        // Clamp acceleration
        const fLen = Math.sqrt(forceX * forceX + forceY * forceY)
        if (fLen > maxForce) {
            forceX = (forceX / fLen) * maxForce
            forceY = (forceY / fLen) * maxForce
        }

        ax[i] = forceX
        ay[i] = forceY

        // Wrap boundary push: soft toroidal wrap with a margin
        const margin = 0.1
        if (x < -1 + margin) forceX += (margin - (x + 1)) * 2
        if (x > 1 - margin) forceX -= (margin - (1 - x)) * 2
        if (y < -1 + margin) forceY += (margin - (y + 1)) * 2
        if (y > 1 - margin) forceY -= (margin - (1 - y)) * 2
        ax[i] = forceX
        ay[i] = forceY
    }

    // Integrate
    for (let i = 0; i < count; i++) {
        let nvx = (vx[i] as number) + (ax[i] as number) * dt
        let nvy = (vy[i] as number) + (ay[i] as number) * dt
        const spd = Math.sqrt(nvx * nvx + nvy * nvy)
        if (spd > maxSpeed) {
            nvx = (nvx / spd) * maxSpeed
            nvy = (nvy / spd) * maxSpeed
        }
        vx[i] = nvx
        vy[i] = nvy
        // Hard-clamp position to viewport
        px[i] = Math.max(-1, Math.min(1, (px[i] as number) + nvx * dt))
        py[i] = Math.max(-1, Math.min(1, (py[i] as number) + nvy * dt))
    }
}

// ---- Component ----

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

    float soft = 1.0 - smoothstep(0.2, 1.0, d);
    float t = clamp(vPos.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 color = mix(uColorA * 1.5, uColorB, t);
    gl_FragColor = vec4(color, soft * 0.85);
  }
`

function makeBoidsState(count: number): BoidsState {
    const px = new Float32Array(count)
    const py = new Float32Array(count)
    const vx = new Float32Array(count)
    const vy = new Float32Array(count)
    for (let i = 0; i < count; i++) {
        px[i] = Math.random() * 2 - 1
        py[i] = Math.random() * 2 - 1
        const angle = Math.random() * Math.PI * 2
        vx[i] = Math.cos(angle) * 0.1
        vy[i] = Math.sin(angle) * 0.1
    }
    return { px, py, vx, vy, count }
}

function buildGeometry(count: number): BufferGeometry {
    const pos = new Float32Array(count * 3)
    const posAttr = new Float32BufferAttribute(pos, 3)
    posAttr.usage = DynamicDrawUsage
    const geo = new BufferGeometry()
    geo.setAttribute('position', posAttr)
    return geo
}

export function BoidsScene({ params }: { params?: Partial<BoidsParams> }) {
    const resolved = { ...DEFAULT_PARAMS, ...params }
    const { scene } = useThree()

    const count = resolved.count
    const geo = useMemo(() => buildGeometry(count), [count])
    const stateRef = useRef<BoidsState | null>(null)
    const gridRef = useRef<SpatialGrid | null>(null)

    useMemo(() => {
        stateRef.current = makeBoidsState(count)
        gridRef.current = new SpatialGrid(resolved.perceptionRadius * 1.2)
    }, [count])

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
        const boidsState = stateRef.current
        const grid = gridRef.current
        if (!mat || !boidsState || !grid) return

        // Cap delta to avoid spiral-of-death on tab visibility change
        const dt = Math.min(delta, 0.05)
        boidsStep(boidsState, dt, resolved, grid)

        // Copy positions to GPU buffer
        const posAttr = geo.getAttribute('position')
        const pos = posAttr.array as Float32Array
        for (let i = 0; i < count; i++) {
            pos[i * 3] = boidsState.px[i] as number
            pos[i * 3 + 1] = boidsState.py[i] as number
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

function BoidsGallery() {
    return <BoidsScene params={isDegraded ? { count: 1500 } : undefined} />
}

export const particlesBoidsScene: BackgroundScene = {
    id: meta.id,
    Component: BoidsGallery,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors as readonly [string, string],
    fallbackPng: meta.fallbackPng,
}
