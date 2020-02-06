/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useRef, useState } from "react"
import { useStaticQuery, graphql } from "gatsby"
import styled from "styled-components"
import Nav from "./Nav"
import Header from "./header"
import { Canvas, useFrame } from "react-three-fiber"

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
            scale={active ? [2, 2, 2] : [1, 1, 1]}
            onClick={e => setActive(!active)}
            onPointerOver={e => setHover(true)}
            onPointerOut={e => setHover(false)}
        >
            <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
            <meshStandardMaterial
                attach="material"
                color={hovered ? "hotpink" : "orange"}
            />
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

const Flexbox = styled.div`
    display: flex;
    width: 100vw;
    height: 100vh;
`

const ChildrenContainer = styled.div`
    width: 200%;
    display: flex;
    flex-direction: column;
`

const SiteBackground = ({ children, ...props }) => {
    console.log("layout", props)
    return (
        <Flexbox>
            <Canvas>
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <Box position={[0, -2, 0]} />
                <Box position={[0, 2, 0]} />
            </Canvas>

            <ChildrenContainer>
                <Nav />
                {children}
            </ChildrenContainer>

            <Canvas>
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <Box position={[0, -2, 0]} />
                <Box position={[0, 2, 0]} />
            </Canvas>
        </Flexbox>
    )
}

export default SiteBackground
