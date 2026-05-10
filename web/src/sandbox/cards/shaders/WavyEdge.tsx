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

const fragmentShader = `
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

void main() {
    float wave = sin(vUv.x * 8.0 + uTime * 1.5) * 0.08
               + sin(vUv.y * 6.0 + uTime * 1.1) * 0.06;
    float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(0.0, 0.12, 1.0 - vUv.x)
               * smoothstep(0.0, 0.12, vUv.y) * smoothstep(0.0, 0.12, 1.0 - vUv.y);
    float t = clamp(vUv.y + wave, 0.0, 1.0);
    vec3 color = mix(uColor2, uColor1, t);
    float alpha = mix(0.7, 1.0, edge);
    gl_FragColor = vec4(color, alpha);
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

export function WavyEdgeScene({ color1 = '#1a1a1a', color2 = '#3a2a00' }: Props) {
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
                transparent
            />
        </mesh>
    )
}
