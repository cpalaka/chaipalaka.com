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

const SCENE_ID = 'particles'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Soft polka-dot field drifting on a Perlin-style flow.
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
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
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv = vUv * aspect * 8.0;

    // Drift each cell's centre with a slow noise field.
    float t = uTime * 0.12;
    vec2 cell = floor(uv);
    vec2 local = fract(uv);

    float dot_mask = 0.0;
    for (int dy = -1; dy <= 1; dy++) {
      for (int dx = -1; dx <= 1; dx++) {
        vec2 neighbor = cell + vec2(float(dx), float(dy));
        float h1 = hash(neighbor + vec2(0.3));
        float h2 = hash(neighbor + vec2(0.7));
        vec2 drift = vec2(
          noise(neighbor * 0.5 + t),
          noise(neighbor * 0.5 + t + 3.7)
        ) * 0.4;
        vec2 centre = vec2(h1, h2) * 0.6 + 0.2 + drift;
        float r = 0.18 + hash(neighbor + 1.1) * 0.12;
        float d = length(local - centre + vec2(float(dx), float(dy)) - vec2(0.0));
        dot_mask = max(dot_mask, 1.0 - smoothstep(r - 0.02, r + 0.02, d));
      }
    }

    vec3 color = mix(uColorA, uColorB, dot_mask);
    gl_FragColor = vec4(color, 1.0);
  }
`

function Particles() {
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

export const particlesScene: BackgroundScene = {
    id: meta.id,
    Component: Particles,
    accentColor: meta.accentColor,
    fallbackColors: meta.fallbackColors,
    fallbackPng: meta.fallbackPng,
}
