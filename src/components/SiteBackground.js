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
            scale={active ? [5, 5, 5] : [3, 3, 3]}
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

const Flexbox = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
`

const ContentContainer = styled.div`
    position: absolute;

    width: 60vw;
    left: 20vw;
    top: 0;

    @media (max-width: 600px) {
        left: 0vw;
        width: 100vw;
    }
`

const Page = styled.div`
    height: 90vh;
`

const Logo = styled.div`
    height: 5vh;
    width: 15vw;
    background-color: blue;
`

const SiteNav = styled.div`
    height: 5vh;
    background-color: red;
`

const SiteBackground = ({ children, ...props }) => {
    return (
        <>
            <Canvas>
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <Box position={[-10, 0, 0]} />
                <Box position={[10, 0, 0]} />
            </Canvas>
            <ContentContainer>
                <Flexbox>
                    <Logo />
                    <Page>{children}</Page>
                    <SiteNav />
                </Flexbox>
            </ContentContainer>
        </>
    )
}

export default SiteBackground
