import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ShaderMaterial } from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// Value noise for the noise field effect
const fragmentShader = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    v += 0.5 * noise(p);
    v += 0.25 * noise(p * 2.0);
    v += 0.125 * noise(p * 4.0);
    return v;
}

void main() {
    vec2 uv = vUv * 3.0 + vec2(uTime * 0.1, uTime * 0.08);
    float n = fbm(uv);
    vec3 color = mix(uColor1, uColor2, n);
    gl_FragColor = vec4(color, 1.0);
}
`

function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return [r, g, b]
}

interface Props {
    color1?: string
    color2?: string
}

export function NoiseFieldScene({ color1 = '#0a0a0a', color2 = '#1a0f00' }: Props) {
    const matRef = useRef<ShaderMaterial>(null)
    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uColor1: { value: hexToRgb(color1) },
            uColor2: { value: hexToRgb(color2) },
        }),
        [],
    )

    useFrame(({ clock }) => {
        if (!matRef.current) return
        const t = matRef.current.uniforms['uTime']
        if (t) t.value = clock.elapsedTime
    })

    return (
        <mesh>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                ref={matRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
            />
        </mesh>
    )
}
