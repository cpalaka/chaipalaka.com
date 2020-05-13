/* modified from :https://github.com/react-spring/react-three-fiber/blob/master/examples/src/demos/MeshLine.js */
import React, { useMemo, useRef, useContext } from 'react'
import * as THREE from 'three'
import * as meshline from 'threejs-meshline'
import { extend, Canvas, useFrame, useThree } from 'react-three-fiber'
import styled, { ThemeContext } from 'styled-components'

extend(meshline)

function Fatline({ curve, width, color, speed }) {
    const material = useRef()
    useFrame(() => (material.current.uniforms.dashOffset.value += speed*0.2))
    return (
        <mesh>
            <meshLine attach='geometry' vertices={curve} />
            <meshLineMaterial
                attach='material'
                ref={material}
                transparent
                depthTest={false}
                lineWidth={width}
                color={color}
                dashArray={0.5}
                dashRatio={0.6}
                // opacity={0.7}
            />
        </mesh>
    )
}

function Lines({ count, colors }) {
    const lines = useMemo(
        () =>
            new Array(count).fill().map(() => {
                const pos = new THREE.Vector3(
                    10 - Math.random() * 20,
                    20 - Math.random() * 40,
                    // 10 - Math.random() * 20,
                    25,
                    // 10 - Math.random() * 20
                )
                const points = new Array(30)
                    .fill()
                    .map(() =>
                        pos
                            .add(
                                new THREE.Vector3(
                                    4 - Math.random() * 8,
                                    4 - Math.random() * 8,
                                    2 - Math.random() * 4
                                )
                            )
                            .clone()
                    )
                const curve = new THREE.CatmullRomCurve3(points).getPoints(1000)
                return {
                    color: colors[parseInt(colors.length * Math.random())],
                    width: Math.max(0.5, 2.5 * Math.random()),
                    speed: Math.max(0.0001, 0.0005 * Math.random()),
                    curve,
                }
            }),
        [colors, count]
    )
    return lines.map((props, index) => <Fatline key={index} {...props} />)
}

function Rig({ mouse }) {
    const { camera } = useThree()
    useFrame(() => {
        camera.position.x += (mouse.current[0] / 50 - camera.position.x) * 0.05
        camera.position.y += (-mouse.current[1] / 50 - camera.position.y) * 0.05
        camera.lookAt(0, 0, 0)
    })
    return null
}

export default React.memo(function App() {
    const mouse = useRef([0, 0])
    const theme = useContext(ThemeContext)

    return (
        <Canvas
            style={{ background: theme.colors.background }}
            camera={{ position: [0, 0, 100], fov: 10 }}
            onMouseMove={e =>
                (mouse.current = [
                    e.clientX - window.innerWidth / 2,
                    e.clientY - window.innerHeight / 2,
                ])
            }
            pixelRatio={typeof window !== `undefined` ? window.devicePixelRatio : undefined}
        >
            <Lines
                count={35}
                colors={['#A2CCB6', '#FCEEB5', '#EE786E', '#e0feff', 'lightpink', 'lightblue']}
                // colors={[theme.colors.primaryAccent]}
            />
            <Rig mouse={mouse} />
        </Canvas>
    )
})
