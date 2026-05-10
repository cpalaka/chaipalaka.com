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
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uTime;
varying vec2 vUv;

void main() {
    float t = vUv.y + sin(vUv.x * 3.14159) * 0.1;
    vec3 color = mix(uColor1, uColor2, t);
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

export function StaticGradientScene({ color1 = '#111111', color2 = '#2a1a00' }: Props) {
    const matRef = useRef<ShaderMaterial>(null)
    const uniforms = useMemo(
        () => ({
            uColor1: { value: hexToRgb(color1) },
            uColor2: { value: hexToRgb(color2) },
            uTime: { value: 0 },
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
