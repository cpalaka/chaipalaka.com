import { useFrame } from '@react-three/fiber'
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
const SCENE_ID = 'geometric-subdivision'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

export interface SubdivisionParams {
    minDepth: number
    maxDepth: number
    noiseScale: number
    evolutionSpeed: number
    lineWidth: number
    colorA: string
    colorB: string
}

export const DEFAULT_PARAMS: SubdivisionParams = {
    minDepth: 5,
    maxDepth: 30,
    noiseScale: 3.2,
    evolutionSpeed: 0.075,
    lineWidth: 0.015,
    colorA: '#700000',
    colorB: '#000000',
}

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Procedural quad-tree subdivision via noise-driven depth field.
// Each pixel walks down the tree until it finds a "final" cell based on
// a slowly-evolving noise sample at the cell centre.
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uMinDepth;
  uniform float uMaxDepth;
  uniform float uNoiseScale;
  uniform float uEvolutionSpeed;
  uniform float uLineWidth;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  #define MAX_ITER 7

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv = vUv * asp;

    float drift = uTime * uEvolutionSpeed;

    // Start with the full canvas as depth-0 cell, halving each iteration
    vec2 cellSize = asp * 0.5;
    vec3 color = uColorA;

    for (int d = 0; d < MAX_ITER; d++) {
      vec2 cellIdx = floor(uv / cellSize);
      vec2 cellCenter = (cellIdx + 0.5) * cellSize;

      float n = valueNoise(cellCenter * uNoiseScale + drift);

      float df = float(d);
      bool pastMin = df >= uMinDepth - 1.0;
      bool atMax   = df >= uMaxDepth - 1.0;

      if (pastMin && (atMax || n < 0.5)) {
        vec2 local = (uv - cellIdx * cellSize) / cellSize;
        float lw = uLineWidth;
        bool border = local.x < lw || local.x > 1.0 - lw ||
                      local.y < lw || local.y > 1.0 - lw;

        // Subtle cell tint from hash of cell position
        float tint = hash(cellIdx) * 0.18;
        vec3 fill = mix(uColorA, uColorB * 0.35, tint);

        color = border ? uColorB : fill;
        break;
      }

      cellSize *= 0.5;
    }

    gl_FragColor = vec4(color, 1.0);
  }
`

export function SubdivisionScene({ params }: { params?: Partial<SubdivisionParams> }) {
    const resolved = { ...DEFAULT_PARAMS, ...params }

    const uniforms = useMemo(() => ({
        uResolution: { value: new Vector2(1, 1) },
        uTime: { value: 0 },
        uMinDepth: { value: resolved.minDepth },
        uMaxDepth: { value: resolved.maxDepth },
        uNoiseScale: { value: resolved.noiseScale },
        uEvolutionSpeed: { value: resolved.evolutionSpeed },
        uLineWidth: { value: resolved.lineWidth },
        uColorA: { value: new Color(resolved.colorA) },
        uColorB: { value: new Color(resolved.colorB) },
    }), [])

    const matRef = useRef<ShaderMaterial>(null)

    // Sync scalar params to uniforms when they change (sandbox tuning)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        const u = mat.uniforms
        if (u.uMinDepth) u.uMinDepth.value = resolved.minDepth
        if (u.uMaxDepth) u.uMaxDepth.value = resolved.maxDepth
        if (u.uNoiseScale) u.uNoiseScale.value = resolved.noiseScale
        if (u.uEvolutionSpeed) u.uEvolutionSpeed.value = resolved.evolutionSpeed
        if (u.uLineWidth) u.uLineWidth.value = resolved.lineWidth
    }, [resolved.minDepth, resolved.maxDepth, resolved.noiseScale, resolved.evolutionSpeed, resolved.lineWidth])

    useEffect(() => {
        const mat = matRef.current
        if (!mat) return
        if (mat.uniforms.uColorA) mat.uniforms.uColorA.value.set(resolved.colorA)
        if (mat.uniforms.uColorB) mat.uniforms.uColorB.value.set(resolved.colorB)
    }, [resolved.colorA, resolved.colorB])

    useFrame((state) => {
        const mat = matRef.current
        if (!mat) return
        const u = mat.uniforms
        if (u.uTime) u.uTime.value = state.clock.elapsedTime
        if (u.uResolution) u.uResolution.value.set(state.size.width, state.size.height)
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

function SubdivisionGallery() {
    return <SubdivisionScene />
}

export const geometricSubdivisionScene: BackgroundScene = {
    id: meta.id,
    Component: SubdivisionGallery,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors as readonly [string, string],
    fallbackPng: meta.fallbackPng,
}
