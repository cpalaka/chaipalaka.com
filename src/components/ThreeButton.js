/* modified from :https://github.com/react-spring/react-three-fiber/blob/master/examples/src/demos/MeshLine.js */
import React, { useMemo, useRef, useContext } from 'react'
import * as THREE from 'three'
import * as meshline from 'threejs-meshline'
import { extend, Canvas, useFrame, useThree } from 'react-three-fiber'
import { ThemeContext } from 'styled-components'
import styled from 'styled-components'

const Rectangle = props => {
    var x = -50,
        y = 50

    var rectShape = new THREE.Shape([
        new THREE.Vector2(-150, 50),
        new THREE.Vector2(150, 50),
        new THREE.Vector2(150, -50),
        new THREE.Vector2(-150, -50),
    ])
    // rectShape.moveTo(x, y)
    // heartShape.moveTo( x + 5, y + 5 );
    // heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
    // heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
    // heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
    // heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
    // heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
    // heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );
    return (
        <mesh>
            <shapeGeometry attach='geometry' args={rectShape} />
            <meshBasicMaterial attach='material' color='black' />
        </mesh>
    )
}

function Rig({ mouse }) {
    const { camera } = useThree()

    useFrame(() => {
        console.log('cam', mouse.current)

        // camera.position.x += (mouse.current[0] / 50 - camera.position.x) * 0.05
        // camera.position.y += (-mouse.current[1] / 50 - camera.position.y) * 0.05
        camera.position.x = -mouse.current[0]*0.05
        camera.position.y = -mouse.current[1]*0.05
        camera.lookAt(0, 0, 0)
    })
    return null
}

const Title = styled.h6`
    position: absolute;
    top: 0;
    left: 0;
    transform: translate(20%, 50%);
    display: inline;
    // width: 100%;
    color: white;
    z-index: 100;
`

export default React.memo(function ThreeButton() {
    const mouse = useRef([0, 0])

    return (
        <>
            <Canvas
                style={{ background: 'white' }}
                camera={{ position: [0, 0, 50], fov: 100 }}
                onMouseMove={e => {
                    mouse.current = [
                        e.clientX - window.innerWidth * 0.25 - e.currentTarget.clientWidth / 2,
                        e.currentTarget.clientHeight / 2 - e.clientY,
                    ]
                    return
                }}
            >
                <Rectangle />
                <Rig mouse={mouse} />
            </Canvas>
            <Title>
                chaipalaka
            </Title>
        </>
    )
})
