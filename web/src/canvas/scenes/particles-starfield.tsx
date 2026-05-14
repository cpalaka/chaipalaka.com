import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
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
const SCENE_ID = 'particles-starfield'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

import { defineSceneParams, defaultsOf, type ParamsOf } from './paramSchema'

export const SCHEMA = defineSceneParams({
    count:    { kind: 'number', default: 10000,  min: 1000,   max: 100000, step: 1000,   label: 'Count', remount: true },
    sizeMin:  { kind: 'range',  default: 0.0001, min: 0.0001, max: 0.01,   step: 0.0001, label: 'Size min' },
    sizeMax:  { kind: 'range',  default: 0.0049, min: 0.001,  max: 0.02,   step: 0.0001, label: 'Size max' },
    speedMin: { kind: 'range',  default: 0.001,  min: 0.001,  max: 0.1,    step: 0.001,  label: 'Speed min' },
    speedMax: { kind: 'range',  default: 0.104,  min: 0.005,  max: 0.2,    step: 0.001,  label: 'Speed max' },
    colorA:   { kind: 'color',  default: '#070a18', label: 'Background color' },
    colorB:   { kind: 'color',  default: '#5fb6c4', label: 'Star color' },
})

export type StarfieldParams = ParamsOf<typeof SCHEMA>
export const DEFAULT_PARAMS = defaultsOf(SCHEMA)

const VERTEX_SHADER = /* glsl */ `
  attribute float aSeed;
  attribute float aSpeed;
  attribute float aBaseX;
  attribute float aBaseY;

  uniform float uTime;
  uniform float uSpeedMin;
  uniform float uSpeedMax;
  uniform float uSizeMin;
  uniform float uSizeMax;
  uniform float uPixelHeight;

  varying float vZ;

  void main() {
    float speed = mix(uSpeedMin, uSpeedMax, aSpeed);
    float z = fract(aSeed + uTime * speed);  // [0,1] cyclic depth
    vZ = z;

    // Parallax: stars appear to expand from centre as they approach
    float scale = mix(0.15, 1.6, z * z);
    vec2 pos = vec2(aBaseX, aBaseY) * scale;

    gl_Position = vec4(pos, 0.0, 1.0);

    float sz = mix(uSizeMin, uSizeMax, z);
    gl_PointSize = sz * uPixelHeight;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  precision mediump float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vZ;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv) * 2.0;
    if (d > 1.0) discard;

    float soft = 1.0 - smoothstep(0.2, 1.0, d);
    float brightness = mix(0.2, 1.0, vZ);
    vec3 color = mix(uColorA * 2.0, uColorB, vZ * 0.8 + 0.1);

    gl_FragColor = vec4(color, soft * brightness);
  }
`

function buildGeometry(params: StarfieldParams): BufferGeometry {
    const { count } = params
    const seeds = new Float32Array(count)
    const speeds = new Float32Array(count)
    const baseX = new Float32Array(count)
    const baseY = new Float32Array(count)

    for (let i = 0; i < count; i++) {
        seeds[i] = Math.random()
        speeds[i] = Math.random()
        // Distribute base positions with slight clustering toward centre
        baseX[i] = (Math.random() * 2 - 1) * 1.2
        baseY[i] = (Math.random() * 2 - 1) * 1.2
    }

    const geo = new BufferGeometry()
    geo.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1))
    geo.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1))
    geo.setAttribute('aBaseX', new Float32BufferAttribute(baseX, 1))
    geo.setAttribute('aBaseY', new Float32BufferAttribute(baseY, 1))
    // Points geometry needs a position attribute to satisfy Three.js
    // (we override gl_Position in the shader; just set a placeholder)
    const pos = new Float32Array(count * 3)
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    return geo
}

export function StarfieldScene({ params }: { params?: Partial<StarfieldParams> }) {
    const resolved = { ...DEFAULT_PARAMS, ...params }
    const { scene } = useThree()

    const geo = useMemo(() => buildGeometry(resolved), [resolved.count])

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uPixelHeight: { value: 720 },
            uSpeedMin: { value: resolved.speedMin },
            uSpeedMax: { value: resolved.speedMax },
            uSizeMin: { value: resolved.sizeMin },
            uSizeMax: { value: resolved.sizeMax },
            uColorA: { value: new Color(resolved.colorA) },
            uColorB: { value: new Color(resolved.colorB) },
        }),
        [],
    )

    const matRef = useRef<ShaderMaterial>(null)

    // Sync non-count params to uniforms when they change (sandbox tuning)
    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        const u = mat.uniforms
        if (u.uSpeedMin) u.uSpeedMin.value = resolved.speedMin
        if (u.uSpeedMax) u.uSpeedMax.value = resolved.speedMax
        if (u.uSizeMin) u.uSizeMin.value = resolved.sizeMin
        if (u.uSizeMax) u.uSizeMax.value = resolved.sizeMax
    }, [resolved.speedMin, resolved.speedMax, resolved.sizeMin, resolved.sizeMax])

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uColorA) mat.uniforms.uColorA.value.set(resolved.colorA)
        if (mat.uniforms.uColorB) mat.uniforms.uColorB.value.set(resolved.colorB)
    }, [resolved.colorA, resolved.colorB])

    // Set scene background so the canvas clears to the right colour
    useEffect(() => {
        const prev = scene.background
        scene.background = new Color(resolved.colorA)
        return () => {
            scene.background = prev
        }
    }, [resolved.colorA, scene])

    useFrame((state) => {
        const mat = matRef.current
        if (!mat) return
        const u = mat.uniforms
        if (u.uTime) u.uTime.value = state.clock.elapsedTime
        if (u.uPixelHeight) u.uPixelHeight.value = state.size.height * state.viewport.dpr
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

// Degraded count for integrated GPUs / low-DPR screens
const isDegraded =
    typeof window !== 'undefined' &&
    (window.devicePixelRatio < 1.5 || navigator.hardwareConcurrency < 4)

function StarfieldGallery() {
    return <StarfieldScene params={isDegraded ? { count: 5000 } : undefined} />
}

export const particlesStarfieldScene: BackgroundScene = {
    id: meta.id,
    Component: StarfieldGallery,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors as readonly [string, string],
    fallbackPng: meta.fallbackPng,
}

export { StarfieldScene as Scene }
