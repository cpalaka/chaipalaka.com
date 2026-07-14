import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
    NodeMaterial,
    Vector2,
    Vector4,
    WebGPURenderer,
    type Node,
} from 'three/webgpu'
import {
    abs,
    clamp,
    dot,
    float,
    Fn,
    fwidth,
    length,
    Loop,
    max,
    min,
    mix,
    normalize,
    positionGeometry,
    pow,
    screenUV,
    select,
    smoothstep,
    uniform,
    uniformArray,
    vec2,
    vec3,
    vec4,
} from 'three/tsl'
import { usePhysicsWorld } from '../../physics/PhysicsContext'
import type { PhysicsWorld } from '../../physics/PhysicsWorld'
import { auraTuning } from './auraTuning'
import { AURA_PARK_SENTINEL, writeAuraRects } from './auraBridge'

// task-038 S2 — the WebGPU/TSL metaball aura scene. Every non-static card body
// (from PhysicsWorld.snapshotCardRects) is a rounded-box SDF; neighbouring cards
// gloop into one mercury body via a polynomial smin and split as they drift
// apart. This is the TSL re-authoring of prototypes/lava-metaball.html (a 2D
// SDF field with a faked normal from the field gradient — NOT a raymarcher, NOT
// ported GLSL strings). Unlike the prototype, the SDF boxes track each card's
// physics rotation (the S3 feel pass showed the axis-aligned plateau poking out
// from behind visibly rotated cards as a "ghost card").

// ── Pure SDF helpers (no uniforms) — reused TSL functions ────────────────────

/** Rounded-box signed distance (prototype `sdBox`). `p` relative to the box
 *  centre, `b` the half-size, `r` the corner radius. */
const sdBox = Fn(
    ([p, b, r]: [Node<'vec2'>, Node<'vec2'>, Node<'float'>]) => {
        // q = abs(p) - b + r
        const q = abs(p).sub(b).add(r)
        return min(max(q.x, q.y), 0)
            .add(length(max(q, vec2(0, 0))))
            .sub(r)
    },
)

/** Polynomial smooth-min (prototype `smin`, k>0 branch). Merges two SDFs so two
 *  card boxes fuse into one gloop before their edges touch. `k` is baked > 0
 *  (auraTuning.blendK), so the k<=0 guard the prototype carried is unneeded. */
const smin = Fn(
    ([a, b, k]: [Node<'float'>, Node<'float'>, Node<'float'>]) => {
        // h = clamp(0.5 + 0.5*(b-a)/k, 0, 1)
        const h = clamp(b.sub(a).mul(0.5).div(k).add(0.5), 0, 1)
        // mix(b, a, h) - k*h*(1-h)
        return mix(b, a, h).sub(k.mul(h).mul(h.oneMinus()))
    },
)

// ── Live uniforms fed one-way from physics each frame ────────────────────────

function createAuraUniforms() {
    const rectVecs = Array.from(
        { length: auraTuning.maxCards },
        () => new Vector4(AURA_PARK_SENTINEL, AURA_PARK_SENTINEL, 0, 0),
    )
    const rotVecs = Array.from(
        { length: auraTuning.maxCards },
        () => new Vector2(1, 0),
    )
    return {
        // One Vector4 per GPU slot `[centreX, centreY, halfW, halfH]` in CSS px.
        // Mutated in place each frame; UniformArrayNode re-uploads on every render
        // (its updateType is RENDER — verified in three@0.184 source), so no
        // version flag is needed.
        rects: uniformArray<'vec4'>(rectVecs, 'vec4'),
        // Per-slot card rotation as `[cos θ, sin θ]` (precomputed CPU-side by
        // snapshotCardRects, so the field rotates each sample point with two dot
        // products — no per-fragment trig). Identity (1, 0) when parked.
        rots: uniformArray<'vec2'>(rotVecs, 'vec2'),
        // The vector objects backing the arrays (same references) — mutated
        // directly.
        rectVecs,
        rotVecs,
        // Active card count; the field loop gates slots at/after it. Float (not
        // int) because the `uniform()` overloads only type a scalar as "float";
        // exact for counts ≤ maxCards, and the loop index is converted to match.
        count: uniform(0),
        // Canvas CSS size (viewport px) — maps normalized fragment coords to the
        // same CSS-px space the fixed cards live in, independent of render dpr.
        resolution: uniform(new Vector2(1, 1)),
    }
}

type AuraUniforms = ReturnType<typeof createAuraUniforms>

// ── Field + fragment graph ───────────────────────────────────────────────────

function buildAuraMaterial(u: AuraUniforms): NodeMaterial {
    const t = auraTuning

    // The gloop field: smin-fold every active card's rounded-box SDF. select()
    // gates inactive slots to a far distance so they contribute nothing to the
    // smin (belt-and-braces with the parked sentinel rects). Loops a constant
    // maxCards; the count uniform decides which slots are live.
    const field = Fn(([p]: [Node<'vec2'>]) => {
        const d = float(1e5).toVar()
        Loop(t.maxCards, ({ i }) => {
            const rect = u.rects.element(i)
            const rot = u.rots.element(i)
            // Rotate the sample point into the card's local frame (by -θ, using
            // the precomputed [cos, sin]): local = [c·x + s·y, -s·x + c·y] — so
            // the SDF box tracks the card's physics rotation, not axis-aligned.
            const q = p.sub(rect.xy)
            const local = vec2(dot(q, rot), dot(q, vec2(rot.y.negate(), rot.x)))
            const dist = sdBox(local, rect.zw, t.cornerRadius)
            const gated = select(float(i).lessThan(u.count), dist, float(1e5))
            d.assign(smin(d, gated, t.blendK))
        })
        return d
    })

    const color = Fn(() => {
        // screenUV is top-left origin / y-down on the WebGPU backend
        // (WGSLNodeBuilder.isFlipY() === false in three@0.184, so screenCoordinate
        // stays at WebGPU-native top-left), matching the fixed cards' CSS
        // coordinates — so no Y flip. (If the visual pass shows the field mirrored
        // vertically vs the cards, flip screenUV.y here: that is the single toggle.)
        const frag = screenUV.mul(u.resolution)
        const d = field(frag)
        const surf = d.sub(t.auraThickness) // <0 inside the gloop, 0 at its surface
        const aa = fwidth(surf).add(1e-4)
        const mask = smoothstep(aa.negate(), aa, surf).oneMinus()

        // Faked normal from the 2D field gradient (central difference).
        const e = t.gradientEpsilon
        const gx = field(frag.add(vec2(e, 0))).sub(field(frag.sub(vec2(e, 0))))
        const gy = field(frag.add(vec2(0, e))).sub(field(frag.sub(vec2(0, e))))
        const depth = clamp(surf.negate().div(Math.max(t.auraThickness, 1)), 0, 1)
        const g = vec2(gx, gy).mul(depth.oneMinus().mul(1.6))
        const N = normalize(vec3(g, 1))

        const L = normalize(
            vec3(
                t.light.direction[0],
                t.light.direction[1],
                t.light.direction[2],
            ),
        )
        const diff = clamp(dot(N, L), 0, 1)
        const H = normalize(L.add(vec3(0, 0, 1)))
        const spec = pow(clamp(dot(N, H), 0, 1), t.light.specPower)

        // Mercury palette (prototype uPal==0): grey base graded by depth, lit by
        // ambient + diffuse, plus a specular highlight.
        const base = mix(
            vec3(t.mercury.lo, t.mercury.lo, t.mercury.lo),
            vec3(t.mercury.hi, t.mercury.hi, t.mercury.hi),
            depth,
        )
        const litFactor = float(t.mercury.ambient).add(
            float(t.mercury.diffuse).mul(diff).mul(t.light.intensity),
        )
        const lit = base
            .mul(litFactor)
            .add(spec.mul(t.light.intensity).mul(t.light.specGain))

        // Transparent outside the gloop, like the prototype (`o = vec4(0.0)`,
        // alpha:true canvas): the blobs composite over whatever sits beneath the
        // layer (background scene / page). Premultiplied output — the quad is
        // drawn opaque (no in-scene blending), and the canvas' premultiplied
        // alphaMode does the page compositing.
        return vec4(lit.mul(mask), mask)
    })

    const material = new NodeMaterial()
    // Fullscreen quad: emit the PlaneGeometry(2,2) vertices straight to clip space
    // so the fill is camera-independent (no ortho/frustum juggling).
    material.vertexNode = vec4(positionGeometry.xy, 0, 1)
    material.fragmentNode = color()
    material.depthTest = false
    material.depthWrite = false
    material.transparent = false
    return material
}

// ── Inner field component (inside the R3F <Canvas> reconciler) ────────────────

// The physics world is read OUTSIDE the Canvas and passed as a prop: React
// context does not cross the R3F reconciler boundary, so usePhysicsWorld() would
// throw inside here.
function AuraField({ world }: { world: PhysicsWorld }) {
    const { material, u, buf, rotBuf, writeSlot, writeRotSlot } =
        useMemo(() => {
            const u = createAuraUniforms()
            const buf = new Float32Array(auraTuning.maxCards * 4)
            const rotBuf = new Float32Array(auraTuning.maxCards * 2)
            // Stable per-slot writers so the per-frame bridge allocates nothing.
            const writeSlot = (
                slot: number,
                x: number,
                y: number,
                z: number,
                w: number,
            ) => u.rectVecs[slot]!.set(x, y, z, w)
            const writeRotSlot = (slot: number, cos: number, sin: number) =>
                u.rotVecs[slot]!.set(cos, sin)
            return {
                material: buildAuraMaterial(u),
                u,
                buf,
                rotBuf,
                writeSlot,
                writeRotSlot,
            }
        }, [])

    useEffect(() => () => material.dispose(), [material])

    // One-way physics→GPU bridge. Pre-allocated buffers + in-place uniform
    // mutation: zero per-frame allocation, and never a GPU→CPU readback.
    useFrame((state) => {
        u.resolution.value.set(state.size.width, state.size.height)
        const n = world.snapshotCardRects(buf, rotBuf)
        writeAuraRects(buf, rotBuf, n, auraTuning.maxCards, writeSlot, writeRotSlot)
        u.count.value = n
    })

    return (
        <mesh frustumCulled={false} material={material}>
            <planeGeometry args={[2, 2]} />
        </mesh>
    )
}

// ── Public scene (mounted lazily by AuraLayer, inside PhysicsProvider) ─────────

export function AuraScene({ onFail }: { onFail?: () => void }) {
    const world = usePhysicsWorld()
    const wrapperRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<WebGPURenderer | null>(null)

    // AC#7: render at ~half the device's linear resolution (¼ fill-rate on 2×).
    const dpr = useMemo(() => {
        const device =
            typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
        return Math.max(auraTuning.minDpr, device * auraTuning.resolutionScale)
    }, [])

    return (
        <div ref={wrapperRef} style={{ position: 'absolute', inset: 0 }}>
            <Canvas
                // flat + linear: no tone mapping, no linear→sRGB output encode —
                // auraTuning's values are the prototype's raw sRGB display values
                // and must pass through untouched to reproduce the validated look.
                flat
                linear
                dpr={dpr}
                gl={async (props) => {
                    // ADR-0009 async-gl factory. props are R3F's WebGL-shaped
                    // DefaultGLProps; WebGPURenderer's params overlap but differ
                    // in a few members (e.g. powerPreference), so cast at this
                    // one renderer-construction boundary.
                    const renderer = new WebGPURenderer(
                        props as ConstructorParameters<
                            typeof WebGPURenderer
                        >[0],
                    )
                    try {
                        await renderer.init()
                    } catch (err) {
                        // init() can reject even after detectWebGPU passed
                        // (adapter lost between detect and init, device request
                        // failure). R3F v9 runs its configure({gl}) in an
                        // un-awaited effect, so this rejection reaches no error
                        // boundary — the ONLY place to catch it is here. Degrade
                        // to the AC#4 static fallback, then re-throw so R3F does
                        // not use a half-initialised renderer.
                        onFail?.()
                        throw err
                    }
                    // Runtime device loss (GPU-process crash, driver update,
                    // dGPU→iGPU switch): three routes both WebGPU device-loss and
                    // context-loss through this one public hook (it already
                    // ignores reason 'destroyed', i.e. our own teardown). Flip to
                    // the fallback — the WebGPU analogue of BackgroundCanvas's
                    // `webglcontextlost` listener (that event never fires on a
                    // WebGPU context).
                    renderer.onDeviceLost = () => onFail?.()
                    rendererRef.current = renderer
                    return renderer
                }}
                onCreated={() => {
                    // AC#1 verification surface: stamp the actual backend so the
                    // orchestrator can assert WebGPU (not a silent WebGL fallback)
                    // via agent-browser. isWebGPUBackend lives on the backend, not
                    // the renderer (three@0.184).
                    const backend = rendererRef.current?.backend as
                        | { isWebGPUBackend?: boolean }
                        | undefined
                    wrapperRef.current?.setAttribute(
                        'data-aura-backend',
                        backend?.isWebGPUBackend === true ? 'webgpu' : 'webgl',
                    )
                }}
            >
                <AuraField world={world} />
            </Canvas>
        </div>
    )
}
