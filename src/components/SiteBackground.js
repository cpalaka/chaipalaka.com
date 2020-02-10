import React, { useRef, useState } from 'react'
import { useStaticQuery, graphql, Link } from 'gatsby'
import styled from 'styled-components'
import Nav from './Nav'
import Header from './header'
import { Canvas, useFrame } from 'react-three-fiber'
import { SplineCurve } from 'three'
import * as THREE from 'three'
import ThreeButton from './ThreeButton'
import MeshLine from './MeshLine'

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
    backdrop-filter: blur(7px);

    @media (max-width: 600px) {
        left: 2.5vw;
        width: 95vw;
    }
`

const Page = styled.div`
    height: 90vh;
`

const Logo = styled.div`
    height: 5vh;
    width: 15vw;
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
            <MeshLine />
            <ContentContainer>
                <Flexbox>
                    {/* <Logo>Chai Palaka</Logo> */}
                    <Logo>
                        <ThreeButton />
                    </Logo>
                    <Page>{children}</Page>
                    <SiteNav>
                        <Link to='page-2'>Page 2</Link>
                    </SiteNav>
                </Flexbox>
            </ContentContainer>
        </Site>
    )
}

export default SiteBackground
