/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useRef, useState } from "react"
import { useStaticQuery, graphql } from "gatsby"
import styled from "styled-components"
import Nav from './Nav'
import Header from "./header"
import { Canvas, useFrame } from 'react-three-fiber'

function Box(props) {
    // This reference will give us direct access to the mesh
    const mesh = useRef()

    // Set up state for the hovered and active state
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)

    // Rotate mesh every frame, this is outside of React without overhead
    useFrame(() => (mesh.current.rotation.x = mesh.current.rotation.y += 0.01))

    return (
        <mesh
            {...props}
            ref={mesh}
            scale={active ? [4, 4, 4] : [3, 3, 3]}
            onClick={e => setActive(!active)}
            onPointerOver={e => setHover(true)}
            onPointerOut={e => setHover(false)}>
            <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
            <meshStandardMaterial attach="material" color={hovered ? 'hotpink' : 'orange'} />
        </mesh>
    )
}

const SimpleLayout = styled.div`
    // background-color: ${({ theme }) => theme.colors.background};
    height: 100vh;
    width: 100vw;
    position: absolute;
    top: 0px;
`

const SiteBackground = ({ children, ...props }) => {
    console.log('layout', props)
    return (<>
        <Canvas>
            <ambientLight />
            <pointLight position={[10, 10, 10]} />
            <Box position={[-20, 0, 0]} />
            <Box position={[20, 0, 0]} />
        </Canvas>
        <SimpleLayout>
            <Nav currentPath={props.path}>
                {/* <ChildrenWrapper> */}
                {children}
                {/* </ChildrenWrapper> */}
            </Nav>
        </SimpleLayout>
        </>
    )
}

export default SiteBackground
