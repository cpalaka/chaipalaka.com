import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Color, ShaderMaterial, Vector2 } from 'three'

const FALLBACK_COLORS: readonly [string, string] = ['#1f0e0e', '#d97a5b']

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`

// Radial concentric pulse — sin(uTime) stands in for future amplitude uniform
// that slice 17 will replace with the /api/now-playing beat.
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  void main() {
    vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
    vec2 uv = (vUv - 0.5) * aspect;

    float dist = length(uv);

    // Simulated beat: amplitude cycles between 0 and 1.
    float beat = 0.5 + 0.5 * sin(uTime * 2.4);

    // Concentric rings expanding outward, modulated by beat.
    float rings = 8.0;
    float phase = dist * rings - uTime * 0.6;
    float wave = 0.5 + 0.5 * sin(phase * 3.14159 * 2.0);

    // Beat brightens the inner circle.
    float inner = 1.0 - smoothstep(0.0, 0.25, dist - beat * 0.1);

    float mask = mix(wave, 1.0, inner * beat * 0.6);
    // Fade rings at the edges.
    float vignette = 1.0 - smoothstep(0.35, 0.65, dist);
    mask *= vignette;

    vec3 color = mix(uColorA, uColorB, mask);
    gl_FragColor = vec4(color, 1.0);
  }
`

function AudioReactive() {
    const ref = useRef<ShaderMaterial>(null)
    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uResolution: { value: new Vector2(1, 1) },
            uColorA: { value: new Color(FALLBACK_COLORS[0]) },
            uColorB: { value: new Color(FALLBACK_COLORS[1]) },
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

export { AudioReactive as Scene }
