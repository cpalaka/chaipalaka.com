/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React, { useRef, useState } from "react"
import { useStaticQuery, graphql, Link } from "gatsby"
import styled from "styled-components"
import Nav from "./Nav"
import Header from "./header"
import { Canvas, useFrame } from "react-three-fiber"
import { SplineCurve } from "three"
import * as THREE from "three"

import MeshLine from "./MeshLine"

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
            scale={active ? [5, 5, 5] : [1, 1, 1]}
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

const Curve = props => {
    const line = useRef()
    const curve = new THREE.CatmullRomCurve3(
        [
            new THREE.Vector3(-10, 0, 0),
            new THREE.Vector3(-5, 5, 0),
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(5, -5, 0),
            new THREE.Vector3(10, 0, 0),
        ],
        true
    ).getPoints(5)

    const vertices = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 10, 0)]
    return (
        <line {...props} ref={line}>
            <geometry attach="geometry" vertices={curve} />
            <lineBasicMaterial attach="material" color="black" />
        </line>
    )
}

const Flexbox = styled.div`
    display: flex;
    flex-direction: column;
    height: 100vh;
`

const ContentContainer = styled.div`
    position: absolute;

    width: 50vw;
    left: 25vw;
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
    // background-color: blue;
`

const SiteNav = styled.div`
    height: 5vh;
    background-color: red;
`

const Site = styled.div`
    height: 100vh;
    width: 100vw;
`

const SiteBackground = ({ children, ...props }) => {
    return (
        <Site>
            {/* <Canvas camera={{ position: [0, 0, 10], fov: 100 }}>
                <ambientLight />
                <pointLight position={[10, 10, 10]} />
                <Box position={[0, 0, 0]} />
                <Box position={[1, 0, 0]} />
            </Canvas> */}
            <MeshLine />
            <ContentContainer>
                <Flexbox>
                    <Logo>Chai Palaka</Logo>
                    <Page>{children}</Page>
                    <SiteNav>
                        <Link to="page-2">Page 2</Link>
                    </SiteNav>
                </Flexbox>
            </ContentContainer>
        </Site>
    )
}

export default SiteBackground
