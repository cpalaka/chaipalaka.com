import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, ShaderMaterial, Vector2 } from 'three'
import type { BackgroundScene } from '../types'
import rawManifest from './manifest.json'

interface SceneManifestEntry {
  id: string
  fallbackColors: readonly [string, string]
  fallbackPng: string
}
const manifest = rawManifest as unknown as readonly SceneManifestEntry[]

const SCENE_ID = 'flow-shader'
const meta = manifest.find((m) => m.id === SCENE_ID)
if (!meta) throw new Error(`Manifest missing entry for scene: ${SCENE_ID}`)

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
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  vec2 hash22(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float gnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * gnoise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 p = (vUv - 0.5) * aspect * 2.0;

    float t = uTime * 0.05;
    vec2 flow = vec2(fbm(p + vec2(t, 0.0)), fbm(p + vec2(0.0, t * 1.3)));
    float n = fbm(p * 1.4 + flow * 1.6 + t);
    float intensity = smoothstep(-0.6, 0.7, n);

    vec3 color = mix(uColorA, uColorB, intensity);
    gl_FragColor = vec4(color, 1.0);
  }
`

function FlowShader() {
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
    if (!ref.current) return
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uResolution.value.set(state.size.width, state.size.height)
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

export const flowShaderScene: BackgroundScene = {
  id: meta.id,
  Component: FlowShader,
  fallbackColors: meta.fallbackColors,
  fallbackPng: meta.fallbackPng,
}
